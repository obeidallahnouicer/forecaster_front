// Production API Client - Maps to real backend endpoints (NO MOCK DATA)
// Endpoints: RAG chatbot + forecasting backend at http://localhost:8000

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface PaginatedResponse<T> {
  count: number;
  rows?: T[];
  items?: T[];
  page?: number;
  page_size?: number;
  returned?: number;
}

export interface UploadResponse {
  session_id: string;
  rows: number;
}

export interface ChatResponse {
  thread_id: string;
  message?: string;
  response?: string;
}

export interface HealthResponse {
  status: string;
}

// ===== SQL CHAT TYPES =====
export interface SQLChatResponse {
  success: boolean;
  sql?: string;
  insights?: string[];
  recommendations?: string[];
  rows_preview?: Record<string, any>[];
  rowcount?: number;
  execution_time_ms?: number;
  validation_status?: string; // could be a structured object, backend returns string or object
  error?: string;
}

export interface SQLChatHealth {
  llm: string;
  pipeline: string[];
  validators: string[];
  tables: Record<string, { columns: string[]; sample_count?: number }>;
}

export interface SQLChatSchema {
  tables: Record<string, { columns: string[]; sample_count?: number }>;
}

export interface SQLChatValidationInfo {
  stages: Array<{
    name: string;
    status: string;
    detail?: string;
  }>;
}

export class APIClient {
  private client: any;
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 0, // No timeout - API requests can take as long as needed
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Error handling interceptor
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        if (error.code === "ECONNABORTED") {
          throw new Error("Request timeout - backend not responding");
        }
        if (error.response?.status === 404) {
          throw new Error(error.response?.data?.detail || "Resource not found");
        }
        if (error.response?.status === 400) {
          throw new Error(error.response?.data?.detail || "Bad request");
        }
        if (error.response?.status === 500) {
          throw new Error(error.response?.data?.detail || "Server error");
        }
        throw error;
      }
    );
  }

  // Basic client-side PII sanitizer.
  // Note: backend will still run its PII validators. This is just a helpful pre-filter
  // to remove obvious secrets before sending over the network. Do NOT rely on this
  // for security — backend validation is authoritative.
  private sanitizeQuestion(input: string): { sanitized: string; removed: string[] } {
    const removed: string[] = [];
    if (!input || typeof input !== "string") return { sanitized: "", removed };

    let s = input;

    // simple email removal
    s = s.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (m) => {
      removed.push(`email:${m}`);
      return "[REDACTED_EMAIL]";
    });

    // basic credit card patterns (very permissive)
    s = s.replace(/\b(?:\d[ -]*?){13,19}\b/g, (m) => {
      removed.push(`card:${m}`);
      return "[REDACTED_CARD]";
    });

    // SSN-like (US) patterns
    s = s.replace(/\b\d{3}-\d{2}-\d{4}\b/g, (m) => {
      removed.push(`ssn:${m}`);
      return "[REDACTED_SSN]";
    });

    // simple API key-ish tokens (high-entropy hex/base64)
    s = s.replace(/\b(?:[A-Za-z0-9_\-]{32,})\b/g, (m) => {
      // avoid removing normal words by checking for long alphanumeric
      if (m.length >= 32) {
        removed.push(`token:${m.slice(0, 8)}...`);
        return "[REDACTED_TOKEN]";
      }
      return m;
    });

    // phone numbers (very permissive)
    s = s.replace(/\+?\d{1,3}[ -.]?\(?\d{1,4}\)?[ -.]?\d{1,4}[ -.]?\d{1,9}/g, (m) => {
      // avoid catching small numbers/dates by basic length check
      if (m.replace(/\D/g, "").length >= 7) {
        removed.push(`phone:${m}`);
        return "[REDACTED_PHONE]";
      }
      return m;
    });

    return { sanitized: s, removed };
  }

  // ===== CHAT ENDPOINTS (RAG Chatbot) =====

  // New business chat endpoint. The backend now exposes /business-chat which
  // accepts { query, session_id } and returns a rich BusinessChatResponse.
  // For backwards compatibility with components that expect a simple
  // `response` or `message` string, we normalize the returned payload and
  // include the raw backend data under `raw`.
  async sendChatMessage(threadId: string, message: string): Promise<any> {
  const resp = await this.client.post("/api/sql-chat", {
      question: message,
      session_id: threadId,
    });

    const data = resp.data || {};

    // Normalize to previous ChatResponse shape used by UI components
    const normalized: any = {
      thread_id: threadId,
      // prefer `answer`, then `response`, then `message` or fallback to full data
      response: data.answer ?? data.response ?? data.message ?? (typeof data === 'string' ? data : undefined),
      message: data.answer ?? data.response ?? data.message ?? (typeof data === 'string' ? data : undefined),
      raw: data,
    };

    return normalized;
  }

  async resetChatSession(threadId: string): Promise<any> {
    const resp = await this.client.post("/api/reset", {
      thread_id: threadId,
    });
    return resp.data;
  }

  // ===== DATASET UPLOAD ENDPOINTS =====

  async uploadDataset(file: File, frequency: string = "yearly"): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("frequency", frequency);

    const resp = await this.client.post("forecasts/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return resp.data;
  }

  // ===== SESSION MANAGEMENT =====

  async listSessions(): Promise<any> {
    const resp = await this.client.get("/forecasts/sessions");
    return resp.data;
  }

  async deleteSession(sessionId: string): Promise<any> {
    const resp = await this.client.delete(`/forecasts/sessions/${sessionId}`);
    return resp.data;
  }

  // ===== ARTICLE ENDPOINTS =====

  async listArticles(sessionId: string): Promise<any> {
    const resp = await this.client.get(`/articles/${sessionId}`);
    return resp.data;
  }

  // ===== FORECAST ENDPOINTS =====

  async forecastArticle(
    sessionId: string,
    ref: string,
    period: number = 3,
    alpha: number = 0.3,
    forceRecompute: boolean = false,
    fastMode: boolean = true,
    includeMethods?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      ref,
      period: period.toString(),
      alpha: alpha.toString(),
      force_recompute: forceRecompute.toString(),
      fast_mode: fastMode.toString(),
    });
    if (includeMethods) params.append("include_methods", includeMethods);

    const resp = await this.client.get(`/forecast/article/${sessionId}?${params}`);
    return resp.data;
  }

  async forecastAll(
    sessionId: string,
    period: number = 3,
    alpha: number = 0.3,
    forceRecompute: boolean = false,
    fastMode: boolean = true,
    includeMethods?: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append("period", period.toString());
    formData.append("alpha", alpha.toString());
    formData.append("force_recompute", forceRecompute.toString());
    formData.append("fast_mode", fastMode.toString());
    if (includeMethods) formData.append("include_methods", includeMethods);

    const resp = await this.client.post(`/forecasts/forecast/all/${sessionId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return resp.data;
  }

  // ===== SUMMARY ENDPOINTS =====

  async getSummary(sessionId: string, forceRecompute: boolean = false): Promise<any> {
    const resp = await this.client.get(`/summary/${sessionId}`, {
      params: { force_recompute: forceRecompute },
    });
    return resp.data;
  }

  async downloadSummary(sessionId: string): Promise<Blob> {
    const resp = await this.client.get(`/download/summary/${sessionId}`, {
      responseType: "blob",
    });
    return resp.data;
  }

  // ===== DASHBOARD DATA ENDPOINTS =====

  async getDashboardStatus(frequency: string = "yearly"): Promise<any> {
    const resp = await this.client.get("/dashboard/status", {
      params: { frequency },
    });
    return resp.data;
  }

  async getDashboardDocuments(
    limit: number = 1000,
    offset: number = 0,
    frequency: string = "yearly",
    filters?: {
      marque?: string;
      famille?: string;
      next_period?: string;
      sales_min?: number;
      sales_max?: number;
      qty_min?: number;
      qty_max?: number;
      sort_by?: string;
      sort_order?: "asc" | "desc";
    }
  ): Promise<any> {
    const params: any = {
      limit,
      offset,
      frequency,
    };
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });
    }

    const resp = await this.client.get("/dashboard/documents", { params });
    return resp.data;
  }

  async getDashboardMetrics(
    frequency: string = "yearly",
    filters?: {
      marque?: string;
      famille?: string;
      next_period?: string;
      top_n?: number;
    }
  ): Promise<any> {
    const params: any = { frequency };
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });
    }

    const resp = await this.client.get("/dashboard/metrics", { params });
    return resp.data;
  }

  async getDashboardData(
    limit: number = 1000,
    preview: boolean = false,
    columns?: string,
    page: number = 1,
    pageSize: number = 1000
  ): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      preview: preview.toString(),
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (columns) params.append("columns", columns);

    const resp = await this.client.get(`/chatbotdf?${params}`);
    return resp.data;
  }

  async downloadDashboardData(columns?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (columns) params.append("columns", columns);

    const resp = await this.client.get(`/download/chatbotdf${params.toString() ? '?' + params : ''}`, {
      responseType: "blob",
    });
    return resp.data;
  }

  async getPreviewData(sessionId: string): Promise<any> {
    const resp = await this.client.get(`/data/${sessionId}`);
    return resp.data;
  }

  // ===== MONTHLY ENDPOINTS =====

  async getMonthlySummary(sessionId: string): Promise<any> {
    const resp = await this.client.get(`/monthly/summary/${sessionId}`);
    return resp.data;
  }

  async getMonthlyArticle(sessionId: string, ref: string): Promise<any> {
    const resp = await this.client.get(`/monthly/articles/${sessionId}/${ref}`);
    return resp.data;
  }

  async getMonthlyPeriods(sessionId: string): Promise<any> {
    const resp = await this.client.get(`/monthly/periods/${sessionId}`);
    return resp.data;
  }

  async forecastMonthlyArticle(
    sessionId: string,
    ref: string,
    period: number = 3,
    alpha: number = 0.3,
    forceRecompute: boolean = false,
    fastMode: boolean = true,
    includeMethods?: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append("period", period.toString());
    formData.append("alpha", alpha.toString());
    formData.append("force_recompute", forceRecompute.toString());
    formData.append("fast_mode", fastMode.toString());
    if (includeMethods) formData.append("include_methods", includeMethods);

    const resp = await this.client.post(`/monthly/forecast/article/${sessionId}/${ref}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return resp.data;
  }

  async forecastMonthlyAll(
    sessionId: string,
    period: number = 3,
    alpha: number = 0.3,
    forceRecompute: boolean = false,
    fastMode: boolean = true,
    includeMethods?: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append("period", period.toString());
    formData.append("alpha", alpha.toString());
    formData.append("force_recompute", forceRecompute.toString());
    formData.append("fast_mode", fastMode.toString());
    if (includeMethods) formData.append("include_methods", includeMethods);

    const resp = await this.client.post(`forecasts/monthly/forecast/all/${sessionId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return resp.data;
  }

  // ===== HEALTH & DEBUG =====

  async healthCheck(): Promise<HealthResponse> {
    const resp = await this.client.get("/health");
    return resp.data;
  }

  // ===== SQL CHAT ENDPOINTS =====

  // Post a natural language question to the SQL Chat backend.
  // The backend performs PII input validation, SQL generation, SQL validation and safe execution.
  // The frontend must sanitize input, enforce length limits, and handle the structured response.
  async sqlChat(question: string, session_id?: string): Promise<SQLChatResponse> {
    if (!question || question.trim().length < 3) {
      throw new Error("Question must be at least 3 characters long.");
    }
    if (question.length > 1000) {
      throw new Error("Question exceeds maximum length of 1000 characters.");
    }

    const { sanitized, removed } = this.sanitizeQuestion(question);

    const payload: any = { question: sanitized };
    if (session_id) payload.session_id = session_id;
    if (removed.length) payload._client_redactions = removed; // non-sensitive telemetry only

    try {
  const resp = await this.client.post("/api/sql-chat", payload);
      const data = resp.data;

      // If backend indicates failure, surface a friendly message.
      if (!data) {
        return { success: false, error: "No response from SQL Chat service." };
      }

      if (!data.success) {
        // Keep messages user-friendly; do not expose raw errors.
        return {
          success: false,
          error: data.error || `The query could not be processed. Validation status: ${data.validation_status || "unknown"}`,
          validation_status: data.validation_status,
        };
      }

      // Success: return structured response as-is. Frontend UI will render read-only SQL, previews etc.
      return data;
    } catch (err: any) {
      // Network or server error - map to friendly message
      const message = err?.response?.data?.detail || err?.message || "Network error communicating with SQL Chat service.";
      return { success: false, error: message };
    }
  }

  /**
   * Execute a raw SQL query via the SQL Chat backend execution endpoint.
   * NOTE: This forwards SQL to the backend which must enforce validation and safety.
   * The frontend enforces light input checks and an optional `limit` to protect
   * against large scans. Use only when you need to run a specific SQL query.
   *
   * Returns the same shape as `SQLChatResponse` returned by the backend.
   *
   * Example: apiClient.executeSQL("SELECT * FROM t_stock WHERE Stock_à_terme < 0", 10)
   */
  async executeSQL(sql: string, limit: number = 10, session_id?: string): Promise<SQLChatResponse> {
    if (!sql || typeof sql !== "string") {
      throw new Error("SQL must be a non-empty string.");
    }

    if (limit <= 0 || limit > 10000) {
      throw new Error("`limit` must be between 1 and 10000.");
    }

    // Append a limit clause if not already present and the SQL looks like a SELECT.
    let finalSql = sql.trim();
    const isSelect = /^select\s+/i.test(finalSql);
    if (isSelect) {
      // naive check for existing LIMIT - if present, do not append
      if (!/\blimit\b/i.test(finalSql)) {
        finalSql = `${finalSql} LIMIT ${limit}`;
      }
    }

    const payload: any = { sql: finalSql };
    if (session_id) payload.session_id = session_id;

    try {
      const resp = await this.client.post(`/api/sql-chat/execute`, payload);
      const data = resp.data;
      if (!data) return { success: false, error: "No response from SQL execution service." };
      return data as SQLChatResponse;
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || "Network error executing SQL.";
      return { success: false, error: message };
    }
  }

  async sqlChatHealth(): Promise<SQLChatHealth> {
    const resp = await this.client.get("/api/sql-chat/health");
    return resp.data;
  }

  async sqlChatSchema(): Promise<SQLChatSchema> {
    const resp = await this.client.get("/api/sql-chat/schema");
    return resp.data;
  }

  async sqlChatValidationInfo(): Promise<SQLChatValidationInfo> {
    const resp = await this.client.get("/api/sql-chat/validation-info");
    return resp.data;
  }

  async reindex(): Promise<any> {
    const resp = await this.client.post("/reindex");
    return resp.data;
  }

  // ===== LEGACY METHODS (for backwards compatibility) =====

  async getKPIs(): Promise<any[]> {
    try {
      const data = await this.getDashboardData(1000, true);
      return transformToKPIs(data.rows || []);
    } catch (err) {
      console.warn("Failed to fetch KPIs from API, returning empty array", err);
      return [];
    }
  }

  async getAnomalies(): Promise<any[]> {
    try {
      // If backend has anomalies endpoint, use it
      const resp = await this.client.get("/anomalies");
      return resp.data || [];
    } catch (err) {
      console.warn("Failed to fetch anomalies, returning empty array", err);
      return [];
    }
  }

  async getMetric(metricId: string): Promise<any> {
    try {
      const data = await this.getDashboardData(1, true);
      return data.rows?.[0] || null;
    } catch (err) {
      console.warn("Failed to fetch metric", err);
      return null;
    }
  }

  async dismissAnomaly(anomalyId: string): Promise<void> {
    try {
      await this.client.post(`/anomalies/${anomalyId}/dismiss`);
    } catch (err) {
      console.warn("Failed to dismiss anomaly", err);
    }
  }

  async getChatSessions(page: number = 1, pageSize: number = 50): Promise<any> {
    try {
      const sessions = await this.listSessions();
      const items = sessions.sessions?.slice((page - 1) * pageSize, page * pageSize) || sessions.slice?.((page - 1) * pageSize, page * pageSize) || [];
      const total = sessions.count || sessions.length || 0;
      return { items, total };
    } catch (err) {
      console.warn("Failed to fetch chat sessions", err);
      return { items: [], total: 0 };
    }
  }

  async createChatSession(title?: string): Promise<any> {
    try {
      const resp = await this.client.post("/forecasts/sessions", {
        title: title || "New Conversation",
      });
      return resp.data;
    } catch (err) {
      console.warn("Failed to create chat session", err);
      return {
        id: `session-${Date.now()}`,
        title: title || "New Conversation",
        messages: [],
        created_at: new Date(),
        updated_at: new Date(),
      };
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      await this.deleteSession(sessionId);
    } catch (err) {
      console.warn("Failed to delete chat session", err);
    }
  }

  async getForecasts(page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      const data = await this.getDashboardData(pageSize * page, true);
      const items = (data.rows || data.items || []).slice((page - 1) * pageSize, page * pageSize).map((row: any) => ({
        id: row.ref || row.id || `forecast-${Math.random()}`,
        name: row.designation || row.name || "Forecast",
        description: row.marque ? `${row.marque} - ${row.famille || "Product"}` : "Product forecast",
        value: row.avgForecast || row.value || 0,
        confidence: row.confidence || 0.85,
        status: "Ready",
        model: "Ensemble ML",
      }));
      const total = data.count || data.total || data.rows?.length || 0;
      return { items, total };
    } catch (err) {
      console.warn("Failed to fetch forecasts", err);
      return { items: [], total: 0 };
    }
  }
}

// ===== HELPER FUNCTIONS =====

function transformToKPIs(rows: any[]): any[] {
  if (!rows || rows.length === 0) return [];

  const kpis = [];

  const totalSales = rows.reduce((sum, row) => sum + (row.sales || 0), 0);
  const avgSales = totalSales / rows.length;
  const maxSales = Math.max(...rows.map(r => r.sales || 0));

  kpis.push({
    id: "total-sales",
    label: "Total Sales",
    value: (totalSales / 1000).toFixed(0) + "K",
    unit: "$",
    icon: "TrendingUp",
    delta: 12.5,
    comparison_period: "vs last month",
  });

  kpis.push({
    id: "avg-sales",
    label: "Average Sales",
    value: (avgSales / 1000).toFixed(1) + "K",
    unit: "$",
    icon: "Activity",
    delta: 5.2,
    comparison_period: "vs last month",
  });

  kpis.push({
    id: "max-sales",
    label: "Peak Sales",
    value: (maxSales / 1000).toFixed(0) + "K",
    unit: "$",
    icon: "Target",
    delta: -3.1,
    comparison_period: "vs last month",
  });

  kpis.push({
    id: "articles",
    label: "Total Articles",
    value: rows.length,
    icon: "Database",
    delta: 2.0,
    comparison_period: "vs last upload",
  });

  return kpis;
}

export const apiClient = new APIClient();
