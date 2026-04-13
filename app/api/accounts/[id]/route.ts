import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me-client";
import { APIError } from "post-for-me";
import { parseBody, validateId } from "@/lib/validations";
import { UpdateAccountSchema } from "@/lib/validations/accounts";
import { handleApiError } from "@/lib/api-errors";
import type { PostForMeError } from "@/types/post-for-me-types";

/**
 * GET /api/accounts/[id]
 * Official API: GET /v1/social-accounts/{id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "account");
    if (idError) return idError;
    const data = await pfm.socialAccounts.retrieve(id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching account" });
  }
}

/**
 * PATCH /api/accounts/[id]
 * Official API: PATCH /v1/social-accounts/{id}
 *
 * Update account properties like username or external_id.
 * Note: Cannot update tokens or platform - use connect/disconnect for that.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "account");
    if (idError) return idError;

    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        {
          error: "Bad Request",
          message: "Invalid JSON in request body",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const parsed = parseBody(UpdateAccountSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const data = await pfm.socialAccounts.update(id, parsed.data);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "updating account" });
  }
}
