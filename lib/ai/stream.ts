import type { StreamChunk, UIMessage, ModelMessage } from "@tanstack/ai";
import { callCloudflare, PRIMARY_MODEL, FALLBACK_MODEL, toCloudflareMessages } from "./provider";

function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

  let result: { text: string; model: string; usage?: any };
  const cfMessages = toCloudflareMessages(messages, opts.systemPrompt);

  try {
    result = await callCloudflare(PRIMARY_MODEL, cfMessages, opts.signal, opts.userId);
  } catch (primaryErr) {
    console.warn("[AI] Primary model failed, trying fallback:", primaryErr);
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
    const res = await callCloudflare(PRIMARY_MODEL, cfMessages, opts.signal, opts.userId);
    return { text: res.text, model: res.model };
  } catch (primaryErr) {
    console.warn("[AI] Primary model failed, trying fallback:", primaryErr);
    const res = await callCloudflare(
      FALLBACK_MODEL,
      cfMessages,
      AbortSignal.timeout(8000),
      opts.userId
    );
    return { text: res.text, model: res.model };
  }
}
