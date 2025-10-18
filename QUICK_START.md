# Quick Start Guide - Sales Forecaster Platform

## 🚀 Launch & Development

### Start Development Server
```bash
npm run dev
```
The app will be available at **http://localhost:3000**

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## 🎯 Explore the Platform

### 1. **Dashboard** (http://localhost:3000/dashboard)
- View Key Performance Indicators
- See trending forecasts
- Monitor anomalies and alerts
- Access quick actions
- Upload new datasets

**What you'll see:**
- 4 KPI cards showing total forecast value, model accuracy, tracked items, active alerts
- Real-time anomaly alerts with severity levels
- Featured forecasts with interactive charts
- Quick action buttons

### 2. **Forecasts** (http://localhost:3000/forecasts)
- Search and filter forecasts by trend
- Grid view of all predictions
- Detailed forecast charts with confidence intervals
- Model comparison tables

**Features:**
- Search by product name, brand, or reference
- Filter by trend (Growth, Stable, Decline)
- View forecast models: SMA, ExpSmoothing, LinearReg, XGBOOST
- Interactive chart with hover details
- Export functionality

### 3. **AI Assistant** (http://localhost:3000/chat)
- Ask questions about your data
- Get context-aware responses
- View conversation history
- Create new chat sessions

**Try these questions:**
- "What are the top 5 trending products?"
- "Which forecasts have the lowest confidence?"
- "Compare this forecast with similar products"
- "Export the latest batch results"

### 4. **Settings** (http://localhost:3000/settings)
- Choose your theme (Light/Dark/System)
- Configure forecast parameters
- Set notification preferences
- Choose export formats

---

## 📊 Mock Data Overview

The platform comes with realistic mock data:

### Forecasts
- **50 products** across multiple brands (Samsung, Apple, Sony, LG, etc.)
- **Historical data** for 5 years
- **Confidence intervals** for uncertainty quantification
- **Multiple models** for ensemble forecasting

### KPIs
- Total Forecast Value: $2.4M (+12.5%)
- Average Model Accuracy: 89.2% (+3.2%)
- Tracked Items: 1,247 (+4.3%)
- Active Alerts: 8 (-2)

### Anomalies
- Critical: Unusual spike detected in Premium Phone X12
- Warning: Low model confidence for 23 items
- Info: New forecast batch ready for deployment

### Chat Sessions
- Q&A about forecast drivers
- Discussion of model confidence levels
- Data quality insights
- Export recommendations

---

## 🎨 Design Highlights

### Color System
- **Gold (#D4A73D)**: Primary actions and highlights
- **Cyan (#4DD9E9)**: Secondary elements and data
- **Deep Midnight (#0D1117)**: Professional dark background
- **Purple (#6F3FF0)**: Accent colors

### Component Features
- **KPI Cards**: Show metrics with trend indicators
- **Anomaly Alerts**: Color-coded by severity
- **Forecast Charts**: Interactive with confidence bands
- **Chat Panel**: Conversation with quick action buttons

### Animations
- Smooth page transitions
- Hover effects on interactive elements
- Framer Motion animations for polish
- Loading states with spinners

---

## 🔌 API Integration Points

The app is ready for backend integration:

### Mock API Structure
```typescript
// Forecast API
POST /api/forecasts/batch - Run batch forecast
GET /api/forecasts/{id} - Get specific forecast
GET /api/forecasts - List all forecasts
POST /api/forecasts/{id}/export - Export forecast

// Chat API
POST /api/chat/message - Send message to AI
GET /api/chat/sessions - Get chat history
POST /api/chat/sessions - Create new session

// Datasets
POST /api/datasets/upload - Upload CSV
GET /api/datasets - List datasets
DELETE /api/datasets/{id} - Delete dataset
```

### Replace Mock Data
In `infrastructure/mockData.ts`, replace `generateMock*` calls with real API calls:

```typescript
// Before (mock)
const forecasts = generateMockArticles().map(a => generateMockForecast(a));

// After (API)
const forecasts = await fetchForecastsFromAPI();
```

---

## 📱 Responsive Design

### Desktop (>1024px)
- Full navigation visible
- Multi-column layouts
- Side-by-side panels
- Rich data tables

### Tablet (640px - 1024px)
- Responsive grid (2 columns)
- Collapsible sidebar
- Optimized touch targets
- Readable charts

### Mobile (<640px)
- Single column layout
- Full-width inputs
- Stacked cards
- Finger-friendly buttons

---

## 🎯 Component Usage Examples

### KPI Card
```tsx
import { KPICard } from "@/components/KPICard";

<KPICard
  label="Model Accuracy"
  value="89.2%"
  delta={3.2}
  deltaTrend="up"
  comparison_period="improvement"
  icon="Target"
/>
```

### Anomaly Alert
```tsx
import { AnomalyAlertList } from "@/components/AnomalyAlert";

<AnomalyAlertList
  alerts={anomalies}
  onDismiss={handleDismiss}
  onAction={handleAction}
/>
```

### Forecast Chart
```tsx
import { ForecastChart } from "@/components/ForecastChart";

<ForecastChart
  forecast={forecastData}
  showConfidenceInterval={true}
  height={400}
/>
```

### Chat Panel
```tsx
import { ChatPanel } from "@/components/ChatPanel";

<ChatPanel
  messages={chatMessages}
  onSendMessage={handleMessage}
  suggestedQuestions={suggestions}
/>
```

---

## 🔧 Customization Guide

### Adding a New Page
1. Create component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Update navigation in `src/components/CinematicHeader.tsx`

### Adding a New Component
1. Create in `src/components/NewComponent.tsx`
2. Add TypeScript types to `src/domain/types.ts`
3. Use in pages/existing components

### Changing Colors
1. Update CSS variables in `src/index.css`
2. All components automatically use new colors
3. Test in light/dark modes

### Adding Mock Data
1. Create generator in `src/infrastructure/mockData.ts`
2. Export function with `generate` prefix
3. Use in components/pages

---

## 🧪 Testing the Features

### Test Anomaly Dismissal
1. Go to Dashboard
2. Click "Dismiss" on an alert
3. Alert disappears with animation

### Test Search & Filter
1. Go to Forecasts
2. Type in search box (searches products, brands, refs)
3. Change trend filter (Growth, Stable, Decline)
4. Results update in real-time

### Test Chat
1. Go to Chat page
2. Click suggested questions OR type your own
3. See simulated AI responses with quick actions
4. Create new conversation sessions

### Test Settings
1. Go to Settings
2. Try theme switcher (Light/Dark/System)
3. Toggle notifications
4. Adjust forecast parameters
5. Click "Save Settings"

### Test Responsive Design
1. Open DevTools (F12)
2. Toggle device toolbar
3. Test at mobile (375px), tablet (768px), desktop sizes
4. Check all pages are responsive

---

## 📊 Data Structure

### Forecast Result
```typescript
{
  id: "forecast-ART-0001",
  designation: "Premium Phone X12",
  marque: "Samsung",
  famille: "Mobile",
  avgForecast: 45000,
  trendPct: 12.5,
  confidence_interval: 95,
  model_accuracy: 89.2,
  forecast_data: [
    {
      period: "Jan",
      value: 45000,
      upper_bound: 47000,
      lower_bound: 43000,
      confidence_level: 95
    },
    // ... more months
  ]
}
```

### KPI Metric
```typescript
{
  id: "kpi-1",
  label: "Total Forecast Value",
  value: "$2.4M",
  delta: 12.5,
  deltaTrend: "up",
  comparison_period: "vs last month",
  icon: "TrendingUp"
}
```

### Chat Message
```typescript
{
  id: "msg-1",
  role: "user",
  content: "What's driving the forecast increases?",
  timestamp: new Date(),
  quick_actions: [
    {
      id: "qa-1",
      label: "Export Analysis",
      action_type: "export"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Port 3000 Already In Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Build Fails
```bash
# Clear node_modules and cache
rm -r node_modules package-lock.json
npm install
npm run build
```

### Charts Not Rendering
- Check browser console for errors
- Verify mock data is loading
- Try refreshing the page
- Check Recharts component imports

### Animations Not Smooth
- Ensure GPU acceleration enabled
- Check Framer Motion is imported
- Verify TailwindCSS animations work
- Test in different browser

---

## 📚 Resources

### Documentation Files
- `REDESIGN_DOCUMENTATION.md` - Complete architecture overview
- `README.md` - Original project README

### Component Library
- `src/components/ui/` - shadcn/ui components
- Storybook ready (can be added later)

### Dependencies
- React 18.3 - View library
- TypeScript 5.8 - Type safety
- Vite 5.4 - Build tool
- TailwindCSS 3.4 - Styling
- Framer Motion 12 - Animations
- Recharts 3.2 - Data visualization
- Zustand 5.0 - State management

---

## 📝 Next Steps

1. **Integrate Backend**
   - Replace mock data with real API calls
   - Implement authentication
   - Set up WebSocket for real-time updates

2. **Add RAG System**
   - Integrate vector database
   - Connect to LLM for AI responses
   - Fine-tune on domain data

3. **Deploy**
   - Set up CI/CD pipeline
   - Choose hosting (Vercel, AWS, etc.)
   - Configure monitoring

4. **Enhance Features**
   - Add report generation
   - Implement collaboration features
   - Build mobile app

---

**Happy Forecasting! 🚀**

For detailed information, see `REDESIGN_DOCUMENTATION.md`
