import { NextRequest, NextResponse } from "next/server";
import type { UIMessage, ModelMessage } from "@tanstack/ai";
import { getChatResponse, buildToolPrompt, RESPONSE_PROMPT } from "@/lib/ai";
import {
  listMCPTools,
  callMCPTool,
  listLocalMCPTools,
  callLocalMCPTool,
  parseToolCalls,
} from "@/lib/mcp";
import { storeHistory, getHistory, clearHistory } from "@/lib/chat";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      messages?: Array<UIMessage | ModelMessage>;
      data?: Record<string, unknown>;
      stream?: boolean;
      message?: string;
      userId?: string;
      history?: Array<{ role: string; content: string }>;
    };

    let messages: Array<UIMessage | ModelMessage> = [];
    let userId = body.userId || (body.data?.userId as string) || "anonymous";
    const stream = body.stream ?? true;

    if (body.messages && Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (body.message) {
      const history = body.history || [];
      messages = [
        ...history.map((h) => ({
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

    // 1. Collect available MCP tools
    let mcpTools = [] as Awaited<ReturnType<typeof listMCPTools>>;
    try {
      const [remote, local] = await Promise.all([
        listMCPTools().catch((e) => {
          console.error("[Chat] Remote MCP unavailable:", e);
          return [] as typeof mcpTools;
        }),
        listLocalMCPTools().catch((e) => {
          console.error("[Chat] Local MCP unavailable:", e);
          return [] as typeof mcpTools;
        }),
      ]);
      mcpTools = [...remote, ...local];
    } catch (e) {
      console.error("[Chat] MCP unavailable:", e);
    }

    // 2. First AI call to detect tool intent
    let initialRes: { text: string; model: string };
    try {
      initialRes = await getChatResponse(messages, {
        systemPrompt: buildToolPrompt(mcpTools),
        userId,
      });
    } catch (err) {
      console.error("[Chat] Initial AI call failed:", err);
      if (stream) return aguiErrorStream(err);
      return NextResponse.json({
        success: false,
        error: err instanceof Error ? err.message : "Failed to connect to AI",
      });
    }

    const toolCalls = parseToolCalls(initialRes.text);
    const cleanContent = initialRes.text
      .replace(/<tool_call>.*?<\/?tool_call>/gs, "")
      .trim();

    // 3. No tools needed — return immediately
    if (!toolCalls || toolCalls.length === 0) {
      const userMsg = [...messages].reverse().find((m) => m.role === "user");
      storeHistory(userId, userMsg ? extractText(userMsg) : "", cleanContent);
      if (stream) {
        return aguiStream(cleanContent, [], initialRes.model);
      }
      return NextResponse.json({
        success: true,
        response: cleanContent,
        toolsUsed: [],
        model: initialRes.model,
      });
    }

    // 4. Execute MCP tools
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

    // 5. Second AI call with tool results
    const toolMessages: Array<UIMessage | ModelMessage> = [
      ...messages,
      {
        id: generateId("msg"),
        role: "assistant",
        parts: [
          {
            type: "text",
            content: cleanContent || "Let me check that for you!",
          },
        ],
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

    let finalRes: { text: string; model: string };
    try {
      finalRes = await getChatResponse(toolMessages, {
        systemPrompt: RESPONSE_PROMPT,
        userId,
      });
    } catch (err) {
      console.error("[Chat] Final AI call failed:", err);
      const userMsg = [...messages].reverse().find((m) => m.role === "user");
      storeHistory(userId, userMsg ? extractText(userMsg) : "", cleanContent);
      if (stream) {
        return aguiStream(cleanContent, toolCalls.map((t) => t.name), initialRes.model);
      }
      return NextResponse.json({
        success: true,
        response: cleanContent,
        toolsUsed: toolCalls.map((t) => t.name),
        model: initialRes.model,
      });
    }

    const userMsg = [...messages].reverse().find((m) => m.role === "user");
    storeHistory(userId, userMsg ? extractText(userMsg) : "", finalRes.text);

    if (stream) {
      return aguiStream(finalRes.text, toolCalls.map((t) => t.name), finalRes.model);
    }

    return NextResponse.json({
      success: true,
      response: finalRes.text,
      toolsUsed: toolCalls.map((t) => t.name),
      model: finalRes.model,
    });
  } catch (error: any) {
    console.error("[Chat] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process message" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    return NextResponse.json({ messages: getHistory(userId) });
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
    clearHistory(userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Chat] Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

function aguiStream(
  text: string,
  toolsUsed: string[],
  model: string
): Response {
  const encoder = new TextEncoder();
  const runId = generateId("run");
  const messageId = generateId("msg");

  const stream = new ReadableStream({
    start(controller) {
      const now = Date.now();
      const send = (chunk: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
        );
      };

      send({ type: "RUN_STARTED", timestamp: now, runId, model });
      send({
        type: "TEXT_MESSAGE_START",
        timestamp: now,
        messageId,
        role: "assistant",
      });

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
      send({
        type: "RUN_FINISHED",
        timestamp: Date.now(),
        runId,
        finishReason: "stop",
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
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
          `data: ${JSON.stringify({
            type: "RUN_STARTED",
            timestamp: now,
            runId,
          })}\n\n`
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
      Connection: "keep-alive",
    },
  });
}
