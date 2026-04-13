import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me-client";
import { parseBody, validateId } from "@/lib/validations";
import { UpdatePostSchema } from "@/lib/validations/posts";
import { handleApiError, sendErrorResponse, buildValidationError } from "@/lib/api-errors";
import type { PostForMeError } from "@/types/post-for-me-types";

/**
 * GET /api/posts/[id]
 * Official API: GET /v1/social-posts/{id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "post");
    if (idError) return idError;
    const data = await pfm.socialPosts.retrieve(id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching post" });
  }
}

/**
 * PUT /api/posts/[id]
 * Official API: PUT /v1/social-posts/{id}
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "post");
    if (idError) return idError;

    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return sendErrorResponse(
        buildValidationError("Invalid JSON in request body", ["Invalid JSON"]),
        400,
      );
    }

    const parsed = parseBody(UpdatePostSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const body = parsed.data;

    // Validate scheduled_at is in the future (skip for drafts)
    if (body.scheduled_at && !body.isDraft) {
      const scheduledDate = new Date(body.scheduled_at);
      if (scheduledDate < new Date()) {
        return sendErrorResponse(
          buildValidationError("scheduled_at must be in the future", [
            "scheduled_at must be in the future",
          ]),
          400,
        );
      }
    }

    type UpdateInput = Parameters<typeof pfm.socialPosts.update>[1];
    const data = await pfm.socialPosts.update(
      id,
      body as unknown as UpdateInput,
    );
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "updating post" });
  }
}

/**
 * DELETE /api/posts/[id]
 * Official API: DELETE /v1/social-posts/{id}
 * Returns: 200 { success: true }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "post");
    if (idError) return idError;
    await pfm.socialPosts.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { context: "deleting post" });
  }
}
