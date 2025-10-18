import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForecastResult, ForecastDataPoint } from "@/domain/types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ForecastChartProps {
  forecast: ForecastResult;
  className?: string;
  showConfidenceInterval?: boolean;
  height?: number;
}

// Prepare combined data (historical + forecast)
const prepareForecastData = (forecast: ForecastResult) => {
  const historicalData = forecast.historique.map((point) => ({
    period: String(point.year),
    value: point.value,
    type: "historical",
  }));

  const forecastData = forecast.forecast_data.map((point, idx) => ({
    period: point.period,
    forecast: point.value,
    upper: point.upper_bound,
    lower: point.lower_bound,
    type: "forecast",
  }));

  return [...historicalData, ...forecastData];
};

export const ForecastChart: React.FC<ForecastChartProps> = ({
  forecast,
  className,
  showConfidenceInterval = true,
  height = 300,
}) => {
  if (!forecast || !forecast.forecast_data || forecast.forecast_data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={className}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">
              No forecast data available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              Forecast data could not be loaded
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const data = prepareForecastData(forecast);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs font-semibold text-foreground mb-2">
          {payload[0]?.payload?.period}
        </p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-xs" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> $
            {(entry.value as number).toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}
          </p>
        ))}
        {payload[0]?.payload?.confidence_level && (
          <p className="text-xs text-muted-foreground mt-1">
            Confidence: {payload[0].payload.confidence_level.toFixed(1)}%
          </p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{forecast.designation || "Forecast"}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {forecast.marque || "Brand"} • {forecast.famille || "Category"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Forecast Value</p>
              <p className="text-lg font-bold text-primary">
                ${(forecast.avgForecast || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="bg-background/50 rounded-lg overflow-hidden">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={height}>
                <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border) / 0.3)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    stroke="hsl(var(--muted-foreground) / 0.5)"
                    style={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground) / 0.5)"
                    style={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      `$${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Confidence interval */}
                  {showConfidenceInterval && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="upper"
                        fill="hsl(var(--primary) / 0.1)"
                        stroke="none"
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="lower"
                        fill="hsl(var(--primary) / 0.1)"
                        stroke="none"
                        isAnimationActive={false}
                      />
                    </>
                  )}

                  {/* Historical data */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={false}
                    name="Historical"
                    isAnimationActive={true}
                  />

                  {/* Forecast line */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Forecast"
                    isAnimationActive={true}
                    strokeDasharray="5 5"
                  />

                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                No data available for visualization
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-accent/5 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Trend</p>
              <p
                className={cn(
                  "text-lg font-bold",
                  (forecast.trendPct || 0) > 0
                    ? "text-green-600 dark:text-green-400"
                    : (forecast.trendPct || 0) < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-600 dark:text-slate-400"
                )}
              >
                {(forecast.trendPct || 0) > 0 ? "+" : ""}
                {((forecast.trendPct || 0).toFixed(1))}%
              </p>
            </div>
            <div className="bg-accent/5 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Confidence</p>
              <p className="text-lg font-bold text-primary">
                {forecast.confidence_interval || 0}%
              </p>
            </div>
            <div className="bg-accent/5 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
              <p className="text-lg font-bold text-secondary">
                {((forecast.model_accuracy || 85).toFixed(1))}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
