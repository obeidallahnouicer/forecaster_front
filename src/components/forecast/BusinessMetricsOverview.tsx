import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  ShoppingCart,
  BarChart3,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

interface MetricsData {
  total_rows: number;
  sales_avg_forecast: number;
  qty_avg_forecast: number;
  avg_data_points: number;
  sales_trend_avg: number;
  qty_trend_avg: number;
}

interface BusinessMetricsOverviewProps {
  metrics: MetricsData;
}

const BusinessMetricsOverview: React.FC<BusinessMetricsOverviewProps> = ({ metrics }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0
    }).format(num);
  };

  const kpis = [
    {
      title: "Total Products",
      value: metrics.total_rows,
      format: "number",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Active SKUs",
    },
    {
      title: "Avg Sales Forecast",
      value: metrics.sales_avg_forecast,
      format: "currency",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Per product",
      trend: metrics.sales_trend_avg,
    },
    {
      title: "Avg Qty Forecast",
      value: metrics.qty_avg_forecast,
      format: "number",
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Units per product",
      trend: metrics.qty_trend_avg,
    },
    {
      title: "Avg Data Points",
      value: metrics.avg_data_points,
      format: "decimal",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Historical periods",
    },
    {
      title: "Sales Trend",
      value: metrics.sales_trend_avg,
      format: "currency",
      icon: Activity,
      color: metrics.sales_trend_avg >= 0 ? "text-green-600" : "text-red-600",
      bgColor: metrics.sales_trend_avg >= 0 ? "bg-green-50" : "bg-red-50",
      description: "Average growth",
      isTrend: true,
    },
    {
      title: "Qty Trend",
      value: metrics.qty_trend_avg,
      format: "number",
      icon: Activity,
      color: metrics.qty_trend_avg >= 0 ? "text-green-600" : "text-red-600",
      bgColor: metrics.qty_trend_avg >= 0 ? "bg-green-50" : "bg-red-50",
      description: "Average growth",
      isTrend: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        let displayValue = "";
        
        if (kpi.format === "currency") {
          displayValue = formatCurrency(kpi.value);
        } else if (kpi.format === "decimal") {
          displayValue = kpi.value.toFixed(2);
        } else {
          displayValue = formatNumber(kpi.value);
        }

        return (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                  {kpi.trend !== undefined && !kpi.isTrend && (
                    <Badge 
                      variant={kpi.trend >= 0 ? "default" : "destructive"}
                      className="flex items-center gap-1"
                    >
                      {kpi.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(kpi.trend).toFixed(0)}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className={`text-2xl font-bold ${kpi.color}`}>
                    {displayValue}
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default BusinessMetricsOverview;
