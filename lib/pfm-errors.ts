import { NotFoundError } from "post-for-me";

/**
 * Extract structured error details from Post For Me SDK errors
 */
export function extractErrorDetails(error: unknown): {
  status?: number;
  message: string;
  body?: unknown;
  isNotFound: boolean;
  isRateLimited: boolean;
  isValidationError: boolean;
} {
  // Default values
  const result = {
    status: undefined as number | undefined,
    message: "Unknown error",
    body: undefined as unknown,
    isNotFound: false,
    isRateLimited: false,
    isValidationError: false,
  };

  // Handle known error types
  if (error instanceof NotFoundError) {
    result.status = 404;
    result.message = error.message;
    result.isNotFound = true;
    return result;
  }

  if (error instanceof Error) {
    result.message = error.message;
    result.isValidationError = error.name === "ZodError";
  }

  // Extract status code
  const err = error as {
    status?: number;
    error?: { statusCode?: number; message?: string };
    response?: { status?: number };
  };

  result.status = err.status || err.error?.statusCode || err.response?.status;
  result.body = err.error;

  if (err.error?.message) {
    result.message = err.error.message;
  }

  // Determine error type
  if (result.status === 404) {
    result.isNotFound = true;
  } else if (result.status === 429) {
    result.isRateLimited = true;
  }

  // Handle Post For Me API bug: 500 with "Internal Server Error" may be disguised 404
  // Log for monitoring but don't automatically treat as 404
  if (result.status === 500 && result.message === "Internal Server Error") {
    console.warn("[PFM_API_BUG] Received 500 Internal Server Error, may be disguised 404", {
      error_message: result.message,
      error_body: result.body,
    });
  }

  return result;
}

/**
 * Check if error is a "not found" error
 * Uses status code check only - removes fragile string matching
 */
export function isNotFoundError(error: unknown): boolean {
  const { isNotFound, status } = extractErrorDetails(error);
  return isNotFound || status === 404;
}

/**
 * Check if error is a rate limit (429) error
 */
export function isRateLimitError(error: unknown): boolean {
  const { isRateLimited, status } = extractErrorDetails(error);
  return isRateLimited || status === 429;
}

/**
 * Get retry delay from rate limit error (in seconds)
 */
export function getRetryAfter(error: unknown): number {
  const err = error as {
    headers?: { "retry-after"?: string };
    response?: { headers?: { "retry-after"?: string } };
  };

  const retryAfter =
    err.headers?.["retry-after"] || err.response?.headers?.["retry-after"];

  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return seconds;
  }

  // Default: 60 seconds
  return 60;
}

/**
 * Format error for API response
 */
export function formatApiError(
  error: unknown,
  defaultMessage: string
): {
  message: string;
  status: number;
  details?: unknown;
} {
  const details = extractErrorDetails(error);

  if (details.isNotFound) {
    return { message: "Not found", status: 404 };
  }

  if (details.isRateLimited) {
    return {
      message: "Rate limited",
      status: 429,
      details: { retry_after: getRetryAfter(error) },
    };
  }

  if (details.isValidationError) {
    return { message: "Validation error", status: 422, details: error };
  }

  return { message: defaultMessage, status: details.status || 500 };
}
