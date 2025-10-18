import React from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/infrastructure/apiClient";
import { toast } from "@/hooks/use-toast";

type ChatMessage = { role: "user" | "assistant"; text: string; time?: string; isCode?: boolean };

type Props = {
  initialThread?: string;
};

export const ChatPanel: React.FC<Props> = ({ initialThread = "default" }) => {
  const [threadId] = React.useState(initialThread);
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    { role: "assistant", text: "Welcome 👋 — ask me anything about your dataset or forecasts.", time: "now" },
    { role: "assistant", text: "Tip: Try 'What are top 3 trends?' or paste a code snippet to see formatting.", time: "now" },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior });
    });
  }, []);

  React.useEffect(() => {
    scrollToBottom("auto");
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", text, time: new Date().toLocaleTimeString() }]);
    setInput("");

    // Optimistic UI: show typing indicator
    setIsTyping(true);
    setLoading(true);

    try {
      const res = await apiClient.chatMessage(text, threadId);
      const answer = String(res?.answer ?? res?.result ?? res ?? "(no response)");
      // if code block detection (simple heuristic)
      const isCode = /```|\n\s{2,}|<table|\t/.test(answer);
      setMessages((m) => [...m, { role: "assistant", text: answer, time: new Date().toLocaleTimeString(), isCode }]);
    } catch (err: any) {
      setMessages((m) => [...m, { role: "assistant", text: `Error: ${err?.message ?? String(err)}`, time: new Date().toLocaleTimeString() }]);
      toast({ title: "Chat error", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => toast({ title: "Copied", description: "Message copied to clipboard" }));
  };

  const handleAttach = (file: File) => {
    setMessages((m) => [...m, { role: "user", text: `Uploaded file: ${file.name} (${Math.round(file.size / 1024)} KB)`, time: new Date().toLocaleTimeString() }]);
    // Optionally upload file - omitted here, show toast
    toast({ title: "Attachment", description: `Simulated upload: ${file.name}` });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-3 sm:px-4 py-3 border-b border-border bg-card/60 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">Assistant</div>
          <div className="text-xs text-muted-foreground truncate">Conversational insights & dataset reasoning</div>
        </div>
        <div className="text-xs text-muted-foreground">Thread: <code className="ml-1">{threadId}</code></div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto p-3 sm:p-4 space-y-3 bg-background/20">
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((m, i) => (
            <motion.div key={i} layout>
              <MessageBubble role={m.role} text={m.text} time={m.time} isCode={m.isCode} onCopy={handleCopy} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div className="mt-1">
            <TypingIndicator />
          </div>
        )}
      </div>

      <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={loading} onAttach={handleAttach} />
    </div>
  );
};

export default ChatPanel;
