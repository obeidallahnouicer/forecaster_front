import { motion } from "framer-motion";
import { TrendingUp, Settings as SettingsIcon, BarChart2, LineChart, MessageCircle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";

export const CinematicHeader = () => {
  const location = useLocation();
  
  // Determine if a route is active
  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart2 },
    { path: "/forecasts", label: "Forecasts", icon: LineChart },
    { path: "/chat", label: "Chat", icon: MessageCircle },
  ];
  
  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 overflow-hidden border-b border-border/40 bg-card/95 backdrop-blur-md"
      >
        {/* subtle full-width overlay — lower opacity, no shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 opacity-30 pointer-events-none" />
      
        <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1"
            >
              <Link to="/" className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary glow-primary flex-shrink-0 hover:opacity-90 transition-opacity">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </Link>
              
              <Link to="/" className="min-w-0 flex-1 hover:opacity-90 transition-opacity">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text truncate">
                  Sales Forecaster
                </h1>
                <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                  Enterprise ML Forecasting Platform
                </p>
              </Link>
            </motion.div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Main Navigation */}
              <nav className="hidden sm:flex items-center gap-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link 
                    key={path}
                    to={path}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                      isActive(path)
                        ? 'bg-primary/20 text-primary' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>

              {/* Settings button */}
              <Link
                to="/settings"
                className={`flex items-center p-2 rounded-lg transition-all ${
                  isActive('/settings')
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title="Settings"
              >
                <SettingsIcon className="w-5 h-5" />
              </Link>

              {/* Sidebar trigger */}
              <SidebarTrigger />
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
};
