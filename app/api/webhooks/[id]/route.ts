import { NextRequest, NextResponse } from "next/server";
import { PostForMeWebhook } from "@/types/webhooks";

const API_BASE = process.env.POSTFORME_API_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;

/**
 * GET /api/webhooks/[id]
 * Get a single webhook by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const { id } = await params;

    const response = await fetch(`${API_BASE}/v1/webhooks/${id}`, {
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

    const data: PostForMeWebhook = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/webhooks/[id]
 * Update a webhook
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${API_BASE}/v1/webhooks/${id}`, {
      method: "PATCH",
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
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error updating webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/webhooks/[id]
 * Delete a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const { id } = await params;

    const response = await fetch(`${API_BASE}/v1/webhooks/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Post For Me API error: ${error}` },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
