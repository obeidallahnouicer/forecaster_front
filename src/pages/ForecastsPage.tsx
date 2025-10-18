import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ForecastChart } from "@/components/ForecastChart";
import { FileUploader } from "@/components/FileUploader";
import { ForecastSettings } from "@/components/ForecastSettings";
import { APIClient } from "@/infrastructure/apiClient";
import { ErrorState, EmptyState } from "@/components/ErrorStates";
import { SkeletonCard } from "@/components/LoadingStates";
import { useToast } from "@/hooks/use-toast";
import { useUIStore } from "@/store/uiStore";
import {
  Search,
  Filter,
  Download,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Play,
  Loader2,
  Upload as UploadIcon,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Settings as SettingsIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ForecastsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [trendFilter, setTrendFilter] = useState<"all" | "growth" | "decline" | "stable">("all");
  const [selectedForecast, setSelectedForecast] = useState<string | null>(null);
  
  // State for upload and forecast workflow
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunningForecast, setIsRunningForecast] = useState(false);
  const [forecastResults, setForecastResults] = useState<any[]>([]);
  const [totalForecastCount, setTotalForecastCount] = useState<number>(0);
  const [isLoadingForecasts, setIsLoadingForecasts] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [showSettings, setShowSettings] = useState(false);
  
  const { toast } = useToast();
  const { settings, sessionFrequency } = useUIStore();
  const apiClient = new APIClient();

  // Handle file upload with proper async handling
  const handleFileUpload = useCallback(async (file: File) => {
    setUploadStatus("uploading");
    setUploadedFile(file);

    console.log(`[ForecastsPage] Uploading dataset with frequency: ${sessionFrequency}`);

    try {
      // Upload with proper timeout handling
      const response = await apiClient.uploadDataset(file, sessionFrequency);
      
      if (response && response.session_id) {
        setSessionId(response.session_id);
        setUploadStatus("success");
        
        console.log(`[ForecastsPage] Upload successful. Session ID: ${response.session_id}, Frequency: ${sessionFrequency}`);
        
        toast({
          title: "Upload successful!",
          description: `Processed ${response.rows || 0} rows with ${sessionFrequency} frequency. Ready to run forecast.`,
        });
      } else {
        throw new Error("Invalid upload response");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unable to upload dataset",
        variant: "destructive",
      });
    }
  }, [sessionFrequency, apiClient, toast]);

  // Handle Run Forecast button
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

    console.log(`[ForecastsPage] Running forecast with settings:`, {
      sessionId,
      frequency: sessionFrequency,
      period: settings.period,
      alpha: settings.alpha,
      fastMode: settings.fastMode,
      methods: settings.includeMethods,
    });

    try {
      // Run forecast with correct endpoint based on frequency
      console.log(`[ForecastsPage] Calling ${sessionFrequency} forecast endpoint`);
      
      const result = sessionFrequency === "monthly"
        ? await apiClient.forecastMonthlyAll(
            sessionId,
            settings.period,
            settings.alpha,
            false, // forceRecompute
            settings.fastMode,
            settings.includeMethods.join(",")
          )
        : await apiClient.forecastAll(
            sessionId,
            settings.period,
            settings.alpha,
            false, // forceRecompute
            settings.fastMode,
            settings.includeMethods.join(",")
          );

      console.log("[ForecastsPage] Raw forecast result:", result);

      // Process results - the API returns { preview: [...], count: number, top_products: [...] }
      let forecasts: any[] = [];
      
      if (Array.isArray(result)) {
        forecasts = result;
      } else if (result.preview && Array.isArray(result.preview)) {
        forecasts = result.preview;
      } else if (result.items && Array.isArray(result.items)) {
        forecasts = result.items;
      } else if (result.forecasts && Array.isArray(result.forecasts)) {
        forecasts = result.forecasts;
      }
      
      // Transform forecast data to match our display format
      const transformedForecasts = forecasts.map((item: any) => ({
        id: item.ref_article || item.ref || item.id || `item-${Math.random()}`,
        ref: item.ref_article || item.ref || item.reference || "N/A",
        designation: item.designation || item.name || "Product",
        marque: item.marque || item.brand || "-",
        famille: item.famille || item.family || "-",
        status: "Completed",
        model: "Available",
        avgForecast: item.avg_forecast || 0,
        trendPct: item.trend_pct || 0,
        trendLabel: item.trend_label || "Stable",
        nextPeriod: item.next_period || item.next_year,
        frequency: item.frequency || sessionFrequency,
        // Include additional metrics if available
        historicalValues: item.historical_values_list || [],
        historicalPeriods: item.historical_periods || [],
      }));
      
      console.log(`[ForecastsPage] Forecast completed. Total count: ${result.count || forecasts.length}, Displaying: ${transformedForecasts.length} items`);
      
      setForecastResults(transformedForecasts);
      setTotalForecastCount(result.count || transformedForecasts.length);
      
      toast({
        title: "Forecast completed!",
        description: `Generated ${result.count || transformedForecasts.length} ${sessionFrequency} forecasts. Showing first ${transformedForecasts.length} items.`,
      });

      if (transformedForecasts.length > 0) {
        setSelectedForecast(transformedForecasts[0].ref || transformedForecasts[0].id);
      }
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
  }, [sessionId, settings, sessionFrequency, apiClient, toast]);

  // Load existing forecasts from session
  const loadExistingForecasts = useCallback(async () => {
    if (!sessionId) return;

    setIsLoadingForecasts(true);

    try {
      const articles = await apiClient.listArticles(sessionId);
      
      if (articles && Array.isArray(articles)) {
        // Transform articles to forecast format
        const transformed = articles.map((article: any) => ({
          id: article.ref || article.id || `item-${Math.random()}`,
          ref: article.ref || article.reference || "N/A",
          designation: article.designation || article.name || "Product",
          marque: article.marque || article.brand,
          famille: article.famille || article.family,
          status: "Ready",
          model: "Available",
        }));
        
        setForecastResults(transformed);
        
        if (transformed.length > 0 && !selectedForecast) {
          setSelectedForecast(transformed[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load forecasts:", error);
    } finally {
      setIsLoadingForecasts(false);
    }
  }, [sessionId, selectedForecast, apiClient]);

  // Load forecasts when session changes
  useEffect(() => {
    if (sessionId && forecastResults.length === 0) {
      loadExistingForecasts();
    }
  }, [sessionId]);

  // Filter forecasts based on search and trend
  const filteredForecasts = useMemo(() => {
    return forecastResults.filter((forecast: any) => {
      const matchesSearch = !searchQuery || 
        (forecast.designation && forecast.designation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (forecast.ref && forecast.ref.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (forecast.marque && forecast.marque.toLowerCase().includes(searchQuery.toLowerCase()));

      // Trend filtering
      if (trendFilter === "all") return matchesSearch;
      
      const trendPct = forecast.trendPct || 0;
      if (trendFilter === "growth") return matchesSearch && trendPct > 5;
      if (trendFilter === "decline") return matchesSearch && trendPct < -5;
      if (trendFilter === "stable") return matchesSearch && Math.abs(trendPct) <= 5;

      return matchesSearch;
    });
  }, [forecastResults, searchQuery, trendFilter]);

  const selectedForecastData = selectedForecast 
    ? forecastResults.find((f: any) => f.id === selectedForecast || f.ref === selectedForecast)
    : filteredForecasts[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="sticky top-20 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Forecast Generator
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Upload data, run forecasts, and analyze results
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {sessionId && (
                <Badge variant="outline" className="gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  Dataset Loaded
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Step 0: Configure Frequency (before upload) */}
        {!sessionId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold">
                      <SettingsIcon className="w-4 h-4" />
                    </div>
                    <CardTitle>Configure Forecast Settings</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="gap-2"
                  >
                    {showSettings ? "Hide" : "Show"} Advanced Settings
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Frequency Selector - Always Visible */}
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
                          "h-auto py-4 flex-col items-start gap-2",
                          sessionFrequency === "yearly" && "ring-2 ring-primary"
                        )}
                        onClick={() => useUIStore.getState().setSessionFrequency("yearly")}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2",
                            sessionFrequency === "yearly" 
                              ? "border-primary-foreground bg-primary-foreground" 
                              : "border-muted-foreground"
                          )} />
                          <span className="font-semibold">Yearly</span>
                        </div>
                        <span className="text-xs font-normal opacity-80">
                          Forecast by calendar year
                        </span>
                      </Button>
                      
                      <Button
                        type="button"
                        variant={sessionFrequency === "monthly" ? "default" : "outline"}
                        className={cn(
                          "h-auto py-4 flex-col items-start gap-2",
                          sessionFrequency === "monthly" && "ring-2 ring-primary"
                        )}
                        onClick={() => useUIStore.getState().setSessionFrequency("monthly")}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2",
                            sessionFrequency === "monthly" 
                              ? "border-primary-foreground bg-primary-foreground" 
                              : "border-muted-foreground"
                          )} />
                          <span className="font-semibold">Monthly</span>
                        </div>
                        <span className="text-xs font-normal opacity-80">
                          Forecast by month for detailed trends
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Advanced Settings (Collapsible) */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="border-t pt-6">
                          <ForecastSettings />
                        </div>
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
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    1
                  </div>
                  <CardTitle>Upload Your Dataset</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <FileUploader onFileSelect={handleFileUpload} disabled={uploadStatus === "uploading"} />
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Selected frequency:</span> {sessionFrequency.charAt(0).toUpperCase() + sessionFrequency.slice(1)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Run Forecast */}
        {sessionId && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        2
                      </div>
                      <CardTitle>Run Forecast Analysis</CardTitle>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSettings(!showSettings)}
                        className="gap-2"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        {showSettings ? "Hide" : "Configure"}
                      </Button>
                      <Button
                        onClick={handleRunForecast}
                        disabled={isRunningForecast}
                        size="lg"
                        className="gap-2"
                      >
                        {isRunningForecast ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Run Forecast
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Current Settings Display */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Frequency</p>
                        <p className="text-lg font-bold capitalize">{sessionFrequency || "yearly"}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">SMA Period</p>
                        <p className="text-lg font-bold">{settings?.period || 3}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Alpha</p>
                        <p className="text-lg font-bold">{settings?.alpha || 0.3}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Models</p>
                        <p className="text-lg font-bold">{settings?.includeMethods?.length || 0}</p>
                      </div>
                    </div>

                    {/* Settings Panel */}
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="border rounded-lg p-4 bg-muted/50">
                            <ForecastSettings />
                            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                                <strong>Note:</strong> Changing the frequency requires re-uploading your dataset.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 3: View Results */}
            {(forecastResults.length > 0 || isLoadingForecasts) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          3
                        </div>
                        <CardTitle>
                          Forecast Results 
                          {totalForecastCount > 0 && (
                            <span className="ml-2 text-base font-normal text-muted-foreground">
                              (Showing {filteredForecasts.length} of {totalForecastCount} total)
                            </span>
                          )}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="w-4 h-4" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={loadExistingForecasts}>
                          <RefreshCw className={cn("w-4 h-4", isLoadingForecasts && "animate-spin")} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Info Banner */}
                    {totalForecastCount > forecastResults.length && (
                      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold text-blue-600 dark:text-blue-400">Preview Mode</p>
                          <p className="text-blue-600/80 dark:text-blue-400/80">
                            Displaying first {forecastResults.length} items of {totalForecastCount} total {sessionFrequency} forecasts generated. 
                            Use the Export button to download all results.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by product, brand, or reference..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <Select value={trendFilter} onValueChange={(value: any) => setTrendFilter(value)}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Filter by trend" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Trends</SelectItem>
                          <SelectItem value="growth">Growth (&gt;5%)</SelectItem>
                          <SelectItem value="stable">Stable (±5%)</SelectItem>
                          <SelectItem value="decline">Decline (&lt;-5%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Results Display */}
                    {isLoadingForecasts ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <SkeletonCard key={idx} />
                        ))}
                      </div>
                    ) : filteredForecasts.length === 0 ? (
                      <EmptyState
                        title="No results found"
                        message={
                          searchQuery || trendFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "Run a forecast to see results"
                        }
                      />
                    ) : (
                      <Tabs defaultValue="grid" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="grid">Grid View</TabsTrigger>
                          <TabsTrigger value="table">Table View</TabsTrigger>
                        </TabsList>

                        <TabsContent value="grid" className="mt-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredForecasts.map((forecast: any, idx: number) => (
                              <motion.div
                                key={forecast.id || forecast.ref || idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.02 }}
                              >
                                <Card
                                  className={cn(
                                    "cursor-pointer transition-all duration-300 hover:shadow-lg",
                                    selectedForecast === (forecast.id || forecast.ref) &&
                                      "border-primary shadow-lg shadow-primary/20"
                                  )}
                                  onClick={() => setSelectedForecast(forecast.id || forecast.ref)}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <CardTitle className="text-sm truncate">
                                          {forecast.designation || forecast.name || forecast.ref}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {forecast.ref || forecast.id}
                                        </p>
                                      </div>
                                      <Badge variant="secondary" className="flex-shrink-0">
                                        {forecast.status || "Ready"}
                                      </Badge>
                                    </div>
                                  </CardHeader>

                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-primary/10 rounded p-2 text-center">
                                        <p className="text-xs text-muted-foreground mb-0.5">
                                          Avg Forecast
                                        </p>
                                        <p className="text-sm font-bold text-primary">
                                          {forecast.avgForecast ? forecast.avgForecast.toLocaleString() : "N/A"}
                                        </p>
                                      </div>
                                      <div className="bg-secondary/10 rounded p-2 text-center">
                                        <p className="text-xs text-muted-foreground mb-0.5">
                                          Trend
                                        </p>
                                        <p className={cn(
                                          "text-sm font-bold",
                                          forecast.trendPct > 5 ? "text-green-500" : forecast.trendPct < -5 ? "text-red-500" : "text-secondary"
                                        )}>
                                          {forecast.trendPct ? `${forecast.trendPct.toFixed(1)}%` : "N/A"}
                                        </p>
                                      </div>
                                    </div>

                                    {forecast.marque && (
                                      <div className="text-xs text-muted-foreground">
                                        Brand: {forecast.marque}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="table" className="mt-6">
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Reference</TableHead>
                                  <TableHead>Designation</TableHead>
                                  <TableHead>Brand</TableHead>
                                  <TableHead className="text-right">Avg Forecast</TableHead>
                                  <TableHead className="text-right">Trend %</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredForecasts.map((forecast: any) => (
                                  <TableRow
                                    key={forecast.id || forecast.ref}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelectedForecast(forecast.id || forecast.ref)}
                                  >
                                    <TableCell className="font-medium">{forecast.ref || forecast.id}</TableCell>
                                    <TableCell>{forecast.designation || "N/A"}</TableCell>
                                    <TableCell>{forecast.marque || "-"}</TableCell>
                                    <TableCell className="text-right">
                                      {forecast.avgForecast ? forecast.avgForecast.toLocaleString() : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <span className={cn(
                                        "font-medium",
                                        forecast.trendPct > 5 ? "text-green-500" : forecast.trendPct < -5 ? "text-red-500" : ""
                                      )}>
                                        {forecast.trendPct ? `${forecast.trendPct.toFixed(1)}%` : "N/A"}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{forecast.status || "Ready"}</Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ForecastsPage;
