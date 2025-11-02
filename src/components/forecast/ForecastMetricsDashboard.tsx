import React from "react";
import { KPICard } from "./KPICard";
import { DashboardMetricsResponse } from "@/domain/types";

interface ForecastMetricsDashboardProps {
  metrics: DashboardMetricsResponse | null;
  frequency?: string;
  showSales?: boolean;
  showQuantities?: boolean;
}

const ForecastMetricsDashboard: React.FC<ForecastMetricsDashboardProps> = ({ 
  metrics, 
  frequency = "yearly",
  showSales = true,
  showQuantities = true
}) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Loading..." value={0} />
      </div>
    );
  }

  const totalProducts = metrics.total_rows ?? 0;
  const periodLabel = frequency === "monthly" ? "Monthly" : "Yearly";
  
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          label="Total Articles" 
          value={totalProducts} 
          icon="Package"
        />
        {showSales && (
          <KPICard 
            label={`Avg ${periodLabel} Sales Forecast`} 
            value={Math.round(metrics.sales_avg_forecast || 0)}
            format="currency"
            icon="TrendingUp"
          />
        )}
        {showQuantities && (
          <KPICard 
            label={`Avg ${periodLabel} Qty Forecast`} 
            value={Math.round(metrics.qty_avg_forecast || 0)}
            icon="BoxSelect"
          />
        )}
      </div>

      {/* Top Articles by Sales */}
      {showSales && metrics.top_articles_by_sales?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Top Articles by Sales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.top_articles_by_sales.slice(0, 6).map((article, idx) => (
              <KPICard
                key={article.ref || idx}
                label={article.designation || article.ref}
                sublabel={article.marque}
                value={Math.round(article.sales_avg_forecast || 0)}
                format="currency"
                trend={article.sales_trend_pct}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Articles by Quantity */}
      {showQuantities && metrics.top_articles_by_qty?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Top Articles by Quantity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.top_articles_by_qty.slice(0, 6).map((article, idx) => (
              <KPICard
                key={article.ref || idx}
                label={article.designation || article.ref}
                sublabel={article.marque}
                value={Math.round(article.qty_avg_forecast || 0)}
                trend={article.qty_trend_pct}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastMetricsDashboard;
