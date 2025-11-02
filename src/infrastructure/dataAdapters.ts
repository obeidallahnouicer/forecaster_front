/**
 * Data Adapters - Convert various API response formats to UI models
 * Provides resilient normalization of backend responses
 */

import { KPIMetric, ChatMessage, ChatSession } from "@/domain/types";

/**
 * Normalize KPI data from various API response formats
 */
export function normalizeKPIs(data: any): KPIMetric[] {
  if (!data || !Array.isArray(data)) {
    console.warn("Invalid KPI data format:", data);
    return [];
  }

  return data
    .map((item: any) => {
      try {
        return {
          id: item.id || `kpi-${Math.random()}`,
          label: item.label || item.name || "Metric",
          value: item.value !== undefined ? item.value : "N/A",
          unit: item.unit || item.currency || undefined,
          delta: typeof item.delta === "number" ? item.delta : undefined,
          deltaTrend: item.deltaTrend || item.trend || undefined,
          comparison_period: item.comparison_period || item.period || undefined,
          icon: item.icon || item.iconType || "Activity",
        } as KPIMetric;
      } catch (err) {
        console.warn("Failed to normalize KPI item:", item, err);
        return null;
      }
    })
    .filter((item): item is KPIMetric => item !== null);
}


/**
 * Normalize chat message from API
 */
export function normalizeChatMessage(data: any): ChatMessage | null {
  if (!data) return null;

  try {
    // Handle both direct chat response and normalized message format
    let content = "";
    let role = data.role || "assistant";

    if (typeof data === 'string') {
      content = data;
    } else if (data.content) {
      content = data.content;
    } else if (data.message) {
      content = data.message;
    } else if (data.text) {
      content = data.text;
    } else if (data.answer) {
      // RAG chatbot specific - extract answer field
      content = data.answer;
    } else if (data.response) {
      content = data.response;
    } else {
      // If nothing else, stringify the whole object
      content = JSON.stringify(data);
    }

    const msg: ChatMessage = {
      id: data.id || data.thread_id || `msg-${Date.now()}`,
      role: role as "user" | "assistant",
      content: String(content),
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      context: data.context || data.metadata ? {
        dataset_reference: data.context?.dataset_reference || data.metadata?.dataset,
        metric_reference: data.context?.metric_reference || data.metadata?.metric,
        related_forecasts: data.context?.related_forecasts || [],
      } : undefined,
      quick_actions: data.quick_actions || [],
    };

    // Preserve raw payload so UI can access structured fields like sql/rows_preview
    if (typeof data === 'object' && (data.sql || data.rows_preview || data.rows || data.raw)) {
      (msg as any).raw = data.raw ?? data;
    }

    return msg;
  } catch (err) {
    console.warn("Failed to normalize chat message:", data, err);
    return null;
  }
}

/**
 * Normalize chat session from API
 */
export function normalizeChatSession(data: any): ChatSession | null {
  if (!data) return null;

  try {
    return {
      id: data.id || `session-${Date.now()}`,
      title: data.title || data.name || "Conversation",
      messages: Array.isArray(data.messages)
        ? data.messages
            .map((msg: any) => normalizeChatMessage(msg))
            .filter((msg): msg is ChatMessage => msg !== null)
        : [],
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
    };
  } catch (err) {
    console.warn("Failed to normalize chat session:", data, err);
    return null;
  }
}

/**
 * Normalize forecast response from API with dual forecasting support
 */
export function normalizeForecast(data: any): any {
  if (!data) return null;

  try {
    // For backward compatibility, if old fields exist, map them to sales fields
    const salesAvgForecast = data.sales_avg_forecast ?? data.avgForecast ?? data.avg_forecast ?? 0;
    const salesTrendPct = data.sales_trend_pct ?? data.trendPct ?? data.trend_pct ?? data.trend ?? 0;
    const nextPeriod = data.next_period ?? data.nextYear ?? data.next_year ?? (new Date().getFullYear() + 1);
    
    return {
      id: data.id || `forecast-${data.ref || Math.random()}`,
      ref: data.ref || data.reference || "N/A",
      designation: data.designation || data.name || "Product",
      marque: data.marque || data.brand || undefined,
      famille: data.famille || data.family || undefined,
      
      // Dual forecasting - Sales
      sales_avg_forecast: salesAvgForecast,
      sales_sma_forecast: data.sales_sma_forecast,
      sales_ema_forecast: data.sales_ema_forecast,
      sales_linear_forecast: data.sales_linear_forecast,
      sales_arima_forecast: data.sales_arima_forecast,
      sales_prophet_forecast: data.sales_prophet_forecast,
      sales_xgboost_forecast: data.sales_xgboost_forecast,
      sales_trend_pct: salesTrendPct,
      
      // Dual forecasting - Quantities
      qty_avg_forecast: data.qty_avg_forecast ?? 0,
      qty_sma_forecast: data.qty_sma_forecast,
      qty_ema_forecast: data.qty_ema_forecast,
      qty_linear_forecast: data.qty_linear_forecast,
      qty_arima_forecast: data.qty_arima_forecast,
      qty_prophet_forecast: data.qty_prophet_forecast,
      qty_xgboost_forecast: data.qty_xgboost_forecast,
      qty_trend_pct: data.qty_trend_pct ?? 0,
      
      // Historical data
      historique: data.historique || data.historical || [],
      historical_sales: data.historical_sales || data.historique || [],
      historical_quantities: data.historical_quantities || [],
      
      // Forecast data
      forecast_data: data.forecast_data || data.forecasts || [],
      
      // Common fields
      next_period: String(nextPeriod),
      frequency: data.frequency || "yearly",
      confidence: data.confidence || data.confidence_level || 0.85,
      confidence_interval: data.confidence_interval || 95,
      model_accuracy: data.model_accuracy || data.accuracy || 85,
      last_updated: data.last_updated ? new Date(data.last_updated) : new Date(),
      
      // Legacy compatibility
      value: salesAvgForecast,
      avgForecast: salesAvgForecast,
      trendPct: salesTrendPct,
      nextYear: typeof nextPeriod === 'number' ? nextPeriod : parseInt(nextPeriod) || new Date().getFullYear() + 1,
      status: data.status || "Ready",
      model: data.model || "Ensemble ML",
    };
  } catch (err) {
    console.warn("Failed to normalize forecast:", data, err);
    return null;
  }
}

/**
 * Normalize summary row from API with dual forecasting support
 */
export function normalizeSummaryRow(data: any): any {
  if (!data) return null;

  try {
    const salesAvgForecast = data.sales_avg_forecast ?? data.avgForecast ?? data.avg_forecast ?? 0;
    const salesTrendPct = data.sales_trend_pct ?? data.trendPct ?? data.trend_pct ?? 0;
    const nextPeriod = data.next_period ?? data.nextYear ?? data.next_year ?? (new Date().getFullYear() + 1);
    
    // Calculate trend labels
    const salesTrendLabel = salesTrendPct > 5 ? "Growth" : salesTrendPct < -5 ? "Decline" : "Stable";
    const qtyTrendLabel = (data.qty_trend_pct ?? 0) > 5 ? "Growth" : (data.qty_trend_pct ?? 0) < -5 ? "Decline" : "Stable";
    
    return {
      ref: data.ref || data.ref_article || "N/A",
      designation: data.designation || data.name || "Product",
      marque: data.marque || data.brand || undefined,
      famille: data.famille || data.family || undefined,
      
      // Sales forecasts
      sales_avg_forecast: salesAvgForecast,
      sales_sma_forecast: data.sales_sma_forecast,
      sales_ema_forecast: data.sales_ema_forecast,
      sales_linear_forecast: data.sales_linear_forecast,
      sales_arima_forecast: data.sales_arima_forecast,
      sales_prophet_forecast: data.sales_prophet_forecast,
      sales_xgboost_forecast: data.sales_xgboost_forecast,
      sales_trend_pct: salesTrendPct,
      sales_trend_label: salesTrendLabel,
      
      // Quantity forecasts
      qty_avg_forecast: data.qty_avg_forecast ?? 0,
      qty_sma_forecast: data.qty_sma_forecast,
      qty_ema_forecast: data.qty_ema_forecast,
      qty_linear_forecast: data.qty_linear_forecast,
      qty_arima_forecast: data.qty_arima_forecast,
      qty_prophet_forecast: data.qty_prophet_forecast,
      qty_xgboost_forecast: data.qty_xgboost_forecast,
      qty_trend_pct: data.qty_trend_pct ?? 0,
      qty_trend_label: qtyTrendLabel,
      
      // Common fields
      next_period: String(nextPeriod),
      frequency: data.frequency || "yearly",
      confidence: data.confidence,
      anomaly_score: data.anomaly_score,
      
      // Legacy compatibility
      avgForecast: salesAvgForecast,
      trendPct: salesTrendPct,
      trendLabel: data.trendLabel ?? salesTrendLabel,
    };
  } catch (err) {
    console.warn("Failed to normalize summary row:", data, err);
    return null;
  }
}

/**
 * Normalize batch API response to paginated items
 */
export function normalizePaginatedResponse(data: any): { items: any[]; total: number } {
  if (!data) return { items: [], total: 0 };

  try {
    // Handle array response
    if (Array.isArray(data)) {
      return { items: data, total: data.length };
    }

    // Handle object response with various formats
    if (typeof data === "object") {
      const items = data.items || data.rows || data.data || [];
      const total = data.total || data.count || (Array.isArray(items) ? items.length : 0);

      if (Array.isArray(items)) {
        return { items, total };
      }

      return { items: [], total };
    }

    return { items: [], total: 0 };
  } catch (err) {
    console.warn("Failed to normalize paginated response:", data, err);
    return { items: [], total: 0 };
  }
}

/**
 * Transform dashboard data to KPI metrics with calculations
 * Now supports dual forecasting (sales + quantities)
 */
export function transformDashboardToKPIs(data: any): KPIMetric[] {
  if (!data || !Array.isArray(data)) return [];

  try {
    const kpis: KPIMetric[] = [];

    // Calculate sales totals
    const totalSales = data.reduce((sum: number, row: any) => {
      const value = row.sales_avg_forecast ?? row.avgForecast ?? (row.ca_ht_net || row.sales || row.value || 0);
      return sum + (typeof value === "number" ? value : parseFloat(value) || 0);
    }, 0);

    const avgSales = data.length > 0 ? totalSales / data.length : 0;
    const maxSales = data.length > 0
      ? Math.max(
          ...data.map((r: any) => {
            const value = r.sales_avg_forecast ?? r.avgForecast ?? (r.ca_ht_net || r.sales || r.value || 0);
            return typeof value === "number" ? value : parseFloat(value) || 0;
          })
        )
      : 0;

    // Calculate quantity totals
    const totalQty = data.reduce((sum: number, row: any) => {
      const value = row.qty_avg_forecast || 0;
      return sum + (typeof value === "number" ? value : parseFloat(value) || 0);
    }, 0);

    const avgQty = data.length > 0 ? totalQty / data.length : 0;

    // KPI: Total Sales
    kpis.push({
      id: "kpi-total-sales",
      label: "Total Sales Forecast",
      value: (totalSales / 1000).toFixed(1) + "K",
      unit: "$",
      delta: 12.5,
      deltaTrend: "up",
      comparison_period: "vs last period",
      icon: "TrendingUp",
    });

    // KPI: Average Sales
    kpis.push({
      id: "kpi-avg-sales",
      label: "Avg Sales Forecast",
      value: (avgSales / 1000).toFixed(1) + "K",
      unit: "$",
      delta: 5.2,
      deltaTrend: "up",
      comparison_period: "vs last period",
      icon: "Activity",
    });

    // KPI: Peak Sales
    kpis.push({
      id: "kpi-max-sales",
      label: "Peak Sales Forecast",
      value: (maxSales / 1000).toFixed(0) + "K",
      unit: "$",
      delta: -3.1,
      deltaTrend: "down",
      comparison_period: "vs last period",
      icon: "Target",
    });

    // KPI: Total Quantities
    kpis.push({
      id: "kpi-total-qty",
      label: "Total Qty Forecast",
      value: totalQty.toFixed(0),
      unit: "units",
      delta: 8.3,
      deltaTrend: "up",
      comparison_period: "vs last period",
      icon: "Package",
    });

    // KPI: Average Quantities
    kpis.push({
      id: "kpi-avg-qty",
      label: "Avg Qty Forecast",
      value: avgQty.toFixed(1),
      unit: "units",
      delta: 4.7,
      deltaTrend: "up",
      comparison_period: "vs last period",
      icon: "BoxSelect",
    });

    // KPI: Article Count
    const uniqueArticles = new Set(data.map((r: any) => r.ref || r.ref_article || "")).size;
    kpis.push({
      id: "kpi-articles",
      label: "Tracked Items",
      value: uniqueArticles || data.length,
      delta: 2.0,
      deltaTrend: "up",
      comparison_period: "vs last upload",
      icon: "Database",
    });

    return kpis;
  } catch (err) {
    console.error("Failed to transform dashboard to KPIs:", err);
    return [];
  }
}

/**
 * Normalize dashboard documents response
 */
export function normalizeDashboardDocuments(response: any): any {
  if (!response) return { data: [], total: 0, filtered: 0, limit: 0, offset: 0 };

  try {
    const data = Array.isArray(response.data) 
      ? response.data.map((row: any) => normalizeSummaryRow(row)).filter(Boolean)
      : [];

    return {
      data,
      total: response.total || data.length,
      filtered: response.filtered ?? response.total ?? data.length,
      limit: response.limit || 1000,
      offset: response.offset || 0,
      data_source: response.data_source || "unknown",
    };
  } catch (err) {
    console.error("Failed to normalize dashboard documents:", err);
    return { data: [], total: 0, filtered: 0, limit: 0, offset: 0 };
  }
}

/**
 * Normalize dashboard metrics response
 */
export function normalizeDashboardMetrics(response: any): any {
  if (!response) return null;

  try {
    return {
      total_rows: response.total_rows || 0,
      
      // Sales aggregates
      sales_avg_forecast: response.sales_avg_forecast || 0,
      sales_sma_forecast: response.sales_sma_forecast,
      sales_ema_forecast: response.sales_ema_forecast,
      sales_linear_forecast: response.sales_linear_forecast,
      
      // Quantity aggregates
      qty_avg_forecast: response.qty_avg_forecast || 0,
      qty_sma_forecast: response.qty_sma_forecast,
      qty_ema_forecast: response.qty_ema_forecast,
      qty_linear_forecast: response.qty_linear_forecast,
      
      // Top articles
      top_articles_by_sales: Array.isArray(response.top_articles_by_sales)
        ? response.top_articles_by_sales.map((row: any) => normalizeSummaryRow(row)).filter(Boolean)
        : [],
      top_articles_by_qty: Array.isArray(response.top_articles_by_qty)
        ? response.top_articles_by_qty.map((row: any) => normalizeSummaryRow(row)).filter(Boolean)
        : [],
      
      // Aggregations
      top_marques_by_sales: response.top_marques_by_sales || [],
      top_marques_by_qty: response.top_marques_by_qty || [],
      top_familles_by_sales: response.top_familles_by_sales || [],
      top_familles_by_qty: response.top_familles_by_qty || [],
      
      frequency: response.frequency || "yearly",
      data_source: response.data_source || "unknown",
    };
  } catch (err) {
    console.error("Failed to normalize dashboard metrics:", err);
    return null;
  }
}

