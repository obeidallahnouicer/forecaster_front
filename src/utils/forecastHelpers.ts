/**
 * Forecast Helpers - Utility functions for dual forecasting support
 * 
 * These helpers provide backward compatibility and easy migration
 * from single forecast to dual forecasting (sales + quantities)
 */

import { SummaryRow, ForecastResult } from "@/domain/types";

/**
 * Get sales forecast value with fallback to legacy field
 */
export function getSalesForecast(item: any): number {
  return item.sales_avg_forecast ?? item.avgForecast ?? item.avg_forecast ?? 0;
}

/**
 * Get quantity forecast value
 */
export function getQuantityForecast(item: any): number {
  return item.qty_avg_forecast ?? 0;
}

/**
 * Get sales trend percentage with fallback to legacy field
 */
export function getSalesTrend(item: any): number {
  return item.sales_trend_pct ?? item.trendPct ?? item.trend_pct ?? 0;
}

/**
 * Get quantity trend percentage
 */
export function getQuantityTrend(item: any): number {
  return item.qty_trend_pct ?? 0;
}

/**
 * Get next period with fallback to legacy field
 */
export function getNextPeriod(item: any): string {
  const nextPeriod = item.next_period ?? item.nextYear ?? item.next_year;
  return String(nextPeriod ?? new Date().getFullYear() + 1);
}

/**
 * Get frequency with default
 */
export function getFrequency(item: any): "yearly" | "monthly" {
  return item.frequency ?? "yearly";
}

/**
 * Calculate trend label from trend percentage
 */
export function getTrendLabel(trendPct: number): "Growth" | "Stable" | "Decline" {
  if (trendPct > 5) return "Growth";
  if (trendPct < -5) return "Decline";
  return "Stable";
}

/**
 * Get sales trend label
 */
export function getSalesTrendLabel(item: any): "Growth" | "Stable" | "Decline" {
  const label = item.sales_trend_label ?? item.trendLabel ?? item.trend_label;
  if (label) return label;
  
  const trendPct = getSalesTrend(item);
  return getTrendLabel(trendPct);
}

/**
 * Get quantity trend label
 */
export function getQuantityTrendLabel(item: any): "Growth" | "Stable" | "Decline" {
  const label = item.qty_trend_label;
  if (label) return label;
  
  const trendPct = getQuantityTrend(item);
  return getTrendLabel(trendPct);
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format large number (e.g., 1000 -> 1K)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Get all forecast methods for sales
 */
export function getSalesForecastMethods(item: any): Record<string, number> {
  return {
    avg: getSalesForecast(item),
    sma: item.sales_sma_forecast ?? 0,
    ema: item.sales_ema_forecast ?? 0,
    linear: item.sales_linear_forecast ?? 0,
    arima: item.sales_arima_forecast ?? 0,
    prophet: item.sales_prophet_forecast ?? 0,
    xgboost: item.sales_xgboost_forecast ?? 0,
  };
}

/**
 * Get all forecast methods for quantities
 */
export function getQuantityForecastMethods(item: any): Record<string, number> {
  return {
    avg: getQuantityForecast(item),
    sma: item.qty_sma_forecast ?? 0,
    ema: item.qty_ema_forecast ?? 0,
    linear: item.qty_linear_forecast ?? 0,
    arima: item.qty_arima_forecast ?? 0,
    prophet: item.qty_prophet_forecast ?? 0,
    xgboost: item.qty_xgboost_forecast ?? 0,
  };
}

/**
 * Check if item has sales data
 */
export function hasSalesData(item: any): boolean {
  return getSalesForecast(item) > 0;
}

/**
 * Check if item has quantity data
 */
export function hasQuantityData(item: any): boolean {
  return getQuantityForecast(item) > 0;
}

/**
 * Get period label based on frequency
 */
export function getPeriodLabel(frequency: string): string {
  return frequency === "monthly" ? "Monthly" : "Yearly";
}

/**
 * Parse query parameter to frequency
 */
export function parseFrequency(param: any): "yearly" | "monthly" {
  const str = String(param || "yearly").toLowerCase();
  return str === "monthly" ? "monthly" : "yearly";
}

/**
 * Build filter params for API calls (handles legacy and new formats)
 */
export function buildFilterParams(filters: {
  marque?: string;
  famille?: string;
  next_period?: string;
  frequency?: string;
  
  // Legacy filters (converted automatically)
  next_year?: number;
  trend_label?: string;
  
  // Range filters
  sales_min?: number;
  sales_max?: number;
  qty_min?: number;
  qty_max?: number;
  
  // Sorting
  sort_by?: string;
  sort_order?: "asc" | "desc";
}): Record<string, any> {
  const params: Record<string, any> = {};
  
  // Convert and add filters
  if (filters.marque) params.marque = filters.marque;
  if (filters.famille) params.famille = filters.famille;
  
  // Handle next_period vs next_year
  if (filters.next_period) {
    params.next_period = filters.next_period;
  } else if (filters.next_year) {
    params.next_period = String(filters.next_year);
  }
  
  // Frequency
  if (filters.frequency) {
    params.frequency = parseFrequency(filters.frequency);
  }
  
  // Range filters
  if (filters.sales_min !== undefined) params.sales_min = filters.sales_min;
  if (filters.sales_max !== undefined) params.sales_max = filters.sales_max;
  if (filters.qty_min !== undefined) params.qty_min = filters.qty_min;
  if (filters.qty_max !== undefined) params.qty_max = filters.qty_max;
  
  // Sorting
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_order) params.sort_order = filters.sort_order;
  
  return params;
}

/**
 * Normalize article data for display (handles all field variations)
 */
export function normalizeArticleForDisplay(item: any): {
  ref: string;
  designation: string;
  marque?: string;
  famille?: string;
  sales: {
    forecast: number;
    trend: number;
    trendLabel: "Growth" | "Stable" | "Decline";
  };
  quantities: {
    forecast: number;
    trend: number;
    trendLabel: "Growth" | "Stable" | "Decline";
  };
  nextPeriod: string;
  frequency: "yearly" | "monthly";
} {
  const salesForecast = getSalesForecast(item);
  const salesTrend = getSalesTrend(item);
  const qtyForecast = getQuantityForecast(item);
  const qtyTrend = getQuantityTrend(item);
  
  return {
    ref: item.ref || item.ref_article || "N/A",
    designation: item.designation || item.name || "Product",
    marque: item.marque || item.brand,
    famille: item.famille || item.family,
    sales: {
      forecast: salesForecast,
      trend: salesTrend,
      trendLabel: getTrendLabel(salesTrend),
    },
    quantities: {
      forecast: qtyForecast,
      trend: qtyTrend,
      trendLabel: getTrendLabel(qtyTrend),
    },
    nextPeriod: getNextPeriod(item),
    frequency: getFrequency(item),
  };
}

/**
 * Sort articles by sales forecast
 */
export function sortBySales(items: any[], order: "asc" | "desc" = "desc"): any[] {
  return [...items].sort((a, b) => {
    const aVal = getSalesForecast(a);
    const bVal = getSalesForecast(b);
    return order === "desc" ? bVal - aVal : aVal - bVal;
  });
}

/**
 * Sort articles by quantity forecast
 */
export function sortByQuantity(items: any[], order: "asc" | "desc" = "desc"): any[] {
  return [...items].sort((a, b) => {
    const aVal = getQuantityForecast(a);
    const bVal = getQuantityForecast(b);
    return order === "desc" ? bVal - aVal : aVal - bVal;
  });
}

/**
 * Filter articles by trend
 */
export function filterByTrend(
  items: any[], 
  trendFilter: "Growth" | "Stable" | "Decline" | "all",
  dimension: "sales" | "quantities" = "sales"
): any[] {
  if (trendFilter === "all") return items;
  
  return items.filter(item => {
    const trendLabel = dimension === "sales" 
      ? getSalesTrendLabel(item) 
      : getQuantityTrendLabel(item);
    return trendLabel === trendFilter;
  });
}

/**
 * Calculate aggregates from array of items
 */
export function calculateAggregates(items: any[]): {
  sales: {
    total: number;
    average: number;
    max: number;
    min: number;
  };
  quantities: {
    total: number;
    average: number;
    max: number;
    min: number;
  };
  count: number;
} {
  if (!items || items.length === 0) {
    return {
      sales: { total: 0, average: 0, max: 0, min: 0 },
      quantities: { total: 0, average: 0, max: 0, min: 0 },
      count: 0,
    };
  }
  
  const salesValues = items.map(getSalesForecast);
  const qtyValues = items.map(getQuantityForecast);
  
  return {
    sales: {
      total: salesValues.reduce((sum, val) => sum + val, 0),
      average: salesValues.reduce((sum, val) => sum + val, 0) / items.length,
      max: Math.max(...salesValues),
      min: Math.min(...salesValues),
    },
    quantities: {
      total: qtyValues.reduce((sum, val) => sum + val, 0),
      average: qtyValues.reduce((sum, val) => sum + val, 0) / items.length,
      max: Math.max(...qtyValues),
      min: Math.min(...qtyValues),
    },
    count: items.length,
  };
}
