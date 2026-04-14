import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { buildCanvaAuthUrl } from "@/lib/canva-client";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const AuthSchema = z.object({
  redirect_path: z.string().optional(),
});

const STATE_COOKIE = "canva_oauth_state";

function generateState(redirectPath?: string): string {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64url");
  return redirectPath ? `${nonce}:${Buffer.from(redirectPath).toString("base64url")}` : nonce;
}

function parseState(state: string): { nonce: string; redirectPath?: string } {
  const parts = state.split(":");
  const nonce = parts[0]!;
  const redirectPath = parts[1] ? Buffer.from(parts[1], "base64url").toString("utf-8") : undefined;
  return { nonce, redirectPath };
}

/**
 * POST /api/canva/auth
 *
 * Initiate Canva OAuth flow.
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

    const parseResult = AuthSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(issues.join("; "), issues),
        400,
      );
    }

    const { redirect_path } = parseResult.data;
    const state = generateState(redirect_path);

    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    const authUrl = buildCanvaAuthUrl(state);
    return NextResponse.json({ auth_url: authUrl });
  } catch (error) {
    return handleApiError(error, { context: "creating Canva auth URL" });
  }
}

export { parseState, STATE_COOKIE };
