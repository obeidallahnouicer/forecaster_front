import React from "react";
import SQLCard from "@/components/ui/SQLCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Copy } from "lucide-react";

type Props = {
  role: "user" | "assistant";
  text: string;
  time?: string;
  isCode?: boolean;
  onCopy?: (text: string) => void;
  raw?: any;
};

function extractSqlFromText(t: string) {
  // naive extraction: find first occurrence of SELECT ... until a trailing semicolon or end
  const match = t.match(/(select[\s\S]*?;)/i);
  if (match && match[1]) return match[1].trim();
  // also allow multi-line SQL blocks without trailing semicolon
  const block = t.match(/\n\s*(select[\s\S]*)/i);
  if (block && block[1]) return block[1].trim();
  return null;
}

export const MessageBubble: React.FC<Props> = ({ role, text, time, isCode, onCopy, raw }) => {
  const isUser = role === "user";
  const [previewOpen, setPreviewOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[88%] break-words p-3 rounded-2xl shadow-sm ${
          isUser
            ? "bg-gradient-to-r from-[rgba(255,236,179,0.12)] to-[rgba(255,243,199,0.06)] text-primary-foreground border border-primary/10"
            : "bg-card p-3 border border-border text-card-foreground"
        }`}
        aria-live="polite"
      >
        <div className="prose prose-sm max-w-none text-sm text-foreground">
          {isCode ? (
            <pre className="bg-[rgba(0,0,0,0.12)] p-3 rounded-md overflow-auto text-xs font-mono">{text}</pre>
          ) : (
            <div>{text}</div>
          )}

          {/* If the assistant included SQL in the text or provided a raw payload, render SQLCard */}
          {role === "assistant" && (
            <>
              {raw && raw.rows_preview && Array.isArray(raw.rows_preview) && raw.rows_preview.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>
                    Preview rows ({Math.min(raw.rows_preview.length, 10)})
                  </Button>
                </div>
              )}

              {raw && (raw.sql || raw.rows_preview) ? (
                <div className="mt-2">
                  <SQLCard sql={raw.sql || text} />
                </div>
              ) : /select\s+/i.test(text) ? (
                <div className="mt-2">
                  <SQLCard sql={extractSqlFromText(text) || text} />
                </div>
              ) : null}

              {/* Preview dialog */}
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <div />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rows preview</DialogTitle>
                    <DialogDescription className="mt-1">Showing up to 10 preview rows returned by the assistant.</DialogDescription>
                  </DialogHeader>

                  <div className="mt-4 max-h-72 overflow-auto text-sm">
                    {raw && Array.isArray(raw.rows_preview) && raw.rows_preview.length > 0 ? (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr>
                            {Object.keys(raw.rows_preview[0]).map((k: string) => (
                              <th key={k} className="p-1 border">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {raw.rows_preview.slice(0, 10).map((row: any, i: number) => (
                            <tr key={i} className="odd:bg-muted/20">
                              {Object.keys(raw.rows_preview[0]).map((k: string) => (
                                <td key={k} className="p-1 border align-top">{String(row[k])}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-sm text-muted-foreground">No preview rows returned.</div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div>{time ?? "now"}</div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Copy message"
              onClick={() => onCopy?.(text)}
              className="p-1 rounded hover:bg-white/6"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
