import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me-client";
import type { PostForMeError } from "@/types/post-for-me-types";

/**
 * GET /api/tiktok/trending-music?accountId=xxx
 * Proxy for TikTok Business CML (Commercial Music Library) trending list.
 * Uses the account's managed access_token from Post For Me — never exposed to client.
 */
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
    // Get account details including access_token and user_id (open_id)
    const accounts = await pfm.socialAccounts.list();
    const account = accounts.data?.find(
      (a: any) => a.id === accountId && a.platform === "tiktok_business",
    );

    if (!account) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Not Found",
          message: "TikTok Business account not found",
          statusCode: 404,
        },
        { status: 404 },
      );
    }

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

    const data = await response.json();

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

    // Normalize TikTok CML response — API returns `list` with `commercial_music_name`, `rank_position` as string
    const rawList: any[] = data.data?.list ?? [];
    const musicList = rawList.map((t: any) => ({
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
        (h: any) => Number(h.rank_position_daily) || 0,
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
