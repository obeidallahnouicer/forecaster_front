import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { uiColors } from '@/theme/theme';
import { cn } from "@/lib/utils";

interface ForecastArticleCardProps {
  article: {
    ref_article: string;
    designation: string;
    marque?: string;
    famille?: string;
    avg_forecast: number;
    trend_pct: number;
    trend_label: string;
    data_points?: number;
    next_period: number;
    frequency: string;
    historical_periods?: string | number[];
    historical_values?: string | number[];
    historical_values_list?: number[];
  };
  onClick?: () => void;
  isSelected?: boolean;
}

const ForecastArticleCard: React.FC<ForecastArticleCardProps> = ({ article, onClick, isSelected }) => {
  // Parse historical data for sparkline with useMemo
  const chartData = useMemo(() => {
    try {
      const periods = typeof article.historical_periods === "string" 
        ? JSON.parse(article.historical_periods) 
        : article.historical_periods || [];
      
      const values = typeof article.historical_values === "string" 
        ? JSON.parse(article.historical_values) 
        : article.historical_values_list || article.historical_values || [];
      
      return periods.map((period: any, idx: number) => ({
        period: String(period),
        value: values[idx] || 0,
      }));
    } catch (error) {
      console.warn("Failed to parse historical data for", article.ref_article, error);
      return [];
    }
  }, [article.historical_periods, article.historical_values, article.historical_values_list, article.ref_article]);

  const trendPct = article.trend_pct || 0;
  const isUptrend = trendPct > 5;
  const isDowntrend = trendPct < -5;
  const isStable = Math.abs(trendPct) <= 5;

  const TrendIcon = isUptrend ? TrendingUp : isDowntrend ? TrendingDown : Minus;
  const trendColor = isUptrend ? "text-green-600" : isDowntrend ? "text-red-600" : "text-yellow-600";
  const trendBgColor = isUptrend ? "bg-green-50 border-green-200" : isDowntrend ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
        isSelected && "ring-2 ring-primary shadow-lg"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate" title={article.designation}>
              {article.designation}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-mono">
                {article.ref_article}
              </Badge>
              {article.marque && (
                <span className="text-xs text-muted-foreground truncate">
                  {article.marque}
                </span>
              )}
            </div>
          </div>
          
          <Badge className={cn("shrink-0", trendBgColor, trendColor)}>
            <TrendIcon className="w-3 h-3 mr-1" />
            {article.trend_label || (isUptrend ? "Growth" : isDowntrend ? "Decline" : "Stable")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Forecast Value */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs text-muted-foreground">
              {article.frequency === "monthly" ? "Avg Monthly Forecast" : "Avg Yearly Forecast"}
            </div>
            <div className="text-2xl font-bold">
              {article.avg_forecast?.toLocaleString(undefined, { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              }) || "N/A"}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Trend</div>
            <div className={cn("text-lg font-semibold flex items-center gap-1", trendColor)}>
              {trendPct > 0 ? <ArrowUpRight className="w-4 h-4" /> : trendPct < 0 ? <ArrowDownRight className="w-4 h-4" /> : null}
              {Math.abs(trendPct).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Sparkline Chart */}
        {chartData.length > 0 && (
          <div className="h-16 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="period" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-md px-2 py-1 shadow-md">
                          <p className="text-xs font-semibold">{data.period}</p>
                          <p className="text-xs text-muted-foreground">
                            {Number(payload[0].value).toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isUptrend ? uiColors.trendUp : isDowntrend ? uiColors.trendDown : uiColors.trendStable}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            <span>{article.data_points || chartData.length || 0} data points</span>
          </div>
          <div>
            Next: {article.next_period}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastArticleCard;
