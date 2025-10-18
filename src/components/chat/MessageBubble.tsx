import React from "react";
import { motion } from "framer-motion";
import { Copy } from "lucide-react";

type Props = {
  role: "user" | "assistant";
  text: string;
  time?: string;
  isCode?: boolean;
  onCopy?: (text: string) => void;
};

export const MessageBubble: React.FC<Props> = ({ role, text, time, isCode, onCopy }) => {
  const isUser = role === "user";

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
