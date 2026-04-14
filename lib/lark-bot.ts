/**
 * Lark (Feishu) Bot SDK Integration
 * For real-time chat between web users and Lark agents
 * 
 * Docs: https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create
 */

import * as lark from "@larksuiteoapi/node-sdk";

// Lark Bot configuration
const LARK_CONFIG = {
  appId: process.env.LARK_BOT_APP_ID || "",
  appSecret: process.env.LARK_BOT_APP_SECRET || "",
  // Group chat for support
  supportChatId: process.env.LARK_SUPPORT_CHAT_ID || "",
};

// Initialize Lark client
const client = new lark.Client({
  appId: LARK_CONFIG.appId,
  appSecret: LARK_CONFIG.appSecret,
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
});

export interface LarkMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  chatId: string;
  messageType: "text" | "image" | "file" | "interactive";
}

/**
 * Send message from web user to Lark group
 */
export async function sendToLark(
  userId: string,
  userName: string,
  content: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!LARK_CONFIG.supportChatId) {
      return { success: false, error: "Lark support chat not configured" };
    }

    // Format message with user info
    const formattedContent = JSON.stringify({
      text: `🌐 **Web User**: ${userName} (${userId.slice(0, 8)}...)\n\n${content}`,
    });

    const response = await client.im.message.create({
      params: {
        receive_id_type: "chat_id",
      },
      data: {
        receive_id: LARK_CONFIG.supportChatId,
        content: formattedContent,
        msg_type: "text",
      },
    });

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    return { success: true, messageId: response.data?.message_id };
  } catch (error: any) {
    console.error("[Lark Bot] Send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send reply from Lark agent back to web user
 * This is called when your Lark bot receives a message
 */
export async function sendReplyToUser(
  message: string,
  replyToUserId: string
): Promise<void> {
  // Store the message for polling
  // In production, use Redis or database
  const messages = globalThis.larkBotMessages?.get(replyToUserId) || [];
  messages.push({
    content: message,
    timestamp: new Date().toISOString(),
    sender: "Support Agent",
  });

  if (!globalThis.larkBotMessages) {
    globalThis.larkBotMessages = new Map();
  }
  globalThis.larkBotMessages.set(replyToUserId, messages);
}

/**
 * Poll for messages from Lark agents
 */
export async function pollLarkMessages(userId: string): Promise<Array<{
  content: string;
  timestamp: string;
  sender: string;
}>> {
  const messages = globalThis.larkBotMessages?.get(userId) || [];
  
  // Clear after reading (optional)
  // globalThis.larkBotMessages?.delete(userId);
  
  return messages;
}

/**
 * Verify Lark webhook signature
 */
export function verifyLarkWebhook(
  signature: string,
  timestamp: string,
  nonce: string,
  body: string
): boolean {
  // Implementation depends on Lark's verification method
  // See: https://open.feishu.cn/document/ukTMukTMukTM/uYDNxYjL2QTM24iN0EjN/event-subscription-overview
  return true; // Simplified for demo
}

/**
 * Handle incoming Lark webhook events
 */
export async function handleLarkWebhook(body: any): Promise<void> {
  const { event } = body;

  if (!event) return;

  switch (event.type) {
    case "im.message.receive_v1": {
      const message = event.message;
      const sender = event.sender;

      // Only process messages from the support group
      if (message.chat_id !== LARK_CONFIG.supportChatId) return;

      // Extract user ID from message content (format: "Web User: xxx...")
      const content = JSON.parse(message.content).text || "";
      const match = content.match(/\(([a-z0-9-]+)\.\.\.\)/);
      
      if (match) {
        const userId = match[1];
        const replyContent = content.replace(/🌐 \*\*Web User\*\*:.*\n\n/, "");
        
        await sendReplyToUser(replyContent, userId);
      }
      break;
    }
  }
}

// Global type declarations
declare global {
  var larkBotMessages: Map<string, Array<{
    content: string;
    timestamp: string;
    sender: string;
  }>> | undefined;
}
