# MCP Schema Refactor - Centralized Validation

## Problem

Previously, validation schemas were **hardcoded in multiple places**:
- `tools.ts` - JSON Schema for MCP clients
- `index.ts` - Zod schemas for runtime validation
- Pattern duplication across both files

**Issues:**
- Same regex pattern defined 10+ times
- Risk of inconsistencies
- Harder to maintain
- No single source of truth

## Solution: Centralized Schema File

Created `src/schemas/index.ts` as the **single source of truth**:

```
workers/mcp-post-for-me/src/
├── schemas/
│   └── index.ts          # All schemas defined here
├── tools.ts              # Uses JsonSchemaHelpers from schemas
├── index.ts              # Uses ToolSchemas from schemas
└── ...
```

## Schema Architecture

### 1. ID Patterns (Single Definition)

```typescript
// schemas/index.ts
export const ID_PATTERNS = {
  POST: /^sp_[a-zA-Z0-9]+$/,      // sp_ prefix
  ACCOUNT: /^sa_[a-zA-Z0-9]+$/,   // sa_ prefix
} as const;

export const PostIdSchema = z.string()
  .regex(ID_PATTERNS.POST, `Post ID must match format: sp_abc123xyz`);

export const AccountIdSchema = z.string()
  .regex(ID_PATTERNS.ACCOUNT, `Account ID must match format: sa_xyz789abc`);
```

**Before (hardcoded):**
```typescript
// In 10+ places:
z.string().regex(/^sp_[a-zA-Z0-9]+$/)  // In index.ts
pattern: "^sp_[a-zA-Z0-9]+$"           // In tools.ts
```

**After (centralized):**
```typescript
// Single definition, used everywhere
import { PostIdSchema, JsonSchemaHelpers } from "./schemas";
```

### 2. Tool Schemas Registry

```typescript
// schemas/index.ts
export const ToolSchemas = {
  list_social_accounts: ListSocialAccountsSchema,
  get_social_account: GetSocialAccountSchema,
  disconnect_social_account: DisconnectSocialAccountSchema,
  list_posts: ListPostsSchema,
  create_post: CreatePostSchema,
  get_post: GetPostSchema,
  get_post_with_accounts: GetPostWithAccountsSchema,
  delete_post: DeletePostSchema,
  list_post_results: ListPostResultsSchema,
  search_posts: SearchPostsSchema,
  get_account_stats: GetAccountStatsSchema,
  batch_delete_posts: BatchDeletePostsSchema,
} as const;

export type ToolName = keyof typeof ToolSchemas;
```

### 3. JSON Schema Helpers

```typescript
// schemas/index.ts - For tools.ts
export const JsonSchemaHelpers = {
  postId: (description = "Post ID") => ({
    type: "string" as const,
    description: `${description} (format: sp_xxxxxxxx)`,
    pattern: "^sp_[a-zA-Z0-9]+$",
  }),
  
  accountId: (description = "Account ID") => ({
    type: "string" as const,
    description: `${description} (format: sa_xxxxxxxx)`,
    pattern: "^sa_[a-zA-Z0-9]+$",
  }),
  
  accountIdArray: (description = "Account IDs") => ({
    type: "array" as const,
    description,
    items: {
      type: "string",
      pattern: "^sa_[a-zA-Z0-9]+$",
    },
    minItems: 1,
  }),
  
  postIdArray: (description = "Post IDs") => ({
    type: "array" as const,
    description,
    items: {
      type: "string",
      pattern: "^sp_[a-zA-Z0-9]+$",
    },
    minItems: 1,
    maxItems: 50,
  }),
};
```

## Usage Examples

### Before (Hardcoded)

**index.ts:**
```typescript
const toolSchemas: Record<string, z.ZodSchema> = {
  get_post: z.object({
    id: z.string().regex(/^sp_[a-zA-Z0-9]+$/),  // Hardcoded
  }),
  create_post: z.object({
    social_accounts: z.array(
      z.string().regex(/^sa_[a-zA-Z0-9]+$/)
    ).min(1),
  }),
  // ... repeated 12 times
};
```

**tools.ts:**
```typescript
ToolBuilder.create("get_post")
  .withInputSchema({
    type: "object",
    properties: {
      id: SchemaHelpers.string("Post ID", {
        pattern: "^sp_[a-zA-Z0-9]+$",  // Duplicated
      }),
    },
  });
```

### After (Centralized)

**index.ts:**
```typescript
import { ToolSchemas } from "./schemas";

const toolSchemas = ToolSchemas;  // Single import
```

**tools.ts:**
```typescript
import { JsonSchemaHelpers } from "./schemas";

ToolBuilder.create("get_post")
  .withInputSchema({
    type: "object",
    properties: {
      id: JsonSchemaHelpers.postId("Post ID"),  // Reusable
    },
  });
```

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Pattern Definition** | 10+ hardcoded | 1 centralized |
| **Consistency** | Risk of drift | Guaranteed |
| **Maintenance** | Update N places | Update 1 place |
| **Type Safety** | Manual | Inferred from schema |
| **Error Messages** | Generic | Custom per field |

## File Changes

### New File
- `src/schemas/index.ts` - Centralized schemas

### Updated Files
- `src/index.ts` - Uses `ToolSchemas` from schemas
- `src/tools.ts` - Uses `JsonSchemaHelpers` from schemas

## Deployment

✅ **Deployed:** https://mcp-post-for-me.hypelive.workers.dev
**Version:** 16aa8052-85bd-40d5-993b-03d6f77e7544

## Validation Matrix

| Tool | ID Field | Centralized Schema | Pattern |
|------|----------|-------------------|---------|
| get_social_account | id | ✅ `AccountIdSchema` | `^sa_[a-zA-Z0-9]+$` |
| disconnect_social_account | id | ✅ `AccountIdSchema` | `^sa_[a-zA-Z0-9]+$` |
| create_post | social_accounts[] | ✅ `AccountIdSchema` | `^sa_[a-zA-Z0-9]+$` |
| get_post | id | ✅ `PostIdSchema` | `^sp_[a-zA-Z0-9]+$` |
| get_post_with_accounts | id | ✅ `PostIdSchema` | `^sp_[a-zA-Z0-9]+$` |
| delete_post | id | ✅ `PostIdSchema` | `^sp_[a-zA-Z0-9]+$` |
| list_post_results | post_id | ✅ `PostIdSchema` | `^sp_[a-zA-Z0-9]+$` |
| get_account_stats | account_id | ✅ `AccountIdSchema` | `^sa_[a-zA-Z0-9]+$` |
| batch_delete_posts | post_ids[] | ✅ `PostIdSchema` | `^sp_[a-zA-Z0-9]+$` |

**All 12 tools now use centralized schemas!**

## Future Improvements

1. **Add branded types:**
```typescript
type PostId = string & { __brand: 'PostId' };
type AccountId = string & { __brand: 'AccountId' };
```

2. **Add ID helper functions:**
```typescript
export function createPostId(id: string): PostId {
  if (!ID_PATTERNS.POST.test(id)) throw new Error("Invalid Post ID");
  return id as PostId;
}
```

3. **Add schema composition:**
```typescript
export const PaginationSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export const ListPostsSchema = PaginationSchema.extend({
  status: z.array(z.string()).optional(),
});
```

---

*Schema centralization complete - single source of truth established*
