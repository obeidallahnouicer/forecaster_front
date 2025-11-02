import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Minus, Package, Tag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSalesForecast, getSalesTrend, getSalesTrendLabel, getQuantityForecast, getQuantityTrend, getQuantityTrendLabel } from "@/utils/forecastHelpers";
import HistoricalProgressChart from "./HistoricalProgressChart";
import ModelComparison from "./ModelComparison";
import { ModelMetrics } from "./ModelPerformanceCard";

interface ForecastDetailPanelProps {
  forecast: {
    ref_article: string;
    designation: string;
    marque?: string;
    famille?: string;
    
    // Dual forecasting fields (new)
    sales_avg_forecast?: number;
    sales_trend_pct?: number;
    qty_avg_forecast?: number;
    qty_trend_pct?: number;
    
    // Legacy fields
    avg_forecast?: number;
    trend_pct?: number;
    trend_label?: string;
    
    data_points?: number;
    next_period?: number | string;
    frequency?: string;
    historical_periods?: string | number[];
    historical_values?: string | number[];
    historical_values_list?: number[];
    historical_sales?: number[];
    historical_quantities?: number[];
    min_sales?: number;
    max_sales?: number;
    avg_sales?: number;
    sales_avg?: number;
    std_sales?: number;
    avg_quantities?: number;
    qty_avg?: number;
    
    // Sales model forecasts
    sales_sma_forecast?: number;
    sales_es_forecast?: number;
    sales_lr_forecast?: number;
    sales_xgb_forecast?: number;
    
    // Quantity model forecasts
    qty_sma_forecast?: number;
    qty_es_forecast?: number;
    qty_lr_forecast?: number;
    qty_xgb_forecast?: number;
    
    // Sales model metrics
    sales_sma_metrics?: ModelMetrics;
    sales_es_metrics?: ModelMetrics;
    sales_lr_metrics?: ModelMetrics;
    sales_xgb_metrics?: ModelMetrics;
    
    // Quantity model metrics
    qty_sma_metrics?: ModelMetrics;
    qty_es_metrics?: ModelMetrics;
    qty_lr_metrics?: ModelMetrics;
    qty_xgb_metrics?: ModelMetrics;
    
    // Legacy method-specific forecasts
    sma_forecast?: number;
    es_forecast?: number;
    lr_forecast?: number;
    xgb_forecast?: number;
    arima_forecast?: number;
    prophet_forecast?: number;
    
    // Legacy Metrics (string-encoded JSON)
    sma_metrics?: string;
    es_metrics?: string;
    lr_metrics?: string;
    xgb_metrics?: string;
    arima_metrics?: string;
    prophet_metrics?: string;
  };
}

const ForecastDetailPanel: React.FC<ForecastDetailPanelProps> = ({ forecast }) => {
  // Get values using helper functions for backward compatibility
  const avgForecast = getSalesForecast(forecast);
  const trendPct = getSalesTrend(forecast);
  const trendLabel = getSalesTrendLabel(forecast);
  
  const qtyForecast = getQuantityForecast(forecast);
  const qtyTrend = getQuantityTrend(forecast);
  const qtyTrendLabel = getQuantityTrendLabel(forecast);
  
  // Parse historical periods
  const historicalPeriods = useMemo(() => {
    try {
      const periods = typeof forecast.historical_periods === "string"
        ? JSON.parse(forecast.historical_periods)
        : forecast.historical_periods || [];
      return periods;
    } catch (error) {
      console.warn("Failed to parse historical_periods", error);
      return [];
    }
  }, [forecast.historical_periods]);
  
  // Parse historical sales
  const historicalSales = useMemo(() => {
    if (forecast.historical_sales && Array.isArray(forecast.historical_sales)) {
      return forecast.historical_sales;
    }
    // Fallback to historical_values if available
    try {
      const values = typeof forecast.historical_values === "string"
        ? JSON.parse(forecast.historical_values)
        : forecast.historical_values_list || forecast.historical_values || [];
      return values;
    } catch (error) {
      console.warn("Failed to parse historical_sales", error);
      return [];
    }
  }, [forecast.historical_sales, forecast.historical_values, forecast.historical_values_list]);
  
  // Parse historical quantities
  const historicalQuantities = useMemo(() => {
    if (forecast.historical_quantities && Array.isArray(forecast.historical_quantities)) {
      return forecast.historical_quantities;
    }
    return [];
  }, [forecast.historical_quantities]);
  
  // Prepare sales models data
  const salesModels = useMemo(() => ({
    sma: forecast.sales_sma_forecast && forecast.sales_sma_metrics ? {
      forecast: forecast.sales_sma_forecast,
      metrics: forecast.sales_sma_metrics
    } : undefined,
    es: forecast.sales_es_forecast && forecast.sales_es_metrics ? {
      forecast: forecast.sales_es_forecast,
      metrics: forecast.sales_es_metrics
    } : undefined,
    lr: forecast.sales_lr_forecast && forecast.sales_lr_metrics ? {
      forecast: forecast.sales_lr_forecast,
      metrics: forecast.sales_lr_metrics
    } : undefined,
    xgb: forecast.sales_xgb_forecast && forecast.sales_xgb_metrics ? {
      forecast: forecast.sales_xgb_forecast,
      metrics: forecast.sales_xgb_metrics
    } : undefined,
  }), [forecast]);
  
  // Prepare quantity models data
  const qtyModels = useMemo(() => ({
    sma: forecast.qty_sma_forecast && forecast.qty_sma_metrics ? {
      forecast: forecast.qty_sma_forecast,
      metrics: forecast.qty_sma_metrics
    } : undefined,
    es: forecast.qty_es_forecast && forecast.qty_es_metrics ? {
      forecast: forecast.qty_es_forecast,
      metrics: forecast.qty_es_metrics
    } : undefined,
    lr: forecast.qty_lr_forecast && forecast.qty_lr_metrics ? {
      forecast: forecast.qty_lr_forecast,
      metrics: forecast.qty_lr_metrics
    } : undefined,
    xgb: forecast.qty_xgb_forecast && forecast.qty_xgb_metrics ? {
      forecast: forecast.qty_xgb_forecast,
      metrics: forecast.qty_xgb_metrics
    } : undefined,
  }), [forecast]);
  
  // Prepare model forecasts for chart (optional scatter points)
  const modelForecasts = useMemo(() => {
    if (!forecast.sales_sma_forecast && !forecast.sales_es_forecast) return undefined;
    return {
      sales_sma: forecast.sales_sma_forecast,
      sales_es: forecast.sales_es_forecast,
      sales_lr: forecast.sales_lr_forecast,
      sales_xgb: forecast.sales_xgb_forecast,
      qty_sma: forecast.qty_sma_forecast,
      qty_es: forecast.qty_es_forecast,
      qty_lr: forecast.qty_lr_forecast,
      qty_xgb: forecast.qty_xgb_forecast,
    };
  }, [forecast]);
  
  // Check if we have model data to display
  const hasModelData = Object.values(salesModels).some(m => m !== undefined) || 
                        Object.values(qtyModels).some(m => m !== undefined);

  // Parse method metrics
  const parseMetrics = (metricsJson?: string) => {
    if (!metricsJson) return null;
    try {
      const parsed = JSON.parse(metricsJson);
      return parsed;
    } catch {
      return null;
    }
  };

  // Collect all methods with their forecasts - use useMemo for efficiency
  const methods = useMemo(() => [
    { name: "SMA", value: forecast.sma_forecast, metrics: parseMetrics(forecast.sma_metrics) },
    { name: "Exp. Smoothing", value: forecast.es_forecast, metrics: parseMetrics(forecast.es_metrics) },
    { name: "Linear Regression", value: forecast.lr_forecast, metrics: parseMetrics(forecast.lr_metrics) },
    { name: "XGBoost", value: forecast.xgb_forecast, metrics: parseMetrics(forecast.xgb_metrics) },
    { name: "ARIMA", value: forecast.arima_forecast, metrics: parseMetrics(forecast.arima_metrics) },
    { name: "Prophet", value: forecast.prophet_forecast, metrics: parseMetrics(forecast.prophet_metrics) },
  ].filter((m) => m.value !== null && m.value !== undefined), [
    forecast.sma_forecast,
    forecast.es_forecast,
    forecast.lr_forecast,
    forecast.xgb_forecast,
    forecast.arima_forecast,
    forecast.prophet_forecast,
    forecast.sma_metrics,
    forecast.es_metrics,
    forecast.lr_metrics,
    forecast.xgb_metrics,
    forecast.arima_metrics,
    forecast.prophet_metrics,
  ]);

  const isUptrend = trendPct > 5;
  const isDowntrend = trendPct < -5;
  const TrendIcon = isUptrend ? TrendingUp : isDowntrend ? TrendingDown : Minus;
  const trendColor = isUptrend ? "text-green-600" : isDowntrend ? "text-red-600" : "text-yellow-600";

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-2xl">{forecast.designation}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {forecast.ref_article}
              </Badge>
              {forecast.marque && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-sm inline-flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {forecast.marque}
                  </span>
                </>
              )}
              {forecast.famille && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-sm inline-flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {forecast.famille}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          
          <Badge className={cn("px-4 py-2", isUptrend ? "bg-green-100 text-green-700 border-green-200" : isDowntrend ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200")}>
            <TrendIcon className="w-4 h-4 mr-2" />
            {trendLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics - Sales */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Sales Forecast</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Avg Forecast ({forecast.frequency || 'yearly'})</div>
              <div className="text-2xl font-bold text-green-600">
                €{avgForecast.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Trend</div>
              <div className={cn("text-2xl font-bold", trendColor)}>
                {trendPct > 0 ? "+" : ""}{trendPct.toFixed(1)}%
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Historical Avg</div>
              <div className="text-2xl font-bold">
                €{(forecast.avg_sales || forecast.sales_avg || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Next Period</div>
              <div className="text-2xl font-bold">
                {forecast.next_period || "N/A"}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Key Metrics - Quantity */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Quantity Forecast</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Avg Forecast ({forecast.frequency || 'yearly'})</div>
              <div className="text-2xl font-bold text-blue-600">
                {qtyForecast.toLocaleString(undefined, { maximumFractionDigits: 0 })} units
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Trend</div>
              <div className={cn(
                "text-2xl font-bold",
                qtyTrend > 5 ? "text-green-600" : qtyTrend < -5 ? "text-red-600" : "text-yellow-600"
              )}>
                {qtyTrend > 0 ? "+" : ""}{qtyTrend.toFixed(1)}%
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Historical Avg</div>
              <div className="text-2xl font-bold">
                {((forecast as any).avg_quantities || (forecast as any).qty_avg || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} units
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Data Points</div>
              <div className="text-2xl font-bold">
                {forecast.data_points || 0}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* NEW: Historical Progress Chart with Dual Axis */}
        {historicalPeriods.length > 0 && historicalSales.length > 0 && historicalQuantities.length > 0 && (
          <>
            <div>
              <h3 className="text-sm font-semibold mb-3 inline-flex items-center gap-2">
                📈 Historical Progress &amp; Forecast
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Track historical sales (€) and quantities (units) with projected forecasts
              </p>
              <HistoricalProgressChart
                historicalPeriods={historicalPeriods}
                historicalSales={historicalSales}
                historicalQuantities={historicalQuantities}
                salesAvgForecast={avgForecast}
                qtyAvgForecast={qtyForecast}
                nextPeriod={forecast.next_period || "N/A"}
                modelForecasts={modelForecasts}
              />
            </div>

            <Separator />
          </>
        )}

        {/* NEW: Model Performance Comparison */}
        {hasModelData && (
          <>
            <ModelComparison
              salesModels={salesModels}
              qtyModels={qtyModels}
            />

            <Separator />
          </>
        )}

        {/* Method Breakdown */}
        {methods.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Forecast Methods Used</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {methods.map((method) => (
                <Card key={method.name} className="p-3">
                  <div className="text-xs text-muted-foreground">{method.name}</div>
                  <div className="text-lg font-semibold mt-1">
                    {method.value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  {method.metrics?.MAPE && (
                    <div className="text-xs text-muted-foreground mt-1">
                      MAPE: {method.metrics.MAPE.toFixed(1)}%
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Statistical Summary */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="text-xs text-muted-foreground">Min Sales</div>
            <div className="text-sm font-semibold">
              {forecast.min_sales?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Max Sales</div>
            <div className="text-sm font-semibold">
              {forecast.max_sales?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Std Deviation</div>
            <div className="text-sm font-semibold">
              {forecast.std_sales?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Data Points</div>
            <div className="text-sm font-semibold">
              {forecast.data_points || 0}
            </div>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
};

export default ForecastDetailPanel;
