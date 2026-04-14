import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listPages, createPage } from "@/lib/canva-catalog-lark";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const PageSchema = z.object({
  "Campaign ID": z.string(),
  "Page Name": z.string().min(1),
  "Template ID": z.string(),
  "Mappings JSON": z.string(),
  "Design ID": z.string().optional(),
  "Resize Jobs JSON": z.string().optional(),
  "Export Jobs JSON": z.string().optional(),
  "Layers JSON": z.string().optional(),
  "Sort Order": z.number().optional(),
});

/**
 * GET /api/canva/campaigns/{id}/pages
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return sendErrorResponse(buildValidationError("Campaign ID is required", ["Campaign ID is required"]), 400);
    }
    const data = await listPages(id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error, { context: "listing Canva pages" });
  }
}

/**
 * POST /api/canva/campaigns/{id}/pages
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return sendErrorResponse(buildValidationError("Campaign ID is required", ["Campaign ID is required"]), 400);
    }

    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return sendErrorResponse(buildValidationError("Invalid JSON", ["Invalid JSON"]), 400);
    }

    const parseResult = PageSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return sendErrorResponse(buildValidationError(issues.join("; "), issues), 400);
    }

    const recordId = await createPage({ ...parseResult.data, "Campaign ID": id });
    return NextResponse.json({ record_id: recordId });
  } catch (error) {
    return handleApiError(error, { context: "creating Canva page" });
  }
}
