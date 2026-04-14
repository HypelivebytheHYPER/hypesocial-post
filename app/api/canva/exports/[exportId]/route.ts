import { NextResponse } from "next/server";
import { getExportJob } from "@/lib/canva-client";
import { handleApiError, buildValidationError, sendErrorResponse } from "@/lib/api-errors";

/**
 * GET /api/canva/exports/{exportId}
 *
 * Proxy get export job from Canva Connect API.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ exportId: string }> },
) {
  try {
    const { exportId } = await params;
    if (!exportId || exportId.trim() === "") {
      return sendErrorResponse(
        buildValidationError("Export ID is required", ["Export ID is required"]),
        400,
      );
    }

    const data = await getExportJob(exportId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching Canva export job" });
  }
}
