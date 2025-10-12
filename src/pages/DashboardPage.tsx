import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, Download, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import Spinner from "@/components/ui/shadcn-io/spinner";
import { ForecastCard } from "@/components/ForecastCard";
import { useUIStore } from "@/store/uiStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { apiClient } from "@/infrastructure/apiClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

export const DashboardPage: React.FC = () => {
  const {
    uploadedFileName,
    articles,
    setArticles,
    sessionId,
    setSessionId,
    isForecastingAll,
    setIsForecastingAll,
    forecastProgress,
    setForecastProgress,
    setSelectedArticle,
    setActiveTab,
    settings,
    updateSettings,
    setIsUploading,
    setUploadedFileName,
  } = useUIStore();

  const [summary, setSummary] = useState<any[]>([]);
  const [datasetPreview, setDatasetPreview] = useState<any[] | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempMethods, setTempMethods] = useState<any[]>(settings.includeMethods ?? []);

  const handleFileSelect = async (file: File) => {
    try {
      setIsUploading(true);
      const res = await apiClient.uploadDataset(file);
      const sid = (res as any).session_id || (res as any).sessionId || null;
      if (sid) {
        setSessionId(sid);
        const list = await apiClient.listArticles(sid);
        setArticles(list.map((r) => ({ ref: r, designation: r })));
        try {
          const dp = await apiClient.getDatasetPreview(sid);
          if (dp && Array.isArray(dp.rows)) setDatasetPreview(dp.rows.slice(0, 10));
        } catch (e) {
          // ignore preview errors
        }
      }

      const rows = (res as any).rows ?? (res as any).data ?? (res as any).rows_parsed ?? null;
      if (!datasetPreview && Array.isArray(rows) && rows.length > 0) setDatasetPreview(rows.slice(0, 10));
      setUploadedFileName(file.name);
      toast({ title: "Dataset loaded", description: `Uploaded ${file.name}` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Upload failed", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunForecasts = async () => {
    if (articles.length === 0) {
      toast({ title: "No data", description: "Please upload a dataset first.", variant: "destructive" });
      return;
    }
    if (!sessionId) {
      toast({ title: "No session", description: "Please upload a dataset to create a session.", variant: "destructive" });
      return;
    }

    setIsForecastingAll(true);
    setForecastProgress(0);
    try {
  const resp = await apiClient.forecastAll(sessionId, settings, false, true, settings.includeMethods as any);
      const preview = Array.isArray(resp.preview) ? resp.preview : [];
      const mapped = preview.map((it: any) => {
        const avg = Number(it.avg_forecast ?? it.avgForecast ?? 0) || 0;
        const trend = Number(it.trend_pct ?? it.trendPct ?? 0) || 0;
        const trendLabel = trend > 5 ? "Growth" : trend < -5 ? "Decline" : "Stable";
        return {
          ref: it.ref_article ?? it.ref ?? String(it.ref_article ?? it.ref ?? ""),
          designation: it.designation ?? it.design ?? "",
          marque: it.marque ?? it.brand ?? undefined,
          famille: it.famille ?? it.family ?? undefined,
          avgForecast: avg,
          trendPct: trend,
          trendLabel,
        };
      });

      setSummary(mapped.sort((a: any, b: any) => (b.avgForecast ?? 0) - (a.avgForecast ?? 0)));
      setForecastProgress(100);
      toast({ title: "Forecasts complete", description: `Generated forecasts for ${resp.count ?? preview.length} articles.` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Forecast failed", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setIsForecastingAll(false);
    }
  };

  const handleCardClick = (ref: string) => {
    setSelectedArticle(ref);
    setActiveTab("single-article");
  };

  const hasSummary = summary.length > 0;

  const handleDownloadCSV = async () => {
    if (summary.length === 0 || !sessionId) return;
    try {
      const blob = await apiClient.downloadSummary(sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "forecast-summary.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Download failed", description: String(err?.message ?? err), variant: "destructive" });
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-16">
      {/* Upload Card */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card-elevated rounded-2xl p-6 sm:p-8 lg:p-10">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-3">Upload dataset</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">Drag & drop a CSV or XLSX file to create a session</p>
          {useUIStore.getState().isUploading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="text-primary" size={48} />
            </div>
          ) : (
            <FileUploader onFileSelect={handleFileSelect} />
          )}
        </div>
      </motion.section>

      {/* Dataset preview (collapsible) */}
      {Boolean(datasetPreview && datasetPreview.length) && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Accordion type="single" collapsible defaultValue="preview">
            <AccordionItem value="preview">
              <AccordionTrigger>
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">Dataset preview</h2>
                  <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Click to expand first 10 rows</p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full table-auto border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        {Array.from(new Set(datasetPreview.flatMap((r) => Object.keys(r)))).map((col) => (
                          <th key={col} className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium border-b border-border whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datasetPreview.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-card/50"}>
                          {Array.from(new Set(datasetPreview.flatMap((r) => Object.keys(r)))).map((col) => (
                            <td key={col} className="px-2 sm:px-3 py-2 align-top text-xs sm:text-sm border-b border-border">{row[col] == null ? "" : String(row[col])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.section>
      )}

      {/* Actions Section */}
      {uploadedFileName && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">Forecast Engine</h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Run ensemble forecasts for all articles in the dataset</p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              <Button onClick={handleRunForecasts} disabled={isForecastingAll} size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-primary px-6 py-3 text-base">
                {isForecastingAll ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="text-sm sm:text-base">Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Run Forecasts</span>
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={() => { setTempMethods(settings.includeMethods ?? []); setIsSettingsOpen(true); }}>
                <SettingsIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Settings</span>
              </Button>

              {hasSummary && (
                <Button onClick={handleDownloadCSV} variant="outline" size="lg" className="border-primary/30">
                  <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Export CSV</span>
                </Button>
              )}
            </div>
          </div>

          <Dialog open={isSettingsOpen} onOpenChange={(open) => setIsSettingsOpen(open)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Forecast settings</DialogTitle>
                <DialogDescription>Choose which models to include in forecasts</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2">
                {["SMA","ExpSmoothing","LinearReg","ARIMA","PROPHET","XGBOOST"].map((k) => (
                  <label key={k} className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={tempMethods.includes(k as any)} onChange={(e) => { const v = k as any; setTempMethods((prev) => (e.target.checked ? Array.from(new Set([...prev, v])) : prev.filter((x) => x !== v))); }} className="accent-primary" />
                    <span>{k}</span>
                  </label>
                ))}
              </div>
              <DialogFooter>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                  <Button onClick={() => { updateSettings({ includeMethods: tempMethods as any }); setIsSettingsOpen(false); }}>Apply</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {isForecastingAll && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <Progress value={forecastProgress} className="h-3" />
              <p className="text-sm sm:text-base text-muted-foreground text-center">Processing {forecastProgress}% complete</p>
            </motion.div>
          )}
        </motion.section>
      )}

      {/* Results Section */}
      {Boolean(summary.length) && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">Top Forecasts</h2>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Click any card to view detailed analysis</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8 sm:gap-10 justify-items-center">
            {summary.slice(0, 12).map((item, index) => {
              return (
                <div className="flex justify-center w-full md:w-auto">
                  <ForecastCard key={item.ref} summary={item} index={index} onClick={() => handleCardClick(item.ref)} />
                </div>
              );
            })}
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default DashboardPage;
