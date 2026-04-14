/**
 * Chatwoot API Channel Webhook Handler
 * Receives events from Chatwoot when messages are sent from the agent side
 */

import { NextRequest, NextResponse } from "next/server";
import { parseWebhookPayload, ChatwootMessage } from "@/lib/chatwoot";

// In-memory store for active conversations (use Redis in production)
const activeConversations = new Map<string, number>();

/**
 * POST /api/chatwoot/webhook
 * Receive webhook events from Chatwoot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = parseWebhookPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    console.log("[Chatwoot Webhook] Received:", payload.event, payload.data);

    switch (payload.event) {
      case "message_created": {
        // Handle new message from agent
        await handleMessageCreated(payload.data);
        break;
      }
      
      case "conversation_status_changed": {
        // Handle conversation status changes
        console.log("[Chatwoot] Conversation status changed:", payload.data.conversation.status);
        break;
      }
      
      case "conversation_created": {
        // Handle new conversation
        console.log("[Chatwoot] New conversation created:", payload.data.conversation.id);
        break;
      }

      default:
        console.log("[Chatwoot] Unhandled event:", payload.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chatwoot Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle message_created event from Chatwoot
 * This is called when an agent sends a message to the customer
 */
async function handleMessageCreated(data: ChatwootMessage["data"]) {
  // Only process outgoing messages (from agent to customer)
  if (data.message_type !== "outgoing") {
    return;
  }

  const conversationId = data.conversation.id;
  const sourceId = data.conversation.contact_inbox?.source_id;
  
  console.log("[Chatwoot] Agent message:", {
    conversationId,
    sourceId,
    content: data.content,
    sender: data.sender?.name,
  });

  // TODO: Send this message to your frontend via WebSocket/SSE
  // Store in memory for now (use Redis in production)
  const messages = globalThis.chatwootMessages?.get(sourceId) || [];
  messages.push({
    content: data.content,
    sender: data.sender?.name || "Agent",
    timestamp: data.created_at,
    type: "agent",
  });
  
  if (!globalThis.chatwootMessages) {
    globalThis.chatwootMessages = new Map();
  }
  globalThis.chatwootMessages.set(sourceId, messages);
}

/**
 * GET /api/chatwoot/webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Chatwoot webhook endpoint is ready",
    docs: "https://www.chatwoot.com/docs/product/channels/api/",
    webhookUrl: "https://hypesocial-post.vercel.app/api/chatwoot/webhook",
  });
}
