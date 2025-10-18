import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SummaryRow } from "@/domain/types";
import {
  ChevronUp,
  ChevronDown,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SortKey = keyof SummaryRow;
type SortDirection = "asc" | "desc";

interface ForecastTableProps {
  data: SummaryRow[];
  onRowClick?: (row: SummaryRow) => void;
  maxHeight?: string;
  className?: string;
}

export const ForecastTable: React.FC<ForecastTableProps> = ({
  data,
  onRowClick,
  maxHeight = "h-96",
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("designation");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [filteredData, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }

    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Forecast Summary</CardTitle>
            <div className="relative flex-1 min-w-xs max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search forecasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className={`overflow-x-auto ${maxHeight}`}>
            <Table>
              <TableHeader className="sticky top-0 bg-card/95 backdrop-blur">
                <TableRow>
                  <TableHead
                    onClick={() => handleSort("ref")}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Reference
                      <SortIcon column="ref" />
                    </div>
                  </TableHead>

                  <TableHead
                    onClick={() => handleSort("designation")}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Product
                      <SortIcon column="designation" />
                    </div>
                  </TableHead>

                  <TableHead
                    onClick={() => handleSort("marque")}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Brand
                      <SortIcon column="marque" />
                    </div>
                  </TableHead>

                  <TableHead
                    onClick={() => handleSort("avgForecast")}
                    className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Forecast
                      <SortIcon column="avgForecast" />
                    </div>
                  </TableHead>

                  <TableHead
                    onClick={() => handleSort("trendPct")}
                    className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Trend
                      <SortIcon column="trendPct" />
                    </div>
                  </TableHead>

                  <TableHead className="text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchQuery ? "No forecasts match your search" : "No forecasts available"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((row, idx) => (
                    <motion.tr
                      key={row.ref}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        "border-b transition-colors",
                        onRowClick && "cursor-pointer hover:bg-muted/50"
                      )}
                    >
                      <TableCell className="font-mono text-sm">{row.ref}</TableCell>

                      <TableCell className="font-medium max-w-xs truncate">
                        {row.designation}
                      </TableCell>

                      <TableCell className="text-sm">{row.marque}</TableCell>

                      <TableCell className="text-right font-semibold text-primary">
                        ${row.avgForecast.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge
                          variant={
                            row.trendPct > 5
                              ? "default"
                              : row.trendPct < -5
                                ? "destructive"
                                : "secondary"
                          }
                          className="justify-center"
                        >
                          {row.trendPct > 0 ? "+" : ""}
                          {row.trendPct.toFixed(1)}%
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {row.confidence ? (
                          <span className="text-sm font-medium">
                            {row.confidence}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Footer with count */}
        <div className="px-6 py-3 bg-muted/30 border-t border-border text-xs text-muted-foreground">
          Showing {sortedData.length} of {data.length} forecasts
          {searchQuery && ` • Filtered: "${searchQuery}"`}
        </div>
      </Card>
    </motion.div>
  );
};
