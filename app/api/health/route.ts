import { NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import packageJson from "@/package.json";

interface HealthResponse {
  status: "ok" | "degraded";
  version: string;
  timestamp: string;
  environment: string;
  services: {
    post_for_me_api: "ok" | "error";
  };
}

/**
 * GET /api/health
 * Health check endpoint for uptime monitoring and load balancer probes.
 * Always returns 200 — use `status` field to detect degradation.
 */
export async function GET() {
  let pfmStatus: "ok" | "error" = "ok";

  try {
    await pfm.socialAccounts.list({ limit: 1 });
  } catch {
    pfmStatus = "error";
  }

  const body: HealthResponse = {
    status: pfmStatus === "ok" ? "ok" : "degraded",
    version: packageJson.version,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "unknown",
    services: {
      post_for_me_api: pfmStatus,
    },
  };

  return NextResponse.json(body, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
