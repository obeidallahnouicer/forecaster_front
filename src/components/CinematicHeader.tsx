import { motion } from "framer-motion";
import { TrendingUp, Settings as SettingsIcon, MessageSquare } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const CinematicHeader = () => {
  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 overflow-hidden border-b border-border/40 bg-card/95 backdrop-blur-md"
      >
        {/* subtle full-width overlay — lower opacity, no shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 opacity-30 pointer-events-none" />
      
        <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1"
            >
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary glow-primary flex-shrink-0">
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text truncate">
                  Sales Forecaster
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                  Cinematic Intelligence • Production-Ready Architecture
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden lg:flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 hover:bg-card-glow transition-colors"
              >
                <SettingsIcon className="h-4 w-4" />
                <span className="font-medium text-sm">Settings</span>
              </motion.button>
              <SidebarTrigger />
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
};
