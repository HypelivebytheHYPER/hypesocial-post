import { NextRequest, NextResponse } from "next/server";
import type { UIMessage, ModelMessage } from "@tanstack/ai";
import { getChatResponse, buildToolPrompt, RESPONSE_PROMPT } from "@/lib/ai";
import {
  listMCPTools,
  callMCPTool,
  listLocalMCPTools,
  callLocalMCPTool,
  parseToolCalls,
  RemoteMCPClient,
  LocalMCPClient,
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

    if (!stream) {
      return await runChatAgentJSON(messages, userId);
    }

    const remoteClient = new RemoteMCPClient();
    const localClient = new LocalMCPClient();

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const send = (chunk: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
          );
        };

        for await (const chunk of agenticStream(
          messages,
          userId,
          remoteClient,
          localClient
        )) {
          send(chunk);
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[Chat] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process message" },
      { status: 500 }
    );
  }
}

async function* agenticStream(
  messages: Array<UIMessage | ModelMessage>,
  userId: string,
  remoteClient: RemoteMCPClient,
  localClient: LocalMCPClient
): AsyncGenerator<any, void, unknown> {
  const runId = generateId("run");
  const messageId = generateId("msg");
  const now = () => Date.now();

  yield { type: "RUN_STARTED", timestamp: now(), runId };

  // Step 1: Collect tools
  yield {
    type: "CUSTOM",
    timestamp: now(),
    name: "agent_step",
    value: { step: "collecting_tools", message: "Checking available tools..." },
  };

  let mcpTools = [] as Awaited<ReturnType<typeof listMCPTools>>;
  try {
    const [remote, local] = await Promise.all([
      listMCPTools(remoteClient).catch((e) => {
        console.error("[Chat] Remote MCP unavailable:", e);
        return [] as typeof mcpTools;
      }),
      listLocalMCPTools(localClient).catch((e) => {
        console.error("[Chat] Local MCP unavailable:", e);
        return [] as typeof mcpTools;
      }),
    ]);
    mcpTools = [...remote, ...local];
  } catch (e) {
    console.error("[Chat] MCP unavailable:", e);
  }

  // Multi-turn agentic loop
  let currentMessages = [...messages];
  let turnCount = 0;
  const maxTurns = 5;
  let allToolsUsed: string[] = [];

  while (turnCount < maxTurns) {
    turnCount++;

    yield {
      type: "CUSTOM",
      timestamp: now(),
      name: "agent_step",
      value: { step: "thinking", message: `Turn ${turnCount}: Planning how to help...` },
    };

    let aiRes: { text: string; model: string };
    try {
      aiRes = await getChatResponse(currentMessages, {
        systemPrompt: buildToolPrompt(mcpTools),
        userId,
      });
    } catch (err) {
      console.error("[Chat] AI call failed:", err);
      yield {
        type: "RUN_ERROR",
        timestamp: now(),
        runId,
        message: err instanceof Error ? err.message : "Failed to connect to AI",
      };
      return;
    }

    if (turnCount === 1) {
      yield {
        type: "CUSTOM",
        timestamp: now(),
        name: "model_info",
        value: { model: aiRes.model },
      };
    }

    const toolCalls = parseToolCalls(aiRes.text);
    const cleanContent = aiRes.text
      .replace(/<tool_call>.*?<\/?tool_call>/gs, "")
      .trim();

    // No more tools — this is the final answer
    if (!toolCalls || toolCalls.length === 0) {
      const userMsg = [...messages].reverse().find((m) => m.role === "user");
      storeHistory(userId, userMsg ? extractText(userMsg) : "", cleanContent);

      yield {
        type: "TEXT_MESSAGE_START",
        timestamp: now(),
        messageId,
        role: "assistant",
      };
      let accumulated = "";
      for (const chunk of cleanContent.split(/(\s+)/).filter(Boolean)) {
        accumulated += chunk;
        yield {
          type: "TEXT_MESSAGE_CONTENT",
          timestamp: now(),
          messageId,
          delta: chunk,
          content: accumulated,
        };
      }
      yield { type: "TEXT_MESSAGE_END", timestamp: now(), messageId };
      if (allToolsUsed.length > 0) {
        yield {
          type: "CUSTOM",
          timestamp: now(),
          name: "tools_used",
          value: { tools: allToolsUsed },
        };
      }
      yield {
        type: "RUN_FINISHED",
        timestamp: now(),
        runId,
        finishReason: "stop",
      };
      return;
    }

    // Execute tools
    yield {
      type: "CUSTOM",
      timestamp: now(),
      name: "agent_step",
      value: {
        step: "executing_tools",
        count: toolCalls.length,
        tools: toolCalls.map((t) => t.name),
      },
    };

    const toolResults: Record<string, unknown> = {};
    for (const toolCall of toolCalls) {
      allToolsUsed.push(toolCall.name);
      yield {
        type: "CUSTOM",
        timestamp: now(),
        name: "agent_step",
        value: { step: "executing_tool", tool: toolCall.name },
      };

      const isLocal =
        toolCall.name.startsWith("canva_") ||
        toolCall.name.startsWith("lark_") ||
        toolCall.name.startsWith("figma_") ||
        toolCall.name.startsWith("media_");

      try {
        const result = isLocal
          ? await callLocalMCPTool(toolCall.name, toolCall.arguments, localClient)
          : await callMCPTool(toolCall.name, toolCall.arguments, remoteClient);
        toolResults[toolCall.name] = result;
        const hasError =
          result && typeof result === "object" && "error" in result;
        yield {
          type: "CUSTOM",
          timestamp: now(),
          name: "agent_step",
          value: {
            step: "tool_result",
            tool: toolCall.name,
            success: !hasError,
          },
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Tool failed";
        toolResults[toolCall.name] = { error: errorMsg };
        yield {
          type: "CUSTOM",
          timestamp: now(),
          name: "agent_step",
          value: {
            step: "tool_result",
            tool: toolCall.name,
            success: false,
            error: errorMsg,
          },
        };
      }
    }

    // Append this turn to context and loop back
    currentMessages = [
      ...currentMessages,
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
            content: `Here are the results from the tools:\n\n${JSON.stringify(toolResults, null, 2)}\n\nIf you need to call more tools to complete the request, do so. Otherwise, respond naturally with the final answer.`,
          },
        ],
      } as UIMessage,
    ];
  }

  // Max turns exceeded — return a graceful fallback
  const userMsg = [...messages].reverse().find((m) => m.role === "user");
  const fallback = "I'm working on that but it's taking a bit longer than expected. Let me get back to you in a moment!";
  storeHistory(userId, userMsg ? extractText(userMsg) : "", fallback);

  yield {
    type: "TEXT_MESSAGE_START",
    timestamp: now(),
    messageId,
    role: "assistant",
  };
  let accumulated = "";
  for (const chunk of fallback.split(/(\s+)/).filter(Boolean)) {
    accumulated += chunk;
    yield {
      type: "TEXT_MESSAGE_CONTENT",
      timestamp: now(),
      messageId,
      delta: chunk,
      content: accumulated,
    };
  }
  yield { type: "TEXT_MESSAGE_END", timestamp: now(), messageId };
  yield {
    type: "CUSTOM",
    timestamp: now(),
    name: "tools_used",
    value: { tools: allToolsUsed },
  };
  yield {
    type: "RUN_FINISHED",
    timestamp: now(),
    runId,
    finishReason: "stop",
  };
}

async function runChatAgentJSON(
  messages: Array<UIMessage | ModelMessage>,
  userId: string
): Promise<NextResponse> {
  const remoteClient = new RemoteMCPClient();
  const localClient = new LocalMCPClient();

  let mcpTools = [] as Awaited<ReturnType<typeof listMCPTools>>;
  try {
    const [remote, local] = await Promise.all([
      listMCPTools(remoteClient).catch(() => [] as typeof mcpTools),
      listLocalMCPTools(localClient).catch(() => [] as typeof mcpTools),
    ]);
    mcpTools = [...remote, ...local];
  } catch (e) {
    console.error("[Chat] MCP unavailable:", e);
  }

  let initialRes: { text: string; model: string };
  try {
    initialRes = await getChatResponse(messages, {
      systemPrompt: buildToolPrompt(mcpTools),
      userId,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to connect to AI",
    });
  }

  const toolCalls = parseToolCalls(initialRes.text);
  const cleanContent = initialRes.text
    .replace(/<tool_call>.*?<\/?tool_call>/gs, "")
    .trim();

  if (!toolCalls || toolCalls.length === 0) {
    const userMsg = [...messages].reverse().find((m) => m.role === "user");
    storeHistory(userId, userMsg ? extractText(userMsg) : "", cleanContent);
    return NextResponse.json({
      success: true,
      response: cleanContent,
      toolsUsed: [],
      model: initialRes.model,
    });
  }

  const toolResults: Record<string, unknown> = {};
  for (const toolCall of toolCalls) {
    const isLocal =
      toolCall.name.startsWith("canva_") ||
      toolCall.name.startsWith("lark_") ||
      toolCall.name.startsWith("figma_") ||
      toolCall.name.startsWith("media_");
    const result = isLocal
      ? await callLocalMCPTool(toolCall.name, toolCall.arguments, localClient)
      : await callMCPTool(toolCall.name, toolCall.arguments, remoteClient);
    toolResults[toolCall.name] = result;
  }

  const toolMessages: Array<UIMessage | ModelMessage> = [
    ...messages,
    {
      id: generateId("msg"),
      role: "assistant",
      parts: [
        { type: "text", content: cleanContent || "Let me check that for you!" },
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
    const userMsg = [...messages].reverse().find((m) => m.role === "user");
    storeHistory(userId, userMsg ? extractText(userMsg) : "", cleanContent);
    return NextResponse.json({
      success: true,
      response: cleanContent,
      toolsUsed: toolCalls.map((t) => t.name),
      model: initialRes.model,
    });
  }

  const userMsg = [...messages].reverse().find((m) => m.role === "user");
  storeHistory(userId, userMsg ? extractText(userMsg) : "", finalRes.text);

  return NextResponse.json({
    success: true,
    response: finalRes.text,
    toolsUsed: toolCalls.map((t) => t.name),
    model: finalRes.model,
  });
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

function extractText(msg: UIMessage | ModelMessage | undefined): string {
  if (!msg) return "";
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
