# MCP Social Account Details - Fix Summary

## Issue Identified

**Problem:** MCP tools `list_posts` and `get_post` were returning `social_accounts` with only `id` field, missing important details like:
- `platform` (instagram, facebook, etc.)
- `username`
- `profile_photo_url`
- `status`

## Root Cause

The Post For Me API returns simplified account references in post responses:
```json
{
  "social_accounts": [{ "id": "sa_xxx" }]
}
```

Full account details require separate API calls to `/social-accounts`.

## Solution Implemented

### 1. Updated Tool Descriptions ✅

**list_posts** and **get_post** now include:
```
"Note: social_accounts in response only includes { id }. " +
"Use 'get_social_account' or 'list_social_accounts' to get full account details..."
```

### 2. New Tool: get_post_with_accounts ✅

Added enriched tool that fetches full account details:

```typescript
ToolBuilder.create("get_post_with_accounts")
  .withTitle("Get Post with Account Details")
  .withDescription(
    "Get a post with full social account details including platform, username, and profile photo. " +
    "This tool makes additional API calls to fetch complete account information..."
  )
```

**Implementation:**
```typescript
case "get_post_with_accounts": {
  const post = await client.getPost(validatedArgs.id as string);
  // Enrich with full account details
  if (post.social_accounts?.length > 0) {
    const enrichedAccounts = await Promise.all(
      post.social_accounts.map(async (ref) => {
        try {
          return await client.getAccount(ref.id);
        } catch {
          return ref; // Fallback to reference
        }
      })
    );
    result = { ...post, social_accounts: enrichedAccounts };
  }
  break;
}
```

## MCP Server Status

✅ **Deployed:** https://mcp-post-for-me.hypelive.workers.dev

**Version ID:** aa2e4a9c-575d-40cb-8000-379a149e767e

## Available Tools (12 total)

| Tool | Returns Full Account Details | Description |
|------|------------------------------|-------------|
| list_posts | ❌ No | Lists posts (account IDs only) |
| get_post | ❌ No | Gets post (account IDs only) |
| **get_post_with_accounts** | ✅ Yes | Gets post + full account details |
| list_social_accounts | ✅ Yes | Lists all accounts with details |
| get_social_account | ✅ Yes | Gets single account details |

## Usage Examples

### Quick lookup (account IDs only)
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_post",
    "arguments": { "id": "sp_xxx" }
  }
}
// Returns: { social_accounts: [{ id: "sa_xxx" }] }
```

### Full details (enriched)
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_post_with_accounts",
    "arguments": { "id": "sp_xxx" }
  }
}
// Returns: { 
//   social_accounts: [{ 
//     id: "sa_xxx", 
//     platform: "instagram",
//     username: "user",
//     profile_photo_url: "..."
//   }] 
// }
```

## Files Updated

1. `workers/mcp-post-for-me/src/tools.ts`
   - Updated `list_posts` description
   - Updated `get_post` description
   - Added `get_post_with_accounts` tool

2. `workers/mcp-post-for-me/src/index.ts`
   - Added schema for `get_post_with_accounts`
   - Added handler with parallel account fetching

## Documentation

- `docs/MCP_SOCIAL_ACCOUNT_DETAILS_FIX.md` - Full analysis
- `docs/MCP_SOCIAL_ACCOUNT_FIX_SUMMARY.md` - This summary

## Recommendations

1. **Use `get_post`** when you only need post content/status
2. **Use `get_post_with_accounts`** when you need platform/username info
3. **Cache account details** in your application to avoid repeated calls
4. **Use `list_social_accounts`** to get all accounts with details upfront

---

*Fix deployed and verified*
