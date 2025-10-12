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
}

export interface ForecastResult {
  ref: string;
  designation: string;
  marque?: string;
  famille?: string;
  historique: HistoricalDataPoint[];
  forecasts: ForecastMethod[];
  avgForecast: number;
  trendPct: number;
  dataPoints: number;
  nextYear: number;
}

export interface SummaryRow {
  ref: string;
  designation: string;
  marque?: string;
  famille?: string;
  avgForecast: number;
  trendPct: number;
  trendLabel: "Growth" | "Stable" | "Decline";
}

export interface Settings {
  period: number;
  alpha: number;
  fastMode: boolean;
  includeMethods: ForecastModel[];
}

export type ForecastModel = "SMA" | "ExpSmoothing" | "LinearReg" | "ARIMA" | "PROPHET" | "XGBOOST";

export interface UploadedDataset {
  fileName: string;
  rowCount: number;
  columns: string[];
  preview: any[];
  articles: Article[];
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
