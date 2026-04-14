/**
 * Global type declarations
 */

declare global {
  // In-memory store for Chatwoot messages (use Redis in production)
  var chatwootMessages: Map<string, Array<{
    content: string;
    sender: string;
    timestamp: string;
    type: "agent" | "user";
  }>> | undefined;

  // Lark Bot messages
  var larkBotMessages: Map<string, Array<{
    content: string;
    timestamp: string;
    sender: string;
  }>> | undefined;

  // Chat messages (AI + Lark combined)
  var chatMessages: Map<string, Array<{
    content: string;
    sender: string;
    timestamp: string;
    type: "ai" | "agent" | "user";
  }>> | undefined;

  // MCP Chat history
  var chatHistory: Map<string, Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    tools?: string[];
  }>> | undefined;

  // Staff messages (for customer polling)
  var staffMessages: Map<string, Array<{
    content: string;
    sender: string;
    timestamp: string;
  }>> | undefined;
}

export {};
