import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me-client";
import { validateId } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

/**
 * GET /api/post-results/[id]
 * Official API: GET /v1/post-results/{id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "post result");
    if (idError) return idError;
    const data = await pfm.socialPostResults.retrieve(id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching post result" });
  }
}
