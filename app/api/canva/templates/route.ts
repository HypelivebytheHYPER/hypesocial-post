import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listCanvaBrandTemplates } from "@/lib/canva-client";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const QuerySchema = z.object({
  continuation: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  query: z.string().optional(),
});

/**
 * GET /api/canva/templates
 *
 * Proxy list brand templates from Canva Connect API.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const queryResult = QuerySchema.safeParse({
      continuation: searchParams.get("continuation") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      query: searchParams.get("query") ?? undefined,
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

    const data = await listCanvaBrandTemplates(queryResult.data);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching Canva brand templates" });
  }
}
