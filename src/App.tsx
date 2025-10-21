import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CinematicHeader } from "@/components/CinematicHeader";
import ChatSidebar from "@/components/ChatSidebar";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import ForecastsPage from "./pages/ForecastsPageNew";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import NotFound from "./pages/NotFound";
import ROUTES from "@/constants/routes";
import { AppProviders } from "@/context/AppProviders";

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <CinematicHeader />
        <main className="flex-1 pt-20 sm:pt-24">
          <Routes>
            <Route path={ROUTES.HOME} element={<Index />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.FORECASTS} element={<ForecastsPage />} />
            <Route path={ROUTES.CHAT} element={<ChatPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            <Route path={ROUTES.ANALYTICS} element={<AnalyticsDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {/* Chat Sidebar - Fixed overlay */}
        <ChatSidebar />
      </div>
    </BrowserRouter>
  </AppProviders>
);

export default App;
