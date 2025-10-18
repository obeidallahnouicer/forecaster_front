# Frequency Endpoint Fix - Implementation Guide

## Problem
The frontend was always calling `/forecast/all/{session_id}` regardless of whether the user selected "yearly" or "monthly" frequency.

## Backend Endpoints

### Yearly Forecasting
- **Upload**: `POST /upload` with `frequency=yearly`
- **Forecast All**: `POST /forecast/all/{session_id}` - uses session's frequency
- **Forecast Single**: `GET /forecast/article/{session_id}?ref={ref}` - uses session's frequency
- **Summary**: `GET /summary/{session_id}`

### Monthly Forecasting
- **Upload**: `POST /upload` with `frequency=monthly`
- **Forecast All**: Backend uses same `POST /forecast/all/{session_id}` - the session stores frequency
- **Forecast Single**: `POST /monthly/forecast/article/{session_id}/{ref}` - monthly-specific endpoint
- **Summary**: `GET /monthly/summary/{session_id}` - monthly-specific summary

## Key Insight
The backend **stores the frequency in the session when uploaded**. The `/forecast/all` endpoint automatically uses the frequency from the session. However, there are **monthly-specific endpoints** for getting summary data and individual article forecasts.

## Frontend Fix Required

1. **Upload**: Already correct - passes `sessionFrequency` to upload endpoint ✅
2. **Forecast All**: The current call to `forecastAll()` is correct - backend handles frequency automatically ✅
3. **Summary**: Need to call different endpoint based on frequency ❌
4. **Individual Article**: Need to call different endpoint based on frequency ❌

## Implementation

### Summary Fetching
```typescript
const fetchSummary = async () => {
  if (sessionFrequency === 'monthly') {
    // Use monthly-specific endpoint
    const summary = await apiClient.getMonthlySummary(sessionId);
  } else {
    // Use yearly endpoint
    const summary = await apiClient.getSummary(sessionId, false);
  }
}
```

### Individual Article Fetching  
```typescript
const fetchArticleDetails = async (ref: string) => {
  if (sessionFrequency === 'monthly') {
    const result = await apiClient.forecastMonthlyArticle(sessionId, ref, ...params);
  } else {
    const result = await apiClient.forecastArticle(sessionId, ref, ...params);
  }
}
```

## Status
- ✅ Upload endpoint: Correctly using frequency parameter
- ✅ Forecast all endpoint: Backend handles frequency automatically  
- ❌ Summary endpoint: Need to use monthly-specific endpoint
- ❌ Article detail endpoint: Need to use monthly-specific endpoint
- ❌ Overview crash: DOM nesting issues in ForecastMetricsDashboard

## Next Steps
1. Fix fetchSummary to use correct endpoint based on frequency
2. Fix article detail fetching to use correct endpoint
3. Fix DOM nesting issues in Overview tab
4. Test thoroughly with both yearly and monthly data
