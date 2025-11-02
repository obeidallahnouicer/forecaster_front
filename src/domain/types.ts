// Domain Types - Core business entities

export interface Article {
  ref: string;
  designation: string;
  marque?: string;
  famille?: string;
}

export interface HistoricalDataPoint {
  year: number;
  value: number;
}

export interface ForecastMethod {
  method: string;
  value: number;
  confidence?: number;
  weight?: number;
}

export interface ForecastDataPoint {
  period: string;
  value: number;
  upper_bound: number;
  lower_bound: number;
  actual?: number;
  confidence_level: number;
}

export interface ForecastResult {
  id: string;
  ref: string;
  designation: string;
  marque?: string;
  famille?: string;
  
  // Historical data
  historique: HistoricalDataPoint[];
  historical_sales?: HistoricalDataPoint[];
  historical_quantities?: HistoricalDataPoint[];
  
  // Forecast methods
  forecasts: ForecastMethod[];
  forecast_data: ForecastDataPoint[];
  
  // Dual forecasting - Sales
  sales_avg_forecast: number;
  sales_sma_forecast?: number;
  sales_ema_forecast?: number;
  sales_linear_forecast?: number;
  sales_arima_forecast?: number;
  sales_prophet_forecast?: number;
  sales_xgboost_forecast?: number;
  
  // Dual forecasting - Quantities
  qty_avg_forecast: number;
  qty_sma_forecast?: number;
  qty_ema_forecast?: number;
  qty_linear_forecast?: number;
  qty_arima_forecast?: number;
  qty_prophet_forecast?: number;
  qty_xgboost_forecast?: number;
  
  // Sales metrics
  sales_trend_pct: number;
  sales_sma_metrics?: any;
  sales_ema_metrics?: any;
  sales_linear_metrics?: any;
  sales_arima_metrics?: any;
  sales_prophet_metrics?: any;
  sales_xgboost_metrics?: any;
  
  // Quantity metrics
  qty_trend_pct: number;
  qty_sma_metrics?: any;
  qty_ema_metrics?: any;
  qty_linear_metrics?: any;
  qty_arima_metrics?: any;
  qty_prophet_metrics?: any;
  qty_xgboost_metrics?: any;
  
  // Common fields
  dataPoints: number;
  next_period: string;
  frequency: "yearly" | "monthly";
  confidence_interval: number;
  model_accuracy?: number;
  last_updated?: Date;
  
  // Legacy fields (for backward compatibility)
  /** @deprecated Use sales_avg_forecast instead */
  avgForecast?: number;
  /** @deprecated Use sales_trend_pct instead */
  trendPct?: number;
  /** @deprecated Use next_period instead */
  nextYear?: number;
}

export interface SummaryRow {
  ref: string;
  designation: string;
  marque?: string;
  famille?: string;
  
  // Sales forecasts
  sales_avg_forecast: number;
  sales_sma_forecast?: number;
  sales_ema_forecast?: number;
  sales_linear_forecast?: number;
  sales_arima_forecast?: number;
  sales_prophet_forecast?: number;
  sales_xgboost_forecast?: number;
  
  // Quantity forecasts
  qty_avg_forecast: number;
  qty_sma_forecast?: number;
  qty_ema_forecast?: number;
  qty_linear_forecast?: number;
  qty_arima_forecast?: number;
  qty_prophet_forecast?: number;
  qty_xgboost_forecast?: number;
  
  // Sales metrics
  sales_trend_pct: number;
  sales_trend_label?: "Growth" | "Stable" | "Decline";
  
  // Quantity metrics
  qty_trend_pct: number;
  qty_trend_label?: "Growth" | "Stable" | "Decline";
  
  // Common fields
  next_period: string;
  frequency: "yearly" | "monthly";
  confidence?: number;
  anomaly_score?: number;
  
  // Legacy fields (for backward compatibility)
  /** @deprecated Use sales_avg_forecast instead */
  avgForecast?: number;
  /** @deprecated Use sales_trend_pct instead */
  trendPct?: number;
  /** @deprecated Use sales_trend_label instead */
  trendLabel?: "Growth" | "Stable" | "Decline";
}

export interface Settings {
  period: number;
  alpha: number;
  fastMode: boolean;
  includeMethods: ForecastModel[];
  frequency?: "yearly" | "monthly";
}

// Dashboard API response types
export interface DashboardStatusResponse {
  summary_exists: boolean;
  total_rows: number;
  columns: string[];
  frequency: string;
  data_source: string;
}

export interface DashboardDocumentsResponse {
  data: SummaryRow[];
  total: number;
  filtered: number;
  limit: number;
  offset: number;
  data_source: string;
}

export interface DashboardMetricsResponse {
  total_rows: number;
  
  // Sales aggregates
  sales_avg_forecast: number;
  sales_sma_forecast?: number;
  sales_ema_forecast?: number;
  sales_linear_forecast?: number;
  
  // Quantity aggregates
  qty_avg_forecast: number;
  qty_sma_forecast?: number;
  qty_ema_forecast?: number;
  qty_linear_forecast?: number;
  
  // Top articles
  top_articles_by_sales: SummaryRow[];
  top_articles_by_qty: SummaryRow[];
  
  // Aggregations by marque
  top_marques_by_sales?: Array<{
    marque: string;
    total_sales: number;
    avg_sales: number;
    count: number;
  }>;
  top_marques_by_qty?: Array<{
    marque: string;
    total_qty: number;
    avg_qty: number;
    count: number;
  }>;
  
  // Aggregations by famille
  top_familles_by_sales?: Array<{
    famille: string;
    total_sales: number;
    avg_sales: number;
    count: number;
  }>;
  top_familles_by_qty?: Array<{
    famille: string;
    total_qty: number;
    avg_qty: number;
    count: number;
  }>;
  
  frequency: string;
  data_source: string;
}

export type ForecastModel = "SMA" | "ExpSmoothing" | "LinearReg" | "ARIMA" | "PROPHET" | "XGBOOST";

export interface UploadedDataset {
  id: string;
  fileName: string;
  rowCount: number;
  columns: string[];
  preview: any[];
  articles: Article[];
  uploadedAt?: Date;
  status: "processing" | "ready" | "error";
}

export interface ForecastJob {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  total: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface ParsedCSVData {
  data: any[];
  columns: string[];
  errors: string[];
}

// KPI & Metrics
export interface KPIMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  delta?: number;
  deltaTrend?: "up" | "down" | "stable";
  comparison_period?: string;
  icon?: string;
}


// Chatbot / AI Assistant
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: {
    dataset_reference?: string;
    metric_reference?: string;
    related_forecasts?: string[];
  };
  quick_actions?: QuickAction[];
  // raw backend payload (optional) - preserves fields like `sql`, `rows_preview`, `insights`
  raw?: any;
}

export interface QuickAction {
  id: string;
  label: string;
  action_type: "navigate" | "export" | "filter" | "explain";
  target?: string;
  params?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
}

// Theme & Settings
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  chart_type?: "line" | "area" | "bar";
  notification_settings?: {
    anomalies: boolean;
    forecast_ready: boolean;
    daily_summary: boolean;
  };
  export_format?: "csv" | "excel" | "pdf";
}
