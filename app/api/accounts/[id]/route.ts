import { NextRequest, NextResponse } from "next/server";
import {
  SocialAccount,
  UpdateSocialAccountDto,
  PostForMeError,
} from "@/types/post-for-me";

const API_BASE = process.env.POSTFORME_API_URL || "https://api.postforme.dev";
const API_KEY = process.env.POSTFORME_API_KEY;

/**
 * GET /api/accounts/[id]
 * Get a single social account by ID
 * Official API: GET /v1/social-accounts/{id}
 *
 * Path Parameters:
 * - id: string (required) - The account ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Configuration Error",
          message: "API key not configured",
          statusCode: 500,
        },
        { status: 500 },
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: "Account ID is required",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE}/v1/social-accounts/${id}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: Partial<PostForMeError>;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      if (response.status === 404) {
        return NextResponse.json<PostForMeError>(
          {
            error: "Not Found",
            message: `Account with ID '${id}' not found`,
            statusCode: 404,
          },
          { status: 404 },
        );
      }

      return NextResponse.json<PostForMeError>(
        {
          error: errorData.error || "API Error",
          message:
            errorData.message || `Failed to fetch account: ${response.status}`,
          statusCode: response.status,
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    const data: SocialAccount = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching account:", error);
    return NextResponse.json<PostForMeError>(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/accounts/[id]
 * Update a social account
 * Official API: PUT /v1/social-accounts/{id}
 *
 * Path Parameters:
 * - id: string (required) - The account ID
 *
 * Body Fields (all optional):
 * - external_id: string
 * - username: string
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Configuration Error",
          message: "API key not configured",
          statusCode: 500,
        },
        { status: 500 },
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: "Account ID is required",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    let body: Partial<UpdateSocialAccountDto>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        {
          error: "Bad Request",
          message: "Invalid JSON in request body",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    // Validate body is not empty
    if (Object.keys(body).length === 0) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message:
            "Request body cannot be empty. Provide at least one field to update (external_id or username).",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE}/v1/social-accounts/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: Partial<PostForMeError>;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      if (response.status === 404) {
        return NextResponse.json<PostForMeError>(
          {
            error: "Not Found",
            message: `Account with ID '${id}' not found`,
            statusCode: 404,
          },
          { status: 404 },
        );
      }

      return NextResponse.json<PostForMeError>(
        {
          error: errorData.error || "API Error",
          message:
            errorData.message || `Failed to update account: ${response.status}`,
          statusCode: response.status,
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    const data: SocialAccount = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error updating account:", error);
    return NextResponse.json<PostForMeError>(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/accounts/[id]
 * Disconnect/delete a social account
 * Official API: DELETE /v1/social-accounts/{id}
 *
 * Path Parameters:
 * - id: string (required) - The account ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Configuration Error",
          message: "API key not configured",
          statusCode: 500,
        },
        { status: 500 },
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: "Account ID is required",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE}/v1/social-accounts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: Partial<PostForMeError>;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      if (response.status === 404) {
        return NextResponse.json<PostForMeError>(
          {
            error: "Not Found",
            message: `Account with ID '${id}' not found`,
            statusCode: 404,
          },
          { status: 404 },
        );
      }

      return NextResponse.json<PostForMeError>(
        {
          error: errorData.error || "API Error",
          message:
            errorData.message ||
            `Failed to disconnect account: ${response.status}`,
          statusCode: response.status,
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[API] Error disconnecting account:", error);
    return NextResponse.json<PostForMeError>(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
