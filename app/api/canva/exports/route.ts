import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createExportJob } from "@/lib/canva-client";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const ExportSchema = z.object({
  designId: z.string(),
  format: z.object({
    type: z.enum(["png", "jpg", "pdf", "mp4", "gif", "svg", "pptx"]),
  }).passthrough(),
});

/**
 * POST /api/canva/exports
 *
 * Proxy create export job to Canva Connect API.
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

    const parseResult = ExportSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(issues.join("; "), issues),
        400,
      );
    }

    const { designId, format } = parseResult.data;
    const data = await createExportJob(designId, { format });
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "creating Canva export job" });
  }
}
