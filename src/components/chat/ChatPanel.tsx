import React from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/infrastructure/apiClient";
import { toast } from "@/hooks/use-toast";

// UI Chat message shape
type UIChatMessage = { role: "user" | "assistant"; text: string; time?: string; isCode?: boolean };

// Domain ChatMessage (from src/domain/types) may have different shape (id, content, timestamp)
type DomainChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content?: string;
  timestamp?: string | Date;
};

type Props = {
  initialThread?: string;
  messages?: UIChatMessage[] | DomainChatMessage[];
  onSendMessage?: (content: string) => Promise<void>;
  isLoading?: boolean;
  showSuggestions?: boolean;
  suggestedQuestions?: string[];
  className?: string;
};

export const ChatPanel: React.FC<Props> = ({
  initialThread = "default",
  messages: externalMessages,
  onSendMessage,
  isLoading: externalLoading = false,
  showSuggestions = false,
  suggestedQuestions = [],
  className = "",
}) => {
  const [threadId] = React.useState(initialThread);
  const [internalMessages, setInternalMessages] = React.useState<UIChatMessage[]>(() => [
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
  }, [externalMessages, internalMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
  const msg: UIChatMessage = { role: "user", text, time: new Date().toLocaleTimeString() };

    // Controlled mode: delegate sending to parent
    if (externalMessages && onSendMessage) {
      try {
        await onSendMessage(text);
      } catch (err) {
        toast({ title: "Chat error", description: String(err as any), variant: "destructive" });
      }
      setInput("");
      return;
    }

    // Uncontrolled: update local state and call backend
    setInternalMessages((m) => [...m, msg]);
    setInput("");
    setIsTyping(true);
    setLoading(true);

    try {
  const res = await apiClient.sendChatMessage(threadId, text);
  // normalized response: { response, message, raw }
  const answer = String(res?.response ?? res?.message ?? res ?? "(no response)");
      const isCode = /```|\n\s{2,}|<table|\t/.test(answer);

      // If backend returned richer metadata, append a short metadata line
  const raw = res?.raw ?? (typeof res === 'object' ? res : undefined);
      const parts: string[] = [answer];
      if (raw.source) parts.push(`\n\n[Source: ${raw.source}]`);
      if (raw.confidence !== undefined && raw.confidence !== null) parts.push(` [Confidence: ${Number(raw.confidence).toFixed(2)}]`);

  // Include raw payload on the message object so MessageBubble can render SQLCard when present
  const assistantMsg: any = { role: "assistant", text: parts.join(""), time: new Date().toLocaleTimeString(), isCode };
  if (raw) assistantMsg.raw = raw;

  setInternalMessages((m) => [...m, assistantMsg]);
    } catch (err: any) {
      setInternalMessages((m) => [...m, { role: "assistant", text: `Error: ${err?.message ?? String(err)}`, time: new Date().toLocaleTimeString() }]);
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
    setInternalMessages((m) => [...m, { role: "user", text: `Uploaded file: ${file.name} (${Math.round(file.size / 1024)} KB)`, time: new Date().toLocaleTimeString() }]);
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
          {(externalMessages ?? internalMessages).map((m, i) => {
            // Map domain message shape to UI shape when necessary
            const uiMessage: UIChatMessage = (m as any).text
              ? (m as UIChatMessage)
              : {
                  role: (m as DomainChatMessage).role,
                  text: String((m as DomainChatMessage).content ?? ""),
                  time:
                    typeof (m as DomainChatMessage).timestamp === "string"
                      ? (m as DomainChatMessage).timestamp as string
                      : (m as DomainChatMessage).timestamp
                      ? new Date((m as DomainChatMessage).timestamp as any).toLocaleTimeString()
                      : undefined,
                };

            // If domain message had raw SQL metadata stringified in content, try to pass it via raw prop
            const domainMsg = m as DomainChatMessage;
            const rawPayload = (domainMsg as any).raw ?? undefined;

            return (
              <motion.div key={i} layout>
                <MessageBubble role={uiMessage.role} text={uiMessage.text} time={uiMessage.time} isCode={uiMessage.isCode} onCopy={handleCopy} raw={rawPayload} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {(externalLoading || isTyping) && (
          <div className="mt-1">
            <TypingIndicator />
          </div>
        )}
      </div>

      <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={loading || externalLoading} onAttach={handleAttach} />
    </div>
  );
};

export default ChatPanel;
