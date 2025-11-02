import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Scatter,
} from "recharts";
import { DollarSign, Package } from "lucide-react";
import { uiColors } from "@/theme/theme";

interface HistoricalProgressChartProps {
  historicalPeriods: (string | number)[];
  historicalSales: number[];
  historicalQuantities: number[];
  salesAvgForecast: number;
  qtyAvgForecast: number;
  nextPeriod: string | number;
  
  // Optional: Show all model forecasts
  modelForecasts?: {
    sales_sma?: number;
    sales_es?: number;
    sales_lr?: number;
    sales_xgb?: number;
    qty_sma?: number;
    qty_es?: number;
    qty_lr?: number;
    qty_xgb?: number;
  };
}

const HistoricalProgressChart: React.FC<HistoricalProgressChartProps> = ({
  historicalPeriods,
  historicalSales,
  historicalQuantities,
  salesAvgForecast,
  qtyAvgForecast,
  nextPeriod,
  modelForecasts,
}) => {
  const chartData = useMemo(() => {
    // Historical data points
    const historical = historicalPeriods.map((period, idx) => ({
      period: String(period),
      sales: historicalSales[idx] || 0,
      quantity: historicalQuantities[idx] || 0,
      isForecast: false,
    }));

    // Forecast points (average of all models)
    const forecast = {
      period: String(nextPeriod),
      salesForecast: salesAvgForecast,
      qtyForecast: qtyAvgForecast,
      isForecast: true,
      
      // Individual model forecasts for scatter plot
      ...(modelForecasts && {
        sales_sma_point: modelForecasts.sales_sma,
        sales_es_point: modelForecasts.sales_es,
        sales_lr_point: modelForecasts.sales_lr,
        sales_xgb_point: modelForecasts.sales_xgb,
        qty_sma_point: modelForecasts.qty_sma,
        qty_es_point: modelForecasts.qty_es,
        qty_lr_point: modelForecasts.qty_lr,
        qty_xgb_point: modelForecasts.qty_xgb,
      }),
    };

    return [...historical, forecast];
  }, [historicalPeriods, historicalSales, historicalQuantities, salesAvgForecast, qtyAvgForecast, nextPeriod, modelForecasts]);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value.toFixed(0)}`;
  };

  // Format quantity
  const formatQuantity = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return `${Math.round(value)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const isForecastPoint = payload[0]?.payload?.isForecast;

    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-2">
          {label} {isForecastPoint && <span className="text-muted-foreground">(Forecast)</span>}
        </p>
        {payload.map((entry: any, index: number) => {
          if (!entry.value) return null;
          
          const isSales = entry.dataKey.includes('sales') || entry.name.includes('Sales');
          const isQty = entry.dataKey.includes('qty') || entry.dataKey.includes('quantity') || entry.name.includes('Quantity');
          
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold">
                {isSales ? formatCurrency(entry.value) : isQty ? `${formatQuantity(entry.value)} units` : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
          
          {/* X-Axis */}
          <XAxis 
            dataKey="period" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          
          {/* Left Y-Axis: Sales (€) */}
          <YAxis 
            yAxisId="sales"
            orientation="left"
            stroke={uiColors.trendUp}
            tickFormatter={formatCurrency}
            style={{ fontSize: '11px' }}
            label={{ value: 'Sales (€)', angle: -90, position: 'insideLeft', style: { fill: uiColors.trendUp } }}
          />
          
          {/* Right Y-Axis: Quantities (units) */}
          <YAxis 
            yAxisId="quantity"
            orientation="right"
            stroke={uiColors.secondary}
            tickFormatter={formatQuantity}
            style={{ fontSize: '11px' }}
            label={{ value: 'Quantity (units)', angle: 90, position: 'insideRight', style: { fill: uiColors.secondary } }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          
          {/* Historical Sales Line */}
          <Line
            yAxisId="sales"
            type="monotone"
            dataKey="sales"
            name="Historical Sales"
            stroke={uiColors.trendUp}
            strokeWidth={2.5}
            dot={{ r: 4, fill: uiColors.trendUp }}
            activeDot={{ r: 6 }}
            connectNulls
          />
          
          {/* Historical Quantities Line */}
          <Line
            yAxisId="quantity"
            type="monotone"
            dataKey="quantity"
            name="Historical Quantity"
            stroke={uiColors.secondary}
            strokeWidth={2.5}
            dot={{ r: 4, fill: uiColors.secondary }}
            activeDot={{ r: 6 }}
            connectNulls
          />
          
          {/* Forecast Sales Line (Dashed) */}
          <Line
            yAxisId="sales"
            type="monotone"
            dataKey="salesForecast"
            name="Sales Forecast (Avg)"
            stroke={uiColors.trendUp}
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={{ r: 6, fill: uiColors.trendUp, strokeWidth: 2, stroke: '#fff' }}
            connectNulls
          />
          
          {/* Forecast Quantities Line (Dashed) */}
          <Line
            yAxisId="quantity"
            type="monotone"
            dataKey="qtyForecast"
            name="Quantity Forecast (Avg)"
            stroke={uiColors.secondary}
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={{ r: 6, fill: uiColors.secondary, strokeWidth: 2, stroke: '#fff' }}
            connectNulls
          />
          
          {/* Individual Model Forecasts as Scatter Points (Optional) */}
          {modelForecasts && (
            <>
              <Scatter
                yAxisId="sales"
                dataKey="sales_sma_point"
                name="SMA"
                fill="#8884d8"
                shape="circle"
              />
              <Scatter
                yAxisId="sales"
                dataKey="sales_es_point"
                name="ES"
                fill="#82ca9d"
                shape="triangle"
              />
              <Scatter
                yAxisId="sales"
                dataKey="sales_lr_point"
                name="LR"
                fill="#ffc658"
                shape="square"
              />
              <Scatter
                yAxisId="sales"
                dataKey="sales_xgb_point"
                name="XGB"
                fill="#ff7c7c"
                shape="diamond"
              />
            </>
          )}
          
          {/* Reference line at y=0 */}
          <ReferenceLine yAxisId="sales" y={0} stroke="#e5e7eb" strokeDasharray="3 3" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoricalProgressChart;
