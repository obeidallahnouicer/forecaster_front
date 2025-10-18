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
  historique: HistoricalDataPoint[];
  forecasts: ForecastMethod[];
  forecast_data: ForecastDataPoint[];
  avgForecast: number;
  trendPct: number;
  dataPoints: number;
  nextYear: number;
  confidence_interval: number;
  model_accuracy?: number;
  last_updated?: Date;
}

export interface SummaryRow {
  ref: string;
  designation: string;
  marque?: string;
  famille?: string;
  avgForecast: number;
  trendPct: number;
  trendLabel: "Growth" | "Stable" | "Decline";
  confidence?: number;
  anomaly_score?: number;
}

export interface Settings {
  period: number;
  alpha: number;
  fastMode: boolean;
  includeMethods: ForecastModel[];
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

export interface AnomalyAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  affected_items: string[];
  timestamp: Date;
  action?: string;
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
