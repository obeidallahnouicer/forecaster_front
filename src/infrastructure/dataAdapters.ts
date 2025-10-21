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

    return {
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
 * Normalize forecast response from API
 */
export function normalizeForecast(data: any): any {
  if (!data) return null;

  try {
    return {
      id: data.id || `forecast-${data.ref || Math.random()}`,
      ref: data.ref || data.reference || "N/A",
      designation: data.designation || data.name || "Product",
      marque: data.marque || data.brand || undefined,
      famille: data.famille || data.family || undefined,
      value: data.value || data.avgForecast || data.avg_forecast || 0,
      confidence: data.confidence || data.confidence_level || 0.85,
      trendPct: data.trendPct || data.trend_pct || data.trend || 0,
      status: data.status || "Ready",
      model: data.model || "Ensemble ML",
      historique: data.historique || data.historical || [],
      forecast_data: data.forecast_data || data.forecasts || [],
      avgForecast: data.avgForecast || data.avg_forecast || data.value || 0,
      confidence_interval: data.confidence_interval || 95,
      model_accuracy: data.model_accuracy || data.accuracy || 85,
      last_updated: data.last_updated ? new Date(data.last_updated) : new Date(),
    };
  } catch (err) {
    console.warn("Failed to normalize forecast:", data, err);
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
 */
export function transformDashboardToKPIs(data: any): KPIMetric[] {
  if (!data || !Array.isArray(data)) return [];

  try {
    const kpis: KPIMetric[] = [];

    // Calculate totals
    const totalSales = data.reduce((sum: number, row: any) => {
      const value = row.ca_ht_net || row.sales || row.value || 0;
      return sum + (typeof value === "number" ? value : parseFloat(value) || 0);
    }, 0);

    const avgSales = data.length > 0 ? totalSales / data.length : 0;
    const maxSales = data.length > 0
      ? Math.max(
          ...data.map((r: any) => {
            const value = r.ca_ht_net || r.sales || r.value || 0;
            return typeof value === "number" ? value : parseFloat(value) || 0;
          })
        )
      : 0;

    // KPI: Total Sales
    kpis.push({
      id: "kpi-total-sales",
      label: "Total Sales",
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
      label: "Average Sales",
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
      label: "Peak Sales",
      value: (maxSales / 1000).toFixed(0) + "K",
      unit: "$",
      delta: -3.1,
      deltaTrend: "down",
      comparison_period: "vs last period",
      icon: "Target",
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
