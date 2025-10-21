import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ForecastTableProps {
  items: Array<{ ref_article: string; designation: string; avg_forecast: number; trend_pct: number }>;
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
        {items.map((it) => (
          <TableRow key={it.ref_article} onClick={() => onRowClick && onRowClick(it)} className="cursor-pointer">
            <TableCell className="font-mono text-xs">{it.ref_article}</TableCell>
            <TableCell>{it.designation}</TableCell>
            <TableCell>{it.avg_forecast?.toLocaleString()}</TableCell>
            <TableCell>{it.trend_pct?.toFixed(1)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ForecastTable;
