import { NextRequest, NextResponse } from "next/server";
import {
  PostForMeWebhook,
  PostForMeWebhookListResponse,
} from "@/types/webhooks";

const API_BASE = process.env.POSTFORME_API_URL || "https://api.postforme.dev";
const API_KEY = process.env.POSTFORME_API_KEY;

/**
 * GET /api/webhooks
 * List all webhooks with optional filtering
 * Official API: GET /v1/webhooks
 *
 * Query Parameters:
 * - offset: number (default: 0)
 * - limit: number (default: 20)
 * - url: string[] (filter by URL, OR logic for multiple)
 * - event_type: string[] (filter by event type, OR logic for multiple)
 * - id: string[] (filter by webhook ID, OR logic for multiple)
 */
export async function GET(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParts: string[] = [];

    // Pagination
    const offset = searchParams.get("offset") || "0";
    const limit = searchParams.get("limit") || "20";
    queryParts.push(`offset=${offset}`, `limit=${limit}`);

    // Filters (can be arrays - OR logic)
    const urls = searchParams.getAll("url");
    urls.forEach((u) => queryParts.push(`url=${encodeURIComponent(u)}`));

    const eventTypes = searchParams.getAll("event_type");
    eventTypes.forEach((e) =>
      queryParts.push(`event_type=${encodeURIComponent(e)}`),
    );

    const ids = searchParams.getAll("id");
    ids.forEach((i) => queryParts.push(`id=${encodeURIComponent(i)}`));

    const query = queryParts.join("&");

    const response = await fetch(`${API_BASE}/v1/webhooks?${query}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Post For Me API error: ${error}` },
        { status: response.status },
      );
    }

    const data: PostForMeWebhookListResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE}/v1/webhooks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Post For Me API error: ${error}` },
        { status: response.status },
      );
    }

    const data: PostForMeWebhook = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
