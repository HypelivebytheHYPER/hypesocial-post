import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";
import { parseBody } from "@/lib/validations";
import { CreateWebhookDtoSchema } from "@/lib/validations/webhooks";

/**
 * GET /api/webhooks
 * List all webhooks with optional filtering
 * Official API: GET /v1/webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query: Record<string, any> = {
      offset: Number(searchParams.get("offset") || 0),
      limit: Number(searchParams.get("limit") || 20),
    };

    const urls = searchParams.getAll("url");
    if (urls.length > 0) query.url = urls;

    const eventTypes = searchParams.getAll("event_type");
    if (eventTypes.length > 0) query.event_type = eventTypes;

    const ids = searchParams.getAll("id");
    if (ids.length > 0) query.id = ids;

    const data = await pfm.get("/v1/webhooks", { query });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook
 * Official API: POST /v1/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    let jsonBody: unknown;

    try {
      jsonBody = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    const parsed = parseBody(CreateWebhookDtoSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const data = await pfm.post("/v1/webhooks", { body: parsed.data });
    console.log("[API] POST /webhooks", { id: (data as any).id, events: parsed.data.event_types?.length ?? 0 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error creating webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
