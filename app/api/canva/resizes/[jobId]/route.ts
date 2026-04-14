import { NextResponse } from "next/server";
import { getResizeJob } from "@/lib/canva-client";
import { handleApiError, buildValidationError, sendErrorResponse } from "@/lib/api-errors";

/**
 * GET /api/canva/resizes/{jobId}
 *
 * Proxy get resize job from Canva Connect API.
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

    const data = await getResizeJob(jobId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching Canva resize job" });
  }
}
