import React from "react";
import { Button } from "@/components/ui/button";

interface SQLCardProps {
  sql: string;
}

export default function SQLCard({ sql }: SQLCardProps) {
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = sql;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  };

  return (
    <div className="border p-3 rounded-md bg-white shadow-sm">
      <div className="mb-2 text-sm text-muted-foreground break-words">
        <pre className="whitespace-pre-wrap text-xs">{sql}</pre>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCopy}>
          Copy
        </Button>
      </div>
    </div>
  );
}
