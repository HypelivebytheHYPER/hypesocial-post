import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createResizeJob } from "@/lib/canva-client";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const ResizeSchema = z.object({
  design_id: z.string(),
  design_type: z.union([
    z.object({ type: z.literal("Template") }),
    z.object({ type: z.literal("custom"), width: z.number(), height: z.number() }),
  ]),
});

/**
 * POST /api/canva/resizes
 *
 * Proxy create resize job to Canva Connect API.
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

    const parseResult = ResizeSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(issues.join("; "), issues),
        400,
      );
    }

    const data = await createResizeJob(parseResult.data);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "creating Canva resize job" });
  }
}
