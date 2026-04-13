# MCP ID Validation Strategy

## Overview

We enforce ID format validation at **3 layers** to ensure all IDs start with the correct prefix:

| Layer | Location | Purpose |
|-------|----------|---------|
| 1. JSON Schema | `tools.ts` | API documentation & client validation |
| 2. Zod Runtime | `index.ts` | Server-side validation |
| 3. TypeScript Types | `types/` | Compile-time checking |

## ID Patterns

```
Social Posts:     sp_[a-zA-Z0-9]+    (e.g., sp_abc123)
Social Accounts:  sa_[a-zA-Z0-9]+    (e.g., sa_xyz789)
```

## Layer 1: JSON Schema (tools.ts)

**Purpose:** API documentation and client-side validation

```typescript
// In workers/mcp-post-for-me/src/tools.ts
ToolBuilder.create("get_post")
  .withInputSchema({
    type: "object",
    properties: {
      id: SchemaHelpers.string("Post ID (format: sp_xxxxxxxx)", {
        pattern: "^sp_[a-zA-Z0-9]+$",  // <-- JSON Schema pattern
      }),
    },
    required: ["id"],
  })
```

**Coverage:**
- `sp_` pattern: 7 tools (get_post, delete_post, list_post_results, etc.)
- `sa_` pattern: 5 tools (get_social_account, disconnect_social_account, etc.)

**Benefits:**
- Shows up in MCP client auto-completion
- Early validation before server call
- Self-documenting API

## Layer 2: Zod Runtime Validation (index.ts)

**Purpose:** Server-side enforcement

```typescript
// In workers/mcp-post-for-me/src/index.ts
const toolSchemas = {
  get_post: z.object({
    id: z.string().regex(/^sp_[a-zA-Z0-9]+$/),  // <-- Zod regex
  }),
  get_social_account: z.object({
    id: z.string().regex(/^sa_[a-zA-Z0-9]+$/),
  }),
  create_post: z.object({
    social_accounts: z.array(
      z.string().regex(/^sa_[a-zA-Z0-9]+$/)
    ).min(1),
  }),
  // ... all 11 tools
};
```

**Validation Flow:**
```
Client Request
     ↓
handleToolCall()
     ↓
schema.parse(args)  <-- Zod validation happens here
     ↓
If invalid: Return validation error
If valid:   Execute tool
```

**Error Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "Error: Validation failed: id: Invalid"
  }],
  "isError": true
}
```

## Layer 3: TypeScript Types

**Purpose:** Compile-time safety in main app

```typescript
// In types/post-for-me-types.ts
export interface SocialPost {
  id: string;  // Runtime: sp_xxx format
  // ...
}

export interface SocialAccount {
  id: string;  // Runtime: sa_xxx format
  // ...
}
```

**Note:** TypeScript types can't enforce string patterns at compile time (would need branded types or template literal types).

## Validation Matrix

| Tool | ID Field | Schema Pattern | Zod Regex | Valid Example | Invalid Example |
|------|----------|----------------|-----------|---------------|-----------------|
| list_social_accounts | - | - | - | - | - |
| get_social_account | id | `^sa_[a-zA-Z0-9]+$` | ✅ | sa_abc123 | abc123, SA_abc |
| disconnect_social_account | id | `^sa_[a-zA-Z0-9]+$` | ✅ | sa_xyz789 | sa_, xyz789 |
| list_posts | - | - | - | - | - |
| create_post | social_accounts[] | `^sa_[a-zA-Z0-9]+$` | ✅ | [sa_abc] | [abc123] |
| get_post | id | `^sp_[a-zA-Z0-9]+$` | ✅ | sp_post456 | post456, SP_post |
| get_post_with_accounts | id | `^sp_[a-zA-Z0-9]+$` | ✅ | sp_post789 | sp_, 789 |
| delete_post | id | `^sp_[a-zA-Z0-9]+$` | ✅ | sp_del999 | del999 |
| list_post_results | post_id | `^sp_[a-zA-Z0-9]+$` | ✅ | sp_res111 | res111 |
| search_posts | - | - | - | - | - |
| get_account_stats | account_id | `^sa_[a-zA-Z0-9]+$` | ✅ | sa_stat222 | stat222 |
| batch_delete_posts | post_ids[] | `^sp_[a-zA-Z0-9]+$` | ✅ | [sp_1, sp_2] | [1, 2] |

## Testing Validation

### Valid Requests (should succeed)
```bash
# Get post with valid ID
curl -X POST https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_post",
      "arguments": { "id": "sp_abc123xyz" }
    }
  }'

# Create post with valid account IDs
curl -X POST https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_post",
      "arguments": {
        "caption": "Hello",
        "social_accounts": ["sa_acc123", "sa_acc456"]
      }
    }
  }'
```

### Invalid Requests (should fail with validation error)
```bash
# Wrong prefix
curl -X POST https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_post",
      "arguments": { "id": "abc123" }  # Missing sp_ prefix
    }
  }'

# Wrong case
curl -X POST https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_post",
      "arguments": { "id": "SP_abc123" }  # Uppercase SP_
    }
  }'

# Special characters
curl -X POST https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_post",
      "arguments": { "id": "sp_abc-123" }  # Hyphen not allowed
    }
  }'
```

## Error Messages

### Zod Validation Error Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "Error: Validation failed: id: Invalid"
    }],
    "isError": true
  }
}
```

### With Detailed Error Data
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Validation failed: id: Invalid"
    },
    {
      "type": "text",
      "text": "{\n  \"validationErrors\": [\n    {\n      \"path\": \"id\",\n      \"message\": \"Invalid\",\n      \"code\": \"invalid_string\"\n    }\n  ]\n}"
    }
  ],
  "isError": true
}
```

## Future Improvements

1. **Add custom error messages in Zod:**
```typescript
id: z.string().regex(/^sp_[a-zA-Z0-9]+$/, {
  message: "ID must start with 'sp_' followed by alphanumeric characters"
})
```

2. **Branded types for TypeScript:**
```typescript
type PostId = string & { __brand: 'PostId' };
type AccountId = string & { __brand: 'AccountId' };
```

3. **Add ID helper functions:**
```typescript
function isValidPostId(id: string): id is `sp_${string}` {
  return /^sp_[a-zA-Z0-9]+$/.test(id);
}
```

## Summary

| Aspect | Implementation | Coverage |
|--------|----------------|----------|
| JSON Schema Pattern | `^sp_[a-zA-Z0-9]+$` / `^sa_[a-zA-Z0-9]+$` | 100% |
| Zod Runtime Regex | `/^sp_[a-zA-Z0-9]+$/` | 100% |
| Error Handling | Zod validation with details | 100% |
| Documentation | Pattern in field descriptions | 100% |

**All 11 MCP tools have proper ID validation at both schema and runtime levels.**
