// Infrastructure - API Client for SalesForecaster Backend

import { ForecastResult, SummaryRow, UploadedDataset, Settings } from "@/domain/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload CSV/XLSX file and parse. Returns { session_id, rows }
   */
  async uploadDataset(file: File): Promise<UploadedDataset> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }

    return response.json();
  }

  /**
   * List articles for a session
   */
  async listArticles(sessionId: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/articles/${encodeURIComponent(sessionId)}`);
    if (!response.ok) throw new Error(`List articles failed: ${response.statusText}`);
    const data = await response.json();
    return data.articles || [];
  }

  /**
   * Run forecasts for all articles (form POST)
   */
  async forecastAll(
    sessionId: string,
    settings: Settings,
    forceRecompute: boolean = false,
    fastMode: boolean = true,
    includeMethods?: string[]
  ): Promise<{ count: number; preview: any[] }> {
    const form = new FormData();
    form.append("period", String(settings.period));
    form.append("alpha", String(settings.alpha));
    form.append("force_recompute", String(forceRecompute));
    form.append("fast_mode", String(fastMode));
    if (includeMethods && includeMethods.length > 0) {
      form.append("include_methods", includeMethods.join(","));
    }

    const response = await fetch(`${this.baseUrl}/forecast/all/${encodeURIComponent(sessionId)}`, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Forecast all failed: ${response.status} ${text}`);
    }

    return response.json();
  }

  /**
   * Get forecast result for a specific article
   */
  async forecastArticle(
    sessionId: string,
    ref: string,
    settings: Settings,
    forceRecompute: boolean = false,
    fastMode: boolean = true,
    includeMethods?: string[]
  ): Promise<ForecastResult> {
    const params = new URLSearchParams({
      ref,
      period: String(settings.period),
      alpha: String(settings.alpha),
      force_recompute: String(forceRecompute),
      fast_mode: String(fastMode),
    });
    if (includeMethods && includeMethods.length > 0) params.append("include_methods", includeMethods.join(","));

    const response = await fetch(`${this.baseUrl}/forecast/article/${encodeURIComponent(sessionId)}?${params}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Forecast article failed: ${response.status} ${text}`);
    }
    return response.json();
  }

  /**
   * Get summary of all forecasts for a session
   */
  async getSummary(sessionId: string, forceRecompute: boolean = false): Promise<SummaryRow[]> {
    const params = new URLSearchParams({ force_recompute: String(forceRecompute) });
    const response = await fetch(`${this.baseUrl}/summary/${encodeURIComponent(sessionId)}?${params}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Get summary failed: ${response.status} ${text}`);
    }

    // Backend may return snake_case keys (ref_article, avg_forecast, trend_pct, etc.)
    // Normalize rows to the frontend SummaryRow shape to avoid runtime crashes.
    const data = await response.json();
    const rows: any[] = data.rows || data || [];

    const safeNumber = (v: any) => {
      if (v === null || v === undefined || v === "") return 0;
      if (typeof v === "number") return v;
      const n = Number(v);
      return Number.isNaN(n) ? 0 : n;
    };

    return rows.map((r: any) => {
      const ref = r.ref || r.ref_article || r.reference || "";
      const designation = r.designation || r.label || "";
      const marque = r.marque || r.brand || "";
      const famille = r.famille || r.family || "";
      const nextYear = r.next_year ?? r.nextYear ?? null;
      const avgForecast = safeNumber(r.avg_forecast ?? r.avgForecast ?? r.avg);
      const trendPct = safeNumber(r.trend_pct ?? r.trendPct ?? r.trend);
      const trendLabel = (r.trend_label || r.trendLabel) ?? (trendPct > 5 ? "Uptrend" : trendPct < -5 ? "Downtrend" : "Stable");
      const dataPoints = r.data_points ?? r.dataPoints ?? r.data_points_count ?? 0;

      return {
        ref,
        designation,
        marque,
        famille,
        nextYear,
        avgForecast,
        trendPct,
        trendLabel,
        dataPoints,
      } as SummaryRow;
    });
  }

  /**
   * Download summary CSV for a session
   */
  async downloadSummary(sessionId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/download/summary/${encodeURIComponent(sessionId)}`);
    if (!response.ok) throw new Error(`Download summary failed: ${response.statusText}`);
    return response.blob();
  }

  /**
   * Get first 10 rows of the raw uploaded dataset for a session
   */
  async getDatasetPreview(sessionId: string): Promise<{ count: number; rows: any[] }> {
    const response = await fetch(`${this.baseUrl}/data/${encodeURIComponent(sessionId)}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Get dataset preview failed: ${response.status} ${text}`);
    }
    return response.json();
  }

  /**
   * List sessions
   */
  async listSessions(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/sessions`);
    if (!res.ok) throw new Error(`List sessions failed: ${res.statusText}`);
    const data = await res.json();
    return data.sessions || [];
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Delete session failed: ${res.statusText}`);
  }

  /* Chat / RAG endpoints integration (assumptions below)
   * Assumptions:
   * - POST /chat with JSON { message, thread_id } returns a JSON response with the assistant answer
   * - GET /chat/threads returns { threads: string[] }
   * - DELETE /chat/{thread_id}/memory resets persisted memory for that thread
   * These routes are lightweight wrappers for the Python functions provided in the prompt.
   */

  async chatMessage(message: string, threadId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, thread_id: threadId }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Chat request failed: ${response.status} ${text}`);
    }

    return response.json();
  }

  async listChatThreads(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/chat/threads`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`List chat threads failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    return data.threads || [];
  }

  async resetChatMemory(threadId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/chat/${encodeURIComponent(threadId)}/memory`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Reset chat memory failed: ${res.status} ${text}`);
    }
  }
}

export const apiClient = new ApiClient();
