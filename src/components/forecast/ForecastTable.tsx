import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSalesForecast, getSalesTrend } from "@/utils/forecastHelpers";

interface ForecastTableProps {
  items: Array<{ 
    ref_article: string; 
    designation: string; 
    avg_forecast?: number;
    sales_avg_forecast?: number;
    trend_pct?: number;
    sales_trend_pct?: number;
  }>;
  onRowClick?: (item: any) => void;
}

export const ForecastTable: React.FC<ForecastTableProps> = ({ items, onRowClick }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ref</TableHead>
          <TableHead>Designation</TableHead>
          <TableHead>Forecast</TableHead>
          <TableHead>Trend</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it) => {
          const forecast = getSalesForecast(it);
          const trend = getSalesTrend(it);
          
          return (
            <TableRow key={it.ref_article} onClick={() => onRowClick && onRowClick(it)} className="cursor-pointer">
              <TableCell className="font-mono text-xs">{it.ref_article}</TableCell>
              <TableCell>{it.designation}</TableCell>
              <TableCell>{forecast.toLocaleString()}</TableCell>
              <TableCell>{trend.toFixed(1)}%</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ForecastTable;
