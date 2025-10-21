import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ForecastChartProps {
  data: Array<{ period: string; value: number; isForecast?: boolean }>;
  height?: number;
  frequency?: string;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ data, height = 300, frequency = "monthly" }) => {
  const isUptrend = (data[data.length - 1]?.value ?? 0) >= (data[0]?.value ?? 0);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="period" />
          <YAxis tickFormatter={(v) => v.toLocaleString()} />
          <Tooltip />
          <CartesianGrid strokeDasharray="3 3" />
          <Line type="monotone" dataKey="value" stroke={isUptrend ? "#22c55e" : "#ef4444"} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
