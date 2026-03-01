import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.POSTFORME_API_URL || "https://api.postforme.dev";
const API_KEY = process.env.POSTFORME_API_KEY;

/**
 * GET /api/post-results/[id]
 * Get a single post result by ID
 * Official API: GET /v1/social-post-results/{id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const { id } = await params;

    const response = await fetch(`${API_BASE}/v1/social-post-results/${id}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Post For Me API error: ${error}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching post result:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
