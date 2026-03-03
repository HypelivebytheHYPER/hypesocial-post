import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";
import { validateId } from "@/lib/validations";

/**
 * POST /api/accounts/[id]/disconnect
 * Disconnect a social account
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
    const data = await pfm.socialAccounts.disconnect(id);
    console.log("[API] POST /accounts/disconnect", { id });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error disconnecting account:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
