/**
 * Cloudflare AI Chat Agent Client
 * Calls Cloudflare Workers AI REST API directly (bypasses the hanging worker binding)
 */

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const MODEL = "@cf/moonshotai/kimi-k2.5";
const CF_AI_URL = CF_ACCOUNT_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${MODEL}`
  : null;

export interface ChatAgentResponse {
  response: string;
  model: string;
}

function extractResponseText(data: any): string {
  // OpenAI-compatible format from Cloudflare REST API
  const choice = data?.result?.choices?.[0] ?? data?.choices?.[0];
  const msg = choice?.message;
  return (msg?.content || msg?.reasoning || msg?.reasoning_content || data?.result?.response || "").trim();
}

function getHeaders(userId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CF_API_TOKEN || ""}`,
  };
  if (userId) {
    // Session affinity improves prefix caching and routing consistency
    headers["x-session-affinity"] = userId;
  }
  return headers;
}

/**
 * Call Cloudflare AI Agent (returns raw Response for streaming or JSON parsing)
 */
export async function callChatAgent(
  messages: Array<{ role: string; content: string }>,
  stream: boolean = false,
  userId?: string
): Promise<Response> {
  if (!CF_AI_URL || !CF_API_TOKEN) {
    throw new Error("Cloudflare AI credentials not configured");
  }

  return fetch(CF_AI_URL, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify({
      messages,
      max_tokens: 2048,
      stream,
    }),
    signal: AbortSignal.timeout(stream ? 25000 : 15000),
  });
}

/**
 * Call agent and get parsed JSON response (non-streaming)
 */
export async function callChatAgentJSON(
  messages: Array<{ role: string; content: string }>,
  userId?: string
): Promise<ChatAgentResponse> {
  const res = await callChatAgent(messages, false, userId);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Cloudflare AI error ${res.status}: ${error}`);
  }

  const data = await res.json();
  const text = extractResponseText(data);

  return {
    response: text || "I'm not sure how to respond to that.",
    model: MODEL,
  };
}

/**
 * Generic fallback when agent is unavailable
 */
export function getFallbackResponse(): ChatAgentResponse {
  return {
    response: "I'm having trouble connecting to the AI right now. Please try again in a moment!",
    model: "fallback",
  };
}
