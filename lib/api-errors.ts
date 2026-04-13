/**
 * Centralized API Error Handling
 * @module lib/api-errors
 *
 * Standardized error responses matching Post For Me API specification.
 * All API routes should use these utilities for consistent error handling.
 */

import { NextResponse } from "next/server";
import { APIError } from "post-for-me";
import { ZodError } from "zod";

// ==================== Error Types ====================

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  error: "Validation Error";
  details: {
    fields: string[];
  };
}

export type HttpStatusCode =
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504; // Gateway Timeout

// ==================== Error Response Builders ====================

/**
 * Build a standardized error response
 */
export function buildErrorResponse(
  error: string,
  message: string,
  statusCode: HttpStatusCode,
  details?: Record<string, unknown>,
): ApiErrorResponse {
  return {
    error,
    message,
    statusCode,
    ...(details && { details }),
  };
}

/**
 * Build a validation error response (400)
 */
export function buildValidationError(
  message: string,
  fields: string[],
): ValidationErrorResponse {
  return {
    error: "Validation Error",
    message,
    statusCode: 400,
    details: { fields },
  };
}

/**
 * Build a Zod validation error response from ZodError
 */
export function buildZodValidationError(zodError: ZodError): ValidationErrorResponse {
  const fields = zodError.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });

  return buildValidationError(
    `Validation failed: ${fields.join("; ")}`,
    fields,
  );
}

/**
 * Build a bad request error (400)
 */
export function buildBadRequestError(message: string): ApiErrorResponse {
  return buildErrorResponse("Bad Request", message, 400);
}

/**
 * Build an unauthorized error (401)
 */
export function buildUnauthorizedError(message = "Authentication required"): ApiErrorResponse {
  return buildErrorResponse("Unauthorized", message, 401);
}

/**
 * Build a forbidden error (403)
 */
export function buildForbiddenError(message = "Access denied"): ApiErrorResponse {
  return buildErrorResponse("Forbidden", message, 403);
}

/**
 * Build a not found error (404)
 */
export function buildNotFoundError(resource: string, id?: string): ApiErrorResponse {
  return buildErrorResponse(
    "Not Found",
    id ? `${resource} with id '${id}' not found` : `${resource} not found`,
    404,
  );
}

/**
 * Build a conflict error (409)
 */
export function buildConflictError(message: string): ApiErrorResponse {
  return buildErrorResponse("Conflict", message, 409);
}

/**
 * Build a rate limit error (429)
 */
export function buildRateLimitError(message = "Too many requests"): ApiErrorResponse {
  return buildErrorResponse("Rate Limit Exceeded", message, 429);
}

/**
 * Build an internal server error (500)
 */
export function buildInternalError(
  message = "An unexpected error occurred",
  context?: string,
): ApiErrorResponse {
  return buildErrorResponse(
    "Internal Server Error",
    message,
    500,
    context ? { context } : undefined,
  );
}

// ==================== Error Response Helpers ====================

/**
 * Send an error response
 */
export function sendErrorResponse(
  response: ApiErrorResponse,
  statusCode: HttpStatusCode = response.statusCode as HttpStatusCode,
): NextResponse {
  return NextResponse.json(response, { status: statusCode });
}

// ==================== Centralized Error Handler ====================

export interface ErrorHandlerOptions {
  /** Context for logging (e.g., "fetching posts", "creating account") */
  context: string;
  /** Include stack trace in development (default: false) */
  includeStack?: boolean;
}

/**
 * Handle API errors and return standardized response
 *
 * @param error - The error to handle
 * @param options - Error handling options
 * @returns NextResponse with standardized error JSON
 *
 * @example
 * ```typescript
 * try {
 *   const data = await pfm.socialPosts.list();
 *   return NextResponse.json(data);
 * } catch (error) {
 *   return handleApiError(error, { context: "fetching posts" });
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  options: ErrorHandlerOptions,
): NextResponse {
  const { context, includeStack = false } = options;

  // Handle Post For Me API errors
  if (error instanceof APIError) {
    // Map Post For Me status codes to our error format
    const statusCode = (error.status ?? 500) as HttpStatusCode;

    // Handle specific Post For Me error types
    if (statusCode === 400) {
      // Check if it's a validation error from Post For Me
      const message = error.message || "Invalid request";
      return sendErrorResponse(
        buildValidationError(message, [message]),
        400,
      );
    }

    if (statusCode === 404) {
      return sendErrorResponse(
        buildNotFoundError(context.replace("fetching ", "").replace("creating ", "").replace("updating ", "").replace("deleting ", "")),
        404,
      );
    }

    if (statusCode === 429) {
      return sendErrorResponse(buildRateLimitError(error.message), 429);
    }

    // Generic API error
    return sendErrorResponse(
      buildErrorResponse(
        "API Error",
        error.message || `Error ${context}`,
        statusCode,
      ),
      statusCode,
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return sendErrorResponse(buildZodValidationError(error), 400);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    console.error(`[API] Error ${context}:`, error);
    return sendErrorResponse(
      buildInternalError(
        includeStack && process.env.NODE_ENV === "development"
          ? `${error.message}\n${error.stack}`
          : error.message || `Failed to ${context}`,
        context,
      ),
      500,
    );
  }

  // Unknown error type
  console.error(`[API] Unknown error ${context}:`, error);
  return sendErrorResponse(
    buildInternalError(`Failed to ${context}`, context),
    500,
  );
}

// ==================== Async Wrapper ====================

export type RouteHandler<T = unknown> = () => Promise<NextResponse<T>>;

/**
 * Wrap a route handler with centralized error handling
 *
 * @param handler - The route handler function
 * @param context - Context for error logging
 * @returns Wrapped handler with error handling
 *
 * @example
 * ```typescript
 * export const GET = withErrorHandling(async () => {
 *   const data = await pfm.socialPosts.list();
 *   return NextResponse.json(data);
 * }, "fetching posts");
 * ```
 */
export function withErrorHandling<T>(
  handler: RouteHandler<T>,
  context: string,
): () => Promise<NextResponse> {
  return async () => {
    try {
      return await handler();
    } catch (error) {
      return handleApiError(error, { context });
    }
  };
}

// ==================== Validation Helpers ====================

/**
 * Parse and validate JSON body
 */
export async function parseJsonBody<T>(
  request: Request,
  schema?: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: ZodError } },
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let jsonBody: unknown;

  try {
    jsonBody = await request.json();
  } catch {
    return {
      success: false,
      response: sendErrorResponse(buildBadRequestError("Invalid JSON in request body"), 400),
    };
  }

  if (schema) {
    const parseResult = schema.safeParse(jsonBody);
    if (!parseResult.success) {
      return {
        success: false,
        response: sendErrorResponse(buildZodValidationError(parseResult.error), 400),
      };
    }
    return { success: true, data: parseResult.data };
  }

  return { success: true, data: jsonBody as T };
}

/**
 * Validate ID parameter
 */
export function validateId(id: string | undefined, resource: string): { valid: true } | { valid: false; response: NextResponse } {
  if (!id || id.trim() === "") {
    return {
      valid: false,
      response: sendErrorResponse(
        buildValidationError(`${resource} ID is required`, [`${resource} ID is required`]),
        400,
      ),
    };
  }
  return { valid: true };
}
