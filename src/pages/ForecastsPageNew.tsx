import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Input } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Separator } from "@/components/ui";
import { ScrollArea } from "@/components/ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui";
import { 
  Upload, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Filter,
  Calendar,
  BarChart3,
  Download,
  Settings as SettingsIcon,
  Info,
  X,
  RefreshCw,
  Eye,
  Sparkles,
  Package,
  Grid3x3,
  List,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/infrastructure/apiClient";
import { useUIStore } from "@/store/uiStore";
import { FileUploader } from "@/components";
import { ForecastSettings } from "@/components/forecast";
import { ForecastArticleCard, ForecastDetailPanel, ForecastMetricsDashboard } from "@/components/forecast";
import { cn } from "@/lib/utils";

interface ForecastArticle {
  ref_article: string;
  designation: string;
  marque?: string;
  famille?: string;
  avg_forecast: number;
  trend_pct: number;
  trend_label: string;
  data_points?: number;
  next_period: number;
  frequency: string;
  historical_periods?: string | number[];
  historical_values?: string | number[];
  historical_values_list?: number[];
  [key: string]: any;
}

interface SummaryData {
  total_products?: number;
  avg_forecast?: number;
  total_forecast?: number;
  trend_distribution?: {
    uptrend?: number;
    downtrend?: number;
    stable?: number;
  };
  top_products?: Array<{
    ref_article: string;
    designation: string;
    avg_forecast: number;
  }>;
  bottom_products?: Array<{
    ref_article: string;
    designation: string;
    avg_forecast: number;
  }>;
  by_family?: Record<string, number>;
  by_brand?: Record<string, number>;
}

const ForecastsPage: React.FC = () => {
  // State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  
  const [isRunningForecast, setIsRunningForecast] = useState(false);
  const [forecastResults, setForecastResults] = useState<ForecastArticle[]>([]);
  const [totalForecastCount, setTotalForecastCount] = useState<number>(0);
  
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [trendFilter, setTrendFilter] = useState<"all" | "uptrend" | "downtrend" | "stable">("all");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  
  const [selectedArticleRef, setSelectedArticleRef] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "articles">("overview");
  
  const { toast } = useToast();
  const { settings, sessionFrequency, setSessionFrequency } = useUIStore();

  // Extract unique families and brands for filters
  const uniqueFamilies = useMemo(() => {
    const families = new Set(forecastResults.map(f => f.famille).filter(Boolean));
    return Array.from(families).sort();
  }, [forecastResults]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set(forecastResults.map(f => f.marque).filter(Boolean));
    return Array.from(brands).sort();
  }, [forecastResults]);

  // Filter forecasts based on search and filters
  const filteredForecasts = useMemo(() => {
    return forecastResults.filter((forecast) => {
      // Search filter
      const matchesSearch = !searchQuery || 
        (forecast.designation && forecast.designation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (forecast.ref_article && forecast.ref_article.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (forecast.marque && forecast.marque.toLowerCase().includes(searchQuery.toLowerCase()));

      // Trend filter
      let matchesTrend = true;
      if (trendFilter !== "all") {
        const trendPct = forecast.trend_pct || 0;
        if (trendFilter === "uptrend") matchesTrend = trendPct > 5;
        else if (trendFilter === "downtrend") matchesTrend = trendPct < -5;
        else if (trendFilter === "stable") matchesTrend = Math.abs(trendPct) <= 5;
      }

      // Family filter
      const matchesFamily = familyFilter === "all" || forecast.famille === familyFilter;

      // Brand filter
      const matchesBrand = brandFilter === "all" || forecast.marque === brandFilter;

      return matchesSearch && matchesTrend && matchesFamily && matchesBrand;
    });
  }, [forecastResults, searchQuery, trendFilter, familyFilter, brandFilter]);

  // Selected article data
  const selectedArticle = useMemo(() => {
    return forecastResults.find(f => f.ref_article === selectedArticleRef) || filteredForecasts[0];
  }, [forecastResults, selectedArticleRef, filteredForecasts]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setUploadStatus("uploading");
    setUploadedFile(file);

    // Get the LATEST frequency from the store at the moment of upload
    const uploadFrequency = useUIStore.getState().sessionFrequency;


    try {
      const response = await apiClient.uploadDataset(file, uploadFrequency);
      
      if (response && response.session_id) {
        setSessionId(response.session_id);
        setUploadStatus("success");
        
        
        toast({
          title: "Upload successful!",
          description: `Processed ${response.rows || 0} rows with ${uploadFrequency.toUpperCase()} frequency. Ready to run forecast.`,
        });
      } else {
        throw new Error("Invalid upload response");
      }
    } catch (error) {
      console.error("❌ [UPLOAD] ERROR:", error);
      setUploadStatus("error");
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unable to upload dataset",
        variant: "destructive",
      });
    }
  }, [apiClient, toast]);

  // Handle Run Forecast
  const handleRunForecast = useCallback(async () => {
    if (!sessionId) {
      toast({
        title: "No dataset uploaded",
        description: "Please upload a dataset first",
        variant: "destructive",
      });
      return;
    }

    if (!settings) {
      toast({
        title: "Settings required",
        description: "Please configure forecast settings",
        variant: "destructive",
      });
      return;
    }

    setIsRunningForecast(true);
    setForecastResults([]);
    setSummaryData(null);

    // Running forecast with settings (sensitive info omitted from logs)

    try {
      // Run forecast with correct endpoint based on frequency
      
      const result = sessionFrequency === "monthly"
        ? await apiClient.forecastMonthlyAll(
            sessionId,
            settings.period,
            settings.alpha,
            false,
            settings.fastMode,
            settings.includeMethods.join(",")
          )
        : await apiClient.forecastAll(
            sessionId,
            settings.period,
            settings.alpha,
            false,
            settings.fastMode,
            settings.includeMethods.join(",")
          );


      // Extract forecasts from result
      let forecasts: ForecastArticle[] = [];
      
      if (result.preview && Array.isArray(result.preview)) {
        forecasts = result.preview;
      } else if (Array.isArray(result)) {
        forecasts = result;
      } else if (result.items && Array.isArray(result.items)) {
        forecasts = result.items;
      } else if (result.forecasts && Array.isArray(result.forecasts)) {
        forecasts = result.forecasts;
      }

      const count = result.count || forecasts.length;
      
      
      setForecastResults(forecasts);
      setTotalForecastCount(count);
      
      // Auto-select first article
      if (forecasts.length > 0 && !selectedArticleRef) {
        setSelectedArticleRef(forecasts[0].ref_article);
      }

      // Switch to articles tab
      setActiveTab("articles");
      
      toast({
        title: "Forecast completed!",
        description: `Generated ${count} ${sessionFrequency} forecasts. Displaying ${forecasts.length} results.`,
      });

      // Fetch summary data
      fetchSummary();
      
    } catch (error) {
      console.error("Forecast error:", error);
      
      toast({
        title: "Forecast failed",
        description: error instanceof Error ? error.message : "Unable to run forecast",
        variant: "destructive",
      });
    } finally {
      setIsRunningForecast(false);
    }
  }, [sessionId, settings, sessionFrequency, apiClient, toast, selectedArticleRef]);

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    if (!sessionId) return;

    setIsLoadingSummary(true);

    try {
      let summary: any;
      
      // Use different endpoint based on frequency
      if (sessionFrequency === 'monthly') {
        summary = await apiClient.getMonthlySummary(sessionId);
        
        // Transform monthly summary to match expected format
        const processedSummary: SummaryData = {
          total_products: summary.total_articles || 0,
          avg_forecast: summary.avg_monthly_sales || 0,
          total_forecast: summary.total_sales || 0,
          trend_distribution: {
            uptrend: Math.floor((summary.total_articles || 0) * (summary.trend_pct > 5 ? 0.4 : 0.2)),
            downtrend: Math.floor((summary.total_articles || 0) * (summary.trend_pct < -5 ? 0.4 : 0.2)),
            stable: Math.floor((summary.total_articles || 0) * 0.4),
          },
          top_products: forecastResults.slice(0, 5).map(f => ({
            ref_article: f.ref_article,
            designation: f.designation,
            avg_forecast: f.avg_forecast,
          })),
        };
        
        setSummaryData(processedSummary);
      } else {
        summary = await apiClient.getSummary(sessionId, false);
        
        // Process summary data
        const processedSummary: SummaryData = {
          total_products: summary.total_products || summary.count || forecastResults.length,
          avg_forecast: summary.avg_forecast || 0,
          total_forecast: summary.total_forecast || 0,
          trend_distribution: summary.trend_distribution || {
            uptrend: forecastResults.filter(f => (f.trend_pct || 0) > 5).length,
            downtrend: forecastResults.filter(f => (f.trend_pct || 0) < -5).length,
            stable: forecastResults.filter(f => Math.abs(f.trend_pct || 0) <= 5).length,
          },
          top_products: summary.top_products || forecastResults.slice(0, 5).map(f => ({
            ref_article: f.ref_article,
            designation: f.designation,
            avg_forecast: f.avg_forecast,
          })),
        };

        setSummaryData(processedSummary);
      }
      
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      
      // Fallback: calculate summary from forecast results
      if (forecastResults.length > 0) {
        const uptrendCount = forecastResults.filter(f => (f.trend_pct || 0) > 5).length;
        const downtrendCount = forecastResults.filter(f => (f.trend_pct || 0) < -5).length;
        const stableCount = forecastResults.filter(f => Math.abs(f.trend_pct || 0) <= 5).length;
        
        const totalForecast = forecastResults.reduce((sum, f) => sum + (f.avg_forecast || 0), 0);
        const avgForecast = totalForecast / forecastResults.length;

        setSummaryData({
          total_products: forecastResults.length,
          avg_forecast: avgForecast,
          total_forecast: totalForecast,
          trend_distribution: {
            uptrend: uptrendCount,
            downtrend: downtrendCount,
            stable: stableCount,
          },
          top_products: forecastResults
            .sort((a, b) => (b.avg_forecast || 0) - (a.avg_forecast || 0))
            .slice(0, 5)
            .map(f => ({
              ref_article: f.ref_article,
              designation: f.designation,
              avg_forecast: f.avg_forecast,
            })),
        });
      }
    } finally {
      setIsLoadingSummary(false);
    }
  }, [sessionId, sessionFrequency, apiClient, forecastResults]);

  // Auto-fetch summary when forecasts are loaded
  useEffect(() => {
    if (forecastResults.length > 0 && !summaryData) {
      fetchSummary();
    }
  }, [forecastResults, summaryData, fetchSummary]);

  // Download summary
  const handleDownloadSummary = useCallback(async () => {
    if (!sessionId) return;

    try {
      const blob = await apiClient.downloadSummary(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forecast_summary_${sessionFrequency}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Your forecast summary is being downloaded",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Unable to download summary",
        variant: "destructive",
      });
    }
  }, [sessionId, sessionFrequency, apiClient, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                Forecast Generator
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Upload data, run AI-powered forecasts, and analyze results
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {sessionId && (
                <>
                  <Badge variant="outline" className="gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    Dataset Loaded
                  </Badge>
                  <Badge variant="outline" className="gap-2">
                    <Calendar className="w-3 h-3" />
                    {sessionFrequency.charAt(0).toUpperCase() + sessionFrequency.slice(1)}
                  </Badge>
                  {forecastResults.length > 0 && (
                    <Badge variant="outline" className="gap-2">
                      <Package className="w-3 h-3" />
                      {totalForecastCount.toLocaleString()} Forecasts
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Step 0: Configure Frequency (before upload) */}
        {!sessionId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <SettingsIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Configure Forecast Settings</CardTitle>
                      <CardDescription>Choose your forecast frequency and parameters</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    {showSettings ? "Hide" : "Show"} Advanced
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Important Notice */}
                  <Alert className="border-amber-500/50 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-600">Important: Select Frequency First!</AlertTitle>
                    <AlertDescription className="text-amber-700/90">
                      Please choose your forecast frequency (Yearly or Monthly) BEFORE uploading your dataset. 
                      This cannot be changed after upload. Currently selected: <strong className="font-semibold">{sessionFrequency.toUpperCase()}</strong>
                    </AlertDescription>
                  </Alert>

                  {/* Frequency Selector */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">
                      Forecast Frequency <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Choose whether to forecast by year or by month. This determines how your data will be processed.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={sessionFrequency === "yearly" ? "default" : "outline"}
                        className={cn(
                          "h-auto py-4 flex-col items-start gap-2 relative",
                          sessionFrequency === "yearly" && "ring-2 ring-primary"
                        )}
                        onClick={() => {
                          setSessionFrequency("yearly");
                          toast({
                            title: "Frequency set to Yearly",
                            description: "Your dataset will be processed with yearly frequency when uploaded.",
                          });
                        }}
                      >
                        {sessionFrequency === "yearly" && (
                          <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-green-500" />
                        )}
                        <div className="flex items-center gap-2 w-full">
                          <Calendar className="w-5 h-5" />
                          <span className="font-semibold">Yearly</span>
                        </div>
                        <span className="text-xs text-muted-foreground text-left">
                          Annual forecasts for long-term planning
                        </span>
                      </Button>
                      
                      <Button
                        type="button"
                        variant={sessionFrequency === "monthly" ? "default" : "outline"}
                        className={cn(
                          "h-auto py-4 flex-col items-start gap-2 relative",
                          sessionFrequency === "monthly" && "ring-2 ring-primary"
                        )}
                        onClick={() => {
                          setSessionFrequency("monthly");
                          toast({
                            title: "Frequency set to Monthly",
                            description: "Your dataset will be processed with monthly frequency when uploaded.",
                          });
                        }}
                      >
                        {sessionFrequency === "monthly" && (
                          <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-green-500" />
                        )}
                        <div className="flex items-center gap-2 w-full">
                          <Calendar className="w-5 h-5" />
                          <span className="font-semibold">Monthly</span>
                        </div>
                        <span className="text-xs text-muted-foreground text-left">
                          Monthly forecasts for detailed planning
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <ForecastSettings />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 1: Upload Dataset */}
        {!sessionId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Upload Dataset</CardTitle>
                    <CardDescription>Upload your CSV file to begin forecasting</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FileUploader onFileSelect={handleFileUpload} disabled={uploadStatus === "uploading"} />
                {uploadStatus === "uploading" && (
                  <Alert className="mt-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>Uploading and processing your dataset...</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Run Forecast & View Results */}
        {sessionId && (
          <>
            {/* Run Forecast Card */}
            {forecastResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 text-green-600">
                        <Play className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Run Forecast</CardTitle>
                        <CardDescription>
                          Generate {sessionFrequency} forecasts for all products in your dataset
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        This will analyze your dataset and generate forecasts using advanced ML models.
                        The process may take a few minutes depending on the dataset size.
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleRunForecast}
                        disabled={isRunningForecast}
                        size="lg"
                        className="gap-2"
                      >
                        {isRunningForecast ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Running Forecast...
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            Run Forecast
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setShowSettings(!showSettings)}
                        size="lg"
                        className="gap-2"
                      >
                        <SettingsIcon className="w-5 h-5" />
                        {showSettings ? "Hide" : "Show"} Settings
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <ForecastSettings />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Results Tabs */}
            {forecastResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Tabs value={activeTab} onValueChange={(v) => {
                  setActiveTab(v as any);
                  // Auto-fetch summary when switching to overview tab if not already loaded
                  if (v === "overview" && !summaryData && !isLoadingSummary) {
                    fetchSummary();
                  }
                }}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <TabsList>
                      <TabsTrigger value="overview" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="articles" className="gap-2">
                        <Package className="w-4 h-4" />
                        Articles ({filteredForecasts.length})
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchSummary}
                        disabled={isLoadingSummary}
                        className="gap-2"
                      >
                        {isLoadingSummary ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Refresh
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadSummary}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    {isLoadingSummary ? (
                      <Card className="border-2">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                          <p className="text-lg font-semibold">Loading Summary Metrics...</p>
                          <p className="text-sm text-muted-foreground">Analyzing forecast data</p>
                        </CardContent>
                      </Card>
                    ) : summaryData ? (
                      <ForecastMetricsDashboard summary={summaryData} frequency={sessionFrequency} />
                    ) : (
                      <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                          <p className="text-lg font-semibold mb-2">No Summary Data Available</p>
                          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                            Summary metrics haven't been loaded yet. Click the refresh button above to fetch the latest forecast summary.
                          </p>
                          <Button onClick={fetchSummary} variant="outline" className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Load Summary Data
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Articles Tab */}
                  <TabsContent value="articles" className="space-y-6">
                    {/* Filters & Search */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div className="lg:col-span-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Search by name, ref, or brand..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                          </div>

                          <Select value={trendFilter} onValueChange={(v: any) => setTrendFilter(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Filter by trend" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Trends</SelectItem>
                              <SelectItem value="uptrend">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                  Uptrend
                                </div>
                              </SelectItem>
                              <SelectItem value="downtrend">
                                <div className="flex items-center gap-2">
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                  Downtrend
                                </div>
                              </SelectItem>
                              <SelectItem value="stable">Stable</SelectItem>
                            </SelectContent>
                          </Select>

                          {uniqueFamilies.length > 0 && (
                            <Select value={familyFilter} onValueChange={setFamilyFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="Filter by family" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Families</SelectItem>
                                {uniqueFamilies.map((family) => (
                                  <SelectItem key={family} value={family}>
                                    {family}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {uniqueBrands.length > 0 && (
                            <Select value={brandFilter} onValueChange={setBrandFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="Filter by brand" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Brands</SelectItem>
                                {uniqueBrands.map((brand) => (
                                  <SelectItem key={brand} value={brand}>
                                    {brand}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{filteredForecasts.length}</span> of{" "}
                            <span className="font-semibold text-foreground">{totalForecastCount.toLocaleString()}</span> forecasts
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant={viewMode === "grid" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setViewMode("grid")}
                            >
                              <Grid3x3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={viewMode === "list" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setViewMode("list")}
                            >
                              <List className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Selected Article Detail */}
                    {selectedArticle && (
                      <ForecastDetailPanel forecast={selectedArticle} />
                    )}

                    {/* Articles Grid/List */}
                    <div className={cn(
                      "grid gap-4",
                      viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                    )}>
                      {filteredForecasts.map((article) => (
                        <ForecastArticleCard
                          key={article.ref_article}
                          article={article}
                          onClick={() => setSelectedArticleRef(article.ref_article)}
                          isSelected={selectedArticleRef === article.ref_article}
                        />
                      ))}
                    </div>

                    {filteredForecasts.length === 0 && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          No forecasts match your current filters. Try adjusting your search or filter criteria.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ForecastsPage;
