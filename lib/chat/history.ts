export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function storeHistory(
  userId: string,
  userContent: string,
  assistantResponse: string
): void {
  const messages = globalThis.chatHistory?.get(userId) || [];
  messages.push(
    {
      role: "user",
      content: userContent,
      timestamp: new Date().toISOString(),
    },
    {
      role: "assistant",
      content: assistantResponse,
      timestamp: new Date().toISOString(),
    }
  );

  if (!globalThis.chatHistory) {
    globalThis.chatHistory = new Map();
  }
  globalThis.chatHistory.set(userId, messages);
}

export function getHistory(userId: string): HistoryMessage[] {
  return globalThis.chatHistory?.get(userId) || [];
}

export function clearHistory(userId: string): void {
  globalThis.chatHistory?.delete(userId);
}
