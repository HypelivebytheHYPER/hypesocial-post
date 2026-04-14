"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatClient, fetchServerSentEvents } from "@tanstack/ai-client";
import type { UIMessage } from "@tanstack/ai-client";
import type { StreamChunk } from "@tanstack/ai";

function getUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  let userId = localStorage.getItem("hypesocial_chat_user_id");
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("hypesocial_chat_user_id", userId);
  }
  return userId;
}

function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      parts: [
        {
          type: "text",
          content:
            "👋 Hi! I'm your HypeSocial AI assistant. Ask me about posts, accounts, analytics, or anything else!",
        },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userId = useRef(getUserId());
  const clientRef = useRef<ChatClient | null>(null);
  const toolsUsedRef = useRef<string[]>([]);
  const modelRef = useRef<string>("");

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize ChatClient once
  useEffect(() => {
    const client = new ChatClient({
      connection: fetchServerSentEvents("/api/chat", {
        body: { userId: userId.current },
      }),
      onChunk: (chunk: StreamChunk) => {
        if (chunk.type === "CUSTOM" && chunk.name === "tools_used") {
          toolsUsedRef.current = (chunk.value as any)?.tools || [];
        }
        if ("model" in chunk && chunk.model) {
          modelRef.current = chunk.model;
        }
      },
      onError: (err) => {
        console.error("[ChatClient] Error:", err);
        setError(err.message);
        setIsLoading(false);
      },
      onFinish: () => {
        setIsLoading(false);
      },
    });

    client.subscribe();
    clientRef.current = client;

    return () => {
      client.unsubscribe();
      clientRef.current = null;
    };
  }, []);

  // Sync client messages to React state
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    const interval = setInterval(() => {
      const clientMessages = client.getMessages();
      // Filter out system messages, keep user + assistant
      const visible = clientMessages.filter(
        (m) => m.role === "user" || m.role === "assistant"
      );

      // Merge welcome message if no other assistant messages yet
      if (visible.length === 0) {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            parts: [
              {
                type: "text",
                content:
                  "👋 Hi! I'm your HypeSocial AI assistant. Ask me about posts, accounts, analytics, or anything else!",
              },
            ],
          },
        ]);
        return;
      }

      setMessages((prev) => {
        // Only update if different to avoid infinite loops
        const prevText = JSON.stringify(prev);
        const nextText = JSON.stringify(visible);
        return prevText === nextText ? prev : visible;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !clientRef.current) return;

    setError(null);
    setIsLoading(true);
    toolsUsedRef.current = [];
    modelRef.current = "";

    try {
      await clientRef.current.sendMessage(input.trim());
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to send message");
      }
    } finally {
      setInput("");
      // onFinish handles setIsLoading(false)
    }
  }, [input, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    clientRef.current?.clear();
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            content:
              "👋 Hi! I'm your HypeSocial AI assistant. How can I help you today?",
          },
        ],
      },
    ]);
    setError(null);
    fetch(`/api/chat?userId=${userId.current}`, { method: "DELETE" });
  };

  const getMessageText = (msg: UIMessage): string => {
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => ("content" in p ? String(p.content) : ""))
      .join("");
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 bg-card">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-lg">AI Assistant</h1>
          <p className="text-xs text-muted-foreground">Powered by TanStack AI + Cloudflare</p>
        </div>
        <Button variant="ghost" size="icon" onClick={clearChat} title="Clear chat">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => {
            const text = getMessageText(message);
            const isStreaming =
              clientRef.current?.getIsLoading() &&
              message.role === "assistant" &&
              message.id === messages[messages.length - 1]?.id;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  {message.role === "user" ? (
                    <AvatarFallback className="bg-slate-200">
                      <User className="w-4 h-4 text-slate-600" />
                    </AvatarFallback>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                </Avatar>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 max-w-[80%] text-sm",
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md"
                  )}
                >
                  {text ? (
                    <p className="whitespace-pre-line">{text}</p>
                  ) : isStreaming ? (
                    <div className="flex gap-1 h-5 items-center">
                      <span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  ) : null}
                  <span className="text-[10px] opacity-60 mt-1 block">
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {modelRef.current && !modelRef.current.includes("fallback") && (
                      <span className="ml-2">
                        • {modelRef.current.replace("@cf/meta/", "").replace("@cf/moonshotai/", "")}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4 bg-card">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            placeholder="Ask about posts, accounts, analytics..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          💡 Tip: Ask about your posts, social accounts, or analytics data
        </p>
      </div>
    </div>
  );
}
