import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModelMetrics {
  MAE: number | null;
  MSE: number | null;
  RMSE: number | null;
  MAPE: number | null;
  R2: number | null;
}

interface ModelPerformanceCardProps {
  modelName: string;
  modelLabel: string;
  forecast: number;
  metrics: ModelMetrics;
  isSales?: boolean; // true for sales (€), false for quantity (units)
  isBestModel?: boolean;
  className?: string;
}

const ModelPerformanceCard: React.FC<ModelPerformanceCardProps> = ({
  modelName,
  modelLabel,
  forecast,
  metrics,
  isSales = true,
  isBestModel = false,
  className,
}) => {
  // Determine model quality based on R2 score
  const getModelQuality = (r2: number | null): { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (r2 === null) return { label: "No Data", color: "text-muted-foreground", variant: "outline" };
    if (r2 >= 0.9) return { label: "Excellent", color: "text-green-600", variant: "default" };
    if (r2 >= 0.7) return { label: "Good", color: "text-blue-600", variant: "secondary" };
    if (r2 >= 0.5) return { label: "Fair", color: "text-yellow-600", variant: "outline" };
    return { label: "Poor", color: "text-red-600", variant: "destructive" };
  };

  const quality = getModelQuality(metrics.R2);

  const formatValue = (value: number) => {
    if (isSales) {
      if (value >= 1000000) return `€${(value / 1000000).toFixed(2)}M`;
      if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
      return `€${value.toFixed(0)}`;
    } else {
      if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return `${Math.round(value)} units`;
    }
  };

  const formatMetric = (value: number | null, decimals: number = 2) => {
    if (value === null) return "N/A";
    if (value >= 1000000) return `${(value / 1000000).toFixed(decimals)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(decimals)}K`;
    return value.toFixed(decimals);
  };

  return (
    <Card className={cn(
      "relative transition-all hover:shadow-md",
      isBestModel && "border-green-500 border-2 shadow-lg",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {modelLabel}
              {isBestModel && (
                <Award className="h-5 w-5 text-green-600" />
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-1">{modelName}</CardDescription>
          </div>
          <Badge variant={quality.variant} className={quality.color}>
            {quality.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Forecast Value */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Forecast</p>
          <p className="text-2xl font-bold">{formatValue(forecast)}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* R² Score */}
          <div className="bg-background border rounded p-2">
            <p className="text-muted-foreground mb-1 flex items-center gap-1">
              R²
              {metrics.R2 !== null && metrics.R2 >= 0.9 && <TrendingUp className="h-3 w-3 text-green-600" />}
              {metrics.R2 !== null && metrics.R2 < 0.5 && <TrendingDown className="h-3 w-3 text-red-600" />}
            </p>
            <p className={cn(
              "font-semibold",
              metrics.R2 !== null && metrics.R2 >= 0.9 && "text-green-600",
              metrics.R2 !== null && metrics.R2 < 0.5 && "text-red-600"
            )}>
              {metrics.R2 !== null ? metrics.R2.toFixed(4) : "N/A"}
            </p>
          </div>

          {/* MAE */}
          <div className="bg-background border rounded p-2">
            <p className="text-muted-foreground mb-1">MAE</p>
            <p className="font-semibold">{formatMetric(metrics.MAE, 0)}</p>
          </div>

          {/* RMSE */}
          <div className="bg-background border rounded p-2">
            <p className="text-muted-foreground mb-1">RMSE</p>
            <p className="font-semibold">{formatMetric(metrics.RMSE, 0)}</p>
          </div>

          {/* MAPE */}
          <div className="bg-background border rounded p-2">
            <p className="text-muted-foreground mb-1">MAPE</p>
            <p className="font-semibold">
              {metrics.MAPE !== null ? `${metrics.MAPE.toFixed(1)}%` : "N/A"}
            </p>
          </div>
        </div>

        {/* Best Model Indicator */}
        {isBestModel && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/20 rounded p-2">
            <Award className="h-4 w-4" />
            <span className="font-medium">Best Performing Model</span>
          </div>
        )}

        {/* Warning for poor metrics */}
        {metrics.R2 !== null && metrics.R2 < 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded p-2">
            <AlertCircle className="h-4 w-4" />
            <span>Negative R² - Model performs worse than baseline</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelPerformanceCard;
