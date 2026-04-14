/**
 * Chat API - TanStack AI unified layer with Cloudflare Native AI
 *
 * Accepts AG-UI formatted messages and returns AG-UI SSE stream chunks.
 * Orchestrates AI + MCP tools on the backend.
 */

import { NextRequest, NextResponse } from "next/server";
import type { UIMessage, ModelMessage } from "@tanstack/ai";
import { streamChatResponse, getChatResponse } from "@/lib/tanstack-ai-chat";
import {
  listMCPTools,
  callMCPTool,
  listLocalMCPTools,
  callLocalMCPTool,
  parseToolCalls,
  MCPTool,
} from "@/lib/mcp-client";

const SYSTEM_PROMPT = `You are the HypeSocial AI Assistant. You're friendly, helpful, and speak like a real human social media manager.

HOW TO SPEAK:
- Use a warm, conversational tone like you're chatting with a friend
- Use contractions (I'm, don't, can't, let's)
- Keep it concise - 2-3 sentences max unless explaining something complex
- Use emojis naturally (not excessively)
- Greet users casually and show enthusiasm
- Say "I" instead of "the assistant" or "the AI"
- React naturally to what users say
- Do NOT show your reasoning or thinking process

WHEN USING TOOLS:
1. First, respond naturally ("Let me check that for you!" or "One sec...")
2. Then use the tool by outputting: <tool_call>{"name": "tool_name", "arguments": {}}</tool_call>
3. You'll get the results back and can provide a helpful response`;

const RESPONSE_PROMPT = `You are the HypeSocial AI Assistant. Respond based on the tool results.

HOW TO RESPOND:
- Speak like a friendly human, not a robot
- Summarize data naturally with enthusiasm
- Use emojis sparingly but appropriately
- Offer helpful next steps
- Keep it conversational and brief
- Do NOT show your reasoning or thinking process`;

function buildToolPrompt(tools: MCPTool[]): string {
  const toolsDescription = tools
    .map((t) => `- ${t.name}: ${t.description || "No description"}`)
    .join("\n");

  return `${SYSTEM_PROMPT}\n\nAVAILABLE TOOLS:\n${toolsDescription || "No tools available"}\n\nTO USE A TOOL, output exactly:\n<tool_call>{"name": "tool_name", "arguments": {"param": "value"}}</tool_call>\n\nRemember: First respond naturally to the user, then use the tool if needed.`;
}

function extractText(msg: UIMessage | ModelMessage): string {
  if ("parts" in msg && Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => ("content" in p ? String(p.content) : ""))
      .join("");
  }
  if ("content" in msg && typeof msg.content === "string") {
    return msg.content;
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      messages?: Array<UIMessage | ModelMessage>;
      data?: Record<string, unknown>;
      stream?: boolean;
      // Legacy support
      message?: string;
      userId?: string;
      history?: Array<{ role: string; content: string }>;
    };

    // Normalize messages from TanStack AI or legacy format
    let messages: Array<UIMessage | ModelMessage> = [];
    let userId = body.userId || (body.data?.userId as string) || "anonymous";
    const stream = body.stream ?? true;

    if (body.messages && Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (body.message) {
      // Legacy format conversion
      const historyMsgs: Array<{ role: string; content: string }> =
        body.history || [];
      messages = [
        ...historyMsgs.map((h) => ({
          id: generateId("msg"),
          role: h.role as "user" | "assistant",
          parts: [{ type: "text" as const, content: h.content }],
        })),
        {
          id: generateId("msg"),
          role: "user" as const,
          parts: [{ type: "text" as const, content: body.message }],
        },
      ];
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // Step 1: Get MCP tools
    let mcpTools: MCPTool[] = [];
    try {
      const [remoteTools, localTools] = await Promise.all([
        listMCPTools().catch((e) => {
          console.error("[Chat] Remote MCP unavailable:", e);
          return [];
        }),
        listLocalMCPTools().catch((e) => {
          console.error("[Chat] Local MCP unavailable:", e);
          return [];
        }),
      ]);
      mcpTools = [...remoteTools, ...localTools];
    } catch (mcpErr) {
      console.error("[Chat] MCP unavailable:", mcpErr);
    }

    // Step 2: First AI call to decide tool usage
    let initialText = "";
    let initialModel = "";
    try {
      const res = await getChatResponse(messages, {
        systemPrompt: buildToolPrompt(mcpTools),
        userId,
      });
      initialText = res.text;
      initialModel = res.model;
    } catch (err) {
      console.error("[Chat] Initial AI call failed:", err);
      if (stream) {
        return aguiErrorStream(err);
      }
      return NextResponse.json({
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to connect to AI",
      });
    }

    const toolCalls = parseToolCalls(initialText);
    const cleanContent = initialText
      .replace(/<tool_call>.*?<\/tool_call>/gs, "")
      .trim();

    // Step 3: If no tools needed, return/stream directly
    if (!toolCalls || toolCalls.length === 0) {
      storeHistory(userId, messages, cleanContent);
      if (stream) {
        return aguiStream(messages, cleanContent, [], initialModel, userId);
      }
      return NextResponse.json({
        success: true,
        response: cleanContent,
        toolsUsed: [],
        model: initialModel,
      });
    }

    // Step 4: Execute MCP tools
    const toolResults: Record<string, unknown> = {};
    for (const toolCall of toolCalls) {
      const isLocal =
        toolCall.name.startsWith("canva_") ||
        toolCall.name.startsWith("lark_") ||
        toolCall.name.startsWith("figma_") ||
        toolCall.name.startsWith("media_");
      const result = isLocal
        ? await callLocalMCPTool(toolCall.name, toolCall.arguments)
        : await callMCPTool(toolCall.name, toolCall.arguments);
      toolResults[toolCall.name] = result;
    }

    // Step 5: Second AI call with tool results
    const toolMessages: Array<UIMessage | ModelMessage> = [
      ...messages,
      {
        id: generateId("msg"),
        role: "assistant",
        parts: [{ type: "text", content: cleanContent || "Let me check that for you!" }],
      } as UIMessage,
      {
        id: generateId("msg"),
        role: "user",
        parts: [
          {
            type: "text",
            content: `Here are the results:\n\n${JSON.stringify(toolResults, null, 2)}\n\nNow respond naturally, like a friendly human assistant would.`,
          },
        ],
      } as UIMessage,
    ];

    let finalText = "";
    let finalModel = "";
    try {
      const res = await getChatResponse(toolMessages, {
        systemPrompt: RESPONSE_PROMPT,
        userId,
      });
      finalText = res.text;
      finalModel = res.model;
    } catch (err) {
      console.error("[Chat] Final AI call failed:", err);
      if (stream) {
        return aguiStream(messages, cleanContent, toolCalls.map((t) => t.name), initialModel, userId);
      }
      return NextResponse.json({
        success: true,
        response: cleanContent,
        toolsUsed: toolCalls.map((t) => t.name),
        model: initialModel,
      });
    }

    storeHistory(userId, messages, finalText);

    if (stream) {
      return aguiStream(messages, finalText, toolCalls.map((t) => t.name), finalModel, userId);
    }

    return NextResponse.json({
      success: true,
      response: finalText,
      toolsUsed: toolCalls.map((t) => t.name),
      model: finalModel,
    });
  } catch (error: any) {
    console.error("[Chat] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process message" },
      { status: 500 }
    );
  }
}

function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function storeHistory(
  userId: string,
  messages: Array<UIMessage | ModelMessage>,
  assistantResponse: string
) {
  const userMsg = [...messages].reverse().find((m) => m.role === "user");
  const userText = userMsg ? extractText(userMsg) : "";

  const existing = globalThis.chatHistory?.get(userId) || [];
  existing.push(
    {
      role: "user",
      content: userText,
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
  globalThis.chatHistory.set(userId, existing);
}

function aguiStream(
  _messages: Array<UIMessage | ModelMessage>,
  text: string,
  toolsUsed: string[],
  model: string,
  userId?: string
): Response {
  const encoder = new TextEncoder();
  const runId = generateId("run");
  const messageId = generateId("msg");

  const stream = new ReadableStream({
    async start(controller) {
      const now = Date.now();

      const send = (chunk: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      };

      send({ type: "RUN_STARTED", timestamp: now, runId, model });
      send({ type: "TEXT_MESSAGE_START", timestamp: now, messageId, role: "assistant" });

      // Include toolsUsed as a custom event
      if (toolsUsed.length > 0) {
        send({
          type: "CUSTOM",
          timestamp: Date.now(),
          name: "tools_used",
          value: { tools: toolsUsed },
        });
      }

      const chunks = text.split(/(\s+)/).filter(Boolean);
      let accumulated = "";
      for (const chunk of chunks) {
        accumulated += chunk;
        send({
          type: "TEXT_MESSAGE_CONTENT",
          timestamp: Date.now(),
          messageId,
          delta: chunk,
          content: accumulated,
        });
      }

      send({ type: "TEXT_MESSAGE_END", timestamp: Date.now(), messageId });
      send({ type: "RUN_FINISHED", timestamp: Date.now(), runId, finishReason: "stop" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

function aguiErrorStream(error: unknown): Response {
  const encoder = new TextEncoder();
  const runId = generateId("run");
  const stream = new ReadableStream({
    start(controller) {
      const now = Date.now();
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "RUN_STARTED", timestamp: now, runId })}\n\n`
        )
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "RUN_ERROR",
            timestamp: Date.now(),
            runId,
            error: {
              message:
                error instanceof Error
                  ? error.message
                  : "AI service unavailable",
            },
          })}\n\n`
        )
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const messages = globalThis.chatHistory?.get(userId) || [];
    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("[Chat] History error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    globalThis.chatHistory?.delete(userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Chat] Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
