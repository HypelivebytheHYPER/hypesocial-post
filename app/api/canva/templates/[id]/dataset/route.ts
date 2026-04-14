import { NextResponse } from "next/server";
import { getBrandTemplateDataset } from "@/lib/canva-client";
import { handleApiError, buildValidationError, sendErrorResponse } from "@/lib/api-errors";

/**
 * GET /api/canva/templates/{id}/dataset
 *
 * Proxy brand template dataset from Canva Connect API.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id || id.trim() === "") {
      return sendErrorResponse(
        buildValidationError("Template ID is required", ["Template ID is required"]),
        400,
      );
    }

    const data = await getBrandTemplateDataset(id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching Canva brand template dataset" });
  }
}
