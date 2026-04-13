import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const ManualCreateSchema = z.object({
  platform: z.enum([
    "facebook",
    "instagram",
    "x",
    "tiktok",
    "youtube",
    "pinterest",
    "linkedin",
    "bluesky",
    "threads",
    "tiktok_business",
  ]),
  user_id: z.string().min(1, "User ID is required"),
  access_token: z.string().min(1, "Access token is required"),
  access_token_expires_at: z.string().datetime(),
  external_id: z.string().optional(),
  username: z.string().optional(),
});

/**
 * POST /api/accounts/manual
 * Official API: POST /v1/social-accounts
 *
 * Create a social account with existing access token.
 * For manual/admin account setup or migration from another system.
 */
export async function POST(request: NextRequest) {
  try {
    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return sendErrorResponse(
        buildValidationError("Invalid JSON in request body", ["Invalid JSON"]),
        400,
      );
    }

    const parseResult = ManualCreateSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(`Validation failed: ${issues.join("; ")}`, issues),
        400,
      );
    }

    const data = await pfm.socialAccounts.create(parseResult.data);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error, { context: "creating account manually" });
  }
}
