import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { uiColors } from '@/theme/theme';

interface ForecastChartProps {
  data: Array<{ period: string; value: number; isForecast?: boolean }>;
  height?: number;
  frequency?: string;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ data, height = 300, frequency = "monthly" }) => {
  const isUptrend = (data[data.length - 1]?.value ?? 0) >= (data[0]?.value ?? 0);
  // use centralized trend colors from theme

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="period" />
          <YAxis tickFormatter={(v) => v.toLocaleString()} />
          <Tooltip />
          <CartesianGrid strokeDasharray="3 3" />
          <Line type="monotone" dataKey="value" stroke={isUptrend ? uiColors.trendUp : uiColors.trendDown} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
