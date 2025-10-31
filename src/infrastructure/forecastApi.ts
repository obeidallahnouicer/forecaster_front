// Lightweight API client for analytics endpoints (/status, /metrics, /documents)
const BASE = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api";

type MetricsFilters = {
  marque?: string | null;
  famille?: string | null;
  trend_label?: string | null;
  next_year?: string | number | null;
};

export async function getMetrics(filters: MetricsFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== "") params.append(k, String(v));
  });
  const res = await fetch(`${BASE}/dashboard/metrics?${params.toString()}`);
  if (!res.ok) throw new Error(`Metrics fetch failed: ${res.status}`);
  return res.json();
}

type DocumentsParams = MetricsFilters & {
  sort_by?: string;
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export async function getDocuments(params: DocumentsParams = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== "") p.append(k, String(v));
  });
  const res = await fetch(`${BASE}/dashboard/documents?${p.toString()}`);
  if (!res.ok) throw new Error(`Documents fetch failed: ${res.status}`);
  return res.json();
}

export default { getMetrics, getDocuments };
