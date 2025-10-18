import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Package, BarChart3, PieChart, Target, AlertCircle } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart as RPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

interface MetricsDashboardProps {
  summary: {
    total_products?: number;
    avg_forecast?: number;
    total_forecast?: number;
    trend_distribution?: {
      uptrend?: number;
      downtrend?: number;
      stable?: number;
    };
    top_products?: Array<{
      ref_article: string;
      designation: string;
      avg_forecast: number;
    }>;
    bottom_products?: Array<{
      ref_article: string;
      designation: string;
      avg_forecast: number;
    }>;
    by_family?: Record<string, number>;
    by_brand?: Record<string, number>;
  };
  frequency: string;
}

const COLORS = {
  uptrend: "#22c55e",
  downtrend: "#ef4444",
  stable: "#eab308",
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  tertiary: "#ec4899",
};

const ForecastMetricsDashboard: React.FC<MetricsDashboardProps> = ({ summary, frequency }) => {
  // Prepare trend distribution data - filter out zero values and ensure unique keys
  const trendData = React.useMemo(() => [
    { id: "uptrend", name: "Uptrend", value: summary.trend_distribution?.uptrend || 0, color: COLORS.uptrend },
    { id: "stable", name: "Stable", value: summary.trend_distribution?.stable || 0, color: COLORS.stable },
    { id: "downtrend", name: "Downtrend", value: summary.trend_distribution?.downtrend || 0, color: COLORS.downtrend },
  ].filter(item => item.value > 0), [summary]);

  // Prepare top products data - ensure valid data with unique keys
  const topProductsData = React.useMemo(() => {
    try {
      return (summary.top_products || [])
        .slice(0, 5)
        .filter(p => p && p.designation && typeof p.avg_forecast === 'number' && p.avg_forecast > 0)
        .map((p, idx) => ({
          id: `${p.ref_article || 'unknown'}-${idx}`,
          name: String(p.designation).length > 25 
            ? String(p.designation).substring(0, 25) + "..." 
            : String(p.designation),
          value: Math.max(0, Math.round(Number(p.avg_forecast))),
          ref: String(p.ref_article || 'N/A'),
        }));
    } catch (error) {
      console.error('Error processing top products data:', error);
      return [];
    }
  }, [summary]);

  // Calculate metrics with proper fallbacks
  const totalProducts = Math.max(summary.total_products || 0, 0);
  const avgForecast = Math.max(summary.avg_forecast || 0, 0);
  const totalForecast = Math.max(summary.total_forecast || 0, 0);
  const uptrendCount = Math.max(summary.trend_distribution?.uptrend || 0, 0);
  const downtrendCount = Math.max(summary.trend_distribution?.downtrend || 0, 0);
  const stableCount = Math.max(summary.trend_distribution?.stable || 0, 0);

  const uptrendPct = totalProducts > 0 ? (uptrendCount / totalProducts) * 100 : 0;
  const downtrendPct = totalProducts > 0 ? (downtrendCount / totalProducts) * 100 : 0;
  
  // Validate data before rendering
  if (totalProducts === 0 && trendData.length === 0 && topProductsData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No metrics data available. Please ensure forecast has completed successfully.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Metric Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Analyzed for {frequency} forecast
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Forecast</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgForecast.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Per product {frequency === "monthly" ? "per month" : "per year"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Growth Products</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{uptrendCount}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {uptrendPct.toFixed(1)}% showing uptrend
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Declining Products</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{downtrendCount}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {downtrendPct.toFixed(1)}% showing downtrend
          </div>
        </CardContent>
      </Card>

      {/* Trend Distribution Pie Chart */}
      <Card className="col-span-full md:col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Trend Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie
                    data={trendData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {trendData.map((entry) => (
                      <Cell key={`cell-${entry.id}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performers Bar Chart */}
      <Card className="col-span-full md:col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Top 5 Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProductsData.length > 0 ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={topProductsData} 
                  layout="horizontal" 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150} 
                    tick={{ fontSize: 11 }} 
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length && payload[0].payload) {
                        return (
                          <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-md">
                            <div className="text-xs font-semibold">{payload[0].payload.ref}</div>
                            <div className="text-xs text-muted-foreground">
                              {Number(payload[0].value).toLocaleString()}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill={COLORS.primary} 
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No product data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForecastMetricsDashboard;
