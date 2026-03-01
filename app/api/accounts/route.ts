import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";

/**
 * GET /api/accounts
 * Official API: GET /v1/social-accounts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const data = await pfm.socialAccounts.list({
      offset: Number(searchParams.get("offset") || 0),
      limit: Number(searchParams.get("limit") || 20),
      platform: searchParams.getAll("platform"),
      status: searchParams.getAll("status") as any,
      username: searchParams.getAll("username"),
      external_id: searchParams.getAll("external_id"),
      id: searchParams.getAll("id"),
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}

/**
 * POST /api/accounts
 * Create or update a social account directly
 * Official API: POST /v1/social-accounts
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, any>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    const errors: string[] = [];
    if (!body.platform || typeof body.platform !== "string") {
      errors.push("platform is required");
    }
    if (!body.user_id || typeof body.user_id !== "string") {
      errors.push("user_id is required");
    }
    if (!body.access_token || typeof body.access_token !== "string") {
      errors.push("access_token is required");
    }
    if (!body.access_token_expires_at) {
      errors.push("access_token_expires_at is required");
    }

    if (errors.length > 0) {
      return NextResponse.json<PostForMeError>(
        { error: "Validation Error", message: errors.join("; "), statusCode: 400, details: { fields: errors } },
        { status: 400 },
      );
    }

    const data = await pfm.socialAccounts.create(body as any);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error creating account:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
