import React, { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  ExternalLink,
  Download,
  BarChart3,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage, QuickAction } from "@/domain/types";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  showSuggestions?: boolean;
  suggestedQuestions?: string[];
  className?: string;
}

const actionIcons: Record<QuickAction["action_type"], React.ComponentType<{ className?: string }>> = {
  navigate: ExternalLink,
  export: Download,
  filter: BarChart3,
  explain: MessageSquare,
};

const MessageBubble: React.FC<{
  message: ChatMessage;
}> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card border border-border text-card-foreground rounded-bl-none"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Quick actions */}
        {message.quick_actions && message.quick_actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-current border-opacity-10">
            {message.quick_actions.map((action) => {
              const ActionIcon = actionIcons[action.action_type];

              return (
                <Button
                  key={action.id}
                  size="sm"
                  variant={isUser ? "outline" : "secondary"}
                  className={cn(
                    "h-7 text-xs",
                    isUser && "border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10"
                  )}
                >
                  <ActionIcon className="w-3 h-3 mr-1" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}

        <p className="text-xs opacity-70 mt-2">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  showSuggestions = true,
  suggestedQuestions = [
    "What's driving the forecast increases?",
    "Show items with low confidence",
    "Export recent forecasts",
  ],
  className,
}) => {
  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-background rounded-lg", className)}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">
                AI-Powered Insights
              </h3>
              <p className="text-sm text-muted-foreground">
                Ask questions about your forecasts, data, and trends
              </p>
            </div>

            {/* Suggested questions */}
            {showSuggestions && (
              <div className="w-full space-y-2 mt-6">
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => onSendMessage(question)}
                  >
                    <span className="text-xs">{question}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <AnimatePresence>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>
            
            {/* Loading indicator when sending */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-start"
              >
                <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg bg-card border border-border text-card-foreground rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">AI is thinking...</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card/50 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about forecasts, data, or trends..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading}
            className="text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Context tags */}
        {messages.length > 0 && messages[messages.length - 1].context && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {messages[messages.length - 1].context?.dataset_reference && (
              <Badge variant="secondary" className="text-xs">
                Dataset: {messages[messages.length - 1].context?.dataset_reference}
              </Badge>
            )}
            {messages[messages.length - 1].context?.metric_reference && (
              <Badge variant="secondary" className="text-xs">
                Item: {messages[messages.length - 1].context?.metric_reference}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
