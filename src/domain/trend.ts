// Domain Business Logic - Trend Calculation

import { HistoricalDataPoint, SummaryRow } from "./types";

/**
 * Calculate trend percentage from historical data
 */
export function calculateTrendPct(history: HistoricalDataPoint[]): number {
  if (history.length < 2) return 0;

  const sorted = [...history].sort((a, b) => a.year - b.year);
  const firstValue = sorted[0].value;
  const lastValue = sorted[sorted.length - 1].value;

  if (firstValue === 0) return 0;

  return ((lastValue - firstValue) / firstValue) * 100;
}

/**
 * Determine trend label from percentage
 */
export function getTrendLabel(trendPct: number): SummaryRow["trendLabel"] {
  if (trendPct > 5) return "Growth";
  if (trendPct < -5) return "Decline";
  return "Stable";
}

/**
 * Calculate ensemble forecast (average of multiple methods)
 */
export function calculateEnsembleForecast(forecasts: number[]): number {
  const validForecasts = forecasts.filter((f) => !isNaN(f) && isFinite(f));
  if (validForecasts.length === 0) return 0;

  return validForecasts.reduce((sum, val) => sum + val, 0) / validForecasts.length;
}
