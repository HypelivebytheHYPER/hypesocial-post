/**
 * Webhook Event Queue powered by TanStack Pacer
 *
 * Processes webhook event persistence (appendEvent) with controlled concurrency
 * to prevent overwhelming downstream services during high-volume bursts.
 */

import { AsyncQueuer } from "@tanstack/pacer";
import { appendEvent, AppendEventInput, AppendEventResult } from "@/lib/lark-events";

interface QueueItem {
  input: AppendEventInput;
  traceHeaders?: Record<string, string>;
  resolve: (result: AppendEventResult) => void;
  reject: (error: Error) => void;
}

/**
 * Singleton AsyncQueuer for webhook event persistence.
 * Concurrency of 3 means up to 3 appendEvent calls can run in parallel,
 * which balances speed with not overwhelming the Lark API.
 */
export const webhookEventQueue = new AsyncQueuer<QueueItem>(
  async (item) => {
    const result = await appendEvent(item.input, item.traceHeaders);
    item.resolve(result);
    return result;
  },
  {
    concurrency: 3,
    wait: 0,
    started: true,
    throwOnError: false,
    onError: (error, item) => {
      console.error("[WebhookQueue] appendEvent failed:", error);
      item.reject(error instanceof Error ? error : new Error(String(error)));
    },
  }
);

/**
 * Enqueue an event to be persisted with controlled concurrency.
 * Returns a promise that resolves when the event is processed.
 */
export function enqueueWebhookEvent(
  input: AppendEventInput,
  traceHeaders?: Record<string, string>
): Promise<AppendEventResult> {
  return new Promise((resolve, reject) => {
    const added = webhookEventQueue.addItem({ input, traceHeaders, resolve, reject });
    if (!added) {
      reject(new Error("[WebhookQueue] Event rejected: queue is full"));
    }
  });
}

/**
 * Flush all pending webhook events immediately.
 * Useful before serverless function shutdown.
 */
export async function flushWebhookEvents(): Promise<void> {
  await webhookEventQueue.flush();
}
