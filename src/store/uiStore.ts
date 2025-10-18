// Zustand Store - UI State Management

import { create } from "zustand";
import { Article, Settings, SummaryRow, ChatSession } from "@/domain/types";
import { apiClient } from "@/infrastructure/apiClient";

interface UIState {
  // Dataset
  uploadedFileName: string | null;
  setUploadedFileName: (name: string | null) => void;

  // Articles
  articles: Article[];
  setArticles: (articles: Article[]) => void;
  selectedArticle: string | null;
  setSelectedArticle: (ref: string | null) => void;

  // Session
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  // Session frequency
  sessionFrequency: "yearly" | "monthly";
  setSessionFrequency: (f: "yearly" | "monthly") => void;

  // Settings
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;

  // Summary (reports)
  summary: SummaryRow[];
  setSummary: (rows: SummaryRow[]) => void;
  isFetchingSummary: boolean;
  setIsFetchingSummary: (v: boolean) => void;
  fetchSummary: (force?: boolean) => Promise<void>;

  // UI State
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;

  isForecastingAll: boolean;
  setIsForecastingAll: (value: boolean) => void;

  forecastProgress: number;
  setForecastProgress: (progress: number) => void;

  activeTab: "forecast-all" | "single-article" | "reports";
  setActiveTab: (tab: "forecast-all" | "single-article" | "reports") => void;

  // Theme
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Chat
  chatSession: ChatSession | null;
  setChatSession: (session: ChatSession | null) => void;
  chatSessions: ChatSession[];
  setChatSessions: (sessions: ChatSession[]) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Dataset
  uploadedFileName: null,
  setUploadedFileName: (name) => set({ uploadedFileName: name }),

  // Articles
  articles: [],
  setArticles: (articles) => set({ articles }),
  selectedArticle: null,
  setSelectedArticle: (ref) => set({ selectedArticle: ref }),

  // Session
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
  // Session frequency (yearly | monthly)
  sessionFrequency: "yearly",
  setSessionFrequency: (f: "yearly" | "monthly") => set({ sessionFrequency: f }),

  // Settings
  settings: {
    period: 3,
    alpha: 0.3,
    fastMode: true,
    includeMethods: ["SMA", "ExpSmoothing", "LinearReg", "XGBOOST"],
  },
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  // UI State
  isUploading: false,
  setIsUploading: (value) => set({ isUploading: value }),

  isForecastingAll: false,
  setIsForecastingAll: (value) => set({ isForecastingAll: value }),

  forecastProgress: 0,
  setForecastProgress: (progress) => set({ forecastProgress: progress }),

  activeTab: "forecast-all",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Theme
  theme: (() => {
    // Initialize theme from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
    return 'system';
  })() as "light" | "dark" | "system",
  setTheme: (newTheme: "light" | "dark" | "system") => {
    set({ theme: newTheme });
    // Persist to localStorage
    localStorage.setItem('theme', newTheme);
    // Apply theme to document
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme - check OS preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  },

  // Chat
  chatSession: null,
  setChatSession: (session) => set({ chatSession: session }),
  chatSessions: [],
  setChatSessions: (sessions) => set({ chatSessions: sessions }),

  // Summary (reports)
  summary: [],
  setSummary: (rows) => set({ summary: rows }),
  isFetchingSummary: false,
  setIsFetchingSummary: (v) => set({ isFetchingSummary: v }),
  fetchSummary: async (force = false) => {
    const sid: string | null = get().sessionId;
    if (!sid) {
      // no session — nothing to fetch
      return;
    }
    try {
      set({ isFetchingSummary: true });
      const resp = await apiClient.getSummary(sid, force);
      // apiClient.getSummary returns rows in { ref_article, avg_forecast, trend_pct } or similar
      const mapped = (resp || []).map((it: any) => {
        const avg = Number(it.avg_forecast ?? it.avgForecast ?? it.avg ?? 0) || 0;
        const trend = Number(it.trend_pct ?? it.trendPct ?? it.trend ?? 0) || 0;
        const trendLabel = trend > 5 ? "Growth" : trend < -5 ? "Decline" : "Stable";
        return {
          ref: String(it.ref_article ?? it.ref ?? ""),
          designation: it.designation ?? it.design ?? "",
          marque: it.marque ?? it.brand ?? undefined,
          famille: it.famille ?? it.family ?? undefined,
          avgForecast: avg,
          trendPct: trend,
          trendLabel,
        } as SummaryRow;
      });
      set({ summary: mapped });
    } catch (err) {
      console.error("fetchSummary failed", err);
    } finally {
      set({ isFetchingSummary: false });
    }
  },
}));
