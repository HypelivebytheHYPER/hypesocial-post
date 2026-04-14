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
import { useHotkey } from "@tanstack/react-hotkeys";

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

type AgentStep =
  | { step: "collecting_tools"; message: string }
  | { step: "thinking"; message: string }
  | { step: "executing_tools"; count: number; tools: string[] }
  | { step: "executing_tool"; tool: string }
  | { step: "tool_result"; tool: string; success: boolean; error?: string };

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
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = useRef(getUserId());
  const clientRef = useRef<ChatClient | null>(null);
  const toolsUsedRef = useRef<string[]>([]);
  const modelRef = useRef<string>("");

  // Hotkeys
  useHotkey("Mod+K", () => {
    inputRef.current?.focus();
  });

  useHotkey("Escape", () => {
    if (isLoading) {
      clientRef.current?.clear();
      setIsLoading(false);
      setAgentSteps([]);
    } else if (messages.length > 1) {
      clearChat();
    } else if (error) {
      setError(null);
    }
  });

  useHotkey("Mod+Shift+C", () => {
    clearChat();
  });

  // Auto-scroll to bottom when messages or steps change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentSteps]);

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
        if (chunk.type === "CUSTOM" && chunk.name === "model_info") {
          modelRef.current = (chunk.value as any)?.model || "";
        }
        if (chunk.type === "CUSTOM" && chunk.name === "agent_step") {
          const step = chunk.value as AgentStep;
          setAgentSteps((prev) => {
            // Replace same-step entries to avoid duplicates
            const filtered = prev.filter((s) => {
              if (s.step === "thinking" && step.step === "thinking") return false;
              if (s.step === "collecting_tools" && step.step === "collecting_tools") return false;
              if (s.step === "executing_tools" && step.step === "executing_tools") return false;
              if (s.step === "executing_tool" && step.step === "executing_tool" && s.tool === (step as any).tool) return false;
              if (s.step === "tool_result" && step.step === "tool_result" && s.tool === (step as any).tool) return false;
              return true;
            });
            return [...filtered, step];
          });
        }
      },
      onError: (err) => {
        console.error("[ChatClient] Error:", err);
        setError(err.message);
        setIsLoading(false);
        setAgentSteps([]);
      },
      onFinish: () => {
        setIsLoading(false);
        // Clear steps after a short delay so user can see final results
        setTimeout(() => setAgentSteps([]), 3000);
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
      const visible = clientMessages.filter(
        (m) => m.role === "user" || m.role === "assistant"
      );

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
    setAgentSteps([]);
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
    setAgentSteps([]);
    fetch(`/api/chat?userId=${userId.current}`, { method: "DELETE" });
  };

  const getMessageText = (msg: UIMessage): string => {
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => ("content" in p ? String(p.content) : ""))
      .join("");
  };

  const currentStep = agentSteps[agentSteps.length - 1];

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
          {messages.map((message, index) => {
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

          {/* Agent Steps Indicator */}
          {isLoading && currentStep && (
            <div className="flex gap-3 flex-row">
              <Avatar className="w-8 h-8 shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </Avatar>
              <div className="rounded-2xl px-4 py-2.5 max-w-[80%] text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md">
                <div className="flex items-center gap-2 min-h-[20px]">
                  <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                  <StepLabel step={currentStep} />
                </div>
                {agentSteps.length > 1 && (
                  <div className="mt-2 space-y-1 border-t border-slate-200 dark:border-slate-700 pt-2">
                    {agentSteps.slice(0, -1).map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                        <StepIcon step={s} />
                        <StepLabel step={s} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4 bg-card">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
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

function StepIcon({ step }: { step: AgentStep }) {
  if (step.step === "tool_result") {
    return step.success ? (
      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px]">✓</span>
    ) : (
      <span className="w-3.5 h-3.5 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center text-[10px]">✕</span>
    );
  }
  return (
    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
  );
}

function StepLabel({ step }: { step: AgentStep }) {
  switch (step.step) {
    case "collecting_tools":
      return <span className="text-sm text-slate-700 dark:text-slate-200">Checking available tools...</span>;
    case "thinking":
      return <span className="text-sm text-slate-700 dark:text-slate-200">{step.message}</span>;
    case "executing_tools":
      return <span className="text-sm text-slate-700 dark:text-slate-200">Executing {step.count} tool{step.count !== 1 ? "s" : ""}...</span>;
    case "executing_tool":
      return <span className="text-sm text-slate-700 dark:text-slate-200">Running <code className="text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">{step.tool}</code>...</span>;
    case "tool_result":
      return (
        <span className="text-sm text-slate-700 dark:text-slate-200">
          {step.success ? (
            <><code className="text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">{step.tool}</code> succeeded</>
          ) : (
            <><code className="text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">{step.tool}</code> failed</>
          )}
        </span>
      );
    default:
      return null;
  }
}
