import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getMetrics, getDocuments } from "@/infrastructure/forecastApi";
import KPI from "@/components/KPI";
import DocumentsTable from "@/components/DocumentsTable";

// --- Types ---
type StatusResponse = { csv_exists?: boolean; csv_path?: string; total_rows?: number; columns?: string[] };

type MetricArticle = {
  ref_article?: string;
  designation?: string;
  avg_forecast?: number;
  trend_label?: string;
  trend_pct?: number;
  data_points?: number;
};

type TopMarque = { marque?: string; total_avg_forecast?: number; count?: number };
type TopFamille = { famille?: string; total_avg_forecast?: number; count?: number };

type TrendLeader = { ref_article?: string; designation?: string; trend_pct?: number };

type MetricsResponse = {
  total_rows?: number;
  total_avg_forecast?: number;
  overall_trend?: string;
  avg_data_points?: number;
  trend_counts?: Record<string, number>;
  top_articles?: MetricArticle[];
  top_marques?: TopMarque[];
  top_familles?: TopFamille[];
  products_by_famille?: Record<string, string[]>;
  products_by_marque?: Record<string, string[]>;
  top_trend_pct_articles?: TrendLeader[];
};

type DocumentsResponse = { total_docs?: number; filtered_docs?: number; limit?: number; offset?: number; documents?: Record<string, unknown>[] };

type Filters = { marque?: string; famille?: string; trend_label?: string };

const UP = "Uptrend";
const DOWN = "Downtrend";
const STABLE = "Stable";

const COLORS = { Uptrend: "#10B981", Downtrend: "#EF4444", Stable: "#6B7280" };

export const AnalyticsDashboard: React.FC = () => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [documents, setDocuments] = useState<DocumentsResponse | null>(null);
  const [filters, setFilters] = useState<Filters>({ marque: "", famille: "", trend_label: "" });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [docsPage, setDocsPage] = useState(1);
  const [docsLimit, setDocsLimit] = useState(10);

  // Ensure numeric values for charts (Recharts needs numbers, sometimes API returns strings)
  const marquesData = useMemo(() => {
    return (metrics?.top_marques || []).map((m) => {
      // support multiple possible backend keys and formatted strings
  const raw = (m as any).total_avg_forecast ?? (m as any).mean_avg_forecast ?? (m as any).total ?? (m as any).value ?? (m as any).avg_forecast ?? 0;
      const num = typeof raw === "string" ? Number(String(raw).replace(/[^0-9.-]+/g, "")) : Number(raw || 0);
      return {
        ...m,
        total_avg_forecast: num,
        value: num,
      };
    });
  }, [metrics?.top_marques]);

  const famillesData = useMemo(() => {
    return (metrics?.top_familles || []).map((f) => {
  const raw = (f as any).total_avg_forecast ?? (f as any).mean_avg_forecast ?? (f as any).total ?? (f as any).value ?? (f as any).avg_forecast ?? 0;
      const num = typeof raw === "string" ? Number(String(raw).replace(/[^0-9.-]+/g, "")) : Number(raw || 0);
      return {
        ...f,
        total_avg_forecast: num,
        value: num,
      };
    });
  }, [metrics?.top_familles]);

  const topProductsData = useMemo(() => {
    if (!metrics?.top_articles) return [];
    const formatted = metrics.top_articles.slice(0, 10).map((a: MetricArticle) => {
      // Parse numeric value from various possible formats
      let numValue = 0;
      const raw = a.avg_forecast ?? 0;
      
      if (typeof raw === 'string') {
        // Remove any non-numeric characters except decimal point and minus sign
        numValue = parseFloat((raw as string).replace(/[^0-9.-]/g, '')) || 0;
      } else {
        numValue = Number(raw) || 0;
      }
      
      return {
        ...a,
        avg_forecast: Math.max(0, numValue),
        designation: a.designation || `Product ${a.ref_article}`,
        trend_label: a.trend_label || STABLE,
      };
    });
    
    return formatted;
  }, [metrics?.top_articles]);

  const trendData = useMemo(() => {
    if (!metrics || !metrics.trend_counts) return [];
    return Object.entries(metrics.trend_counts).map(([k, v]) => ({ name: k, value: Number(v) }));
  }, [metrics]);

  const fetchAll = async (page = 1, limit = 10) => {
    setLoadingMetrics(true);
    setLoadingDocs(true);
    try {
      const m = await getMetrics(filters);
      setMetrics(m);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMetrics(false);
    }

    try {
      const offset = (page - 1) * limit;
      const docs = await getDocuments({ ...filters, limit, offset, sort_by: "avg_forecast", sort_order: "desc" });
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug logging for data flow
  useEffect(() => {
    if (metrics?.top_articles) {
    }
  }, [metrics?.top_articles, topProductsData]);

  // Debounce filters - reset to page 1 when filters change
  useEffect(() => {
    setDocsPage(1);
    const id = setTimeout(() => fetchAll(1, docsLimit), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.marque, filters.famille, filters.trend_label]);

  // Fetch when page changes
  useEffect(() => {
    fetchAll(docsPage, docsLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docsPage, docsLimit]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sales Forecast Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Interactive analytics for forecast results</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${status?.csv_exists ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {status?.csv_exists ? "CSV Present" : "CSV Missing"}
          </div>
          <div className="text-sm text-gray-500">{lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : "Not refreshed"}</div>
          <button className="btn btn-secondary" onClick={() => fetchAll()} aria-label="Refresh">Refresh</button>
        </div>
      </header>

      {/* KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Total Forecast" value={metrics?.total_avg_forecast} loading={loadingMetrics} format="currency" />
        <KPI title="Overall Trend" value={metrics?.overall_trend} loading={loadingMetrics} colorize />
        <KPI title="Total Products" value={metrics?.total_rows} loading={loadingMetrics} subtitle="in dataset" />
        <KPI title="Avg Data Points" value={metrics?.avg_data_points} loading={loadingMetrics} subtitle="historical records per product" decimals={1} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-card p-4 rounded-lg flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Top Products (by Forecast)</h3>
          <div className="flex-1" style={{ minHeight: 420, width: '100%' }}>
            {topProductsData && topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={topProductsData} 
                  margin={{ left: 0, right: 0, top: 5, bottom: 5 }}
                  key={`chart-${topProductsData.length}`}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    stroke="#6B7280" 
                    tick={{ fill: '#D1D5DB', fontSize: 11 }} 
                    tickFormatter={(v) => {
                      if (v >= 1000000) return (v / 1000000).toFixed(0) + 'M';
                      if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
                      return v.toFixed(0);
                    }}
                  />
                  <YAxis
                    dataKey="designation"
                    type="category"
                    width={240}
                    tick={{ fill: '#F3F4F6', fontSize: 11 }}
                    interval={0}
                    tickFormatter={(v: any) => {
                      const s = String(v ?? "");
                      return s.length > 35 ? s.slice(0, 35) + "…" : s;
                    }}
                  />
                  <ReTooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '4px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    formatter={(value: any) => [new Intl.NumberFormat().format(Math.round(Number(value))), 'Forecast Value']} 
                  />
                  <Bar dataKey="avg_forecast" barSize={22} radius={[0, 4, 4, 0]} isAnimationActive={false} fill="#3B82F6">
                    {topProductsData.map((row: MetricArticle, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[row.trend_label ?? STABLE] || "#60A5FA"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">No data available</div>
            )}
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Trend Distribution</h3>
          <div className="flex-1" style={{ minHeight: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ReTooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '4px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Pie data={trendData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {trendData.map((entry: { name: string; value: number }) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || "#CBD5E1"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-card p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <select className="input" value={filters.marque} onChange={(e) => setFilters((p) => ({ ...p, marque: e.target.value }))}>
            <option value="">All Marques</option>
            {metrics && metrics.products_by_marque && Object.keys(metrics.products_by_marque).map((m: string) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input" value={filters.famille} onChange={(e) => setFilters((p) => ({ ...p, famille: e.target.value }))}>
            <option value="">All Familles</option>
            {metrics && metrics.products_by_famille && Object.keys(metrics.products_by_famille).map((f: string) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select className="input" value={filters.trend_label} onChange={(e) => setFilters((p) => ({ ...p, trend_label: e.target.value }))}>
            <option value="">All Trends</option>
            <option value={UP}>Uptrend</option>
            <option value={DOWN}>Downtrend</option>
            <option value={STABLE}>Stable</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn" onClick={() => setFilters({ marque: "", famille: "", trend_label: "" })}>Clear Filters</button>
            <div className="text-sm text-gray-500">Active: {Object.values(filters).filter(Boolean).length}</div>
          </div>
        </div>
      </section>

      {/* Charts row: marques, familles, leaderboard */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card p-4 rounded-lg flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Top Marques</h3>
          <div className="flex-1" style={{ minHeight: 220 }}>
            {marquesData && marquesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marquesData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                  <XAxis dataKey="marque" stroke="#6B7280" tick={{ fill: '#D1D5DB', fontSize: 11 }} />
                  <YAxis stroke="#6B7280" tick={{ fill: '#D1D5DB', fontSize: 11 }} domain={[0, (dataMax: number) => Math.max(1, dataMax)]} tickFormatter={(v) => new Intl.NumberFormat().format(Number(v))} />
                  <ReTooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '4px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    formatter={(value: any) => new Intl.NumberFormat().format(Number(value))} 
                  />
                  <Bar dataKey="value" fill="#3B82F6">
                    {marquesData.map((row: any) => (
                      <Cell key={row.marque} fill={COLORS[row.trend_label ?? STABLE] || "#60A5FA"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">No data</div>
            )}
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Top Familles</h3>
          <div className="flex-1" style={{ minHeight: 220 }}>
            {famillesData && famillesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={famillesData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                  <XAxis dataKey="famille" stroke="#6B7280" tick={{ fill: '#D1D5DB', fontSize: 11 }} />
                  <YAxis stroke="#6B7280" tick={{ fill: '#D1D5DB', fontSize: 11 }} domain={[0, (dataMax: number) => Math.max(1, dataMax)]} tickFormatter={(v) => new Intl.NumberFormat().format(Number(v))} />
                  <ReTooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '4px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    formatter={(value: any) => new Intl.NumberFormat().format(Number(value))} 
                  />
                  <Bar dataKey="value" fill="#3B82F6">
                    {famillesData.map((row: any) => (
                      <Cell key={row.famille} fill={COLORS[row.trend_label ?? STABLE] || "#60A5FA"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">No data</div>
            )}
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Momentum Leaders</h3>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {metrics?.top_trend_pct_articles && metrics.top_trend_pct_articles.length > 0 ? (
              metrics.top_trend_pct_articles.map((a: TrendLeader, i: number) => (
                <div key={a.ref_article} className="flex items-center justify-between px-2 py-2 rounded hover:bg-muted/30 cursor-pointer text-sm">
                  <span className="text-gray-300 font-medium truncate flex-1">{i + 1}. {a.designation}</span>
                  <span className={`text-sm font-semibold ml-2 ${(a.trend_pct ?? 0) > 0 ? "text-green-400" : "text-red-400"}`}>{Number(a.trend_pct ?? 0).toFixed(1)}%</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">No data</div>
            )}
          </div>
        </div>
      </section>

      {/* Documents table */}
      <section className="bg-card p-4 rounded-lg">
        <DocumentsTable 
          data={documents} 
          loading={loadingDocs} 
          refresh={() => fetchAll(docsPage, docsLimit)}
          page={docsPage}
          limit={docsLimit}
          onPageChange={setDocsPage}
          onLimitChange={setDocsLimit}
        />
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
