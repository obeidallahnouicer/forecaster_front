import React, { useMemo } from "react";

type Props = { 
  data?: any; 
  loading?: boolean; 
  refresh?: () => void;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
};

const DocumentsTable: React.FC<Props> = ({ 
  data, 
  loading, 
  refresh,
  page = 1,
  limit = 10,
  onPageChange,
  onLimitChange
}) => {

  const docs = (data?.documents ?? []) as Record<string, any>[];
  const filteredCount = data?.filtered_docs ?? docs.length;
  const totalDocs = data?.total_docs ?? docs.length;

  const pageCount = Math.max(1, Math.ceil((filteredCount || docs.length) / limit));

  // No local slicing needed - data is already paginated from server
  const visible = useMemo(() => {
    return docs;
  }, [docs, limit, page]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
  <div className="text-sm text-gray-600">Showing {visible.length} of {filteredCount ?? docs.length} results</div>
        <div className="flex items-center gap-2">
          <select className="input" value={limit} onChange={(e) => onLimitChange?.(Number(e.target.value))}>
            {[10,20,50,100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="btn" onClick={() => refresh && refresh()}>Refresh</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-900/50">
              <th className="px-2 py-2 text-left text-gray-300">Ref</th>
              <th className="px-2 py-2 text-left text-gray-300">Designation</th>
              <th className="px-2 py-2 text-left text-gray-300">Marque</th>
              <th className="px-2 py-2 text-left text-gray-300">Famille</th>
              <th className="px-2 py-2 text-right text-gray-300">Avg Forecast</th>
              <th className="px-2 py-2 text-right text-gray-300">Trend %</th>
              <th className="px-2 py-2 text-right text-gray-300">Data Points</th>
              <th className="px-2 py-2 text-right text-gray-300">Next Year</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900/20">
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500">Loading…</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500">No results</td></tr>
            ) : (
              visible.map((r: any, i: number) => {
                const trend = Number(r.trend_pct ?? r.trendPct ?? 0);
                return (
                  <tr key={r.ref_article ?? r.ref} className={`${i % 2 === 0 ? 'bg-gray-900/20' : 'bg-gray-900/10'} border-b border-gray-800`}> 
                    <td className="px-2 py-2 max-w-[120px] truncate text-gray-300" title={String(r.ref_article ?? r.ref)}>{r.ref_article ?? r.ref}</td>
                    <td className="px-2 py-2 max-w-[420px] truncate text-gray-300" title={String(r.designation)}>{r.designation}</td>
                    <td className="px-2 py-2 text-gray-300">{r.marque}</td>
                    <td className="px-2 py-2 text-gray-300">{r.famille}</td>
                    <td className="px-2 py-2 text-right font-medium text-gray-100">{Number(r.avg_forecast ?? r.avgForecast ?? r.avg ?? 0).toLocaleString()}</td>
                    <td className={`px-2 py-2 text-right font-medium ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>{trend.toFixed(1)}%</td>
                    <td className="px-2 py-2 text-right text-gray-300">{r.data_points ?? r.dataPoints ?? 0}</td>
                    <td className="px-2 py-2 text-right text-gray-300">{r.next_year ?? r.nextYear}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
  <div className="text-sm text-gray-600">Page {page} of {pageCount}</div>
        <div className="flex items-center gap-2">
          <button className="btn" disabled={page <= 1} onClick={() => onPageChange?.(Math.max(1, page - 1))}>Previous</button>
          <button className="btn" disabled={page >= pageCount} onClick={() => onPageChange?.(Math.min(pageCount, page + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentsTable;
