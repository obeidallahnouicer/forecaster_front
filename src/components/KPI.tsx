import React from "react";

const formatCurrency = (v: number | undefined | null) => {
  if (v === null || v === undefined) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v as number);
  } catch {
    return String(v);
  }
};

const formatPercent = (v: number | undefined | null) => {
  if (v === null || v === undefined) return "—";
  return `${Number(v).toFixed(1)}%`;
};

type Props = {
  title: string;
  value?: number | string | null;
  loading?: boolean;
  subtitle?: string;
  decimals?: number;
  format?: "currency" | "percent" | "number" | "string";
  trend?: number | null;
  colorize?: boolean;
};

const KPI: React.FC<Props> = ({ title, value, loading, subtitle, decimals = 0, format, trend, colorize }) => {
  const display = (() => {
    if (typeof value === "string") return value;
    if (format === "currency") return formatCurrency(value);
    if (format === "percent") return formatPercent(value);
    if (typeof value === "number") return Number(value).toFixed(decimals);
    return "—";
  })();

  const trendColor = trend == null ? "text-gray-400" : trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-gray-400";

  const textColor = colorize && typeof value === "string" ? 
    (value === "Uptrend" ? "text-green-400" : value === "Downtrend" ? "text-red-400" : "text-gray-400") : 
    "text-white";

  return (
    <div className="card-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm text-gray-400">{title}</div>
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-semibold mt-1 ${textColor}`}>{loading ? <span className="text-gray-500">Loading…</span> : display}</div>
            {trend != null && (
              <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${trend > 0 ? "bg-green-950 text-green-300" : trend < 0 ? "bg-red-950 text-red-300" : "bg-gray-800 text-gray-300"}`}>
                {trend > 0 ? "▲" : trend < 0 ? "▼" : "—"} {Math.abs(Number(trend)).toFixed(1)}%
              </div>
            )}
          </div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>

        <div className="w-12 h-12 flex items-center justify-center">
          <div style={{ width: 6, height: 40, borderRadius: 4 }} className="bg-gradient-to-b from-primary to-secondary" aria-hidden />
        </div>
      </div>
    </div>
  );
};

export default KPI;
