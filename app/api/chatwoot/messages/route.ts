/**
 * Chatwoot Messages API
 * Send messages from the frontend to Chatwoot
 */

import { NextRequest, NextResponse } from "next/server";
import { sendMessageToChatwoot, createConversation, createContact, generateSourceId } from "@/lib/chatwoot";

// Get Chatwoot config from environment variables
function getChatwootConfig() {
  return {
    channelName: process.env.CHATWOOT_CHANNEL_NAME || "HypeSocial Chat",
    inboxId: process.env.CHATWOOT_INBOX_ID || "",
    accountId: process.env.CHATWOOT_ACCOUNT_ID || "",
    apiToken: process.env.CHATWOOT_API_TOKEN || "",
    webhookUrl: process.env.CHATWOOT_WEBHOOK_URL || "https://hypesocial-post.vercel.app/api/chatwoot/webhook",
    chatwootUrl: process.env.CHATWOOT_URL || "https://app.chatwoot.com",
  };
}

/**
 * POST /api/chatwoot/messages
 * Send a message from the user to Chatwoot
 */
export async function POST(request: NextRequest) {
  try {
    const config = getChatwootConfig();
    
    if (!config.apiToken || !config.accountId || !config.inboxId) {
      return NextResponse.json(
        { error: "Chatwoot not configured. Please set environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message, userId, userEmail, userName, conversationId } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required" },
        { status: 400 }
      );
    }

    let convId = conversationId;

    // Create new conversation if needed
    if (!convId) {
      const sourceId = generateSourceId(userId);
      
      // Create or get contact
      await createContact(config, {
        identifier: userId,
        email: userEmail,
        name: userName || `User ${userId.slice(0, 8)}`,
      });

      // Create conversation
      convId = await createConversation(config, sourceId, {
        identifier: userId,
        email: userEmail,
        name: userName,
      });
    }

    // Send message to Chatwoot
    await sendMessageToChatwoot(config, convId, message, "incoming");

    // Store message for polling
    const sourceId = generateSourceId(userId);
    const messages = globalThis.chatwootMessages?.get(sourceId) || [];
    messages.push({
      content: message,
      sender: userName || "You",
      timestamp: new Date().toISOString(),
      type: "user",
    });
    
    if (!globalThis.chatwootMessages) {
      globalThis.chatwootMessages = new Map();
    }
    globalThis.chatwootMessages.set(sourceId, messages);

    return NextResponse.json({
      success: true,
      conversationId: convId,
    });
  } catch (error) {
    console.error("[Chatwoot Messages] Error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chatwoot/messages
 * Poll for new messages from agents
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const sourceId = generateSourceId(userId);
    const messages = globalThis.chatwootMessages?.get(sourceId) || [];

    // Clear messages after fetching (optional - depends on your needs)
    // globalThis.chatwootMessages?.delete(sourceId);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[Chatwoot Messages] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
