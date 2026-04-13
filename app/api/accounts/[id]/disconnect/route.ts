import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me-client";
import { APIError } from "post-for-me";
import { validateId } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

/**
 * POST /api/accounts/[id]/disconnect
 * Official API: POST /v1/social-accounts/{id}/disconnect
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "account");
    if (idError) return idError;
    await pfm.socialAccounts.disconnect(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { context: "disconnecting account" });
  }
}
