import { NextResponse } from "next/server";
import { z } from "zod";
import { updateCampaign, deleteCampaign } from "@/lib/canva-catalog-lark";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const UpdateCampaignSchema = z.object({
  Name: z.string().min(1).optional(),
  "Date Start": z.string().optional(),
  "Date End": z.string().optional(),
  Status: z.enum(["draft", "generating", "ready", "archived"]).optional(),
});

/**
 * PATCH /api/canva/campaigns/{id}
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const parseResult = UpdateCampaignSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return sendErrorResponse(buildValidationError(issues.join("; "), issues), 400);
    }

    await updateCampaign(id, parseResult.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { context: "updating Canva campaign" });
  }
}

/**
 * DELETE /api/canva/campaigns/{id}
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return sendErrorResponse(buildValidationError("Campaign ID is required", ["Campaign ID is required"]), 400);
    }
    await deleteCampaign(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { context: "deleting Canva campaign" });
  }
}
