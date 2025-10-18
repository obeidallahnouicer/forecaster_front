import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  AlertTriangle,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/LoadingStates";
import { KPIMetric } from "@/domain/types";

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaTrend?: "up" | "down" | "stable";
  comparison_period?: string;
  icon?: "TrendingUp" | "TrendingDown" | "Activity" | "Target" | "AlertTriangle" | "Database";
  className?: string;
  isLoading?: boolean;
}

const iconMap = {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  AlertTriangle,
  Database,
};

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  unit,
  delta,
  deltaTrend = "stable",
  comparison_period,
  icon = "Activity",
  className,
  isLoading = false,
}) => {
  const IconComponent = iconMap[icon] || Activity; // Fallback to Activity if icon not found
  const isDeltaPositive = delta !== undefined && delta > 0;
  const isDeltaNegative = delta !== undefined && delta < 0;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden border-border/50 hover:border-border transition-all duration-300",
          "hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/10",
          className
        )}
      >
        {/* Background gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <IconComponent className="w-4 h-4" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              {unit && (
                <span className="text-sm text-muted-foreground font-medium">
                  {unit}
                </span>
              )}
            </div>

            {delta !== undefined && (
              <div className="flex items-center gap-1 text-xs font-medium">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 px-2 py-1 rounded-full",
                    isDeltaPositive
                      ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                      : isDeltaNegative
                        ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                        : "bg-slate-50 text-slate-700 dark:bg-slate-950/50 dark:text-slate-400"
                  )}
                >
                  {isDeltaPositive && <TrendingUp className="w-3 h-3" />}
                  {isDeltaNegative && <TrendingDown className="w-3 h-3" />}
                  <span>
                    {isDeltaNegative ? "" : "+"}
                    {delta.toFixed(1)}%
                  </span>
                </span>
                {comparison_period && (
                  <span className="text-muted-foreground">{comparison_period}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

