/**
 * MCP Tool Definitions for Post For Me
 * Following MCP 2025-03-26 specification with proper schemas
 * 
 * NOTE: Validation schemas are centralized in ./schemas/index.ts
 * This file defines the JSON Schema for MCP clients.
 */

import {
  MCPTool,
  MCPToolResult,
  ToolBuilder,
  SchemaHelpers,
} from "../../../lib/mcp-tools";
import { JsonSchemaHelpers, getMediaConstraintsSummary, getCaptionLimitsSummary, ID_EXAMPLES } from "./schemas";

// ============================================================================
// Tool Definitions
// ============================================================================

export const tools: MCPTool[] = [
  // Social Accounts
  ToolBuilder.create("list_social_accounts")
    .withTitle("List Social Accounts")
    .withDescription(
      "List all connected social media accounts with optional filtering by platform and status. " +
      "Returns account details including platform, username, connection status, and token expiration."
    )
    .withInputSchema({
      type: "object",
      properties: {
        limit: SchemaHelpers.number("Maximum number of accounts to return", {
          minimum: 1,
          maximum: 100,
          default: 20,
          integer: true,
        }),
        offset: SchemaHelpers.number("Number of accounts to skip for pagination", {
          minimum: 0,
          default: 0,
          integer: true,
        }),
        platform: SchemaHelpers.array(
          "Filter by platform(s)",
          SchemaHelpers.enum("Platform", [
            "facebook",
            "instagram",
            "twitter",
            "linkedin",
            "tiktok",
            "youtube",
            "pinterest",
            "bluesky",
            "threads",
            "tiktok_business",
          ]),
          { minItems: 1 }
        ),
        status: SchemaHelpers.array(
          "Filter by connection status",
          SchemaHelpers.enum("Status", ["connected", "disconnected"]),
          { minItems: 1 }
        ),
      },
    })
    .asReadOnly()
    .build(),

  ToolBuilder.create("get_social_account")
    .withTitle("Get Social Account")
    .withDescription(
      "Get detailed information about a specific social media account by ID. " +
      "Includes profile information, tokens, and metadata."
    )
    .withInputSchema({
      type: "object",
      properties: {
        id: JsonSchemaHelpers.accountId("Social account ID"),
      },
      required: ["id"],
    })
    .asReadOnly()
    .build(),

  ToolBuilder.create("disconnect_social_account")
    .withTitle("Disconnect Social Account")
    .withDescription(
      "Disconnect a connected social media account. This will revoke API access tokens " +
      "and prevent future posts to this account. Previously published posts remain unaffected. " +
      "The account can be reconnected later through the OAuth flow."
    )
    .withInputSchema({
      type: "object",
      properties: {
        id: JsonSchemaHelpers.accountId("Social account ID to disconnect"),
      },
      required: ["id"],
    })
    .asDestructive()
    .build(),

  // Social Posts
  ToolBuilder.create("list_posts")
    .withTitle("List Posts")
    .withDescription(
      "List social media posts with pagination and optional status filtering. " +
      "Returns post metadata, content, publishing status, and associated account IDs. " +
      "Note: social_accounts in response only includes { id }. " +
      "Use 'get_social_account' or 'list_social_accounts' to get full account details (platform, username, etc.)."
    )
    .withInputSchema({
      type: "object",
      properties: {
        limit: SchemaHelpers.number("Maximum posts to return (1-100)", {
          minimum: 1,
          maximum: 100,
          default: 20,
          integer: true,
        }),
        offset: SchemaHelpers.number("Posts to skip for pagination", {
          minimum: 0,
          default: 0,
          integer: true,
        }),
        status: SchemaHelpers.array(
          "Filter by post status. Omit to see all.",
          SchemaHelpers.enum("Status", [
            "draft",
            "scheduled",
            "processing",
            "processed",
            "failed",
          ]),
          { minItems: 1 }
        ),
        platform: SchemaHelpers.array(
          "Filter by platforms. Multiple values use OR logic.",
          SchemaHelpers.enum("Platform", [
            "bluesky",
            "facebook", 
            "instagram",
            "linkedin",
            "pinterest",
            "threads",
            "tiktok",
            "x",
            "youtube",
          ]),
          { minItems: 1 }
        ),
        external_id: SchemaHelpers.array(
          "Filter by external IDs you assigned. Multiple values use OR logic.",
          { type: "string" },
          { minItems: 1 }
        ),
        social_account_id: JsonSchemaHelpers.accountIdArray(
          "Filter by specific social account IDs"
        ),
      },
    })
    .asReadOnly()
    .build(),

  ToolBuilder.create("create_post")
    .withTitle("Create Post")
    .withDescription(
      "Create a new social media post to be published across one or more connected accounts. " +
      "Supports text captions, media attachments (images/videos/reels), and scheduled publishing. " +
      "Optionally provide an external_id to link to your internal systems. " +
      "Media constraints by platform: " + getMediaConstraintsSummary()
    )
    .withInputSchema({
      type: "object",
      properties: {
        caption: SchemaHelpers.string(
          "Post caption/content. Supports emojis, hashtags, and mentions. " +
          "Length limits vary by platform (Instagram: 2200, Twitter: 280, etc.)",
          { minLength: 1 }
        ),
        social_accounts: JsonSchemaHelpers.accountIdArray(
          "Array of social account IDs to publish this post to"
        ),
        media: JsonSchemaHelpers.mediaArray(
          "Optional media attachments (images or videos)"
        ),
        scheduled_at: SchemaHelpers.string(
          "ISO 8601 datetime for scheduled posts (e.g., 2026-04-15T10:00:00Z). If omitted, publishes immediately. Must be in the future.",
          { format: "date-time" }
        ),
        external_id: SchemaHelpers.string(
          "Your internal identifier for this post (for linking to your database). Max 255 characters.",
          { maxLength: 255 }
        ),
      },
      required: ["caption", "social_accounts"],
    })
    .asCreate()
    .build(),

  ToolBuilder.create("get_post")
    .withTitle("Get Post")
    .withDescription(
      "Get detailed information about a specific social media post by ID. " +
      "Includes content, media attachments, scheduled time, and publishing results. " +
      "Note: social_accounts in response only includes account { id }. " +
      "Use 'get_social_account' to get full account details (platform, username, profile_photo_url)."
    )
    .withInputSchema({
      type: "object",
      properties: {
        id: JsonSchemaHelpers.postId("Post ID"),
      },
      required: ["id"],
    })
    .asReadOnly()
    .build(),

  ToolBuilder.create("get_post_with_accounts")
    .withTitle("Get Post with Account Details")
    .withDescription(
      "Get a post with full social account details including platform, username, and profile photo. " +
      "This tool makes additional API calls to fetch complete account information for each linked account. " +
      "Slower than 'get_post' but includes complete account data."
    )
    .withInputSchema({
      type: "object",
      properties: {
        id: JsonSchemaHelpers.postId("Post ID"),
      },
      required: ["id"],
    })
    .asReadOnly()
    .build(),

  ToolBuilder.create("delete_post")
    .withTitle("Delete Post")
    .withDescription(
      "Permanently delete a social media post. This action cannot be undone. " +
      "Posts that have already been published to social platforms may remain visible on those platforms."
    )
    .withInputSchema({
      type: "object",
      properties: {
        id: JsonSchemaHelpers.postId("Post ID to delete"),
      },
      required: ["id"],
    })
    .asDestructive()
    .build(),

  // Post Results
  ToolBuilder.create("list_post_results")
    .withTitle("List Post Results")
    .withDescription(
      "List publishing results for posts across platforms. " +
      "Shows success/failure status, platform-specific post URLs, and error messages for failed posts."
    )
    .withInputSchema({
      type: "object",
      properties: {
        limit: SchemaHelpers.number("Maximum results to return", {
          minimum: 1,
          maximum: 100,
          default: 20,
          integer: true,
        }),
        offset: SchemaHelpers.number("Results to skip", {
          minimum: 0,
          default: 0,
          integer: true,
        }),
        post_id: JsonSchemaHelpers.postId("Filter by specific post ID"),
      },
    })
    .asReadOnly()
    .build(),

  // Search Operations
  ToolBuilder.create("search_posts")
    .withTitle("Search Posts")
    .withDescription(
      "Search posts by caption content. Returns posts whose caption contains the search query. " +
      "Supports pagination and sorting by relevance or date."
    )
    .withInputSchema({
      type: "object",
      properties: {
        query: SchemaHelpers.string("Search query text to find in post captions", {
          minLength: 1,
          maxLength: 255,
        }),
        limit: SchemaHelpers.number("Maximum posts to return", {
          minimum: 1,
          maximum: 100,
          default: 20,
          integer: true,
        }),
        sort: SchemaHelpers.enum("Sort results by", ["relevance", "newest", "oldest"], "relevance"),
      },
      required: ["query"],
    })
    .asReadOnly()
    .build(),

  ToolBuilder.create("get_account_stats")
    .withTitle("Get Account Statistics")
    .withDescription(
      "Get posting statistics for a social media account. " +
      "Returns total posts, posts by status, recent activity, and platform-specific metrics."
    )
    .withInputSchema({
      type: "object",
      properties: {
        account_id: JsonSchemaHelpers.accountId("Social account ID"),
        period: SchemaHelpers.enum("Time period for statistics", [
          "7d", "30d", "90d", "all"
        ], "30d"),
      },
      required: ["account_id"],
    })
    .asReadOnly()
    .build(),

  // Batch Operations
  ToolBuilder.create("batch_delete_posts")
    .withTitle("Batch Delete Posts")
    .withDescription(
      "Delete multiple posts at once. Maximum 50 posts per batch. " +
      "This action is destructive and cannot be undone. " +
      "Posts already published may remain visible on social platforms."
    )
    .withInputSchema({
      type: "object",
      properties: {
        post_ids: JsonSchemaHelpers.postIdArray(
          "Array of post IDs to delete"
        ),
      },
      required: ["post_ids"],
    })
    .asDestructive()
    .build(),

  // Caption Limits Reference
  ToolBuilder.create("get_caption_limits")
    .withTitle("Get Caption Limits")
    .withDescription(
      "Get character/caption limits for all social media platforms. " +
      "Returns max character limits, hashtag limits, and special notes for each platform and content type. " +
      "Useful for validating captions before creating posts."
    )
    .withInputSchema({
      type: "object",
      properties: {
        platform: SchemaHelpers.enum(
          "Filter by specific platform (optional)",
          ["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube", "pinterest", "bluesky", "threads"]
        ),
        content_type: SchemaHelpers.enum(
          "Filter by content type (optional)",
          ["feed", "reels", "stories", "photos", "videos", "shorts"]
        ),
      },
    })
    .asReadOnly()
    .build(),
];

// ============================================================================
// Tool Map for Quick Lookup
// ============================================================================

export const toolMap = new Map<string, MCPTool>(
  tools.map((tool) => [tool.name, tool])
);

// ============================================================================
// Tool Result Helpers
// ============================================================================

export function createTextResult(text: string): MCPToolResult {
  return {
    content: [{ type: "text", text }],
  };
}

export function createErrorResult(error: string, data?: Record<string, unknown>): MCPToolResult {
  const result: MCPToolResult = {
    content: [{ type: "text", text: `Error: ${error}` }],
    isError: true,
  };
  
  // Include rich error data if provided
  if (data) {
    result.content.push({
      type: "text",
      text: JSON.stringify({ errorData: data }, null, 2)
    });
  }
  
  return result;
}

/**
 * Create error result with platform-specific restriction details
 * Example: Twitter caption too long, Instagram video duration exceeded
 */
export function createPlatformErrorResult(
  message: string,
  platformErrors: Array<{
    platform: string;
    error: string;
    limit: number;
    actual: number;
    unit: string;
    suggestions: string[];
  }>
): MCPToolResult {
  return {
    content: [
      { type: "text", text: `Error: ${message}` },
      { 
        type: "text", 
        text: JSON.stringify({ 
          platformErrors,
          summary: {
            affectedPlatforms: platformErrors.map(e => e.platform),
            suggestion: "Adjust content to meet platform limits or exclude incompatible accounts"
          }
        }, null, 2) 
      }
    ],
    isError: true,
  };
}

/**
 * Create error result with validation details and constraints
 */
export function createValidationErrorResult(
  message: string,
  fieldErrors: Array<{
    field: string;
    message: string;
    constraint?: string;
    max?: number;
    actual?: number;
  }>
): MCPToolResult {
  return {
    content: [
      { type: "text", text: `Error: ${message}` },
      {
        type: "text",
        text: JSON.stringify({ validationErrors: fieldErrors }, null, 2)
      }
    ],
    isError: true,
  };
}

export function createJsonResult(data: unknown): MCPToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}
