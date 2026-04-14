import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  createRequestContext,
  formatRequestLog,
  TRACE_HEADERS,
  runWithContext,
} from "@/lib/request-context";

const WEBHOOK_SECRET = process.env.CANVA_WEBHOOK_SECRET;

/**
 * Verify Canva webhook signature (if secret is configured)
 */
function verifySignature(request: NextRequest, body: string): boolean {
  if (!WEBHOOK_SECRET) return true; // Skip verification if not configured

  const signature = request.headers.get("x-canva-signature");
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/webhooks/canva
 * Canva webhook URL verification (challenge-response)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");

  const ctx = createRequestContext(request.headers, {
    operation: "canva_webhook_verification",
    challenge: challenge || undefined,
  });

  return runWithContext(ctx, async () => {
    if (!challenge) {
      console.log(JSON.stringify(formatRequestLog(ctx, "GET", "/api/webhooks/canva", 400, {
        error: "Missing challenge parameter",
      })));
      return NextResponse.json(
        { error: "Missing challenge parameter", request_id: ctx.requestId },
        { status: 400, headers: { [TRACE_HEADERS.REQUEST_ID]: ctx.requestId } }
      );
    }

    console.log(JSON.stringify(formatRequestLog(ctx, "GET", "/api/webhooks/canva", 200, {
      challenge,
    })));

    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
        [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
      },
    });
  });
}

/**
 * POST /api/webhooks/canva
 * Receive Canva collaboration event notifications
 */
export async function POST(request: NextRequest) {
  const ctx = createRequestContext(request.headers, {
    operation: "canva_webhook_event",
  });

  return runWithContext(ctx, async () => {
    let bodyText: string;
    try {
      bodyText = await request.text();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body", request_id: ctx.requestId },
        { status: 400, headers: { [TRACE_HEADERS.REQUEST_ID]: ctx.requestId } }
      );
    }

    if (!verifySignature(request, bodyText)) {
      console.error(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/canva", 401, {
        error: "Invalid webhook signature",
      })));
      return NextResponse.json(
        { error: "Invalid signature", request_id: ctx.requestId },
        { status: 401, headers: { [TRACE_HEADERS.REQUEST_ID]: ctx.requestId } }
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON", request_id: ctx.requestId },
        { status: 400, headers: { [TRACE_HEADERS.REQUEST_ID]: ctx.requestId } }
      );
    }

    const typedPayload = payload as Record<string, unknown>;
    const eventType = typedPayload?.event_type ?? "unknown";
    const designId = (typedPayload?.design as Record<string, unknown> | undefined)?.id ?? null;

    console.log(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/canva", 200, {
      event_type: eventType,
      design_id: designId,
      payload: payload as Record<string, unknown>,
    })));

    return NextResponse.json(
      { success: true, request_id: ctx.requestId },
      {
        status: 200,
        headers: {
          [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
          [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
        },
      }
    );
  });
}
