import { NextResponse } from "next/server";
import type { ZodSchema, ZodError } from "zod";
import type { PostForMeError } from "@/types/post-for-me";

/**
 * PFM resource ID prefixes — used for lightweight format validation.
 * Rejects garbage IDs early (400) instead of letting upstream return 500.
 */
const PFM_ID_PREFIXES: Record<string, string> = {
  post: "sp_",
  account: "spc_",
  "post-result": "spr_",
  webhook: "wbh_",
  preview: "spp_",
  feed: "spc_", // feeds use account IDs
};

/**
 * Validate a PFM resource ID format.
 * Returns a 400 NextResponse if invalid, or null if valid.
 */
export function validateId(
  id: string,
  resource: keyof typeof PFM_ID_PREFIXES,
): NextResponse | null {
  const prefix = PFM_ID_PREFIXES[resource];
  if (!prefix) return null; // unknown resource — skip validation

  if (!id || id.length < prefix.length + 1 || !id.startsWith(prefix)) {
    return NextResponse.json<PostForMeError>(
      {
        error: "Validation Error",
        message: `Invalid ${resource} ID format. Expected prefix "${prefix}"`,
        statusCode: 400,
      },
      { status: 400 },
    );
  }
  return null; // valid
}

function formatZodError(error: ZodError): { message: string; fields: string[] } {
  const fields = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  return { message: fields.join("; "), fields };
}

/**
 * Validate a request body against a Zod schema.
 * Returns `{ success: true, data }` or `{ success: false, response }`.
 */
export function parseBody<T>(
  schema: ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };

  const { message, fields } = formatZodError(result.error);
  return {
    success: false,
    response: NextResponse.json<PostForMeError>(
      {
        error: "Validation Error",
        message,
        statusCode: 400,
        details: { fields },
      },
      { status: 400 },
    ),
  };
}

/**
 * Validate query parameters against a Zod schema.
 * Returns `{ success: true, data }` or `{ success: false, response }`.
 */
export function parseQuery<T>(
  schema: ZodSchema<T>,
  params: Record<string, unknown>,
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(params);
  if (result.success) return { success: true, data: result.data };

  const { message, fields } = formatZodError(result.error);
  return {
    success: false,
    response: NextResponse.json<PostForMeError>(
      {
        error: "Validation Error",
        message: `Invalid query parameters: ${message}`,
        statusCode: 400,
        details: { fields },
      },
      { status: 400 },
    ),
  };
}
