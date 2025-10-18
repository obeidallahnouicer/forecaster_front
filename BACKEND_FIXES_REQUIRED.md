# Backend Fixes Required for forecasts.py

## Issue 1: Remove Year/Decade Selection from Settings
**Problem:** The upload endpoint should only accept `frequency: "yearly"` or `"monthly"`, not arbitrary year parameters.

**Current Code (Line ~16):**
```python
if frequency.lower() not in ["yearly", "monthly"]:
    raise HTTPException(status_code=400, detail="Frequency must be 'yearly' or 'monthly'")
```

✅ **Already correct** - This validation is already present and working.

---

## Issue 2: Remove Redundant Fields from Response
**Problem:** The forecast response contains duplicate and redundant fields:
- `next_year` is redundant (use `next_period` instead)
- `historical_years` duplicates `historical_periods`
- `historical_values_list` duplicates `historical_values`

**Fields to Remove:**
In the forecast response serialization, remove:
1. `next_year` 
2. `historical_years`
3. `historical_values_list`

**Location:** In the forecast method output or the serialization layer where the response is built.

**Action:** Update the response schema or sanitize function to exclude these fields:

```python
# Fields to exclude from response
EXCLUDED_FIELDS = {'next_year', 'historical_years', 'historical_values_list'}

def sanitize(obj):
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items() if k not in EXCLUDED_FIELDS}
    if isinstance(obj, list):
        return [sanitize(v) for v in obj]
    return _sanitize_value(obj)
```

---

## Issue 3: Consistency in Forecast Endpoint Parameters
**Problem:** The yearly and monthly forecast endpoints use different parameter passing methods:
- Yearly: Uses query parameters for `/forecast/article/{session_id}`
- Monthly: Uses Form parameters for `/monthly/forecast/article/{session_id}/{ref}`

**Fix:** Make both endpoints consistent. **Recommend using query parameters** for GET-style endpoints:

**Current (INCONSISTENT):**
```python
# Yearly - uses query params
@router.get("/forecast/article/{session_id}")
async def forecast_article(session_id: str, ref: str, period: int = 3, alpha: float = 0.3, ...):

# Monthly - uses Form (POST only)
@router.post("/monthly/forecast/article/{session_id}/{ref}")
async def forecast_monthly_article(session_id: str, ref: str, period: int = Form(3), ...):
```

**Better (CONSISTENT):**
```python
# Both should be GET with query params
@router.get("/forecast/article/{session_id}")
async def forecast_article(session_id: str, ref: str, period: int = 3, alpha: float = 0.3, ...):

@router.get("/monthly/forecast/article/{session_id}/{ref}")
async def forecast_monthly_article(session_id: str, ref: str, period: int = 3, alpha: float = 0.3, ...):
```

**Frontend needs update** (APIClient.ts):
```typescript
async forecastMonthlyArticle(
    sessionId: string,
    ref: string,
    period: number = 3,
    alpha: number = 0.3,
    forceRecompute: boolean = false,
    fastMode: boolean = true,
    includeMethods?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      period: period.toString(),
      alpha: alpha.toString(),
      force_recompute: forceRecompute.toString(),
      fast_mode: fastMode.toString(),
    });
    if (includeMethods) params.append("include_methods", includeMethods);

    const resp = await this.client.get(`/monthly/forecast/article/${sessionId}/${ref}?${params}`);
    return resp.data;
  }
```

---

## Summary of Changes

| Issue | Fix Location | Action |
|-------|--------------|--------|
| Remove year selection | `@router.post("/upload")` | ✅ Already correct |
| Remove redundant response fields | Response serialization | Remove `next_year`, `historical_years`, `historical_values_list` |
| Consistency in endpoints | Both forecast endpoints | Change monthly to GET with query params instead of POST with Form |

---

## Testing Checklist

- [ ] Upload with only "yearly" or "monthly" frequencies
- [ ] Response contains no `next_year`, `historical_years`, or `historical_values_list`
- [ ] Both `/forecast/article/` and `/monthly/forecast/article/` accept same query params
- [ ] Frontend calls updated to use GET for monthly forecast endpoint
