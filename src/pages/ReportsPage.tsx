import { useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid } from "recharts";
import { useUIStore } from "@/store/uiStore";
import Spinner from "@/components/ui/shadcn-io/spinner";

export const ReportsPage = () => {
  const { summary, fetchSummary, isFetchingSummary, sessionId } = useUIStore();

  useEffect(() => {
    if (sessionId) {
      fetchSummary();
    }
  }, [sessionId]);

  // derive trend distribution
  const counts = { Growth: 0, Stable: 0, Decline: 0 };
  const scatterData: { forecast: number; trend: number }[] = [];
  (summary || []).forEach((r) => {
    const label = (r as any).trendLabel ?? (r as any).trend_label ?? ((r as any).trendPct > 5 ? "Growth" : (r as any).trendPct < -5 ? "Decline" : "Stable");
    counts[label as keyof typeof counts] = (counts[label as keyof typeof counts] || 0) + 1;
    scatterData.push({ forecast: Number((r as any).avgForecast ?? (r as any).avg_forecast ?? 0), trend: Number((r as any).trendPct ?? (r as any).trend_pct ?? 0) });
  });

  const trendData = [
    { name: "Growth", value: counts.Growth, color: "hsl(var(--primary))" },
    { name: "Stable", value: counts.Stable, color: "hsl(var(--muted))" },
    { name: "Decline", value: counts.Decline, color: "hsl(var(--destructive))" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 sm:space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-2">Summary & Reports</h1>
  <p className="text-gray-500 text-xs sm:text-sm">
          Visual insights from all forecasted articles
        </p>
      </motion.div>

      {/* Trend Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-elevated rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10"
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Trend Distribution</h2>
        {isFetchingSummary ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="text-primary" size={48} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={420} className="sm:h-[480px]">
            <PieChart>
              <Pie
                data={trendData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={140}
                fill="#8884d8"
                dataKey="value"
              >
                {trendData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "13px" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Forecast vs Trend Scatter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-elevated rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10"
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Forecast vs Trend Analysis</h2>
        {isFetchingSummary ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="text-primary" size={48} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={420} className="sm:h-[480px]">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="forecast"
                name="Forecast"
                stroke="hsl(var(--muted-foreground))"
                label={{ value: "Forecast (DT)", position: "bottom", style: { fontSize: "12px" } }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="trend"
                name="Trend %"
                stroke="hsl(var(--muted-foreground))"
                label={{ value: "Trend %", angle: -90, position: "left", style: { fontSize: "12px" } }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Scatter data={scatterData} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  );
};
