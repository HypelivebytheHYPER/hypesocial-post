import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listProducts, createProducts, updateProducts, deleteProducts } from "@/lib/canva-catalog-lark";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const ProductSchema = z.object({
  "Campaign ID": z.string(),
  SKU: z.string().optional(),
  Name: z.string().min(1),
  Price: z.string(),
  Promo: z.string().optional(),
  "Image URL": z.string(),
  Category: z.string().optional(),
  "Sort Order": z.number().optional(),
});

/**
 * GET /api/canva/campaigns/{id}/products
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
    const data = await listProducts(id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error, { context: "listing Canva products" });
  }
}

/**
 * POST /api/canva/campaigns/{id}/products
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

    const records = Array.isArray(jsonBody) ? jsonBody : [jsonBody];
    const parsed = records.map((r) => ({ ...ProductSchema.parse(r), "Campaign ID": id }));
    const recordIds = await createProducts(parsed);
    return NextResponse.json({ record_ids: recordIds });
  } catch (error) {
    return handleApiError(error, { context: "creating Canva products" });
  }
}

/**
 * PATCH /api/canva/campaigns/{id}/products
 */
export async function PATCH(request: NextRequest) {
  try {
    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return sendErrorResponse(buildValidationError("Invalid JSON", ["Invalid JSON"]), 400);
    }

    const updates = z
      .array(z.object({ record_id: z.string(), fields: ProductSchema.partial() }))
      .parse(jsonBody);

    await updateProducts(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { context: "updating Canva products" });
  }
}

/**
 * DELETE /api/canva/campaigns/{id}/products
 */
export async function DELETE(request: NextRequest) {
  try {
    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return sendErrorResponse(buildValidationError("Invalid JSON", ["Invalid JSON"]), 400);
    }

    const recordIds = z.array(z.string()).parse(jsonBody);
    await deleteProducts(recordIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { context: "deleting Canva products" });
  }
}
