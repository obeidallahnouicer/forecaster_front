import React from "react";
import { KPICard } from "./KPICard";

interface SummaryData {
  total_products?: number;
  avg_forecast?: number;
  total_forecast?: number;
}

interface ForecastMetricsDashboardProps {
  summary: SummaryData | null;
  frequency?: string;
}

const ForecastMetricsDashboard: React.FC<ForecastMetricsDashboardProps> = ({ summary, frequency = "monthly" }) => {
  const totalProducts = summary?.total_products ?? 0;
  const avgForecast = summary?.avg_forecast ?? 0;
  const totalForecast = summary?.total_forecast ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KPICard label="Total Products" value={totalProducts} />
      <KPICard label={frequency === "monthly" ? "Avg Monthly Forecast" : "Avg Yearly Forecast"} value={Math.round(avgForecast)} />
      <KPICard label="Total Forecast" value={Math.round(totalForecast)} />
    </div>
  );
};

export default ForecastMetricsDashboard;
