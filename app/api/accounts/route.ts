import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import { APIError } from "post-for-me";
import { PAGINATION } from "@/lib/constants";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";
import type { PostForMeError } from "@/types/post-for-me-types";

const ListAccountsQuerySchema = z.object({
  platform: z.array(z.string()).optional(),
  status: z.array(z.enum(["connected", "disconnected"])).optional(),
  username: z.array(z.string()).optional(),
  external_id: z.array(z.string()).optional(),
  id: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
});

const CreateAccountSchema = z.object({
  platform: z.string(),
  code: z.string(),
  redirect_uri: z.string().url().optional(),
});

/**
 * GET /api/accounts
 * Official API: GET /v1/social-accounts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const queryResult = ListAccountsQuerySchema.safeParse({
      platform: searchParams.getAll("platform"),
      status: searchParams.getAll("status"),
      username: searchParams.getAll("username"),
      external_id: searchParams.getAll("external_id"),
      id: searchParams.getAll("id"),
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!queryResult.success) {
      const issues = queryResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(`Invalid query parameters: ${issues.join(", ")}`, issues),
        400,
      );
    }

    const data = await pfm.socialAccounts.list(queryResult.data);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching accounts" });
  }
}

/**
 * POST /api/accounts
 * Official API: POST /v1/social-accounts (OAuth callback completion)
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

    const parseResult = CreateAccountSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(issues.join("; "), issues),
        400,
      );
    }

    const body = parseResult.data;
    // Use raw HTTP since SDK create() expects tokens, not OAuth code
    const data = await pfm.post("/v1/social-accounts", { body });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error, { context: "creating account" });
  }
}
