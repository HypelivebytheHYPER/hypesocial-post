# MCP Error Data Field Guide

The `data` field in MCP errors is **optional** but highly recommended for rich error information. It helps AI agents understand *why* something failed and potentially recover or suggest fixes.

## When to Use `data`

| Use Case | Include in `data` |
|----------|-------------------|
| Validation errors | Field-level errors, schemas, constraints |
| Platform restrictions | Platform limits, unsupported features |
| API errors | HTTP status, error codes, retry info |
| Resource conflicts | Conflicting IDs, state information |
| Rate limiting | Retry-after, limit details |

---

## Error Data Patterns

### 1. Validation Errors (-32003)

**Use when**: Input fails Zod validation or business rules

```typescript
{
  code: -32003,
  message: "Validation failed: caption exceeds maximum length",
  data: {
    errors: [
      {
        path: "caption",
        message: "Must be at most 2200 characters",
        code: "too_big",
        max: 2200,
        actual: 3450
      },
      {
        path: "media.0.url",
        message: "Invalid URL format",
        code: "invalid_string"
      }
    ],
    // Optional: show what was valid
    validFields: ["social_accounts", "scheduled_at"]
  }
}
```

### 2. Platform Restrictions (-32002)

**Use when**: Platform doesn't support a feature or exceeds limits

```typescript
{
  code: -32002,
  message: "Tool execution failed: create_post",
  data: {
    toolName: "create_post",
    error: "Platform limitations exceeded",
    platformErrors: [
      {
        platform: "twitter",
        accountId: "sa_abc123",
        error: "CAPTION_TOO_LONG",
        message: "Caption exceeds 280 characters",
        limits: {
          captionMax: 280,
          captionActual: 450,
          mediaMax: 4,
          mediaActual: 1
        },
        // Suggest fixes
        suggestions: [
          "Shorten caption to 280 characters",
          "Remove 170 characters",
          "Split into thread (not supported yet)"
        ]
      },
      {
        platform: "instagram",
        accountId: "sa_def456",
        error: "VIDEO_TOO_LONG",
        message: "Reels must be under 90 seconds",
        limits: {
          videoMaxDuration: 90,
          videoActualDuration: 145
        },
        suggestions: [
          "Trim video to 90 seconds",
          "Post as carousel instead"
        ]
      }
    ],
    // What succeeded
    succeededAccounts: ["sa_ghi789"], // Facebook account OK
    // Current state after partial failure
    partialResult: {
      postId: "sp_xxx",
      status: "partial",
      postedTo: ["facebook"],
      failedTo: ["twitter", "instagram"]
    }
  }
}
```

### 3. Media Validation Errors

**Use when**: Media files don't meet platform requirements

```typescript
{
  code: -32003,
  message: "Validation failed: media requirements not met",
  data: {
    errors: [
      {
        path: "media.0",
        message: "Image exceeds maximum file size",
        code: "media_too_large",
        constraints: {
          maxSizeMB: 8,
          actualSizeMB: 12.5,
          formats: ["jpg", "jpeg", "png", "webp"],
          actualFormat: "png"
        },
        platformSpecific: {
          instagram: { maxSizeMB: 8 },
          twitter: { maxSizeMB: 5 },
          facebook: { maxSizeMB: 10 }
        },
        suggestions: [
          "Compress image to under 8MB",
          "Convert to JPEG for smaller size",
          "Use Facebook only (supports 10MB)"
        ]
      },
      {
        path: "media.1",
        message: "Video aspect ratio not supported",
        code: "invalid_aspect_ratio",
        constraints: {
          acceptedRatios: ["9:16", "4:5", "1:1"],
          actualRatio: "16:9",
          platform: "instagram_reels"
        },
        suggestions: [
          "Crop to 9:16 for Reels",
          "Post as feed video (supports 16:9)",
          "Use YouTube instead"
        ]
      }
    ],
    // Full constraints reference
    mediaConstraints: {
      instagram: {
        image: { maxSizeMB: 8, formats: ["jpg", "png"], minDimensions: [320, 320] },
        video: { maxSizeMB: 100, maxDuration: 60, formats: ["mp4", "mov"] }
      },
      twitter: {
        image: { maxSizeMB: 5, formats: ["jpg", "png", "gif", "webp"] },
        video: { maxSizeMB: 512, maxDuration: 140, formats: ["mp4"] }
      }
    }
  }
}
```

### 4. Account Connection Errors

**Use when**: Account is disconnected or token expired

```typescript
{
  code: -32002,
  message: "Tool execution failed: create_post",
  data: {
    toolName: "create_post",
    error: "Account not available",
    accountErrors: [
      {
        accountId: "sa_abc123",
        platform: "linkedin",
        error: "TOKEN_EXPIRED",
        message: "Access token expired 3 days ago",
        expiredAt: "2026-04-09T12:00:00Z",
        // Recovery action
        action: {
          type: "reconnect",
          description: "Re-authenticate LinkedIn account",
          authUrl: "https://api.postforme.dev/v1/auth/linkedin?reconnect=sa_abc123"
        }
      },
      {
        accountId: "sa_def456",
        platform: "instagram",
        error: "PERMISSION_REVOKED",
        message: "User revoked app permissions",
        action: {
          type: "reconnect",
          description: "Re-authorize Instagram access"
        }
      }
    ],
    // Accounts that still work
    availableAccounts: [
      { id: "sa_ghi789", platform: "facebook", status: "connected" }
    ],
    suggestedAction: "Use Facebook account or reconnect LinkedIn/Instagram"
  }
}
```

### 5. Rate Limit Errors (-32005)

**Use when**: API rate limits hit

```typescript
{
  code: -32005,
  message: "Rate limit exceeded",
  data: {
    limitType: "requests_per_minute",
    limit: 60,
    remaining: 0,
    resetAt: "2026-04-12T08:30:45Z",
    retryAfter: 45, // seconds
    scope: "account", // or "ip", "api_key"
    suggestions: [
      "Wait 45 seconds before retrying",
      "Reduce request frequency to 60/minute",
      "Consider batch operations for multiple posts"
    ]
  }
}
```

### 6. Scheduling Errors

**Use when**: Scheduled time is invalid

```typescript
{
  code: -32003,
  message: "Validation failed: invalid schedule time",
  data: {
    errors: [
      {
        path: "scheduled_at",
        message: "Schedule time must be at least 5 minutes in the future",
        code: "schedule_too_soon",
        constraints: {
          minAdvanceMinutes: 5,
          maxAdvanceDays: 90,
          requestedTime: "2026-04-12T08:15:00Z",
          earliestAllowed: "2026-04-12T08:20:00Z"
        },
        suggestions: [
          "Schedule for 2026-04-12T08:20:00Z or later",
          "Post immediately by removing scheduled_at"
        ]
      }
    ],
    // Valid timezone info
    timezone: {
      server: "UTC",
      detected: "Asia/Bangkok",
      note: "All times interpreted as UTC"
    }
  }
}
```

---

## Implementation in Code

### Enhanced Error Helpers

```typescript
// errors.ts - Add these helpers

interface PlatformError {
  platform: string;
  accountId: string;
  error: string;
  message: string;
  limits?: Record<string, number>;
  suggestions?: string[];
}

interface ValidationErrorDetail {
  path: string;
  message: string;
  code: string;
  constraints?: Record<string, unknown>;
  suggestions?: string[];
}

export function createPlatformRestrictionError(
  toolName: string,
  platformErrors: PlatformError[],
  succeededAccounts?: string[]
): MCPErrorException {
  return new MCPErrorException(
    ErrorCodes.TOOL_EXECUTION_ERROR,
    `Platform restrictions: ${platformErrors.map(e => e.platform).join(", ")}`,
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

export function createMediaValidationError(
  errors: ValidationErrorDetail[],
  constraints?: Record<string, unknown>
): MCPErrorException {
  return new MCPErrorException(
    ErrorCodes.VALIDATION_ERROR,
    `Media validation failed: ${errors.map(e => e.message).join("; ")}`,
    {
      errors,
      constraints,
      helpUrl: "https://docs.postforme.dev/media-requirements"
    }
  );
}
```

### Using in Tool Handlers

```typescript
// In handleToolCall for create_post

case "create_post": {
  const platformErrors: PlatformError[] = [];
  const succeededAccounts: string[] = [];
  
  for (const accountId of validatedArgs.social_accounts) {
    const account = await client.getAccount(accountId);
    
    // Check caption length
    if (account.platform === "twitter" && validatedArgs.caption.length > 280) {
      platformErrors.push({
        platform: "twitter",
        accountId,
        error: "CAPTION_TOO_LONG",
        message: "Caption exceeds 280 characters",
        limits: { captionMax: 280, captionActual: validatedArgs.caption.length },
        suggestions: [
          `Remove ${validatedArgs.caption.length - 280} characters`,
          "Post to Facebook instead (longer captions supported)"
        ]
      });
      continue;
    }
    
    // Check media count
    const mediaCount = validatedArgs.media?.length ?? 0;
    const maxMedia = account.platform === "twitter" ? 4 : 10;
    if (mediaCount > maxMedia) {
      platformErrors.push({
        platform: account.platform,
        accountId,
        error: "TOO_MANY_MEDIA",
        message: `Maximum ${maxMedia} media files allowed`,
        limits: { mediaMax: maxMedia, mediaActual: mediaCount },
        suggestions: [`Remove ${mediaCount - maxMedia} media files`]
      });
      continue;
    }
    
    // Try to post
    try {
      await client.createPost({ ...validatedArgs, social_accounts: [accountId] });
      succeededAccounts.push(accountId);
    } catch (error) {
      platformErrors.push({
        platform: account.platform,
        accountId,
        error: "API_ERROR",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // If any failed, return detailed error
  if (platformErrors.length > 0) {
    if (succeededAccounts.length === 0) {
      // Complete failure
      throw createPlatformRestrictionError("create_post", platformErrors);
    } else {
      // Partial success - return as tool result with isError
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "partial",
            message: `Posted to ${succeededAccounts.length} accounts, failed for ${platformErrors.length}`,
            succeeded: succeededAccounts,
            failed: platformErrors
          }, null, 2)
        }],
        isError: true
      };
    }
  }
  
  return createJsonResult({ status: "success", postedTo: succeededAccounts });
}
```

---

## Summary: What Goes in `data`

| Category | Fields | Example |
|----------|--------|---------|
| **Validation** | `errors[]` with path, message, code, constraints | Field-level validation |
| **Platform Limits** | `platformErrors[]` with limits, suggestions | Twitter 280 chars |
| **Media** | `constraints` with sizes, formats, durations | 8MB max, 9:16 ratio |
| **Account Issues** | `action` with reconnect URL, `expiredAt` | Token expired |
| **Rate Limits** | `retryAfter`, `resetAt`, `limit` | Wait 45 seconds |
| **Scheduling** | `earliestAllowed`, `timezone` | Min 5 min advance |
| **Partial Results** | `succeeded`, `failed`, `partialResult` | Posted to 2/3 accounts |

---

## Best Practices

1. **Always include actionable suggestions** - Help the AI/agent recover
2. **Show partial results** - Don't hide what succeeded
3. **Include constraints** - "Max 280" is better than "too long"
4. **Use structured data** - Arrays/objects, not just strings
5. **Link to docs** - `helpUrl` for complex errors
6. **Platform-specific info** - Different limits per platform
