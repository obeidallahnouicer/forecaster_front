import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { X } from "lucide-react";
import { apiClient } from "@/infrastructure/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export const ChatSidebar: React.FC = () => {
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();
  const visible = isMobile ? openMobile : open;

  const [threadId, setThreadId] = React.useState<string>(() => "default");
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [loading, setLoading] = React.useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiClient.chatMessage(msg, threadId);
      const answer = res.answer ?? res.result ?? res;
      setMessages((m) => [...m, { role: "assistant", text: String(answer) }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", text: `Error: ${e?.message ?? e}` }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    try {
      await apiClient.resetChatMemory(threadId);
      setMessages([]);
    } catch (e) {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    // Fixed floating panel on the right — overlay on mobile/tablet, doesn't affect layout
    <div className="fixed right-2 sm:right-4 top-20 sm:top-24 bottom-4 z-[60] w-[calc(100vw-1rem)] sm:w-[24rem] md:w-[26rem] max-w-[95vw] bg-card border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border/60 bg-card/50">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium">Assistant</h3>
          <div className="text-xs text-muted-foreground hidden sm:block">Ask something about the dataset or forecasts.</div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={reset} className="h-8 px-2 sm:px-3">
            <span className="text-xs">Reset</span>
          </Button>
          <button 
            aria-label="Close chat" 
            onClick={() => (isMobile ? setOpenMobile(false) : setOpen(false))} 
            className="p-1.5 rounded hover:bg-accent/10 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 overflow-auto space-y-2 sm:space-y-3">
        {messages.length === 0 && (
          <div className="text-xs sm:text-sm text-muted-foreground">
            No messages yet. Try asking about forecasts or the uploaded dataset.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div 
              className={
                m.role === "user" 
                  ? "max-w-[85%] rounded-lg bg-primary text-primary-foreground p-2 text-sm" 
                  : "max-w-[85%] rounded-lg bg-card p-2 border border-border text-sm"
              }
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-border bg-background/50">
        <div className="flex gap-2">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Ask the assistant..." 
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            className="text-sm"
          />
          <Button onClick={send} disabled={loading || !input.trim()} size="sm" className="flex-shrink-0">
            {loading ? "..." : "Send"}
          </Button>
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground hidden sm:block">
          Thread: <code className="ml-1">{threadId}</code>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
