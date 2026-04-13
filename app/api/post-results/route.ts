import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import { PAGINATION } from "@/lib/constants";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const ListPostResultsQuerySchema = z.object({
  post_id: z.array(z.string()).optional(),
  social_account_id: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/post-results
 * Official API: GET /v1/post-results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const queryResult = ListPostResultsQuerySchema.safeParse({
      post_id: searchParams.getAll("post_id"),
      social_account_id: searchParams.getAll("social_account_id"),
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
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

    const query: Record<string, string | string[]> = {};
    if (queryResult.data.post_id?.length) query.post_id = queryResult.data.post_id;
    if (queryResult.data.social_account_id?.length) query.social_account_id = queryResult.data.social_account_id;
    if (queryResult.data.limit) query.limit = queryResult.data.limit.toString();
    if (queryResult.data.offset !== undefined) query.offset = queryResult.data.offset.toString();

    const data = await pfm.socialPostResults.list(Object.keys(query).length > 0 ? query : undefined);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching post results" });
  }
}
