/**
 * TanStack AI Chat Backend
 * Unified AI layer using Cloudflare REST API with AG-UI protocol output
 */

import type { StreamChunk, UIMessage, ModelMessage } from "@tanstack/ai";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// Primary working model on Cloudflare REST API
const PRIMARY_MODEL = "@cf/meta/llama-3.1-70b-instruct";
// Fallback model (Kimi when it comes back online)
const FALLBACK_MODEL = "@cf/moonshotai/kimi-k2.5";

const CF_AI_URL = CF_ACCOUNT_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run`
  : null;

interface CloudflareMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function extractTextContent(msg: UIMessage | ModelMessage): string {
  if ("parts" in msg && Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => ("content" in p ? String(p.content) : ""))
      .join("");
  }
  if ("content" in msg) {
    if (typeof msg.content === "string") return msg.content;
    if (Array.isArray(msg.content)) {
      return msg.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => String(c.content ?? ""))
        .join("");
    }
  }
  return "";
}

export function toCloudflareMessages(
  messages: Array<UIMessage | ModelMessage>,
  systemPrompt?: string
): CloudflareMessage[] {
  const out: CloudflareMessage[] = [];
  if (systemPrompt) {
    out.push({ role: "system", content: systemPrompt });
  }
  for (const msg of messages) {
    const role =
      msg.role === "tool"
        ? "assistant"
        : (msg.role as "system" | "user" | "assistant");
    const content = extractTextContent(msg);
    if (content || role === "assistant") {
      out.push({ role, content: content || "" });
    }
  }
  return out;
}

async function callCloudflare(
  model: string,
  messages: CloudflareMessage[],
  signal?: AbortSignal,
  userId?: string
): Promise<{ text: string; model: string; usage?: any }> {
  if (!CF_AI_URL || !CF_API_TOKEN) {
    throw new Error("Cloudflare AI credentials not configured");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${CF_API_TOKEN}`,
    "Content-Type": "application/json",
  };
  if (userId) {
    headers["x-session-affinity"] = userId;
  }

  const res = await fetch(`${CF_AI_URL}/${model}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages,
      max_tokens: 2048,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudflare AI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const result = data.result ?? data;

  // Cloudflare meta/llama returns { response: string }
  const text =
    result.response ??
    result.choices?.[0]?.message?.content ??
    result.choices?.[0]?.delta?.content ??
    "";

  return { text: text.trim(), model, usage: result.usage };
}

export async function* streamChatResponse(
  messages: Array<UIMessage | ModelMessage>,
  opts: {
    systemPrompt?: string;
    userId?: string;
    signal?: AbortSignal;
    toolsUsed?: string[];
  } = {}
): AsyncGenerator<StreamChunk> {
  const runId = generateId("run");
  const messageId = generateId("msg");
  const now = () => Date.now();

  yield { type: "RUN_STARTED", timestamp: now(), runId };
  yield {
    type: "TEXT_MESSAGE_START",
    timestamp: now(),
    messageId,
    role: "assistant",
  };

  // Try primary model first, fallback to Kimi if it fails quickly
  let result: { text: string; model: string; usage?: any };
  const cfMessages = toCloudflareMessages(messages, opts.systemPrompt);

  try {
    result = await callCloudflare(
      PRIMARY_MODEL,
      cfMessages,
      opts.signal,
      opts.userId
    );
  } catch (primaryErr) {
    console.warn("[TanStackAI] Primary model failed, trying fallback:", primaryErr);
    try {
      result = await callCloudflare(
        FALLBACK_MODEL,
        cfMessages,
        AbortSignal.timeout(8000),
        opts.userId
      );
    } catch (fallbackErr) {
      yield {
        type: "RUN_ERROR",
        timestamp: now(),
        runId,
        error: {
          message:
            fallbackErr instanceof Error
              ? fallbackErr.message
              : "AI service unavailable",
        },
      };
      return;
    }
  }

  // Chunk the response into smaller deltas for a typing effect
  const chunks = result.text.split(/(\s+)/).filter(Boolean);
  let accumulated = "";
  for (const chunk of chunks) {
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
    type: "RUN_FINISHED",
    timestamp: now(),
    runId,
    finishReason: "stop",
    usage: result.usage
      ? {
          promptTokens: result.usage.prompt_tokens ?? 0,
          completionTokens: result.usage.completion_tokens ?? 0,
          totalTokens: result.usage.total_tokens ?? 0,
        }
      : undefined,
  };
}

export async function getChatResponse(
  messages: Array<UIMessage | ModelMessage>,
  opts: {
    systemPrompt?: string;
    userId?: string;
    signal?: AbortSignal;
  } = {}
): Promise<{ text: string; model: string }> {
  const cfMessages = toCloudflareMessages(messages, opts.systemPrompt);

  try {
    const res = await callCloudflare(
      PRIMARY_MODEL,
      cfMessages,
      opts.signal,
      opts.userId
    );
    return { text: res.text, model: res.model };
  } catch (primaryErr) {
    console.warn("[TanStackAI] Primary model failed, trying fallback:", primaryErr);
    const res = await callCloudflare(
      FALLBACK_MODEL,
      cfMessages,
      AbortSignal.timeout(8000),
      opts.userId
    );
    return { text: res.text, model: res.model };
  }
}
