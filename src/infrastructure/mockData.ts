// Mock Data for Demo Mode

import {
  Article,
  ForecastResult,
  SummaryRow,
  UploadedDataset,
  KPIMetric,
  AnomalyAlert,
  ChatMessage,
  ChatSession,
} from "@/domain/types";
import { calculateTrendPct, getTrendLabel, calculateEnsembleForecast } from "@/domain/trend";

/**
 * Generate mock historical data for an article
 */
export function generateMockHistory(
  baseValue: number,
  years: number = 5
): { year: number; value: number }[] {
  const currentYear = new Date().getFullYear();
  const history = [];

  for (let i = 0; i < years; i++) {
    const year = currentYear - years + i + 1;
    const variation = (Math.random() - 0.4) * 0.2;
    const value = baseValue * (1 + variation * i);
    history.push({ year, value: Math.max(0, value) });
  }

  return history;
}

/**
 * Generate mock forecast data with confidence intervals
 */
export function generateMockForecastData(
  lastHistoricalValue: number,
  trend: number,
  periods: number = 12
): {
  period: string;
  value: number;
  upper_bound: number;
  lower_bound: number;
  confidence_level: number;
}[] {
  const data = [];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const baseValue = lastHistoricalValue * (1 + trend / 100);

  for (let i = 0; i < periods; i++) {
    const seasonality = Math.sin((i / periods) * Math.PI * 2) * baseValue * 0.1;
    const noise = (Math.random() - 0.5) * baseValue * 0.08;
    const value = baseValue + seasonality + noise;
    const confidence = 95 - (i * 5) / periods; // Decreasing confidence over time

    data.push({
      period: months[i % 12],
      value: Math.max(0, value),
      upper_bound: value * (1 + (100 - confidence) / 100),
      lower_bound: value * (1 - (100 - confidence) / 100),
      confidence_level: confidence,
    });
  }

  return data;
}

/**
 * Generate mock forecast result
 */
export function generateMockForecast(article: Article): ForecastResult {
  const baseValue = 10000 + Math.random() * 50000;
  const history = generateMockHistory(baseValue);
  const trendPct = calculateTrendPct(history);
  const nextYear = new Date().getFullYear() + 1;

  // Generate mock forecasts from different methods
  const lastValue = history[history.length - 1].value;
  const forecasts = [
    { method: "SMA", value: lastValue * (1 + trendPct / 100), confidence: 0.82 },
    {
      method: "ExpSmoothing",
      value: lastValue * (1 + trendPct / 100 + 0.02),
      confidence: 0.88,
    },
    {
      method: "LinearReg",
      value: lastValue * (1 + trendPct / 100 - 0.01),
      confidence: 0.85,
    },
    {
      method: "XGBOOST",
      value: lastValue * (1 + trendPct / 100 + 0.03),
      confidence: 0.91,
      weight: 2,
    },
  ];

  const avgForecast = calculateEnsembleForecast(forecasts.map((f) => f.value));
  const forecastData = generateMockForecastData(lastValue, trendPct);

  return {
    id: `forecast-${article.ref}`,
    ref: article.ref,
    designation: article.designation,
    marque: article.marque,
    famille: article.famille,
    historique: history,
    forecasts,
    forecast_data: forecastData,
    avgForecast,
    trendPct,
    dataPoints: history.length,
    nextYear,
    confidence_interval: 95,
    model_accuracy: 85 + Math.random() * 12,
    last_updated: new Date(),
  };
}

/**
 * Generate mock articles
 */
export function generateMockArticles(count: number = 50): Article[] {
  const brands = [
    "Samsung",
    "Apple",
    "Sony",
    "LG",
    "Panasonic",
    "HP",
    "Dell",
    "Canon",
    "Nikon",
    "ASUS",
  ];
  const families = [
    "Electronics",
    "Home Appliance",
    "Computing",
    "Mobile",
    "Audio",
    "Imaging",
    "Networking",
  ];
  const articles: Article[] = [];

  for (let i = 0; i < count; i++) {
    articles.push({
      ref: `ART-${String(i + 1).padStart(4, "0")}`,
      designation: `Premium Product ${i + 1}`,
      marque: brands[i % brands.length],
      famille: families[i % families.length],
    });
  }

  return articles;
}

/**
 * Generate mock uploaded dataset
 */
export function generateMockDataset(): UploadedDataset {
  const articles = generateMockArticles(50);

  return {
    id: "dataset-001",
    fileName: "sales-forecast-2025-q1.csv",
    rowCount: articles.length * 5, // 5 years per article
    columns: [
      "ref_article",
      "designation",
      "marque",
      "famille",
      "annee",
      "ca_ht_net",
    ],
    preview: articles.slice(0, 10).map((a) => ({
      ref_article: a.ref,
      designation: a.designation,
      marque: a.marque,
      famille: a.famille,
      annee: 2024,
      ca_ht_net: (Math.random() * 50000).toFixed(2),
    })),
    articles,
    uploadedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    status: "ready",
  };
}

/**
 * Generate mock summary
 */
export function generateMockSummary(articles: Article[]): SummaryRow[] {
  return articles.map((article) => {
    const forecast = generateMockForecast(article);
    const anomalyScore = Math.random();

    return {
      ref: article.ref,
      designation: article.designation,
      marque: article.marque,
      famille: article.famille,
      avgForecast: forecast.avgForecast,
      trendPct: forecast.trendPct,
      trendLabel: getTrendLabel(forecast.trendPct),
      confidence: forecast.confidence_interval,
      anomaly_score: anomalyScore > 0.85 ? anomalyScore : undefined,
    };
  });
}

/**
 * Generate KPI metrics for dashboard
 */
export function generateMockKPIs(): KPIMetric[] {
  return [
    {
      id: "kpi-1",
      label: "Total Forecast Value",
      value: "$2.4M",
      unit: "USD",
      delta: 12.5,
      deltaTrend: "up",
      comparison_period: "vs last month",
      icon: "TrendingUp",
    },
    {
      id: "kpi-2",
      label: "Avg Model Accuracy",
      value: "89.2%",
      delta: 3.2,
      deltaTrend: "up",
      comparison_period: "improvement",
      icon: "Target",
    },
    {
      id: "kpi-3",
      label: "Tracked Items",
      value: "1,247",
      delta: 4.3,
      deltaTrend: "up",
      comparison_period: "vs last week",
      icon: "Activity",
    },
    {
      id: "kpi-4",
      label: "Active Alerts",
      value: "8",
      delta: -2,
      deltaTrend: "down",
      comparison_period: "critical issues",
      icon: "AlertTriangle",
    },
  ];
}

/**
 * Generate anomaly alerts
 */
export function generateMockAnomalies(): AnomalyAlert[] {
  return [
    {
      id: "anomaly-1",
      severity: "critical",
      title: "Unusual Spike Detected",
      description:
        'Product "Premium Phone X12" shows 340% increase in sales forecast — check for data quality',
      affected_items: ["ART-0001", "ART-0015"],
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      action: "Review Data",
    },
    {
      id: "anomaly-2",
      severity: "warning",
      title: "Low Model Confidence",
      description:
        "Forecast confidence below 70% for 23 items. Consider expanding historical data.",
      affected_items: ["ART-0023", "ART-0045", "ART-0067"],
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      action: "Improve Data",
    },
    {
      id: "anomaly-3",
      severity: "info",
      title: "New Forecast Batch Ready",
      description:
        "Latest forecast batch (v2.4) is ready for deployment. 1,247 items processed.",
      affected_items: [],
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      action: "Deploy",
    },
  ];
}

/**
 * Generate mock chat messages (conversation samples)
 */
export function generateMockChatMessages(): ChatMessage[] {
  return [
    {
      id: "msg-1",
      role: "user",
      content: "Why is the forecast for Product X showing a 45% increase?",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      context: {
        dataset_reference: "dataset-001",
        metric_reference: "ART-0001",
      },
    },
    {
      id: "msg-2",
      role: "assistant",
      content: `Based on the historical data for Product X (ART-0001), the 45% forecast increase is driven by:

1. **Seasonal Pattern**: Q1 typically shows 35-40% growth year-over-year
2. **Trend Analysis**: 3-year trend shows consistent +12% growth annually
3. **Market Indicators**: Recent market expansion in Asia-Pacific region
4. **Model Confidence**: 91% confidence level (XGBOOST ensemble)

This forecast aligns with similar products in the Electronics category. Would you like to export this analysis or compare with other forecast models?`,
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      context: {
        metric_reference: "ART-0001",
        related_forecasts: ["ART-0002", "ART-0003"],
      },
      quick_actions: [
        {
          id: "qa-1",
          label: "Export Analysis",
          action_type: "export",
          target: "ART-0001",
          params: { format: "pdf" },
        },
        {
          id: "qa-2",
          label: "Compare Models",
          action_type: "navigate",
          target: "/forecasts/ART-0001/models",
        },
      ],
    },
    {
      id: "msg-3",
      role: "user",
      content: "Show me all items with forecasts below 70% confidence",
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
    },
    {
      id: "msg-4",
      role: "assistant",
      content: `I found 23 items with forecast confidence below 70%. Here's a summary:

**Items with Low Confidence:**
- ART-0023: 68% confidence (insufficient historical data)
- ART-0045: 65% confidence (high volatility)
- ART-0067: 62% confidence (recent market changes)

Would you like to:
1. Review the data quality for these items
2. Adjust the forecast period
3. Run a separate analysis with different parameters`,
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      quick_actions: [
        {
          id: "qa-3",
          label: "Filter Dashboard",
          action_type: "filter",
          target: "low_confidence",
          params: { threshold: 0.7 },
        },
        {
          id: "qa-4",
          label: "Run Analysis",
          action_type: "navigate",
          target: "/forecasts/batch-analysis",
        },
      ],
    },
  ];
}

/**
 * Generate mock chat session
 */
export function generateMockChatSession(): ChatSession {
  return {
    id: "session-001",
    title: "Q1 Forecast Review",
    messages: generateMockChatMessages(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 1 * 60 * 1000),
  };
}
