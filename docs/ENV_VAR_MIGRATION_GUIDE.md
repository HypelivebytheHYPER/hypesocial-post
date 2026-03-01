# Environment Variable Migration Guide

## Quick Reference Card: POSTFORME_* to POST_FOR_ME_*

---

## The Change

| Old (Deprecated) | New (Current) |
|-----------------|---------------|
| `POSTFORME_API_KEY` | `POST_FOR_ME_API_KEY` |
| `POSTFORME_API_URL` | `POST_FOR_ME_BASE_URL` |
| `POSTFORME_WEBHOOK_SECRET` | `POST_FOR_ME_WEBHOOK_SECRET` |
| `POSTFORME_BASE_URL` | `POST_FOR_ME_BASE_URL` |

---

## Why?

The official Post For Me SDK (`post-for-me-mcp`) expects `POST_FOR_ME_API_KEY`. Our old naming was inconsistent with:
- Official SDK conventions
- Industry standards for multi-word env vars
- The service's branding ("Post For Me" not "Postforme")

---

## Files Changed (25 Total)

### API Routes (11)
```
app/api/posts/route.ts
app/api/posts/[id]/route.ts
app/api/accounts/route.ts
app/api/accounts/[id]/route.ts
app/api/post-results/route.ts
app/api/post-results/[id]/route.ts
app/api/webhooks/route.ts
app/api/webhooks/[id]/route.ts
app/api/webhooks/post-for-me/route.ts
app/api/media/route.ts
app/api/social-post-previews/route.ts
app/api/account-feeds/[accountId]/route.ts
```

### Actions & UI (3)
```
app/actions/webhooks.ts
app/(dashboard)/diagnostics/page.tsx
app/api/debug-env/route.ts
app/api/debug-api/route.ts
```

### Config (5)
```
.env.example
.env.local
.mcp.json
vercel.json
.github/workflows/ci.yml
```

### Docs (4)
```
README.md
CLAUDE.md
AI_INTEGRATION.md
AGENT_GUIDE.md
```

---

## Verification Commands

### Check for Old Names (Should Return Nothing)
```bash
grep -r "POSTFORME" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.yml" --include="*.md" .
```

### Verify New Names
```bash
grep -r "POST_FOR_ME_API_KEY" --include="*.ts" --include="*.tsx" . | wc -l
grep -r "POST_FOR_ME_BASE_URL" --include="*.ts" --include="*.tsx" . | wc -l
```

### Check Vercel
```bash
vercel env ls | grep POST_FOR_ME
```

### Test API
```bash
curl https://hypesocial-post.vercel.app/api/posts
curl https://hypesocial-post.vercel.app/api/accounts
```

---

## Common Pitfalls

### 1. CI/CD Secrets Not Updated
**Fix**: Update GitHub Actions secrets to use new naming

### 2. MCP Config Wrong
**Fix**: Ensure `.mcp.json` uses `POST_FOR_ME_API_KEY`

### 3. Local .env.local Outdated
**Fix**: Update your local `.env.local` file

### 4. Vercel Vars Not Updated
**Fix**: Use `vercel env rm` to remove old, `vercel env add` to add new

---

## Checklist

### Codebase
- [ ] No `POSTFORME_*` in `.ts` files
- [ ] No `POSTFORME_*` in `.tsx` files
- [ ] No `POSTFORME_*` in `.json` files
- [ ] No `POSTFORME_*` in `.yml` files
- [ ] No `POSTFORME_*` in `.md` files

### Config
- [ ] `.env.example` updated
- [ ] `.env.local` updated
- [ ] `.mcp.json` updated
- [ ] `vercel.json` updated
- [ ] `.github/workflows/ci.yml` updated

### Vercel
- [ ] Production: `POST_FOR_ME_API_KEY` set
- [ ] Production: `POST_FOR_ME_BASE_URL` set
- [ ] Production: `POST_FOR_ME_WEBHOOK_SECRET` set
- [ ] Preview: All three variables set

### CI/CD
- [ ] GitHub secrets updated
- [ ] Build works

### Testing
- [ ] Local dev works
- [ ] Preview works
- [ ] Production works
- [ ] MCP server starts
- [ ] API endpoints respond
- [ ] Webhooks verify correctly

---

## Usage Pattern

```typescript
// API routes
const API_BASE = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;

// Webhook verification
const secret = request.headers.get("Post-For-Me-Webhook-Secret");
const expected = process.env.POST_FOR_ME_WEBHOOK_SECRET;
```

---

## MCP Configuration

```json
{
  "mcpServers": {
    "post_for_me_api": {
      "command": "npx",
      "args": ["-y", "post-for-me-mcp"],
      "env": {
        "POST_FOR_ME_API_KEY": "${POST_FOR_ME_API_KEY}"
      }
    }
  }
}
```

---

## Vercel CLI Commands

```bash
# Remove old variables
vercel env rm POSTFORME_API_KEY -y
vercel env rm POSTFORME_API_URL -y
vercel env rm POSTFORME_WEBHOOK_SECRET -y

# Add new variables (production)
vercel env add POST_FOR_ME_API_KEY production
vercel env add POST_FOR_ME_BASE_URL production
vercel env add POST_FOR_ME_WEBHOOK_SECRET production

# Add new variables (preview)
vercel env add POST_FOR_ME_API_KEY preview
vercel env add POST_FOR_ME_BASE_URL preview
vercel env add POST_FOR_ME_WEBHOOK_SECRET preview
```

---

## Need Help?

1. Check full documentation: [`/ENVIRONMENT_VARIABLES.md`](/ENVIRONMENT_VARIABLES.md)
2. Run diagnostics: Visit `/diagnostics` page in the app
3. Check debug endpoint: `GET /api/debug-env`

---

**Migration Date**: 2025-03-01
