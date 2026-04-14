import type { UIMessage, ModelMessage } from "@tanstack/ai";
import { type MCPTool } from "@/lib/mcp";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const PRIMARY_MODEL = "@cf/meta/llama-3.1-70b-instruct";
const FALLBACK_MODEL = "@cf/moonshotai/kimi-k2.5";

export const RESPONSE_PROMPT = `You are a friendly, concise, helpful assistant. Avoid long paragraphs. You are a SMM(Social Media Manager) assistant helping with social media tasks.
Respond naturally, like a friendly human assistant would.`;

const ACCOUNT_ID_HINT = `IMPORTANT: Some tools require a specific social account ID (like 'spc_xxx').
Before calling 'create_post', 'get_posting_stats', or any tool that needs an account ID, you MUST first call 'list_social_accounts' to get the correct ID.
If the user mentions a platform like "Instagram", find the account with that platform in the list and use its 'id'.`;

function buildToolPrompt(tools: MCPTool[]): string {
  if (!tools || tools.length === 0) return RESPONSE_PROMPT;

  const toolDescriptions = tools
    .map((tool) => {
      const schema = JSON.stringify(tool.inputSchema, null, 2);
      return `- ${tool.name}: ${tool.description}\n  Schema: ${schema}`;
    })
    .join("\n\n");

  return `${RESPONSE_PROMPT}

${ACCOUNT_ID_HINT}

You have access to the following tools. Use them when appropriate. When you decide to use a tool, include it exactly like this in your response:
<tool_call>{"name": "tool_name", "arguments": {"key": "value"}}</tool_call>

You can include a brief message before or after the tool call if you want.

Available tools:
${toolDescriptions}`;
}

async function callCloudflare(
  model: string,
  messages: Array<{ role: string; content: string }>,
  signal?: AbortSignal,
  userId?: string
): Promise<Response> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error("Cloudflare AI credentials not configured");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CF_API_TOKEN}`,
      ...(userId && { "x-session-affinity": userId }),
    },
    body: JSON.stringify({ messages, max_tokens: 2048 }),
    signal: signal || AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Cloudflare AI error ${res.status}: ${errorText}`);
  }

  return res;
}

export interface ChatResponse {
  text: string;
  model: string;
}

export async function getChatResponse(
  messages: Array<UIMessage | ModelMessage>,
  opts: {
    systemPrompt?: string;
    userId?: string;
  } = {}
): Promise<ChatResponse> {
  const converted = toCloudflareMessages(messages, opts.systemPrompt);

  try {
    const res = await callCloudflare(PRIMARY_MODEL, converted, undefined, opts.userId);
    const data = await res.json();
    const text =
      data?.result?.choices?.[0]?.message?.content ||
      data?.result?.response ||
      "";
    return { text: text.trim() || "I'm not sure how to respond to that.", model: PRIMARY_MODEL };
  } catch (err) {
    console.warn("[AI] Primary model failed, trying fallback:", err);
    const res = await callCloudflare(
      FALLBACK_MODEL,
      converted,
      AbortSignal.timeout(8000),
      opts.userId
    );
    const data = await res.json();
    const text =
      data?.result?.choices?.[0]?.message?.content ||
      data?.result?.response ||
      "";
    return { text: text.trim() || "I'm not sure how to respond to that.", model: FALLBACK_MODEL };
  }
}

export async function* streamChatResponse(
  messages: Array<UIMessage | ModelMessage>,
  opts: {
    systemPrompt?: string;
    userId?: string;
    runId?: string;
    messageId?: string;
  } = {}
): AsyncGenerator<any, void, unknown> {
  const {
    userId,
    systemPrompt,
    runId = `run_${Date.now()}`,
    messageId = `msg_${Date.now()}`,
  } = opts;

  const converted = toCloudflareMessages(messages, systemPrompt);

  yield { type: "RUN_STARTED", timestamp: Date.now(), runId };
  yield {
    type: "TEXT_MESSAGE_START",
    timestamp: Date.now(),
    messageId,
    role: "assistant",
  };

  let result: ChatResponse;
  try {
    result = await getChatResponse(messages, { systemPrompt, userId });
  } catch (err) {
    console.error("[AI] Stream failed:", err);
    yield {
      type: "RUN_ERROR",
      timestamp: Date.now(),
      runId,
      message:
        err instanceof Error
          ? err.message
          : "I'm having trouble connecting to the AI. Please try again in a moment!",
    };
    return;
  }

  const text = result.text;
  const words = text.split(/(\s+)/).filter(Boolean);
  let accumulated = "";

  for (const word of words) {
    accumulated += word;
    yield {
      type: "TEXT_MESSAGE_CONTENT",
      timestamp: Date.now(),
      messageId,
      delta: word,
      content: accumulated,
    };
  }

  yield { type: "TEXT_MESSAGE_END", timestamp: Date.now(), messageId };
  yield {
    type: "RUN_FINISHED",
    timestamp: Date.now(),
    runId,
    finishReason: "stop",
    usage: { promptTokens: 0, completionTokens: words.length },
  };
}

function toCloudflareMessages(
  messages: Array<UIMessage | ModelMessage>,
  systemPrompt?: string
): Array<{ role: string; content: string }> {
  const out: Array<{ role: string; content: string }> = [];

  if (systemPrompt) {
    out.push({ role: "system", content: systemPrompt });
  }

  for (const msg of messages) {
    const role = msg.role === "assistant" ? "assistant" : "user";
    let content = "";

    if ("parts" in msg && Array.isArray(msg.parts)) {
      content = msg.parts
        .filter((p) => p.type === "text")
        .map((p) => ("content" in p ? String(p.content) : ""))
        .join("");
    } else if ("content" in msg && typeof msg.content === "string") {
      content = msg.content;
    }

    if (content.trim()) {
      out.push({ role, content });
    }
  }

  return out;
}

export async function callChatAgentJSON(
  messages: Array<{ role: string; content: string }>,
  userId?: string
): Promise<{ response: string; model: string }> {
  const converted = messages.map((m) => ({
    id: generateId("msg"),
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    parts: [{ type: "text" as const, content: m.content }],
  }));
  const res = await getChatResponse(converted, { userId });
  return { response: res.text, model: res.model };
}

function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export { buildToolPrompt };
