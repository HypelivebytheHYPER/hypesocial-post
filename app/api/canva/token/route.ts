import { NextResponse } from "next/server";
import { getCanvaSession, clearCanvaCookie, isCanvaConfigured } from "@/lib/canva-client";
import { handleApiError } from "@/lib/api-errors";

/**
 * GET /api/canva/token
 *
 * Check if a Canva session exists.
 */
export async function GET() {
  try {
    if (!isCanvaConfigured()) {
      return NextResponse.json({
        connected: false,
        configured: false,
        scope: null,
      });
    }
    const session = await getCanvaSession();
    return NextResponse.json({
      connected: !!session,
      configured: true,
      scope: session?.scope || null,
    });
  } catch (error) {
    return handleApiError(error, { context: "checking Canva token" });
  }
}

/**
 * DELETE /api/canva/token
 *
 * Disconnect Canva by clearing the session cookie.
 */
export async function DELETE() {
  try {
    await clearCanvaCookie();
    return NextResponse.json({ connected: false });
  } catch (error) {
    return handleApiError(error, { context: "disconnecting Canva" });
  }
}
