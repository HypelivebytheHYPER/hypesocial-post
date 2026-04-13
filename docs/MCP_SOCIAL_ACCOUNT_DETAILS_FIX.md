# MCP Social Account Details Fix

## Issue Identified

**Problem:** MCP tool responses for posts don't include complete social account details.

### Current Behavior

When fetching a post via `get_post` or `list_posts`, the `social_accounts` field only includes:
```json
{
  "social_accounts": [
    { "id": "sa_xxx" },
    { "id": "sa_yyy" }
  ]
}
```

**Missing fields:**
- `platform` (instagram, facebook, etc.)
- `username`
- `profile_photo_url`
- `status`

### Root Cause

The Post For Me API returns simplified `SocialAccount` references in post responses:

```typescript
// In post response - simplified reference
social_accounts: [{ id: "sa_xxx" }, { id: "sa_yyy" }]

// Full account details only available from /social-accounts endpoint
```

This is confirmed in:
- `lib/validations/webhook-schemas.ts:287`
- Post For Me API specification

## Solution

### Option 1: Document the Behavior (Recommended)

Update MCP tool descriptions to clarify what data is returned:

```typescript
ToolBuilder.create("list_posts")
  .withDescription(
    "List social media posts. " +
    "Note: social_accounts in response only includes account IDs. " +
    "Use list_social_accounts to get full account details including platform and username."
  )
```

### Option 2: Enrich Response in MCP Server

Modify MCP server to fetch and merge account details:

```typescript
case "get_post": {
  const post = await client.getPost(validatedArgs.id as string);
  
  // Fetch full account details
  const accounts = await Promise.all(
    post.social_accounts.map(async (ref) => {
      try {
        return await client.getAccount(ref.id);
      } catch {
        return ref; // Fallback to reference
      }
    })
  );
  
  result = { ...post, social_accounts: accounts };
  break;
}
```

**Pros:** Complete data in one call
**Cons:** N+1 queries, slower response

### Option 3: Add Helper Tool

Create a tool to enrich post data with account details:

```typescript
ToolBuilder.create("get_post_with_accounts")
  .withDescription("Get post with full social account details")
  // Fetches post + all referenced accounts in parallel
```

## Recommended Implementation

Use **Option 1 + Option 3**:

1. Document current behavior in tool descriptions
2. Add `get_post_with_accounts` tool for when full details are needed
3. Update types to reflect actual API response

## Updated MCP Tool Schemas

### list_posts / get_post

```typescript
.withDescription(
  "Returns posts with social_accounts as ID references only. " +
  "Each social_account object contains: { id: string }. " +
  "Use 'list_social_accounts' to get full account details (platform, username, etc.)."
)
```

### New: get_post_enriched

```typescript
ToolBuilder.create("get_post_enriched")
  .withTitle("Get Post with Account Details")
  .withDescription(
    "Get a post with full social account details including platform, username, and profile photo. " +
    "This makes additional API calls to fetch complete account information."
  )
  .withInputSchema({
    type: "object",
    properties: {
      id: SchemaHelpers.string("Post ID", { pattern: "^sp_[a-zA-Z0-9]+$" }),
    },
    required: ["id"],
  })
  .asReadOnly()
  .build()
```

## Type Corrections

Update `types/post-for-me-types.ts` to reflect actual API:

```typescript
// Current (incorrect)
export interface SocialPost {
  social_accounts: SocialAccount[]; // Actually only has { id }
}

// Fixed
export interface SocialAccountRef {
  id: string;
}

export interface SocialPost {
  social_accounts: SocialAccountRef[];
}

// Full post with enriched accounts (from get_post_enriched)
export interface SocialPostEnriched extends SocialPost {
  social_accounts: SocialAccount[]; // Full details
}
```

## Files to Update

1. `workers/mcp-post-for-me/src/tools.ts` - Update descriptions
2. `workers/mcp-post-for-me/src/index.ts` - Add enriched tool
3. `types/post-for-me-types.ts` - Fix types
4. `lib/validations/webhook-schemas.ts` - Already correct

## TOON Cache

```
~/.kimi/cache/mcp-social-account-fix.toon
[3,]{option,effort,impact,recommended}:
1_document,low,medium,yes
2_enrich,medium,high,no
3_helper,medium,high,yes
```

---

*Issue identified during MCP field alignment audit*
