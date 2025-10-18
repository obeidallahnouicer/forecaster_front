# Frequency Selector Fix - Year/Month in Settings

## Changes Made

### 1. ForecastSettings Component (`src/components/ForecastSettings.tsx`)
✅ **Added Yearly/Monthly Frequency Selector**
- Added `sessionFrequency` and `setSessionFrequency` from `useUIStore`
- Two large toggle buttons at the top: **Yearly** and **Monthly**
- Active button is highlighted with primary color
- Button click changes the frequency for the entire session

### 2. ForecastsPage Component (`src/pages/ForecastsPage.tsx`)
✅ **Updated Display Cards**
- Changed from showing "Forecast Period: 3 years" to "Frequency: yearly/monthly"
- Renamed "Forecast Period" (which was the SMA period) to "SMA Period" for clarity
- Removed "Mode" display (Fast/Accurate) to make room for Frequency
- Now displays 4 cards: **Frequency | SMA Period | Alpha | Models**

### 3. How It Works
1. User selects **Yearly** or **Monthly** in ForecastSettings
2. `sessionFrequency` is stored in `useUIStore`
3. When uploading dataset, frequency is sent to backend: `uploadDataset(file, sessionFrequency)`
4. Display shows the selected frequency before running forecast
5. Backend receives the correct frequency parameter

## Response Structure
The backend response now includes:
```json
{
  "frequency": "yearly",  // or "monthly"
  "next_period": 2026,
  "historical_periods": "[2020, 2021, 2022, 2023, 2024, 2025]",
  ...
}
```

## Files Modified
- ✅ `src/components/ForecastSettings.tsx` - Added frequency selector
- ✅ `src/pages/ForecastsPage.tsx` - Updated display cards
- ✅ `src/store/uiStore.ts` - Already has `sessionFrequency` state
- ✅ `src/infrastructure/apiClient.ts` - Already sends frequency to backend

## Next Steps (Backend)
The backend response includes redundant fields that should be cleaned:
- Remove `next_year` field (use `next_period` instead)
- Remove `historical_years` field (use `historical_periods` instead)
- Keep only non-duplicate fields to reduce response size
