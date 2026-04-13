/**
 * MCP Error Handling
 * 
 * Implements JSON-RPC 2.0 error codes as defined in MCP specification
 * https://modelcontextprotocol.io/specification/2025-03-26/basic/messages#error-responses
 */

// JSON-RPC 2.0 Standard Error Codes
export const ErrorCodes = {
  // Standard errors
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  
  // Server errors (reserved range: -32000 to -32099)
  SERVER_ERROR: -32000,
  SESSION_NOT_FOUND: -32001,
  TOOL_EXECUTION_ERROR: -32002,
  VALIDATION_ERROR: -32003,
  API_ERROR: -32004,
  RATE_LIMIT_ERROR: -32005,
  TIMEOUT_ERROR: -32006,
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export interface MCPError {
  code: ErrorCode;
  message: string;
  data?: unknown;
}

export class MCPErrorException extends Error {
  code: ErrorCode;
  data?: unknown;

  constructor(code: ErrorCode, message: string, data?: unknown) {
    super(message);
    this.name = "MCPErrorException";
    this.code = code;
    this.data = data;
  }

  toJSON(id: string | number | null = null): { jsonrpc: "2.0"; id: string | number | null; error: MCPError } {
    const error: MCPError = {
      code: this.code,
      message: this.message,
    };
    if (this.data !== undefined) {
      error.data = this.data;
    }
    return {
      jsonrpc: "2.0",
      id,
      error,
    };
  }
}

// Helper functions for common errors
export function createParseError(message: string): MCPErrorException {
  return new MCPErrorException(ErrorCodes.PARSE_ERROR, `Parse error: ${message}`);
}

export function createInvalidRequest(message: string): MCPErrorException {
  return new MCPErrorException(ErrorCodes.INVALID_REQUEST, `Invalid request: ${message}`);
}

export function createMethodNotFound(method: string): MCPErrorException {
  return new MCPErrorException(ErrorCodes.METHOD_NOT_FOUND, `Method not found: ${method}`);
}

export function createInvalidParams(message: string, details?: unknown): MCPErrorException {
  return new MCPErrorException(ErrorCodes.INVALID_PARAMS, `Invalid params: ${message}`, details);
}

export function createInternalError(message: string): MCPErrorException {
  return new MCPErrorException(ErrorCodes.INTERNAL_ERROR, `Internal error: ${message}`);
}

export function createSessionNotFound(sessionId: string): MCPErrorException {
  return new MCPErrorException(
    ErrorCodes.SESSION_NOT_FOUND,
    `Session not found: ${sessionId}`,
    { sessionId }
  );
}

export function createToolExecutionError(toolName: string, error: string): MCPErrorException {
  return new MCPErrorException(
    ErrorCodes.TOOL_EXECUTION_ERROR,
    `Tool execution failed: ${toolName}`,
    { toolName, error }
  );
}

export function createValidationError(message: string, errors?: unknown[]): MCPErrorException {
  return new MCPErrorException(
    ErrorCodes.VALIDATION_ERROR,
    `Validation failed: ${message}`,
    errors ? { errors } : undefined
  );
}

// ============================================================================
// Rich Error Data Helpers
// ============================================================================

export interface ValidationErrorDetail {
  path: string;
  message: string;
  code: string;
  constraints?: Record<string, unknown>;
  suggestions?: string[];
}

export interface PlatformError {
  platform: string;
  accountId: string;
  error: string;
  message: string;
  limits?: Record<string, number>;
  suggestions?: string[];
}

/**
 * Create error for platform-specific restrictions
 * Example: Twitter caption too long, Instagram video too long
 */
export function createPlatformRestrictionError(
  toolName: string,
  platformErrors: PlatformError[],
  succeededAccounts?: string[]
): MCPErrorException {
  const platforms = platformErrors.map(e => e.platform).join(", ");
  return new MCPErrorException(
    ErrorCodes.TOOL_EXECUTION_ERROR,
    `Platform restrictions on ${platforms}`,
    {
      toolName,
      error: "Platform limitations exceeded",
      platformErrors,
      succeededAccounts,
      suggestions: [
        "Adjust content for platform limits",
        "Post to compatible accounts only",
        "Split into multiple posts"
      ]
    }
  );
}

/**
 * Create error for media validation failures
 * Example: File too large, wrong format, bad aspect ratio
 */
export function createMediaValidationError(
  errors: ValidationErrorDetail[],
  constraints?: Record<string, unknown>
): MCPErrorException {
  const message = errors.map(e => `${e.path}: ${e.message}`).join("; ");
  return new MCPErrorException(
    ErrorCodes.VALIDATION_ERROR,
    `Media validation failed: ${message}`,
    {
      errors,
      constraints,
      mediaRequirements: {
        instagram: {
          image: { maxSizeMB: 8, formats: ["jpg", "png", "webp"], minDimensions: [320, 320] },
          video: { maxSizeMB: 100, maxDurationSec: 60, formats: ["mp4", "mov"] }
        },
        twitter: {
          image: { maxSizeMB: 5, formats: ["jpg", "png", "gif", "webp"], maxCount: 4 },
          video: { maxSizeMB: 512, maxDurationSec: 140, formats: ["mp4"] }
        },
        facebook: {
          image: { maxSizeMB: 10, formats: ["jpg", "png", "gif", "webp"] },
          video: { maxSizeMB: 1000, maxDurationSec: 240 * 60, formats: ["mp4", "mov"] }
        },
        linkedin: {
          image: { maxSizeMB: 8, formats: ["jpg", "png"], maxCount: 9 },
          video: { maxSizeMB: 5000, maxDurationSec: 30 * 60, formats: ["mp4"] }
        }
      }
    }
  );
}

/**
 * Create error for account connection issues
 * Example: Token expired, permissions revoked
 */
export function createAccountConnectionError(
  accountErrors: Array<{
    accountId: string;
    platform: string;
    error: string;
    message: string;
    expiredAt?: string;
    reconnectUrl?: string;
  }>,
  availableAccounts?: Array<{ id: string; platform: string }>
): MCPErrorException {
  return new MCPErrorException(
    ErrorCodes.TOOL_EXECUTION_ERROR,
    `Account connection issues: ${accountErrors.map(e => e.platform).join(", ")}`,
    {
      error: "Account not available",
      accountErrors,
      availableAccounts,
      suggestedAction: availableAccounts && availableAccounts.length > 0
        ? `Use ${availableAccounts.map(a => a.platform).join(", ")} account(s) or reconnect failed accounts`
        : "Reconnect social accounts in settings"
    }
  );
}

export function createApiError(statusCode: number, message: string): MCPErrorException {
  return new MCPErrorException(
    ErrorCodes.API_ERROR,
    `API error: ${message}`,
    { statusCode }
  );
}

// Format Zod validation errors into readable message
export function formatZodErrors(error: unknown): { message: string; details: unknown[] } {
  if (typeof error === "object" && error !== null && "issues" in error) {
    const issues = (error as { issues: Array<{ path: (string | number)[]; message: string; code: string }> }).issues;
    const details = issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    
    const message = issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    
    return { message, details };
  }
  
  if (error instanceof Error) {
    return { message: error.message, details: [{ message: error.message }] };
  }
  
  return { message: String(error), details: [{ message: String(error) }] };
}

// Safe JSON parsing with proper error
export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw createParseError(message);
  }
}

// Validate JSON-RPC request structure
export function validateJsonRpcRequest(body: unknown): { jsonrpc: string; id: string | number | null; method: string; params?: Record<string, unknown> } {
  if (typeof body !== "object" || body === null) {
    throw createInvalidRequest("Request body must be an object");
  }

  const req = body as Record<string, unknown>;

  // Check jsonrpc version
  if (req.jsonrpc !== "2.0") {
    throw createInvalidRequest("Invalid or missing jsonrpc version, expected '2.0'");
  }

  // Check method
  if (typeof req.method !== "string") {
    throw createInvalidRequest("Invalid or missing method");
  }

  // Check id (can be string, number, or null)
  if (req.id !== undefined && req.id !== null && typeof req.id !== "string" && typeof req.id !== "number") {
    throw createInvalidRequest("Invalid id type");
  }

  // Check params (if provided, must be an object)
  if (req.params !== undefined && (typeof req.params !== "object" || req.params === null)) {
    throw createInvalidRequest("Params must be an object");
  }

  return {
    jsonrpc: req.jsonrpc,
    id: req.id as string | number | null,
    method: req.method,
    params: req.params as Record<string, unknown> | undefined,
  };
}
