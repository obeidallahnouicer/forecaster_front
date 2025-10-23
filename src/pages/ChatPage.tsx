import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { ChatPanel } from "@/components/chat";
import { useAsyncData } from "@/hooks/useAsyncData";
import { apiClient } from "@/infrastructure/apiClient";
import { normalizeChatSession, normalizeChatMessage } from "@/infrastructure/dataAdapters";
import { useToast } from "@/hooks/use-toast";
import { ErrorState, EmptyState } from "@/components";
import { SkeletonCard } from "@/components";
import { Plus, Clock, MessageSquare, Loader2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { ChatSession } from "@/domain/types";

const ChatPage: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const { toast } = useToast();

  // Fetch chat sessions directly from backend API
  const sessionsData = useAsyncData(
    useCallback(async () => {
      try {
        const response = await apiClient.getChatSessions(1, 50);
        const items = response.items || [];
        
        // Normalize sessions
        const normalized = items
          .map((item: any) => normalizeChatSession(item))
          .filter((s): s is ChatSession => s !== null);

        setSessions(normalized);
        if (!currentSession && normalized.length > 0) {
          setCurrentSession(normalized[0]);
        }

        return normalized;
      } catch (err) {
        console.error("Failed to fetch chat sessions:", err);
        throw err;
      }
    }, []),
    [],
    {
      // Disable timeout for chat sessions - wait as long as needed
      timeout: 0,
      retries: 2,
      onError: (err) => {
        console.error("Sessions fetch error:", err);
        toast({
          title: "Failed to load chat sessions",
          description: "Unable to connect to chat backend",
          variant: "destructive",
        });
      },
    }
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!currentSession) {
        toast({
          title: "No session",
          description: "Please create or select a session first",
          variant: "destructive",
        });
        return;
      }

      setIsSendingMessage(true);

      try {
        const userMessage = {
          id: `msg-${Date.now()}`,
          role: "user" as const,
          content,
          timestamp: new Date(),
        };

        // Optimistic update
        const updatedSession = {
          ...currentSession,
          messages: [...(currentSession?.messages || []), userMessage],
        };
        setCurrentSession(updatedSession);
        setSessions((prev) =>
          prev.map((s) => (s.id === currentSession.id ? updatedSession : s))
        );

        // Send to API
        const response = await apiClient.sendChatMessage(currentSession.id, content);

        if (response && typeof response === "object") {
          const aiMessage = normalizeChatMessage(response);

          if (aiMessage) {
            setCurrentSession((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: [...prev.messages, aiMessage],
                updated_at: new Date(),
              };
            });
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === currentSession.id) {
                  return {
                    ...s,
                    messages: [...s.messages, aiMessage],
                    updated_at: new Date(),
                  };
                }
                return s;
              })
            );
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Failed to send message",
          description:
            error instanceof Error ? error.message : "Unable to connect to chat backend",
          variant: "destructive",
        });
        // Revert optimistic update on error
        sessionsData.retry();
      } finally {
        setIsSendingMessage(false);
      }
    },
    [currentSession, toast, sessionsData]
  );

  const handleNewSession = useCallback(async () => {
    try {
      const newSession = await apiClient.createChatSession();
      const normalized = normalizeChatSession(newSession);

      if (normalized) {
        setSessions((prev) => [normalized, ...prev]);
        setCurrentSession(normalized);
        toast({
          title: "New conversation started",
          description: "Ready to chat about your forecasts",
        });
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Failed to create conversation",
        description:
          error instanceof Error ? error.message : "Unable to create new chat session",
        variant: "destructive",
      });
    }
  }, [apiClient, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="sticky top-20 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions about your forecasts, datasets, and insights
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          {/* Sessions sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-1 flex flex-col"
          >
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Conversations</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={handleNewSession}
                    title="New conversation"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                {sessions.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-8">
                    No conversations yet
                  </div>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setCurrentSession(session)}
                      className={`w-full text-left p-3 rounded-lg transition-all text-sm ${
                        currentSession?.id === session.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <p className="font-medium truncate">{session.title}</p>
                      <div className="flex items-center gap-1 text-xs opacity-70 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.updated_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-3"
          >
            {!currentSession ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Create a new conversation to get started
                  </p>
                  <Button onClick={handleNewSession}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Conversation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ChatPanel
                messages={currentSession.messages || []}
                onSendMessage={handleSendMessage}
                isLoading={isSendingMessage}
                showSuggestions={(currentSession.messages || []).length === 0}
                suggestedQuestions={[
                  "What are the top 5 trending products?",
                  "Which forecasts have the lowest confidence?",
                  "Compare this forecast with similar products",
                  "Export the latest batch results",
                ]}
                className="h-full"
              />
            )}
          </motion.div>
        </div>

        {/* Features section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-12"
        >
          {/* <h2 className="text-lg font-semibold mb-4">AI Assistant Features</h2> */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: "🔍",
                title: "Data Exploration",
                desc: "Ask questions about trends, patterns, and anomalies",
              },
              {
                icon: "📊",
                title: "Forecast Analysis",
                desc: "Understand model predictions and confidence levels",
              },
              {
                icon: "💡",
                title: "Insights",
                desc: "Get actionable recommendations based on data",
              },
              {
                icon: "⚡",
                title: "Quick Actions",
                desc: "Export data, filter forecasts, and more",
              },
            ].map((feature, idx) => (
              <Card key={idx} className="hover:shadow-md transition-all">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div> */}
        </motion.div>
      </div>
    </div>
  );
};

export default ChatPage;
