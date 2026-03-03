import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";
import { parseBody, validateId } from "@/lib/validations";
import { UpdateWebhookDtoSchema } from "@/lib/validations/webhooks";

/**
 * GET /api/webhooks/[id]
 * Get a single webhook by ID
 * Official API: GET /v1/webhooks/{id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "webhook");
    if (idError) return idError;
    const data = await pfm.get(`/v1/webhooks/${id}`);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error fetching webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/webhooks/[id]
 * Update a webhook
 * Official API: PATCH /v1/webhooks/{id}
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "webhook");
    if (idError) return idError;

    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    const parsed = parseBody(
      UpdateWebhookDtoSchema.refine(
        (data) => Object.keys(data).length > 0,
        { message: "Request body cannot be empty. Provide at least one field to update." },
      ),
      jsonBody,
    );
    if (!parsed.success) return parsed.response;

    const data = await pfm.patch(`/v1/webhooks/${id}`, { body: parsed.data });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error updating webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/webhooks/[id]
 * Delete a webhook
 * Official API: DELETE /v1/webhooks/{id}
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "webhook");
    if (idError) return idError;
    await pfm.delete(`/v1/webhooks/${id}`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error deleting webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
