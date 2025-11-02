# Frontend Architecture: Dual Forecasting Data Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REACT FRONTEND                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │   Components    │◄───┤  Helper Functions │◄───┤  Data Adapters │ │
│  │                 │    │                   │    │                │ │
│  │ - Dashboard     │    │ - getSales        │    │ - normalize    │ │
│  │ - KPI Cards     │    │ - getQuantity     │    │ - transform    │ │
│  │ - Charts        │    │ - getTrend        │    │                │ │
│  └────────┬────────┘    └──────────────────┘    └───────▲────────┘ │
│           │                                               │          │
│           │                                               │          │
│           ▼                                               │          │
│  ┌──────────────────────────────────────────────────────┴────────┐ │
│  │                      API Client                               │ │
│  │                                                                │ │
│  │  - getDashboardStatus()                                       │ │
│  │  - getDashboardDocuments()                                    │ │
│  │  - getDashboardMetrics()                                      │ │
│  └────────────────────────────┬──────────────────────────────────┘ │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 │ HTTP/REST
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                         BACKEND API                                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Dashboard Router (/api/dashboard)               │   │
│  │                                                              │   │
│  │  - GET /status?frequency=yearly                             │   │
│  │  - GET /documents?frequency=yearly&filters...               │   │
│  │  - GET /metrics?frequency=yearly&top_n=10                   │   │
│  └───────────────────────┬──────────────────────────────────────┘   │
│                          │                                           │
│                          ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           get_forecaster() → IntegratedForecaster            │   │
│  │                                                              │   │
│  │  - Loads data from ventes_cleann.csv                        │   │
│  │  - Prepares data (clean + group)                            │   │
│  │  - Caches forecaster instance                               │   │
│  └───────────────────────┬──────────────────────────────────────┘   │
│                          │                                           │
│                          ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │    forecaster.generate_summary() → DataFrame Response        │   │
│  │                                                              │   │
│  │  Returns DataFrame with:                                     │   │
│  │  - sales_avg_forecast, qty_avg_forecast                     │   │
│  │  - sales_trend_pct, qty_trend_pct                           │   │
│  │  - All forecast methods (sma, ema, linear, arima, etc.)     │   │
│  └───────────────────────┬──────────────────────────────────────┘   │
│                          │                                           │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Cache Dir   │
                    │              │
                    │  - Parquet   │
                    │  - Per freq  │
                    └──────────────┘
```

## Data Flow Layers

### Layer 1: Backend (Python)

```
┌─────────────────────────────────────────────────┐
│  IntegratedForecaster                           │
│  ├─ prepare_data()                              │
│  ├─ clean_data()                                │
│  ├─ group_data()                                │
│  ├─ forecast_sales() → Multiple methods         │
│  ├─ forecast_quantities() → Multiple methods    │
│  └─ generate_summary() → DataFrame              │
│     ├─ sales_avg_forecast                       │
│     ├─ qty_avg_forecast                         │
│     ├─ sales_sma_forecast, qty_sma_forecast     │
│     ├─ sales_ema_forecast, qty_ema_forecast     │
│     ├─ sales_linear_forecast, qty_linear_...    │
│     ├─ sales_arima_forecast, qty_arima_...      │
│     ├─ sales_prophet_forecast, qty_prophet_...  │
│     ├─ sales_xgboost_forecast, qty_xgboost_...  │
│     ├─ sales_trend_pct, qty_trend_pct           │
│     └─ next_period, frequency                   │
└─────────────────────────────────────────────────┘
```

### Layer 2: API Router (FastAPI)

```
┌─────────────────────────────────────────────────┐
│  Dashboard Router                               │
│  ├─ load_forecast_summary(frequency)            │
│  │  └─ get_forecaster(frequency)                │
│  │     └─ forecaster.generate_summary()         │
│  │        └─ Returns DataFrame                  │
│  │                                               │
│  ├─ GET /dashboard/status                       │
│  │  └─ Returns: summary_exists, total_rows,     │
│  │              columns, frequency, data_source │
│  │                                               │
│  ├─ GET /dashboard/documents                    │
│  │  ├─ Load summary DataFrame                   │
│  │  ├─ Apply filters (marque, famille, etc.)    │
│  │  ├─ Apply sorting                            │
│  │  ├─ Apply pagination (limit, offset)         │
│  │  └─ Returns: {data, total, filtered, ...}    │
│  │                                               │
│  └─ GET /dashboard/metrics                      │
│     ├─ Load summary DataFrame                   │
│     ├─ Calculate aggregates                     │
│     ├─ Find top articles by sales               │
│     ├─ Find top articles by quantity            │
│     ├─ Group by marque (sales & qty)            │
│     ├─ Group by famille (sales & qty)           │
│     └─ Returns: metrics object                  │
└─────────────────────────────────────────────────┘
```

### Layer 3: API Client (TypeScript)

```
┌─────────────────────────────────────────────────┐
│  apiClient                                      │
│  ├─ getDashboardStatus(frequency)               │
│  │  └─ GET /api/dashboard/status?frequency=...  │
│  │                                               │
│  ├─ getDashboardDocuments(limit, offset,        │
│  │                        frequency, filters)    │
│  │  └─ GET /api/dashboard/documents?            │
│  │         frequency=...&limit=...&offset=...   │
│  │         &marque=...&sales_min=...            │
│  │                                               │
│  └─ getDashboardMetrics(frequency, filters)     │
│     └─ GET /api/dashboard/metrics?              │
│            frequency=...&top_n=...              │
└─────────────────────────────────────────────────┘
```

### Layer 4: Data Adapters (TypeScript)

```
┌─────────────────────────────────────────────────┐
│  Data Adapters                                  │
│  ├─ normalizeForecast(data)                     │
│  │  ├─ Extract sales_avg_forecast               │
│  │  ├─ Extract qty_avg_forecast                 │
│  │  ├─ Extract all methods                      │
│  │  ├─ Extract trends                           │
│  │  └─ Fallback to legacy fields                │
│  │                                               │
│  ├─ normalizeSummaryRow(data)                   │
│  │  └─ Same as normalizeForecast                │
│  │                                               │
│  ├─ normalizeDashboardDocuments(response)       │
│  │  ├─ Map response.data                        │
│  │  ├─ Normalize each row                       │
│  │  └─ Return {data, total, filtered, ...}      │
│  │                                               │
│  └─ normalizeDashboardMetrics(response)         │
│     ├─ Normalize top_articles_by_sales          │
│     ├─ Normalize top_articles_by_qty            │
│     └─ Return full metrics object               │
└─────────────────────────────────────────────────┘
```

### Layer 5: Helper Functions (TypeScript)

```
┌─────────────────────────────────────────────────┐
│  Forecast Helpers                               │
│  ├─ getSalesForecast(item)                      │
│  │  └─ item.sales_avg_forecast                  │
│  │     ?? item.avgForecast                      │
│  │     ?? 0                                      │
│  │                                               │
│  ├─ getQuantityForecast(item)                   │
│  │  └─ item.qty_avg_forecast ?? 0               │
│  │                                               │
│  ├─ getSalesTrend(item)                         │
│  │  └─ item.sales_trend_pct                     │
│  │     ?? item.trendPct                         │
│  │     ?? 0                                      │
│  │                                               │
│  ├─ getQuantityTrend(item)                      │
│  │  └─ item.qty_trend_pct ?? 0                  │
│  │                                               │
│  ├─ normalizeArticleForDisplay(item)            │
│  │  └─ Returns structured object with           │
│  │     sales & quantities data                  │
│  │                                               │
│  └─ [30+ other helper functions]                │
└─────────────────────────────────────────────────┘
```

### Layer 6: React Components (TypeScript/TSX)

```
┌─────────────────────────────────────────────────┐
│  Components                                     │
│  ├─ ForecastMetricsDashboard                    │
│  │  ├─ Receives DashboardMetricsResponse        │
│  │  ├─ Displays sales & qty KPIs                │
│  │  ├─ Shows top_articles_by_sales              │
│  │  └─ Shows top_articles_by_qty                │
│  │                                               │
│  ├─ KPICard (Enhanced)                          │
│  │  ├─ Supports currency/percent formatting     │
│  │  ├─ Displays trends with icons               │
│  │  └─ Supports sublabels                       │
│  │                                               │
│  ├─ ForecastTable                               │
│  │  ├─ Uses getSalesForecast() helper           │
│  │  ├─ Uses getQuantityForecast() helper        │
│  │  └─ Displays both dimensions                 │
│  │                                               │
│  └─ [Other components...]                       │
└─────────────────────────────────────────────────┘
```

## Component Usage Flow

### Example: Dashboard Page

```
User Opens Dashboard
        │
        ▼
┌───────────────────────┐
│ DashboardPage.tsx     │
│                       │
│ useEffect(() => {     │
│   fetchMetrics();     │
│   fetchDocuments();   │
│ })                    │
└──────────┬────────────┘
           │
           ├─────────────────────────┐
           │                         │
           ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐
│ apiClient           │   │ apiClient           │
│ .getDashboard       │   │ .getDashboard       │
│  Metrics()          │   │  Documents()        │
└──────────┬──────────┘   └──────────┬──────────┘
           │                         │
           ▼                         ▼
     [Backend API]            [Backend API]
           │                         │
           ▼                         ▼
   Metrics Response          Documents Response
           │                         │
           ├─────────────────────────┤
           │                         │
           ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐
│ normalize           │   │ normalize           │
│ DashboardMetrics    │   │ DashboardDocuments  │
└──────────┬──────────┘   └──────────┬──────────┘
           │                         │
           ├─────────────────────────┤
           │                         │
           ▼                         ▼
      State Update            State Update
           │                         │
           ├─────────────────────────┤
           │                         │
           ▼                         ▼
┌────────────────────────────────────────┐
│ Components Re-render                   │
│ ├─ ForecastMetricsDashboard            │
│ │  └─ Shows sales & qty metrics        │
│ │                                       │
│ └─ DocumentsTable                      │
│    └─ Shows articles with dual forecasts│
└────────────────────────────────────────┘
```

## Data Transformation Pipeline

### Example: Single Article

```
Backend DataFrame Row:
{
  ref_article: "ART123",
  designation: "Product XYZ",
  sales_avg_forecast: 12500.50,
  qty_avg_forecast: 150.25,
  sales_trend_pct: 15.5,
  qty_trend_pct: 12.3,
  sales_sma_forecast: 12000,
  qty_sma_forecast: 145,
  next_period: "2025",
  frequency: "yearly"
}
        │
        ▼
API Response (JSON):
{
  "ref_article": "ART123",
  "designation": "Product XYZ",
  "sales_avg_forecast": 12500.50,
  "qty_avg_forecast": 150.25,
  ...
}
        │
        ▼
normalizeSummaryRow():
{
  ref: "ART123",
  designation: "Product XYZ",
  sales_avg_forecast: 12500.50,
  qty_avg_forecast: 150.25,
  sales_trend_pct: 15.5,
  qty_trend_pct: 12.3,
  sales_trend_label: "Growth",
  qty_trend_label: "Growth",
  next_period: "2025",
  frequency: "yearly",
  // Legacy compatibility
  avgForecast: 12500.50,
  trendPct: 15.5
}
        │
        ▼
normalizeArticleForDisplay():
{
  ref: "ART123",
  designation: "Product XYZ",
  sales: {
    forecast: 12500.50,
    trend: 15.5,
    trendLabel: "Growth"
  },
  quantities: {
    forecast: 150.25,
    trend: 12.3,
    trendLabel: "Growth"
  },
  nextPeriod: "2025",
  frequency: "yearly"
}
        │
        ▼
Component Rendering:
┌──────────────────────────┐
│ ART123: Product XYZ      │
├──────────────────────────┤
│ Sales: $12,500          │
│ Trend: +15.5% ↑ Growth  │
├──────────────────────────┤
│ Quantity: 150 units     │
│ Trend: +12.3% ↑ Growth  │
└──────────────────────────┘
```

## Cache Strategy

```
Backend Cache:
├─ cache/
│  ├─ summary/
│  │  └─ summary.parquet (Global, latest)
│  │
│  ├─ yearly/
│  │  ├─ forecasts/
│  │  │  └─ [article]__forecast.csv
│  │  └─ summary/
│  │     └─ summary.parquet (Session-specific)
│  │
│  └─ monthly/
│     ├─ forecasts/
│     └─ summary/

Frontend Cache (React Query - Optional):
├─ Query Key: ["dashboard", "status", "yearly"]
├─ Query Key: ["dashboard", "documents", {filters}]
└─ Query Key: ["dashboard", "metrics", {filters}]

Cache Invalidation:
├─ New forecast generated → Backend cache updated
├─ Frontend refetches on window focus (React Query)
└─ Manual refresh via UI button
```

## Error Handling Flow

```
API Call
   │
   ├─ Network Error
   │  └─ Show: "Unable to connect to server"
   │
   ├─ 404 Not Found
   │  └─ Show: "Forecast data not found. Generate forecasts first."
   │
   ├─ 500 Server Error
   │  └─ Show: "Server error. Please try again later."
   │
   └─ Success
      │
      ├─ Empty Data
      │  └─ Show: "No forecasts available for these filters"
      │
      ├─ Invalid Data
      │  └─ Adapters normalize with defaults (0 for missing values)
      │
      └─ Valid Data
         └─ Render components
```

## Performance Optimization

### Backend
- Parquet format (3-5x faster than CSV)
- In-memory forecaster caching
- Efficient DataFrame operations
- Lazy loading of forecast details

### Frontend
- React Query caching
- Component memoization
- Virtual scrolling for large lists
- Lazy loading of charts
- Debounced filtering

---

**Legend:**
- `└─` Single child
- `├─` Multiple children
- `▼` Data flow direction
- `[...]` External system/file
