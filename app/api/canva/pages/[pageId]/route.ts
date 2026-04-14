import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updatePage, deletePage } from "@/lib/canva-catalog-lark";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const UpdatePageSchema = z.object({
  "Page Name": z.string().min(1).optional(),
  "Template ID": z.string().optional(),
  "Mappings JSON": z.string().optional(),
  "Design ID": z.string().optional(),
  "Resize Jobs JSON": z.string().optional(),
  "Export Jobs JSON": z.string().optional(),
  "Layers JSON": z.string().optional(),
  "Sort Order": z.number().optional(),
});

/**
 * PATCH /api/canva/pages/{pageId}
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const { pageId } = await params;
    if (!pageId) {
      return sendErrorResponse(buildValidationError("Page ID is required", ["Page ID is required"]), 400);
    }

    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return sendErrorResponse(buildValidationError("Invalid JSON", ["Invalid JSON"]), 400);
    }

    const parseResult = UpdatePageSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return sendErrorResponse(buildValidationError(issues.join("; "), issues), 400);
    }

    await updatePage(pageId, parseResult.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { context: "updating Canva page" });
  }
}

/**
 * DELETE /api/canva/pages/{pageId}
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const { pageId } = await params;
    if (!pageId) {
      return sendErrorResponse(buildValidationError("Page ID is required", ["Page ID is required"]), 400);
    }
    await deletePage(pageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { context: "deleting Canva page" });
  }
}
