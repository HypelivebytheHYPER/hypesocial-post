/**
 * MCP Tool Schema Generator
 * 
 * Utilities for creating MCP 2025-03-26 compliant tool schemas
 * with proper typing, validation, and annotations.
 */

import { z } from "zod";

// ============================================================================
// MCP Types (from specification)
// ============================================================================

export interface MCPTool {
  name: string;
  description?: string;
  title?: string;
  inputSchema?: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
  outputSchema?: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  execution?: {
    taskSupport?: "optional" | "required" | "forbidden";
  };
  _meta?: Record<string, unknown>;
}

export interface MCPTextContent {
  type: "text";
  text: string;
}

export interface MCPImageContent {
  type: "image";
  data: string;
  mimeType: string;
}

export type MCPContent = MCPTextContent | MCPImageContent;

export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

// ============================================================================
// Tool Builder Class
// ============================================================================

export class ToolBuilder {
  private tool: Partial<MCPTool> = {};

  static create(name: string): ToolBuilder {
    const builder = new ToolBuilder();
    builder.tool.name = name;
    return builder;
  }

  withDescription(description: string): this {
    this.tool.description = description;
    return this;
  }

  withTitle(title: string): this {
    this.tool.title = title;
    return this;
  }

  withInputSchema(schema: MCPTool["inputSchema"]): this {
    this.tool.inputSchema = schema;
    return this;
  }

  withOutputSchema(schema: MCPTool["outputSchema"]): this {
    this.tool.outputSchema = schema;
    return this;
  }

  withAnnotations(annotations: MCPTool["annotations"]): this {
    this.tool.annotations = annotations;
    return this;
  }

  // Pre-built annotation presets
  asReadOnly(): this {
    this.tool.annotations = {
      title: this.tool.title || this.tool.name,
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };
    return this;
  }

  asDestructive(): this {
    this.tool.annotations = {
      title: this.tool.title || this.tool.name,
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    };
    return this;
  }

  asCreate(): this {
    this.tool.annotations = {
      title: this.tool.title || this.tool.name,
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    };
    return this;
  }

  asUpdate(): this {
    this.tool.annotations = {
      title: this.tool.title || this.tool.name,
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    };
    return this;
  }

  withExecutionConfig(config: MCPTool["execution"]): this {
    this.tool.execution = config;
    return this;
  }

  withMeta(meta: Record<string, unknown>): this {
    this.tool._meta = meta;
    return this;
  }

  build(): MCPTool {
    if (!this.tool.name) {
      throw new Error("Tool name is required");
    }
    return this.tool as MCPTool;
  }
}

// ============================================================================
// Schema Helpers
// ============================================================================

export const SchemaHelpers = {
  /**
   * Create a string property
   */
  string(description: string, options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;
    default?: string;
  }): object {
    const schema: Record<string, unknown> = {
      type: "string",
      description,
    };
    if (options?.minLength !== undefined) schema.minLength = options.minLength;
    if (options?.maxLength !== undefined) schema.maxLength = options.maxLength;
    if (options?.pattern) schema.pattern = options.pattern;
    if (options?.format) schema.format = options.format;
    if (options?.default !== undefined) schema.default = options.default;
    return schema;
  },

  /**
   * Create a number property
   */
  number(description: string, options?: {
    minimum?: number;
    maximum?: number;
    default?: number;
    integer?: boolean;
  }): object {
    const schema: Record<string, unknown> = {
      type: options?.integer ? "integer" : "number",
      description,
    };
    if (options?.minimum !== undefined) schema.minimum = options.minimum;
    if (options?.maximum !== undefined) schema.maximum = options.maximum;
    if (options?.default !== undefined) schema.default = options.default;
    return schema;
  },

  /**
   * Create a boolean property
   */
  boolean(description: string, defaultValue?: boolean): object {
    const schema: Record<string, unknown> = {
      type: "boolean",
      description,
    };
    if (defaultValue !== undefined) schema.default = defaultValue;
    return schema;
  },

  /**
   * Create an array property
   */
  array(description: string, itemSchema: object, options?: {
    minItems?: number;
    maxItems?: number;
  }): object {
    const schema: Record<string, unknown> = {
      type: "array",
      description,
      items: itemSchema,
    };
    if (options?.minItems !== undefined) schema.minItems = options.minItems;
    if (options?.maxItems !== undefined) schema.maxItems = options.maxItems;
    return schema;
  },

  /**
   * Create an enum property (string with specific values)
   */
  enum(description: string, values: string[], defaultValue?: string): object {
    const schema: Record<string, unknown> = {
      type: "string",
      enum: values,
      description,
    };
    if (defaultValue !== undefined) schema.default = defaultValue;
    return schema;
  },

  /**
   * Create an object property
   */
  object(description: string, properties: Record<string, object>, required?: string[]): object {
    const schema: Record<string, unknown> = {
      type: "object",
      description,
      properties,
    };
    if (required && required.length > 0) {
      schema.required = required;
    }
    return schema;
  },

  /**
   * Create a reference to another schema (for complex types)
   */
  ref(refName: string): object {
    return { $ref: `#/definitions/${refName}` };
  },
};

// ============================================================================
// Zod to MCP Schema Converter
// ============================================================================

export function zodToMcpSchema(zodSchema: z.ZodTypeAny): object {
  // Handle different Zod types
  if (zodSchema instanceof z.ZodString) {
    const result: Record<string, unknown> = { type: "string" };
    // Check for validations
    const checks = (zodSchema as z.ZodString)._def.checks || [];
    for (const check of checks) {
      switch (check.kind) {
        case "min":
          result.minLength = check.value;
          break;
        case "max":
          result.maxLength = check.value;
          break;
        case "email":
          result.format = "email";
          break;
        case "url":
          result.format = "uri";
          break;
        case "regex":
          result.pattern = check.regex.source;
          break;
        case "datetime":
          result.format = "date-time";
          break;
      }
    }
    return result;
  }

  if (zodSchema instanceof z.ZodNumber) {
    const result: Record<string, unknown> = { type: "number" };
    const checks = (zodSchema as z.ZodNumber)._def.checks || [];
    for (const check of checks) {
      switch (check.kind) {
        case "min":
          result.minimum = check.value;
          break;
        case "max":
          result.maximum = check.value;
          break;
        case "int":
          result.type = "integer";
          break;
      }
    }
    return result;
  }

  if (zodSchema instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }

  if (zodSchema instanceof z.ZodArray) {
    const elementSchema = zodToMcpSchema(zodSchema.element);
    return {
      type: "array",
      items: elementSchema,
    };
  }

  if (zodSchema instanceof z.ZodObject) {
    const shape = zodSchema.shape;
    const properties: Record<string, object> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToMcpSchema(value as z.ZodTypeAny);
      // Check if field is required
      if (!(value instanceof z.ZodOptional) && !(value instanceof z.ZodDefault)) {
        required.push(key);
      }
    }

    const result: Record<string, unknown> = {
      type: "object",
      properties,
    };
    if (required.length > 0) {
      result.required = required;
    }
    return result;
  }

  if (zodSchema instanceof z.ZodOptional) {
    return zodToMcpSchema(zodSchema.unwrap());
  }

  if (zodSchema instanceof z.ZodDefault) {
    const inner = zodToMcpSchema(zodSchema._def.innerType);
    return {
      ...inner,
      default: zodSchema._def.defaultValue(),
    };
  }

  if (zodSchema instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: zodSchema._def.values,
    };
  }

  if (zodSchema instanceof z.ZodUnion) {
    const options = zodSchema._def.options.map(zodToMcpSchema);
    return {
      anyOf: options,
    };
  }

  if (zodSchema instanceof z.ZodNullable) {
    const inner = zodToMcpSchema(zodSchema._def.innerType);
    return {
      ...inner,
      nullable: true,
    };
  }

  // Fallback
  return { type: "object" };
}

// ============================================================================
// Pre-built Tool Templates
// ============================================================================

export const ToolTemplates = {
  /**
   * Create a LIST tool (read-only, idempotent)
   */
  list(name: string, itemType: string, options?: {
    filters?: Record<string, object>;
    maxLimit?: number;
  }): MCPTool {
    const properties: Record<string, object> = {
      limit: SchemaHelpers.number("Maximum number of items to return", {
        minimum: 1,
        maximum: options?.maxLimit || 100,
        default: 20,
        integer: true,
      }),
      offset: SchemaHelpers.number("Number of items to skip", {
        minimum: 0,
        default: 0,
        integer: true,
      }),
    };

    if (options?.filters) {
      Object.assign(properties, options.filters);
    }

    return ToolBuilder.create(name)
      .withTitle(`${name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}`)
      .withDescription(`List ${itemType} with pagination support`)
      .withInputSchema({
        type: "object",
        properties,
      })
      .asReadOnly()
      .build();
  },

  /**
   * Create a GET tool (read-only, idempotent)
   */
  get(name: string, resourceType: string, idPattern?: string): MCPTool {
    return ToolBuilder.create(name)
      .withTitle(`Get ${resourceType}`)
      .withDescription(`Retrieve a specific ${resourceType} by ID`)
      .withInputSchema({
        type: "object",
        properties: {
          id: SchemaHelpers.string(`${resourceType} ID`, {
            pattern: idPattern,
          }),
        },
        required: ["id"],
      })
      .asReadOnly()
      .build();
  },

  /**
   * Create a CREATE tool (non-idempotent)
   */
  create(name: string, resourceType: string, properties: Record<string, object>, required: string[]): MCPTool {
    return ToolBuilder.create(name)
      .withTitle(`Create ${resourceType}`)
      .withDescription(`Create a new ${resourceType}`)
      .withInputSchema({
        type: "object",
        properties,
        required,
      })
      .asCreate()
      .build();
  },

  /**
   * Create an UPDATE tool (idempotent)
   */
  update(name: string, resourceType: string, idPattern: string, properties: Record<string, object>): MCPTool {
    return ToolBuilder.create(name)
      .withTitle(`Update ${resourceType}`)
      .withDescription(`Update an existing ${resourceType}`)
      .withInputSchema({
        type: "object",
        properties: {
          id: SchemaHelpers.string(`${resourceType} ID`, { pattern: idPattern }),
          ...properties,
        },
        required: ["id"],
      })
      .asUpdate()
      .build();
  },

  /**
   * Create a DELETE tool (destructive, idempotent)
   */
  delete(name: string, resourceType: string, idPattern: string): MCPTool {
    return ToolBuilder.create(name)
      .withTitle(`Delete ${resourceType}`)
      .withDescription(`Permanently delete a ${resourceType}`)
      .withInputSchema({
        type: "object",
        properties: {
          id: SchemaHelpers.string(`${resourceType} ID`, { pattern: idPattern }),
        },
        required: ["id"],
      })
      .asDestructive()
      .build();
  },
};

// ============================================================================
// Post For Me Specific Tools
// ============================================================================

export const PostForMeTools = {
  listSocialAccounts(): MCPTool {
    return ToolBuilder.create("list_social_accounts")
      .withTitle("List Social Accounts")
      .withDescription("List all connected social media accounts with optional filtering by platform and status")
      .withInputSchema({
        type: "object",
        properties: {
          limit: SchemaHelpers.number("Maximum accounts to return", { minimum: 1, maximum: 100, default: 20, integer: true }),
          offset: SchemaHelpers.number("Accounts to skip", { minimum: 0, default: 0, integer: true }),
          platform: SchemaHelpers.array("Filter by platform", SchemaHelpers.enum("Platform", ["facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube", "pinterest", "bluesky", "threads", "tiktok_business"])),
          status: SchemaHelpers.array("Filter by status", SchemaHelpers.enum("Status", ["connected", "disconnected"])),
        },
      })
      .asReadOnly()
      .build();
  },

  getSocialAccount(): MCPTool {
    return ToolBuilder.create("get_social_account")
      .withTitle("Get Social Account")
      .withDescription("Get detailed information about a specific social media account")
      .withInputSchema({
        type: "object",
        properties: {
          id: SchemaHelpers.string("Social account ID", { pattern: "^sa_[a-zA-Z0-9]+$" }),
        },
        required: ["id"],
      })
      .asReadOnly()
      .build();
  },

  disconnectSocialAccount(): MCPTool {
    return ToolBuilder.create("disconnect_social_account")
      .withTitle("Disconnect Social Account")
      .withDescription("Disconnect a social media account. This revokes API access but doesn't delete published posts.")
      .withInputSchema({
        type: "object",
        properties: {
          id: SchemaHelpers.string("Social account ID to disconnect", { pattern: "^sa_[a-zA-Z0-9]+$" }),
        },
        required: ["id"],
      })
      .asDestructive()
      .build();
  },

  listPosts(): MCPTool {
    return ToolBuilder.create("list_posts")
      .withTitle("List Posts")
      .withDescription("List social media posts with filtering by status and pagination")
      .withInputSchema({
        type: "object",
        properties: {
          limit: SchemaHelpers.number("Maximum posts to return", { minimum: 1, maximum: 100, default: 20, integer: true }),
          offset: SchemaHelpers.number("Posts to skip", { minimum: 0, default: 0, integer: true }),
          status: SchemaHelpers.array("Filter by status", SchemaHelpers.enum("Status", ["draft", "scheduled", "processing", "processed", "failed"])),
        },
      })
      .asReadOnly()
      .build();
  },

  createPost(): MCPTool {
    return ToolBuilder.create("create_post")
      .withTitle("Create Post")
      .withDescription("Create a new social media post to be published to one or more connected accounts")
      .withInputSchema({
        type: "object",
        properties: {
          caption: SchemaHelpers.string("Post caption/content. Supports emojis and hashtags.", { minLength: 1 }),
          social_accounts: SchemaHelpers.array("Social account IDs to publish to", SchemaHelpers.string("Account ID", { pattern: "^sa_[a-zA-Z0-9]+$" }), { minItems: 1 }),
          media: SchemaHelpers.array("Media attachments", {
            type: "object",
            properties: {
              url: SchemaHelpers.string("Media URL", { format: "uri" }),
              type: SchemaHelpers.enum("Media type", ["image", "video"], "image"),
            },
            required: ["url"],
          }),
          scheduled_at: SchemaHelpers.string("ISO 8601 datetime for scheduled posts", { format: "date-time" }),
          external_id: SchemaHelpers.string("Your internal ID for this post", { maxLength: 255 }),
        },
        required: ["caption", "social_accounts"],
      })
      .asCreate()
      .build();
  },

  getPost(): MCPTool {
    return ToolBuilder.create("get_post")
      .withTitle("Get Post")
      .withDescription("Get detailed information about a specific post")
      .withInputSchema({
        type: "object",
        properties: {
          id: SchemaHelpers.string("Post ID", { pattern: "^sp_[a-zA-Z0-9]+$" }),
        },
        required: ["id"],
      })
      .asReadOnly()
      .build();
  },

  deletePost(): MCPTool {
    return ToolBuilder.create("delete_post")
      .withTitle("Delete Post")
      .withDescription("Permanently delete a social media post")
      .withInputSchema({
        type: "object",
        properties: {
          id: SchemaHelpers.string("Post ID to delete", { pattern: "^sp_[a-zA-Z0-9]+$" }),
        },
        required: ["id"],
      })
      .asDestructive()
      .build();
  },

  listPostResults(): MCPTool {
    return ToolBuilder.create("list_post_results")
      .withTitle("List Post Results")
      .withDescription("List publishing results for posts across platforms")
      .withInputSchema({
        type: "object",
        properties: {
          limit: SchemaHelpers.number("Maximum results to return", { minimum: 1, maximum: 100, default: 20, integer: true }),
          offset: SchemaHelpers.number("Results to skip", { minimum: 0, default: 0, integer: true }),
          post_id: SchemaHelpers.string("Filter by specific post ID", { pattern: "^sp_[a-zA-Z0-9]+$" }),
        },
      })
      .asReadOnly()
      .build();
  },

  getAllTools(): MCPTool[] {
    return [
      this.listSocialAccounts(),
      this.getSocialAccount(),
      this.disconnectSocialAccount(),
      this.listPosts(),
      this.createPost(),
      this.getPost(),
      this.deletePost(),
      this.listPostResults(),
    ];
  },
};

// ============================================================================
// Export Default
// ============================================================================

export default {
  ToolBuilder,
  SchemaHelpers,
  ToolTemplates,
  PostForMeTools,
  zodToMcpSchema,
};
