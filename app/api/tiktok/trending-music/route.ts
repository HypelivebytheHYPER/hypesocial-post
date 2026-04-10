import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import type { PostForMeError } from "@/types/post-for-me-types";

/**
 * GET /api/tiktok/trending-music?accountId=xxx
 * Proxy for TikTok Business CML (Commercial Music Library) trending list.
 * Uses the account's managed access_token from Post For Me — never exposed to client.
 *
 * Response shape is validated by Zod (TikTokCmlResponseSchema). Field names
 * differ slightly between TikTok API versions, so most fields are optional
 * with `.passthrough()` to keep parsing tolerant of upstream additions.
 */

// ── TikTok CML response Zod schema ──
// Field names mirror TikTok Business API v1.3 docs. Optional + passthrough
// because the API occasionally renames fields between versions.

const NumericSchema = z.union([z.string(), z.number()]);

const TrendingHistoryEntrySchema = z
  .object({
    rank_position_daily: NumericSchema.optional(),
  })
  .passthrough();

const TikTokTrackSchema = z
  .object({
    commercial_music_id: z.string(),
    artist: z.string().optional(),
    commercial_music_name: z.string().optional(),
    name: z.string().optional(),
    genres: z.array(z.string()).optional(),
    duration: z.number().optional(),
    preview_url: z.string().optional(),
    full_duration_song_clip: z
      .object({ preview_url: z.string().optional() })
      .passthrough()
      .optional(),
    thumbnail_url: z.string().optional(),
    rank_position: NumericSchema.optional(),
    trending_history: z.array(TrendingHistoryEntrySchema).optional(),
  })
  .passthrough();

const TikTokCmlResponseSchema = z
  .object({
    code: z.number(),
    message: z.string().optional(),
    data: z
      .object({
        list: z.array(TikTokTrackSchema).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// PFM social account shape we depend on for TikTok Business calls
const PfmTikTokAccountSchema = z
  .object({
    id: z.string(),
    platform: z.string(),
    access_token: z.string().optional(),
    user_id: z.string().optional(),
  })
  .passthrough();
type PfmTikTokAccount = z.infer<typeof PfmTikTokAccountSchema>;

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json<PostForMeError>(
      {
        error: "Bad Request",
        message: "accountId is required",
        statusCode: 400,
      },
      { status: 400 },
    );
  }

  try {
    // Get account details including access_token and user_id (open_id).
    // Cast through the Zod schema instead of `as any` so the fields we
    // depend on are at least runtime-validated.
    const accounts = await pfm.socialAccounts.list();
    const candidate = (accounts.data ?? []).find((a) => {
      const parsed = PfmTikTokAccountSchema.safeParse(a);
      if (!parsed.success) return false;
      return (
        parsed.data.id === accountId &&
        parsed.data.platform === "tiktok_business"
      );
    });

    if (!candidate) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Not Found",
          message: "TikTok Business account not found",
          statusCode: 404,
        },
        { status: 404 },
      );
    }

    const account: PfmTikTokAccount = PfmTikTokAccountSchema.parse(candidate);
    const accessToken = account.access_token;
    const businessId = account.user_id; // open_id format

    if (!accessToken || !businessId) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Unauthorized",
          message: "Account missing access token or user ID",
          statusCode: 401,
        },
        { status: 401 },
      );
    }

    // Call TikTok Business CML trending list API
    const countryCode = request.nextUrl.searchParams.get("country") || "TH";
    const url = new URL(
      "https://business-api.tiktok.com/open_api/v1.3/discovery/cml/trending_list/",
    );
    url.searchParams.set("business_id", businessId);
    url.searchParams.set("country_code", countryCode);

    const response = await fetch(url.toString(), {
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API] TikTok CML error:", response.status, errorText);
      return NextResponse.json<PostForMeError>(
        {
          error: "TikTok API Error",
          message: `CML request failed: ${response.status}`,
          statusCode: response.status,
        },
        { status: response.status },
      );
    }

    const rawJson: unknown = await response.json();
    const parsed = TikTokCmlResponseSchema.safeParse(rawJson);
    if (!parsed.success) {
      console.error("[API] TikTok CML schema mismatch:", parsed.error.format());
      return NextResponse.json<PostForMeError>(
        {
          error: "Bad Gateway",
          message: "TikTok API returned an unexpected shape",
          statusCode: 502,
        },
        { status: 502 },
      );
    }
    const data = parsed.data;

    if (data.code !== 0) {
      console.error("[API] TikTok CML API error:", data);
      return NextResponse.json<PostForMeError>(
        {
          error: "TikTok API Error",
          message: data.message || "Unknown CML error",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    // Normalize TikTok CML response — fields are now strongly typed via Zod
    const rawList = data.data?.list ?? [];
    const musicList = rawList.map((t) => ({
      commercial_music_id: t.commercial_music_id,
      artist: t.artist ?? "",
      name: t.commercial_music_name ?? t.name ?? "",
      genres: t.genres ?? [],
      duration: t.duration ?? 0,
      preview_url:
        t.preview_url ?? t.full_duration_song_clip?.preview_url ?? "",
      thumbnail_url: t.thumbnail_url ?? "",
      rank_position: Number(t.rank_position) || 0,
      trending_history: (t.trending_history ?? []).map(
        (h) => Number(h.rank_position_daily) || 0,
      ),
    }));

    return NextResponse.json({
      music_list: musicList,
      total: musicList.length,
    });
  } catch (error) {
    console.error("[API] Error fetching trending music:", error);
    return NextResponse.json<PostForMeError>(
      {
        error: "Internal Server Error",
        message: "Failed to fetch trending music",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
