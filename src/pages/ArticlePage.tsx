import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, Database, Calendar } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { generateMockForecast } from "@/infrastructure/mockData";
import { apiClient } from "@/infrastructure/apiClient";
import { ForecastResult } from "@/domain/types";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const ArticlePage = () => {
  const { articles, selectedArticle, setSelectedArticle, settings, updateSettings, sessionId } = useUIStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  

  const filteredArticles = articles.filter(
    (a) =>
      a.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedArticle) return;
      // Try backend first
      if (sessionId) {
        try {
          const resRaw = await apiClient.forecastArticle(sessionId, selectedArticle, settings, false, true, settings.includeMethods);
          // Defensive mapping from backend shape to ForecastResult
          const r: any = resRaw ?? {};

          // helper to parse possibly stringified arrays like "[1,2,3]"
          const parseArray = (v: any) => {
            if (Array.isArray(v)) return v;
            if (typeof v === "string") {
              try {
                const parsed = JSON.parse(v);
                if (Array.isArray(parsed)) return parsed;
              } catch (e) {
                // fallback: split by comma
                return v.replace(/\[|\]|\s+/g, "").split(",").filter(Boolean).map((s) => Number(s));
              }
            }
            return [];
          };

          const years = parseArray(r.historical_years ?? r.historicalYears ?? r.years ?? []);
          const values = parseArray(r.historical_values ?? r.historicalValues ?? r.values ?? []);

          const historique = years.map((y: any, i: number) => ({ year: Number(y), value: Number(values[i] ?? 0) }));

          const forecasts: any[] = [];
          const pushIfNumber = (method: string, val: any) => {
            const n = val == null ? null : Number(val);
            if (n !== null && !Number.isNaN(n)) forecasts.push({ method, value: n });
          };

          pushIfNumber("SMA", r.sma_forecast ?? r.smaForecast ?? r.sma);
          pushIfNumber("ExpSmoothing", r.es_forecast ?? r.esForecast ?? r.es);
          pushIfNumber("LinearReg", r.lr_forecast ?? r.lrForecast ?? r.lr);
          pushIfNumber("ARIMA", r.arima_forecast ?? r.arimaForecast ?? r.arima);
          pushIfNumber("PROPHET", r.prophet_forecast ?? r.prophetForecast ?? r.prophet);
          pushIfNumber("XGBOOST", r.xgb_forecast ?? r.xgbForecast ?? r.xgb);

          const avgForecast = Number(r.avg_forecast ?? r.avgForecast ?? 0) || 0;
          const trendPct = Number(r.trend_pct ?? r.trendPct ?? 0) || 0;
          const nextYear = Number(r.next_year ?? r.nextYear ?? (new Date().getFullYear() + 1));

          const mapped: any = {
            ref: String(r.ref_article ?? r.ref ?? selectedArticle),
            designation: r.designation ?? r.design ?? "",
            marque: r.marque ?? r.brand ?? undefined,
            famille: r.famille ?? r.family ?? undefined,
            historique,
            forecasts,
            avgForecast,
            trendPct,
            dataPoints: Number(r.data_points ?? r.dataPoints ?? (historique.length)),
            nextYear,
          };

          if (mounted) setForecast(mapped as any);
          return;
        } catch (err) {
          console.warn("Backend forecast failed, falling back to mock", err);
        }
      }

      const article = articles.find((a) => a.ref === selectedArticle);
      if (article) {
        const mockForecast = generateMockForecast(article);
        if (mounted) setForecast(mockForecast);
      }
    })();
    return () => { mounted = false };
  }, [selectedArticle, articles, settings.includeMethods]);


  const handleSelectArticle = (ref: string) => {
    setSelectedArticle(ref);
  };

  if (!forecast) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">Single Article Analysis</h2>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              Search and select an article to view detailed forecasts
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              placeholder="Search by reference or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:pl-12 h-12 sm:h-14 text-base sm:text-lg bg-card border-border"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-[600px] overflow-y-auto">
            {filteredArticles.map((article) => (
              <motion.div
                key={article.ref}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSelectArticle(article.ref)}
                className="cursor-pointer rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6 hover:bg-card-glow hover-lift transition-colors"
              >
                <p className="font-mono text-xs sm:text-sm text-primary mb-2 truncate">{article.ref}</p>
                <h3 className="text-sm sm:text-base font-semibold mb-2 line-clamp-2">{article.designation}</h3>
                <div className="flex gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  {article.marque && <span className="truncate">{article.marque}</span>}
                  {article.famille && (
                    <>
                      <span>•</span>
                      <span className="truncate">{article.famille}</span>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const historicalChartData = forecast.historique.map((h) => ({
    year: h.year,
    value: h.value,
  }));

  const forecastChartData = [
    ...historicalChartData,
    { year: forecast.nextYear, forecast: forecast.avgForecast },
  ];

  const methodsChartData = forecast.forecasts.map((f) => ({
    method: f.method,
    value: f.value,
  }));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 sm:space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="outline"
          onClick={() => setForecast(null)}
          className="mb-4 sm:mb-6 text-sm"
        >
          \u2190 Back to Search
        </Button>

        <div className="card-elevated rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs sm:text-sm text-primary mb-2 truncate">{forecast.ref}</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-3">{forecast.designation}</h1>
              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                {forecast.marque && <span>Brand: {forecast.marque}</span>}
                {forecast.famille && <span>Family: {forecast.famille}</span>}
              </div>
            </div>
            <div className="flex-shrink-0 lg:ml-6">
              <div className="text-xs sm:text-sm text-muted-foreground mb-2">Models</div>
              <div className="flex flex-col gap-1">
                {[
                  ["SMA", "SMA"],
                  ["ExpSmoothing", "ExpSmoothing"],
                  ["LinearReg", "LinearReg"],
                  ["ARIMA", "ARIMA"],
                  ["PROPHET", "PROPHET"],
                  ["XGBOOST", "XGBOOST"],
                ].map(([k, label]) => (
                  <label key={k} className="inline-flex items-center gap-2 text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={settings.includeMethods?.includes(k as any)}
                      onChange={(e) => {
                        const v = k as any;
                        const prev = (settings.includeMethods ?? []) as any[];
                        const next = e.target.checked ? Array.from(new Set([...prev, v])) : prev.filter((x) => x !== v);
                        updateSettings({ includeMethods: next as any });
                      }}
                      className="accent-primary"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="rounded-lg sm:rounded-xl border border-border bg-muted/20 p-6 sm:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Database className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground">Data Points</p>
              </div>
              <p className="text-3xl sm:text-4xl font-bold">{forecast.dataPoints}</p>
            </div>

            <div className="rounded-lg sm:rounded-xl border border-border bg-muted/20 p-6 sm:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                <p className="text-xs sm:text-sm text-muted-foreground">Historical Trend</p>
              </div>
              <p className={`text-3xl sm:text-4xl font-bold ${forecast.trendPct > 0 ? "text-primary" : "text-destructive"}`}>
                {forecast.trendPct > 0 ? "+" : ""}
                {forecast.trendPct.toFixed(1)}%
              </p>
            </div>

            <div className="rounded-lg sm:rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10 p-6 sm:p-8 glow-primary sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground">Next Year Forecast</p>
              </div>
              <p className="text-4xl sm:text-5xl font-bold gradient-text">
                {forecast.avgForecast.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} DT
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Historical + Forecast Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-elevated rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8"
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Historical Sales & Forecast</h2>
        <ResponsiveContainer width="100%" height={420} className="sm:h-[480px]">
          <LineChart data={forecastChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              name="Historical"
              dot={{ fill: "hsl(var(--primary))", r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--secondary))"
              strokeWidth={3}
              strokeDasharray="5 5"
              name="Forecast"
              dot={{ fill: "hsl(var(--secondary))", r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Methods Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-elevated rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10"
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Model Comparison</h2>
        <ResponsiveContainer width="100%" height={340} className="sm:h-[380px]">
          <BarChart data={methodsChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="method" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* raw server response hidden by default */}
    </div>
  );
};

export default ArticlePage;

