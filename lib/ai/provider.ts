import type { UIMessage, ModelMessage } from "@tanstack/ai";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

export const PRIMARY_MODEL = "@cf/meta/llama-3.1-70b-instruct";
export const FALLBACK_MODEL = "@cf/moonshotai/kimi-k2.5";

const CF_AI_URL = CF_ACCOUNT_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run`
  : null;

interface CloudflareMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

export async function callCloudflare(
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
    body: JSON.stringify({ messages, max_tokens: 2048 }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudflare AI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const result = data.result ?? data;

  const text =
    result.response ??
    result.choices?.[0]?.message?.content ??
    result.choices?.[0]?.delta?.content ??
    "";

  return { text: text.trim(), model, usage: result.usage };
}
