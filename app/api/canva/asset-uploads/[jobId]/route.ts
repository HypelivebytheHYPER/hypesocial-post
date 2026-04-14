import { NextResponse } from "next/server";
import { getUrlAssetUploadJob } from "@/lib/canva-client";
import { handleApiError, buildValidationError, sendErrorResponse } from "@/lib/api-errors";

/**
 * GET /api/canva/asset-uploads/{jobId}
 *
 * Proxy get asset upload job from Canva Connect API.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    if (!jobId || jobId.trim() === "") {
      return sendErrorResponse(
        buildValidationError("Job ID is required", ["Job ID is required"]),
        400,
      );
    }

    const data = await getUrlAssetUploadJob(jobId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching Canva asset upload job" });
  }
}
