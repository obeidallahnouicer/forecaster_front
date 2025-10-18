# Sales Forecaster - Cinematic Edition

A production-ready React + TypeScript sales forecasting dashboard with Clean Architecture, cinematic UI, and enterprise-grade state management.

## 🎯 Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── app/                    # Application layer
│   └── pages/             # Feature pages
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui primitives
├── domain/               # Business logic & entities
│   ├── types.ts         # Core domain types
│   └── trend.ts         # Business logic helpers
├── infrastructure/       # External integrations
│   ├── apiClient.ts     # Backend API client
│   └── mockData.ts      # Demo mode data
├── store/               # State management
│   └── uiStore.ts       # Zustand global state
└── hooks/               # Custom React hooks
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Design System

The app features a **cinematic design system** with:

- **Deep midnight backgrounds** with gradient overlays
- **Gold (#EAB308) and Cyan (#06B6D4) accents** for CTAs and highlights
- **Large-scale typography** (48-80px headlines)
- **Smooth animations** via Framer Motion
- **Glow effects** and elevated shadows for depth

All design tokens are defined in:
- `src/index.css` - CSS custom properties
- `tailwind.config.ts` - Tailwind theme extensions

## 🔧 Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: Zustand (UI state) + React Query (server data)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Build Tool**: Vite

## 📊 Features

### 1. Forecast All
- Upload CSV/XLSX datasets
- Batch forecast processing with progress tracking
- Top forecasts grid with interactive cards
- CSV export

### 2. Single Article Analysis
- Searchable article selector
- Historical sales line chart
- Next-year ensemble forecast
- Model comparison bar chart
- Detailed metrics (data points, trend %, forecast)

### 3. Summary & Reports
- Trend distribution pie chart
- Forecast vs trend scatter plot
- Visual insights across all articles

## 🌐 Backend Integration

### API Endpoints (Expected)

The app expects the following REST API:

```typescript
POST   /api/upload              // Upload CSV/XLSX
POST   /api/forecast/all        // Run batch forecasts
GET    /api/forecast/article    // Get single article forecast
GET    /api/summary             // Get summary of all forecasts
POST   /api/cache/clear         // Clear server cache
```

### Mock Mode (Default)

Currently runs in **demo mode** with client-side mock data generation. To connect a real backend:

1. Set `VITE_API_URL` environment variable
2. Implement backend endpoints matching the contract in `src/infrastructure/apiClient.ts`

Example `.env`:
```bash
VITE_API_URL=http://localhost:8000/api
```

## � Analytics Dashboard

This project now includes an interactive Analytics Dashboard at `/analytics` that consumes the backend endpoints `/api/status`, `/api/metrics`, and `/api/documents`.

Use the provided `.env.example` to set `VITE_API_URL` or `REACT_APP_API_BASE_URL` to point to your FastAPI backend.

## �🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `/api` |

## 🧪 Testing

```bash
# Run unit tests (when configured)
npm run test

# Run E2E tests (when configured)
npm run test:e2e
```

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Output: dist/ folder ready for deployment
```

Deploy `dist/` to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.)

## 🎯 Key Design Decisions

1. **Clean Architecture**: Domain logic separated from infrastructure and UI
2. **Mock-first**: Demo mode with generated data for instant preview
3. **Zustand for UI state**: Lightweight, no boilerplate
4. **React Query ready**: Infrastructure for server data caching (add when backend available)
5. **Cinematic UI**: Bold, confident design that feels premium

## 🛠️ Development

### Adding New Features

1. **Domain**: Add types to `src/domain/types.ts`
2. **Infrastructure**: Add API methods to `src/infrastructure/apiClient.ts`
3. **Components**: Create UI in `src/components/`
4. **Pages**: Wire up in `src/pages/`

### Customizing Design

Edit design tokens in:
- `src/index.css` (colors, gradients, shadows)
- `tailwind.config.ts` (theme extensions)

All components use semantic tokens from the design system.

## 📚 Learn More

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://zustand-demo.pmnd.rs)
- [Recharts](https://recharts.org)
- [Framer Motion](https://www.framer.com/motion)

