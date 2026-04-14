import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listCampaigns, createCampaign } from "@/lib/canva-catalog-lark";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

/**
 * Accepts either an ISO datetime string (e.g. `"2026-04-14T10:00"` from an
 * `<input type="datetime-local">`) or a ms-epoch number, normalizing to the
 * number form that Lark's DateTime field expects on-wire.
 */
const DateTimeMs = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === "") return undefined;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const ms = Date.parse(v);
      return Number.isNaN(ms) ? v : ms;
    }
    return v;
  },
  z.number().int().nonnegative().optional(),
);

const CreateCampaignSchema = z.object({
  Name: z.string().min(1),
  "Date Start": DateTimeMs,
  "Date End": DateTimeMs,
  Status: z.enum(["draft", "generating", "ready", "archived"]).default("draft"),
});

/**
 * GET /api/canva/campaigns
 */
export async function GET() {
  try {
    const data = await listCampaigns();
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error, { context: "listing Canva campaigns" });
  }
}

/**
 * POST /api/canva/campaigns
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

    const parseResult = CreateCampaignSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return sendErrorResponse(buildValidationError(issues.join("; "), issues), 400);
    }

    const recordId = await createCampaign(parseResult.data);
    return NextResponse.json({ record_id: recordId });
  } catch (error) {
    return handleApiError(error, { context: "creating Canva campaign" });
  }
}
