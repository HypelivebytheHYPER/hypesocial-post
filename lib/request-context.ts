/**
 * Request Context Utilities
 * 
 * Provides trace ID generation and propagation for request tracing
 * across the application and to downstream services (Lark Base, Post For Me).
 */

import { headers } from "next/headers";
import { randomUUID } from "crypto";

// Header names for trace propagation
export const TRACE_HEADERS = {
  REQUEST_ID: "x-request-id",
  TRACE_ID: "x-trace-id",
  SPAN_ID: "x-span-id",
  PARENT_SPAN_ID: "x-parent-span-id",
  WEBHOOK_ID: "x-webhook-id",
  EVENT_TYPE: "x-event-type",
} as const;

/**
 * Generate a new trace ID
 */
export function generateTraceId(): string {
  return randomUUID();
}

/**
 * Generate a short span ID (8 chars)
 */
export function generateSpanId(): string {
  return randomUUID().slice(0, 8);
}

/**
 * Extract trace context from incoming headers
 */
export function extractTraceContext(incomingHeaders: Headers) {
  return {
    traceId: incomingHeaders.get(TRACE_HEADERS.TRACE_ID) || generateTraceId(),
    requestId: incomingHeaders.get(TRACE_HEADERS.REQUEST_ID) || generateTraceId(),
    parentSpanId: incomingHeaders.get(TRACE_HEADERS.SPAN_ID) || null,
    spanId: generateSpanId(),
  };
}

/**
 * Build outbound headers with trace propagation
 */
export function buildTraceHeaders(
  traceId: string,
  spanId: string,
  parentSpanId?: string | null
): Record<string, string> {
  const headers: Record<string, string> = {
    [TRACE_HEADERS.TRACE_ID]: traceId,
    [TRACE_HEADERS.SPAN_ID]: spanId,
  };

  if (parentSpanId) {
    headers[TRACE_HEADERS.PARENT_SPAN_ID] = parentSpanId;
  }

  return headers;
}

/**
 * Request context for a single request lifecycle
 */
export interface RequestContext {
  traceId: string;
  requestId: string;
  spanId: string;
  parentSpanId: string | null;
  startTime: number;
  metadata: Record<string, unknown>;
}

/**
 * Create a new request context
 */
export function createRequestContext(
  incomingHeaders?: Headers,
  metadata: Record<string, unknown> = {}
): RequestContext {
  const trace = incomingHeaders ? extractTraceContext(incomingHeaders) : {
    traceId: generateTraceId(),
    requestId: generateTraceId(),
    parentSpanId: null,
    spanId: generateSpanId(),
  };

  return {
    ...trace,
    startTime: Date.now(),
    metadata,
  };
}

/**
 * Format request log entry
 */
export function formatRequestLog(
  ctx: RequestContext,
  method: string,
  path: string,
  status: number,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const duration = Date.now() - ctx.startTime;

  return {
    timestamp: new Date().toISOString(),
    level: status >= 400 ? "error" : status >= 300 ? "warn" : "info",
    trace_id: ctx.traceId,
    request_id: ctx.requestId,
    span_id: ctx.spanId,
    parent_span_id: ctx.parentSpanId,
    method,
    path,
    status,
    duration_ms: duration,
    ...ctx.metadata,
    ...extra,
  };
}

/**
 * AsyncLocalStorage for request context (requires Node.js 14.8+)
 * Allows accessing context anywhere in the call stack
 */
import { AsyncLocalStorage } from "async_hooks";

let contextStorage: AsyncLocalStorage<RequestContext> | null = null;

export function getContextStorage(): AsyncLocalStorage<RequestContext> {
  if (!contextStorage) {
    contextStorage = new AsyncLocalStorage<RequestContext>();
  }
  return contextStorage;
}

/**
 * Run function with request context
 */
export function runWithContext<T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return getContextStorage().run(context, fn);
}

/**
 * Get current request context (must be called within runWithContext)
 */
export function getCurrentContext(): RequestContext | undefined {
  return getContextStorage().getStore();
}
