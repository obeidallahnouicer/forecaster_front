import React from "react";

export const RawPreview: React.FC<{ data: any; title?: string }> = ({ data, title }) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 overflow-auto max-h-96">
      {title && <h3 className="mb-2 font-semibold">{title}</h3>}
      <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default RawPreview;
