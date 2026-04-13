import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";
import { PAGINATION } from "@/lib/constants";

const FeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).optional(),
  cursor: z.string().optional(),
  expand: z.string().optional(),
});

/**
 * GET /api/account-feeds/[accountId]
 * Official API: GET /v1/social-account-feeds/{accountId}
 *
 * Get feed items for a specific social account.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const { accountId } = await params;

    if (!accountId) {
      return sendErrorResponse(
        buildValidationError("Account ID is required", ["accountId is required"]),
        400,
      );
    }

    const { searchParams } = new URL(request.url);

    const queryResult = FeedQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      expand: searchParams.get("expand") ?? undefined,
    });

    if (!queryResult.success) {
      const issues = queryResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(`Invalid query parameters: ${issues.join(", ")}`, issues),
        400,
      );
    }

    const query: Record<string, string> = {};
    if (queryResult.data.limit) query.limit = queryResult.data.limit.toString();
    if (queryResult.data.cursor) query.cursor = queryResult.data.cursor;
    if (queryResult.data.expand) query.expand = queryResult.data.expand;

    const data = await pfm.socialAccountFeeds.list(accountId, Object.keys(query).length > 0 ? query : undefined);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching account feed" });
  }
}
