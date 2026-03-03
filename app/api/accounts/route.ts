import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";
import { parseBody, parseQuery } from "@/lib/validations";
import {
  ListAccountsQuerySchema,
  CreateAccountSchema,
} from "@/lib/validations/accounts";

/**
 * GET /api/accounts
 * Official API: GET /v1/social-accounts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = parseQuery(ListAccountsQuerySchema, {
      offset: searchParams.get("offset") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      platform: searchParams.getAll("platform"),
      status: searchParams.getAll("status"),
      username: searchParams.getAll("username"),
      external_id: searchParams.getAll("external_id"),
      id: searchParams.getAll("id"),
    });
    if (!q.success) return q.response;

    const data = await pfm.socialAccounts.list(q.data as any);

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
    let jsonBody: unknown;

    try {
      jsonBody = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    const parsed = parseBody(CreateAccountSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const data = await pfm.socialAccounts.create(parsed.data as any);
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
