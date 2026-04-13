# MCP Tool Schema Development Guide

A comprehensive guide for developing MCP (Model Context Protocol) tool schemas that align with the official specification.

## Based on MCP Specification 2025-03-26

---

## 1. Tool Structure

### Complete Tool Schema

```typescript
interface Tool {
  // Required
  name: string;                    // Unique identifier (kebab-case or snake_case)
  
  // Optional but recommended
  description?: string;            // Human-readable description
  title?: string;                  // Display title
  inputSchema?: {                  // JSON Schema for input validation
    type: "object";
    properties?: Record<string, JSONSchema>;
    required?: string[];
  };
  outputSchema?: {                 // JSON Schema for output (optional)
    type: "object";
    properties?: Record<string, JSONSchema>;
    required?: string[];
  };
  
  // Annotations (MCP 2025-03-26+)
  annotations?: {
    title?: string;                // Human-readable title
    readOnlyHint?: boolean;        // Tool doesn't modify state
    destructiveHint?: boolean;     // Tool deletes/modifies data
    idempotentHint?: boolean;      // Safe to retry
    openWorldHint?: boolean;       // Tool interacts with external systems
  };
  
  // Execution hints
  execution?: {
    taskSupport?: "optional" | "required" | "forbidden";
  };
  
  // Metadata
  _meta?: Record<string, unknown>;
  
  // UI icons (optional)
  icons?: Array<{
    src: string;
    mimeType?: string;
    sizes?: string[];
    theme?: "light" | "dark";
  }>;
}
```

---

## 2. Naming Conventions

### Tool Names

```typescript
// ✅ Good: Clear, descriptive, consistent
create_social_post      // snake_case
list-social-accounts    // kebab-case (also valid)
getPostById            // camelCase (acceptable)

// ❌ Bad: Vague, inconsistent
createPost             // too vague
post                   // too short
make_it_happen         // not descriptive
```

### Best Practices

| Pattern | Use For | Example |
|---------|---------|---------|
| `verb_noun` | Actions | `create_post`, `delete_account` |
| `list_nouns` | Collections | `list_posts`, `list_accounts` |
| `get_noun` | Retrieval | `get_post`, `get_account` |
| `update_noun` | Modification | `update_post`, `update_settings` |
| `disconnect_noun` | Removal | `disconnect_account` |

---

## 3. Description Writing

### Principles

1. **Be specific**: What does the tool do?
2. **Include constraints**: Rate limits, required permissions
3. **Mention side effects**: What changes as a result?
4. **Provide examples**: When should this be used?

### Examples

```typescript
// ❌ Weak description
{
  name: "create_post",
  description: "Creates a post"
}

// ✅ Strong description
{
  name: "create_post",
  description: "Create a new social media post that will be published to one or more connected social accounts. Supports scheduling for future publication. Returns the created post with its ID and status."
}
```

### Template

```
[Action] [object] [to/for] [purpose]. 
[Additional context about behavior].
[Constraints or limitations].
[What is returned].
```

---

## 4. Input Schema Design

### JSON Schema Structure

```typescript
const inputSchema = {
  type: "object",
  properties: {
    // Property definitions
  },
  required: ["required_field1", "required_field2"],
};
```

### Property Types

```typescript
// String
{
  caption: {
    type: "string",
    description: "Post caption text. Supports emojis and hashtags.",
    minLength: 1,
    maxLength: 2200  // Platform-specific limit
  }
}

// Number
{
  limit: {
    type: "number",
    description: "Maximum number of items to return",
    minimum: 1,
    maximum: 100,
    default: 20
  }
}

// Integer
{
  offset: {
    type: "integer",
    description: "Number of items to skip for pagination",
    minimum: 0,
    default: 0
  }
}

// Boolean
{
  include_metadata: {
    type: "boolean",
    description: "Whether to include additional metadata in response",
    default: false
  }
}

// Array
{
  social_accounts: {
    type: "array",
    description: "Array of social account IDs to publish to",
    items: {
      type: "string",
      description: "Social account ID (e.g., sa_xxxxxxxx)"
    },
    minItems: 1
  }
}

// Enum (using string with specific values)
{
  status: {
    type: "array",
    items: {
      type: "string",
      enum: ["draft", "scheduled", "processing", "processed", "failed"],
      description: "Post status filter"
    }
  }
}

// Object (nested)
{
  media: {
    type: "array",
    description: "Media attachments",
    items: {
      type: "object",
      properties: {
        url: {
          type: "string",
          format: "uri",
          description: "Publicly accessible URL of the media"
        },
        type: {
          type: "string",
          enum: ["image", "video"],
          description: "Media type"
        }
      },
      required: ["url"]
    }
  }
}

// Optional with default
{
  scheduled_at: {
    type: "string",
    format: "date-time",
    description: "ISO 8601 datetime for scheduled posts. If not provided, posts immediately."
  }
}
```

### Complete Example: create_post

```typescript
{
  name: "create_post",
  description: "Create a new social media post to be published across connected social accounts. Supports scheduling, media attachments, and platform-specific configurations.",
  inputSchema: {
    type: "object",
    properties: {
      caption: {
        type: "string",
        description: "Post caption/content. Supports emojis, hashtags, and mentions. Length limits vary by platform (Instagram: 2200, Twitter: 280, etc.)",
        minLength: 1
      },
      social_accounts: {
        type: "array",
        description: "Array of social account IDs to publish this post to",
        items: {
          type: "string",
          description: "Social account ID (format: sa_xxxxxxxx)",
          pattern: "^sa_[a-zA-Z0-9]+$"
        },
        minItems: 1
      },
      media: {
        type: "array",
        description: "Optional media attachments (images or videos)",
        items: {
          type: "object",
          properties: {
            url: {
              type: "string",
              format: "uri",
              description: "Publicly accessible URL of the media file"
            },
            type: {
              type: "string",
              enum: ["image", "video"],
              description: "Type of media",
              default: "image"
            }
          },
          required: ["url"]
        }
      },
      scheduled_at: {
        type: "string",
        format: "date-time",
        description: "ISO 8601 datetime for scheduled posts. If omitted, publishes immediately. Must be in the future."
      },
      external_id: {
        type: "string",
        description: "Your internal identifier for this post (for linking to your database)",
        maxLength: 255
      }
    },
    required: ["caption", "social_accounts"]
  }
}
```

---

## 5. Tool Annotations (MCP 2025-03-26)

### Purpose

Annotations help clients understand tool behavior without executing them. This enables:
- Better UI indicators (warning icons for destructive actions)
- Permission prompts before execution
- Retry logic for idempotent tools
- Caching for read-only tools

### Annotation Types

```typescript
{
  annotations: {
    // Human-readable title for UI display
    title: "Create Social Post",
    
    // Tool only reads data, doesn't modify
    // Enables caching, safe to call repeatedly
    readOnlyHint: false,
    
    // Tool deletes or significantly modifies data
    // Shows warning in UI, may require confirmation
    destructiveHint: false,
    
    // Safe to retry if execution fails
    // Important for network timeouts
    idempotentHint: false,
    
    // Tool interacts with external systems (APIs, databases)
    // May have side effects beyond the MCP server
    openWorldHint: true
  }
}
```

### Annotation Matrix by Tool Type

| Tool Type | readOnly | destructive | idempotent | openWorld |
|-----------|----------|-------------|------------|-----------|
| `list_*` | ✅ true | ❌ false | ✅ true | ⚠️ varies |
| `get_*` | ✅ true | ❌ false | ✅ true | ❌ false |
| `create_*` | ❌ false | ❌ false | ❌ false | ✅ true |
| `update_*` | ❌ false | ❌ false | ✅ true | ✅ true |
| `delete_*` | ❌ false | ✅ true | ✅ true | ✅ true |
| `disconnect_*` | ❌ false | ✅ true | ✅ true | ✅ true |
| `search_*` | ✅ true | ❌ false | ✅ true | ⚠️ varies |
| `validate_*` | ✅ true | ❌ false | ✅ true | ❌ false |

### Examples

```typescript
// Read-only tool
{
  name: "list_social_accounts",
  description: "List all connected social media accounts",
  annotations: {
    title: "List Social Accounts",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false  // Internal data only
  }
}

// Destructive tool
{
  name: "delete_post",
  description: "Permanently delete a social media post",
  annotations: {
    title: "Delete Post",
    readOnlyHint: false,
    destructiveHint: true,   // ⚠️ Shows warning
    idempotentHint: true,    // Safe to retry
    openWorldHint: true      // Calls external APIs
  }
}

// Create tool (non-idempotent)
{
  name: "create_post",
  description: "Create a new social media post",
  annotations: {
    title: "Create Post",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,   // ⚠️ Don't retry blindly (creates duplicates)
    openWorldHint: true
  }
}
```

---

## 6. Complete Tool Examples

### List Tools (Read-Only)

```typescript
{
  name: "list_posts",
  title: "List Posts",
  description: "Retrieve a paginated list of social media posts with optional filtering by status, platform, or date range. Results include post metadata, content, and publishing status.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of posts to return (1-100)",
        minimum: 1,
        maximum: 100,
        default: 20
      },
      offset: {
        type: "integer",
        description: "Number of posts to skip for pagination",
        minimum: 0,
        default: 0
      },
      status: {
        type: "array",
        description: "Filter by post status. Omit to see all statuses.",
        items: {
          type: "string",
          enum: ["draft", "scheduled", "processing", "processed", "failed"]
        }
      },
      platform: {
        type: "array",
        description: "Filter by platform. Omit to see all platforms.",
        items: {
          type: "string",
          enum: ["facebook", "instagram", "twitter", "linkedin", "tiktok"]
        }
      }
    }
  },
  annotations: {
    title: "List Posts",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
}
```

### Get Tool (Read-Only, Single Item)

```typescript
{
  name: "get_post",
  title: "Get Post Details",
  description: "Retrieve detailed information about a specific social media post, including its content, media attachments, scheduled time, and publishing results across platforms.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique post identifier (format: sp_xxxxxxxx)",
        pattern: "^sp_[a-zA-Z0-9]+$"
      }
    },
    required: ["id"]
  },
  annotations: {
    title: "Get Post",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
}
```

### Disconnect Tool (Destructive)

```typescript
{
  name: "disconnect_social_account",
  title: "Disconnect Social Account",
  description: "Disconnect a connected social media account. This will revoke API access tokens and prevent future posts to this account. Previously published posts remain unaffected. The account can be reconnected later.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Social account ID to disconnect (format: sa_xxxxxxxx)",
        pattern: "^sa_[a-zA-Z0-9]+$"
      },
      confirm: {
        type: "boolean",
        description: "Confirm disconnection. Must be true to proceed.",
        default: false
      }
    },
    required: ["id"]
  },
  annotations: {
    title: "Disconnect Account",
    readOnlyHint: false,
    destructiveHint: true,    // ⚠️ Warning: removes access
    idempotentHint: true,     // Safe to retry
    openWorldHint: true       // Calls external OAuth revoke
  }
}
```

---

## 7. Schema Validation with Zod

### Type-Safe Tool Definition

```typescript
import { z } from "zod";

// Define input schema
const CreatePostInputSchema = z.object({
  caption: z.string().min(1).describe("Post caption text"),
  social_accounts: z.array(z.string().regex(/^sa_[a-zA-Z0-9]+$/)).min(1),
  media: z.array(z.object({
    url: z.string().url(),
    type: z.enum(["image", "video"]).optional()
  })).optional(),
  scheduled_at: z.string().datetime().optional(),
  external_id: z.string().max(255).optional()
});

// Infer TypeScript type
type CreatePostInput = z.infer<typeof CreatePostInputSchema>;

// Convert to JSON Schema for MCP
const inputSchema = zodToJsonSchema(CreatePostInputSchema, {
  target: "openApi3",
  name: "CreatePostInput"
});
```

### JSON Schema Conversion

```typescript
function zodToMcpJsonSchema(zodSchema: z.ZodTypeAny): object {
  // Use zod-to-json-schema package
  return zodToJsonSchema(zodSchema, {
    target: "openApi3",
    $refStrategy: "none"
  });
}
```

---

## 8. Prompt Templates for LLMs

### Tool Selection Prompt

```
You have access to the following Post For Me MCP tools:

{{#each tools}}
- {{name}}: {{description}}
  {{#if annotations.readOnlyHint}}(Read-only){{/if}}
  {{#if annotations.destructiveHint}}⚠️ Destructive{{/if}}
{{/each}}

When helping users:
1. Use list_* tools to show available data
2. Use get_* tools to retrieve specific items
3. Confirm before using destructive tools (delete_*, disconnect_*)
4. Explain what each tool does before executing
```

### Tool Execution Prompt

```
I'll help you {{action}} using the {{toolName}} tool.

This will: {{toolDescription}}
{{#if annotations.destructiveHint}}
⚠️ Warning: This action cannot be undone.
{{/if}}

Parameters:
{{#each params}}
- {{name}}: {{value}} ({{type}}){{#if required}} *required{{/if}}
  {{description}}
{{/each}}

Proceed? (yes/no)
```

---

## 9. Testing Tools

### Validation Checklist

- [ ] Name follows naming convention
- [ ] Description is clear and complete
- [ ] All parameters have descriptions
- [ ] Required fields are marked
- [ ] Default values are specified where appropriate
- [ ] Annotations are accurate
- [ ] Input schema validates correctly
- [ ] Output format is documented

### Test Commands

```bash
# List tools
curl -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Validate input schema
curl -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"create_post",
      "arguments":{"caption":"Test","social_accounts":["sa_test"]}
    }
  }'
```

---

## 10. Best Practices Summary

| Aspect | Recommendation |
|--------|----------------|
| **Naming** | Use `verb_noun` pattern, kebab-case or snake_case |
| **Descriptions** | Be specific, include constraints and examples |
| **Input Schema** | Use appropriate types, add validation, mark required fields |
| **Annotations** | Accurately reflect tool behavior for better UX |
| **Defaults** | Provide sensible defaults for optional fields |
| **Errors** | Return clear error messages in tool results |
| **Documentation** | Document all parameters and return values |

---

## Reference

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-03-26)
- [JSON Schema](https://json-schema.org/)
- [Zod Documentation](https://zod.dev/)
