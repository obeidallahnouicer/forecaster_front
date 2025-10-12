// Mock Data for Demo Mode

import { Article, ForecastResult, SummaryRow, UploadedDataset } from "@/domain/types";
import { calculateTrendPct, getTrendLabel, calculateEnsembleForecast } from "@/domain/trend";

/**
 * Generate mock historical data for an article
 */
export function generateMockHistory(baseValue: number, years: number = 5): { year: number; value: number }[] {
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
    { method: "SMA", value: lastValue * (1 + trendPct / 100) },
    { method: "ExpSmoothing", value: lastValue * (1 + trendPct / 100 + 0.02) },
    { method: "LinearReg", value: lastValue * (1 + trendPct / 100 - 0.01) },
    { method: "XGBOOST", value: lastValue * (1 + trendPct / 100 + 0.03) },
  ];

  const avgForecast = calculateEnsembleForecast(forecasts.map((f) => f.value));

  return {
    ref: article.ref,
    designation: article.designation,
    marque: article.marque,
    famille: article.famille,
    historique: history,
    forecasts,
    avgForecast,
    trendPct,
    dataPoints: history.length,
    nextYear,
  };
}

/**
 * Generate mock articles
 */
export function generateMockArticles(count: number = 50): Article[] {
  const brands = ["Samsung", "Apple", "Sony", "LG", "Panasonic", "HP", "Dell"];
  const families = ["Electronics", "Home Appliance", "Computing", "Mobile", "Audio"];
  const articles: Article[] = [];

  for (let i = 0; i < count; i++) {
    articles.push({
      ref: `ART-${String(i + 1).padStart(4, "0")}`,
      designation: `Product ${i + 1}`,
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
  const articles = generateMockArticles();
  
  return {
    fileName: "mock-sales-data.csv",
    rowCount: articles.length * 5, // 5 years per article
    columns: ["ref_article", "designation", "marque", "famille", "annee", "ca_ht_net"],
    preview: articles.slice(0, 10).map((a) => ({
      ref_article: a.ref,
      designation: a.designation,
      marque: a.marque,
      famille: a.famille,
      annee: 2023,
      ca_ht_net: (Math.random() * 50000).toFixed(2),
    })),
    articles,
  };
}

/**
 * Generate mock summary
 */
export function generateMockSummary(articles: Article[]): SummaryRow[] {
  return articles.map((article) => {
    const forecast = generateMockForecast(article);
    return {
      ref: article.ref,
      designation: article.designation,
      marque: article.marque,
      famille: article.famille,
      avgForecast: forecast.avgForecast,
      trendPct: forecast.trendPct,
      trendLabel: getTrendLabel(forecast.trendPct),
    };
  });
}
