/**
 * Cloudflare AI Chat Agent
 * Pure Kimi k2.5 proxy - handles AI reasoning
 * Supports "streaming" by chunking the full response (Kimi streaming currently emits reasoning tokens only)
 */

export interface Env {
  AI: any;
}

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
}

const MODEL = "@cf/moonshotai/kimi-k2.5";

export default {
  async fetch(request: Request, env: Env, ctx: { waitUntil: (promise: Promise<unknown>) => void }): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    try {
      const body: ChatRequest = await request.json();
      const { messages, stream = false } = body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return jsonResponse({ error: "messages array required" }, 400);
      }

      // Get full response from Kimi (non-streaming to avoid reasoning-only chunks)
      const response = await env.AI.run(MODEL, {
        messages,
        max_completion_tokens: 2048,
      });

      const text = extractResponseText(response);

      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();
        
        ctx.waitUntil((async () => {
          try {
            await writer.write(encoder.encode(`event: meta\ndata: ${JSON.stringify({ model: MODEL })}\n\n`));
            
            // Split into chunks and stream with small delays
            const chunks = text.split(/(\s+)/).filter(Boolean);
            for (let i = 0; i < chunks.length; i++) {
              const batchSize = Math.min(Math.floor(Math.random() * 3) + 1, chunks.length - i);
              const batch = chunks.slice(i, i + batchSize).join("");
              i += batchSize - 1;
              
              await writer.write(encoder.encode(
                `event: text\ndata: ${JSON.stringify({ chunk: batch })}\n\n`
              ));
              
              if (batchSize < 3) {
                await new Promise(r => setTimeout(r, 10));
              }
            }
            
            await writer.write(encoder.encode(`event: done\ndata: {}\n\n`));
          } catch (err) {
            console.error("[ChatAgent] Stream error:", err);
          } finally {
            await writer.close();
          }
        })());
        
        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      return jsonResponse({
        response: text,
        model: MODEL,
      });
    } catch (error: any) {
      console.error("[ChatAgent] Error:", error);
      return jsonResponse({ error: error.message || "Internal error" }, 500);
    }
  },
};

function extractResponseText(response: any): string {
  const choice = response?.choices?.[0];
  const message = choice?.message;
  return (message?.content || message?.reasoning || message?.reasoning_content || "").trim();
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
