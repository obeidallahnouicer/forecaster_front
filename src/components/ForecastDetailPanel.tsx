import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, Package, Tag } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, Bar, ComposedChart } from "recharts";
import { cn } from "@/lib/utils";

interface ForecastDetailPanelProps {
  forecast: {
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
    min_sales?: number;
    max_sales?: number;
    avg_sales?: number;
    std_sales?: number;
    
    // Method-specific forecasts
    sma_forecast?: number;
    es_forecast?: number;
    lr_forecast?: number;
    xgb_forecast?: number;
    arima_forecast?: number;
    prophet_forecast?: number;
    
    // Metrics
    sma_metrics?: string;
    es_metrics?: string;
    lr_metrics?: string;
    xgb_metrics?: string;
    arima_metrics?: string;
    prophet_metrics?: string;
  };
}

const ForecastDetailPanel: React.FC<ForecastDetailPanelProps> = ({ forecast }) => {
  // Parse historical data with useMemo to avoid recalculation
  const historicalData = useMemo(() => {
    try {
      const periods = typeof forecast.historical_periods === "string" 
        ? JSON.parse(forecast.historical_periods) 
        : forecast.historical_periods || [];
      
      const values = typeof forecast.historical_values === "string" 
        ? JSON.parse(forecast.historical_values) 
        : forecast.historical_values_list || forecast.historical_values || [];
      
      return periods.map((period: any, idx: number) => ({
        period: String(period),
        value: values[idx] || 0,
      }));
    } catch (error) {
      console.warn("Failed to parse historical data", error);
      return [];
    }
  }, [forecast.historical_periods, forecast.historical_values, forecast.historical_values_list]);

  // Add forecast point to the end with useMemo
  const chartData = useMemo(() => [
    ...historicalData,
    {
      period: String(forecast.next_period),
      value: forecast.avg_forecast,
      isForecast: true,
    },
  ], [historicalData, forecast.next_period, forecast.avg_forecast]);

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

  const trendPct = forecast.trend_pct || 0;
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
            {forecast.trend_label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Forecast ({forecast.frequency})</div>
            <div className="text-2xl font-bold">
              {forecast.avg_forecast?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
              {forecast.avg_sales?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "N/A"}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Next Period
            </div>
            <div className="text-2xl font-bold">
              {forecast.next_period}
            </div>
          </div>
        </div>

        <Separator />

        {/* Historical + Forecast Chart */}
        <div>
          <h3 className="text-sm font-semibold mb-3 inline-flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Historical Trend &amp; Forecast
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg">
                        <p className="text-sm font-semibold">{data.period}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.isForecast ? "Forecast: " : "Actual: "}
                          {Number(payload[0].value).toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                name={forecast.frequency === "monthly" ? "Monthly Sales" : "Yearly Sales"}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Trend"
                stroke={isUptrend ? "#22c55e" : isDowntrend ? "#ef4444" : "#eab308"}
                strokeWidth={2}
                dot={(props: any) => {
                  const { payload, cx, cy, stroke } = props;
                  if (payload.isForecast) {
                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />;
                  }
                  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill={stroke} />;
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <Separator />

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
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
              {forecast.data_points || historicalData.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastDetailPanel;
