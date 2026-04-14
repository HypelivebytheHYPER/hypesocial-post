import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAutofillJob } from "@/lib/canva-client";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const AutofillSchema = z.object({
  brand_template_id: z.string(),
  title: z.string().optional(),
  data: z.record(z.any()),
});

/**
 * POST /api/canva/autofills
 *
 * Proxy create autofill job to Canva Connect API.
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

    const parseResult = AutofillSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(issues.join("; "), issues),
        400,
      );
    }

    const data = await createAutofillJob(parseResult.data);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "creating Canva autofill job" });
  }
}
