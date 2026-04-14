import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUrlAssetUploadJob } from "@/lib/canva-client";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const AssetUploadSchema = z.object({
  name: z.string(),
  url: z.string(),
});

/**
 * POST /api/canva/asset-uploads
 *
 * Proxy create asset upload job to Canva Connect API.
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

    const parseResult = AssetUploadSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(issues.join("; "), issues),
        400,
      );
    }

    const data = await createUrlAssetUploadJob(parseResult.data);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "creating Canva asset upload job" });
  }
}
