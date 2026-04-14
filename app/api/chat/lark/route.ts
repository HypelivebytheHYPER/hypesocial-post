/**
 * Lark Bot Chat API
 * Handles messages between web users and Lark agents
 */

import { NextRequest, NextResponse } from "next/server";
import { sendToLark, pollLarkMessages } from "@/lib/lark-bot";
import { getAIResponse, getFallbackResponse } from "@/lib/ai-support";

/**
 * POST /api/chat/lark
 * Send message from web user → AI/Lark
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, userName, useAI = true } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId required" },
        { status: 400 }
      );
    }

    // Step 1: Get AI response first (instant)
    let aiResponse: { content: string; needsHuman: boolean } | null = null;
    
    if (useAI) {
      try {
        // Try AI SDK first
        if (process.env.OPENAI_API_KEY) {
          aiResponse = await getAIResponse(message);
        } else {
          // Fallback to rule-based (no API costs)
          aiResponse = getFallbackResponse(message);
        }
      } catch (err) {
        console.log("[Chat] AI failed, using fallback");
        aiResponse = getFallbackResponse(message);
      }

      // Store AI response
      if (aiResponse) {
        const messages = globalThis.chatMessages?.get(userId) || [];
        messages.push({
          content: aiResponse.content,
          sender: "AI Assistant",
          timestamp: new Date().toISOString(),
          type: "ai",
        });

        if (!globalThis.chatMessages) {
          globalThis.chatMessages = new Map();
        }
        globalThis.chatMessages.set(userId, messages);
      }
    }

    // Step 2: Also send to Lark if human needed or user prefers
    if (aiResponse?.needsHuman || !useAI) {
      const larkResult = await sendToLark(userId, userName || "Guest", message);
      
      if (!larkResult.success) {
        console.error("[Chat] Failed to send to Lark:", larkResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      aiResponse: aiResponse?.content || null,
      needsHuman: aiResponse?.needsHuman || false,
    });
  } catch (error: any) {
    console.error("[Chat] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/lark
 * Poll for new messages (AI + Lark)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    // Get messages from both AI and Lark
    const messages = globalThis.chatMessages?.get(userId) || [];
    
    // Get Lark agent messages
    const larkMessages = await pollLarkMessages(userId);

    // Combine and sort by timestamp
    const allMessages = [...messages, ...larkMessages]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Clear fetched messages
    globalThis.chatMessages?.delete(userId);

    return NextResponse.json({ messages: allMessages });
  } catch (error: any) {
    console.error("[Chat] Poll error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
