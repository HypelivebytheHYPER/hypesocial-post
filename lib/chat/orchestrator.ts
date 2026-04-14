import type { UIMessage, ModelMessage } from "@tanstack/ai";
import { getChatResponse, buildToolPrompt, RESPONSE_PROMPT } from "@/lib/ai";
import {
  listMCPTools,
  callMCPTool,
  listLocalMCPTools,
  callLocalMCPTool,
  parseToolCalls,
  type MCPTool,
} from "@/lib/mcp";
import { storeHistory } from "./history";

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

export interface ChatResult {
  response: string;
  toolsUsed: string[];
  model: string;
}

export async function runChatAgent(
  messages: Array<UIMessage | ModelMessage>,
  userId: string
): Promise<ChatResult> {
  // 1. Collect available MCP tools
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

  // 2. First AI call to detect tool intent
  const initialRes = await getChatResponse(messages, {
    systemPrompt: buildToolPrompt(mcpTools),
    userId,
  });

  const toolCalls = parseToolCalls(initialRes.text);
  const cleanContent = initialRes.text
    .replace(/<tool_call>.*?<\/tool_call>/gs, "")
    .trim();

  // 3. No tools needed — return immediately
  if (!toolCalls || toolCalls.length === 0) {
    const userMsg = [...messages].reverse().find((m) => m.role === "user");
    storeHistory(userId, userMsg ? extractText(userMsg) : "", cleanContent);
    return { response: cleanContent, toolsUsed: [], model: initialRes.model };
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
    // Fallback to the clean first response if second call fails
    const userMsg = [...messages].reverse().find((m) => m.role === "user");
    storeHistory(userId, userMsg ? extractText(userMsg) : "", cleanContent);
    return {
      response: cleanContent,
      toolsUsed: toolCalls.map((t) => t.name),
      model: initialRes.model,
    };
  }

  const userMsg = [...messages].reverse().find((m) => m.role === "user");
  storeHistory(userId, userMsg ? extractText(userMsg) : "", finalRes.text);

  return {
    response: finalRes.text,
    toolsUsed: toolCalls.map((t) => t.name),
    model: finalRes.model,
  };
}

function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
