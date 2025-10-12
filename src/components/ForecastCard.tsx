import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { SummaryRow } from "@/domain/types";

interface ForecastCardProps {
  summary: SummaryRow;
  index: number;
  onClick?: () => void;
}

export const ForecastCard = ({ summary, index, onClick }: ForecastCardProps) => {
  // Defensive access: backend may return snake_case keys
  const ref = (summary as any).ref ?? (summary as any).ref_article ?? "";
  const designation = summary.designation ?? (summary as any).designation ?? "";
  const marque = summary.marque ?? (summary as any).marque;
  const famille = summary.famille ?? (summary as any).famille;

  const avgForecast = Number((summary as any).avgForecast ?? (summary as any).avg_forecast ?? 0) || 0;
  const trendPct = Number((summary as any).trendPct ?? (summary as any).trend_pct ?? 0) || 0;
  const trendLabel = (summary as any).trendLabel ?? (summary as any).trend_label ?? (
    trendPct > 5 ? "Growth" : trendPct < -5 ? "Decline" : "Stable"
  );

  const getTrendIcon = () => {
    switch (trendLabel) {
      case "Growth":
        return <TrendingUp className="h-5 w-5 text-primary" />;
      case "Decline":
        return <TrendingDown className="h-5 w-5 text-destructive" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trendLabel) {
      case "Growth":
        return "text-primary";
      case "Decline":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
  <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border border-border/40 bg-card p-6 sm:p-8 hover-lift card-elevated w-full md:w-auto md:max-w-[920px] mx-auto"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-base sm:text-lg font-mono text-muted-foreground truncate">{ref}</span>
            {getTrendIcon()}
          </div>
          
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 line-clamp-2">{designation}</h3>
          
          <div className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base text-muted-foreground flex-wrap">
            {marque && <span className="truncate">{marque}</span>}
            {famille && (
              <>
                <span>•</span>
                <span className="truncate">{famille}</span>
              </>
            )}
          </div>
        </div>

        <ArrowRight className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>

      <div className="relative z-10 mt-4 sm:mt-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm sm:text-base text-muted-foreground mb-1">Next Year Forecast</p>
          <p className="text-5xl sm:text-6xl font-extrabold gradient-text leading-tight">
            {avgForecast.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} DT
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm sm:text-base text-muted-foreground mb-1">Trend</p>
          <p className={`text-4xl sm:text-5xl font-bold ${getTrendColor()}`}>
            {trendPct > 0 ? "+" : ""}
            {trendPct.toFixed(1)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
};
