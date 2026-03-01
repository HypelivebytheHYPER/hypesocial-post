# Environment Variables - Single Source of Truth

## Post For Me API Integration

### Required Variables

| Variable | Format | Example | Required In |
|----------|--------|---------|-------------|
| `POST_FOR_ME_API_KEY` | `pfm_live_*` | `pfm_live_xxxxxxxx` | Production, Preview, Local |
| `POST_FOR_ME_BASE_URL` | URL | `https://api.postforme.dev` | Production, Preview, Local |
| `POST_FOR_ME_WEBHOOK_SECRET` | string | `whsec_xxxxxxxx` | Production, Preview (optional for local) |

### Deprecated Variables (REMOVED)

These variables have been **completely removed** from the codebase and Vercel:

- ❌ `POSTFORME_API_KEY` - Use `POST_FOR_ME_API_KEY`
- ❌ `POSTFORME_API_URL` - Use `POST_FOR_ME_BASE_URL`
- ❌ `POSTFORME_WEBHOOK_SECRET` - Use `POST_FOR_ME_WEBHOOK_SECRET`
- ❌ `POSTFORME_BASE_URL` - Use `POST_FOR_ME_BASE_URL`

---

## Storage Architecture

This project uses **Post For Me's managed storage** for all social media assets. No separate storage configuration is required.

### Post For Me Managed Storage (Automatic)

| Asset Type | Storage URL | Managed By |
|------------|-------------|------------|
| Profile Photos | `https://cjsgitiiwhrsfolwmtby.supabase.co/storage/...` | Post For Me |
| Post Media | `https://data.postforme.dev/storage/...` | Post For Me |

**Note:** The Supabase URL above belongs to Post For Me's infrastructure, not this project. All storage is handled transparently through the Post For Me API.

### No Local Storage Required

The following have been removed from the project:
- ❌ Project-specific Supabase configuration
- ❌ R2/Media Worker configuration
- ❌ Custom storage buckets

All media uploads and storage are managed by Post For Me's API.

---

## Migration Summary: POSTFORME_* to POST_FOR_ME_*

### Why This Change Was Needed

The official Post For Me SDK (`post-for-me-mcp`) uses `POST_FOR_ME_API_KEY` as its expected environment variable name. Our original `POSTFORME_API_KEY` naming was inconsistent with:

1. **Official SDK conventions** - The Post For Me MCP server expects `POST_FOR_ME_API_KEY`
2. **Industry standards** - Multi-word environment variables typically use underscores between words
3. **Consistency** - Aligning with how the service brands itself ("Post For Me" not "Postforme")

### What Changed

| Old Name | New Name | Status |
|----------|----------|--------|
| `POSTFORME_API_KEY` | `POST_FOR_ME_API_KEY` | Migrated |
| `POSTFORME_API_URL` | `POST_FOR_ME_BASE_URL` | Migrated |
| `POSTFORME_WEBHOOK_SECRET` | `POST_FOR_ME_WEBHOOK_SECRET` | Migrated |
| `POSTFORME_BASE_URL` | `POST_FOR_ME_BASE_URL` | Migrated |

---

## Files Modified (25 Total)

### Source Code Files (13)

| # | File | Variable Usage |
|---|------|----------------|
| 1 | `app/api/posts/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 2 | `app/api/posts/[id]/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 3 | `app/api/accounts/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 4 | `app/api/accounts/[id]/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 5 | `app/api/post-results/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 6 | `app/api/post-results/[id]/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 7 | `app/api/webhooks/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 8 | `app/api/webhooks/[id]/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 9 | `app/api/webhooks/post-for-me/route.ts` | `POST_FOR_ME_WEBHOOK_SECRET` |
| 10 | `app/api/media/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 11 | `app/api/social-post-previews/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 12 | `app/api/account-feeds/[accountId]/route.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |
| 13 | `app/actions/webhooks.ts` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |

### UI/Diagnostics Files (2)

| # | File | Purpose |
|---|------|---------|
| 14 | `app/(dashboard)/diagnostics/page.tsx` | Displays `POST_FOR_ME_API_KEY` status |
| 15 | `app/api/debug-env/route.ts` | Debug endpoint for env vars |
| 16 | `app/api/debug-api/route.ts` | Debug endpoint for API testing |

### Configuration Files (5)

| # | File | Variables Defined |
|------|------|-------------------|
| 17 | `.env.example` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL`, `POST_FOR_ME_WEBHOOK_SECRET` |
| 18 | `.env.local` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL`, `POST_FOR_ME_WEBHOOK_SECRET` |
| 19 | `.mcp.json` | `POST_FOR_ME_API_KEY` (for MCP server) |
| 20 | `vercel.json` | `POST_FOR_ME_BASE_URL` |
| 21 | `.github/workflows/ci.yml` | `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL` |

### Documentation Files (4)

| # | File | Purpose |
|------|------|---------|
| 22 | `README.md` | Setup instructions |
| 23 | `CLAUDE.md` | Project guide for AI agents |
| 24 | `AI_INTEGRATION.md` | MCP/AI integration docs |
| 25 | `AGENT_GUIDE.md` | Agent troubleshooting |

---

## Current Status

### Vercel Production
```
POST_FOR_ME_API_KEY         (set in Vercel dashboard)
POST_FOR_ME_BASE_URL        https://api.postforme.dev
POST_FOR_ME_WEBHOOK_SECRET  (set in Vercel dashboard)
```

### Vercel Preview
```
POST_FOR_ME_API_KEY         (set in Vercel dashboard)
POST_FOR_ME_BASE_URL        https://api.postforme.dev
POST_FOR_ME_WEBHOOK_SECRET  (set in Vercel dashboard)
```

### Local Development (.env.local)
```
POST_FOR_ME_API_KEY=your_api_key_here
POST_FOR_ME_BASE_URL=https://api.postforme.dev
POST_FOR_ME_WEBHOOK_SECRET=your_webhook_secret
```

---

## Usage in Code

All API routes use these exact variable names:

```typescript
const API_BASE = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;
```

Webhook verification:
```typescript
const secret = request.headers.get("Post-For-Me-Webhook-Secret");
const expected = process.env.POST_FOR_ME_WEBHOOK_SECRET;
```

---

## Verification Commands

### Check for Old Variable Names (Should Return Nothing)

```bash
# Search for any remaining POSTFORME references
grep -r "POSTFORME" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.md" .

# Search in hidden files too
grep -r "POSTFORME" --include=".env*" .
```

### Verify New Variable Names

```bash
# Count usages of new naming
grep -r "POST_FOR_ME_API_KEY" --include="*.ts" --include="*.tsx" . | wc -l
grep -r "POST_FOR_ME_BASE_URL" --include="*.ts" --include="*.tsx" . | wc -l
grep -r "POST_FOR_ME_WEBHOOK_SECRET" --include="*.ts" --include="*.tsx" . | wc -l
```

### Check Vercel Environment

```bash
# List all Vercel environment variables
vercel env ls

# Filter for Post For Me variables
vercel env ls | grep POST_FOR_ME

# Should show:
# POST_FOR_ME_API_KEY
# POST_FOR_ME_BASE_URL
# POST_FOR_ME_WEBHOOK_SECRET
```

### Test API Endpoints

```bash
# Test posts endpoint
curl https://hypesocial-post.vercel.app/api/posts

# Test accounts endpoint
curl https://hypesocial-post.vercel.app/api/accounts

# Test with explicit header (if you have a key)
curl -H "Authorization: Bearer $POST_FOR_ME_API_KEY" \
  https://api.postforme.dev/v1/social-posts
```

---

## Common Pitfalls

### 1. Mixing Old and New Naming

**Problem**: Some files use old naming while others use new.

**Solution**: Run the grep commands above to find any stragglers.

### 2. CI/CD Secrets Not Updated

**Problem**: GitHub Actions or other CI/CD still uses old secret names.

**Solution**: Update repository secrets:
- Go to GitHub repo → Settings → Secrets and variables → Actions
- Remove: `POSTFORME_API_KEY`, `POSTFORME_API_URL`, `POSTFORME_WEBHOOK_SECRET`
- Add: `POST_FOR_ME_API_KEY`, `POST_FOR_ME_BASE_URL`, `POST_FOR_ME_WEBHOOK_SECRET`

### 3. MCP Configuration Using Wrong Name

**Problem**: MCP server fails to start because it expects `POST_FOR_ME_API_KEY`.

**Solution**: Ensure `.mcp.json` and `~/.claude/mcp.json` use the new naming:

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

### 4. Local .env.local Not Updated

**Problem**: Local development fails because `.env.local` still has old names.

**Solution**: Update your local `.env.local`:

```bash
# Remove old names
sed -i '' '/POSTFORME/d' .env.local

# Add new names
echo "POST_FOR_ME_API_KEY=your_key" >> .env.local
echo "POST_FOR_ME_BASE_URL=https://api.postforme.dev" >> .env.local
```

### 5. Vercel Environment Variables Not Updated

**Problem**: Production/preview deployments fail because Vercel still has old names.

**Solution**: Update via CLI or dashboard:

```bash
# Remove old variables
vercel env rm POSTFORME_API_KEY -y
vercel env rm POSTFORME_API_URL -y
vercel env rm POSTFORME_WEBHOOK_SECRET -y

# Add new variables
vercel env add POST_FOR_ME_API_KEY production
vercel env add POST_FOR_ME_BASE_URL production
vercel env add POST_FOR_ME_WEBHOOK_SECRET production

# Repeat for preview environment
vercel env add POST_FOR_ME_API_KEY preview
vercel env add POST_FOR_ME_BASE_URL preview
vercel env add POST_FOR_ME_WEBHOOK_SECRET preview
```

---

## Verification Checklist

Use this checklist after migration:

### Codebase Verification
- [ ] No `POSTFORME_*` references in any `.ts` files
- [ ] No `POSTFORME_*` references in any `.tsx` files
- [ ] No `POSTFORME_*` references in any `.json` files
- [ ] No `POSTFORME_*` references in any `.yml` or `.yaml` files
- [ ] No `POSTFORME_*` references in any `.md` files
- [ ] No `POSTFORME_*` references in any `.env*` files

### Configuration Verification
- [ ] `.env.example` uses `POST_FOR_ME_*` naming
- [ ] `.env.local` uses `POST_FOR_ME_*` naming
- [ ] `.mcp.json` uses `POST_FOR_ME_API_KEY`
- [ ] `vercel.json` uses `POST_FOR_ME_BASE_URL`
- [ ] `.github/workflows/ci.yml` uses `POST_FOR_ME_*` naming

### Vercel Verification
- [ ] Production: `POST_FOR_ME_API_KEY` is set
- [ ] Production: `POST_FOR_ME_BASE_URL` is set to `https://api.postforme.dev`
- [ ] Production: `POST_FOR_ME_WEBHOOK_SECRET` is set
- [ ] Preview: `POST_FOR_ME_API_KEY` is set
- [ ] Preview: `POST_FOR_ME_BASE_URL` is set to `https://api.postforme.dev`
- [ ] Preview: `POST_FOR_ME_WEBHOOK_SECRET` is set

### CI/CD Verification
- [ ] GitHub Actions secrets use `POST_FOR_ME_*` naming
- [ ] CI workflow file references correct variable names
- [ ] Build process can access the new variables

### Testing Verification
- [ ] Local development works with new naming
- [ ] Preview deployment works with new naming
- [ ] Production deployment works with new naming
- [ ] MCP server starts successfully
- [ ] API endpoints respond correctly
- [ ] Webhook verification works

---

## CI/CD Secrets (GitHub)

Required secrets in GitHub repository:

- `POST_FOR_ME_API_KEY`
- `POST_FOR_ME_BASE_URL`
- `NEXTAUTH_SECRET`

---

## Quick Reference

| Task | Command |
|------|---------|
| Check for old vars | `grep -r "POSTFORME" --include="*.ts" --include="*.tsx" .` |
| Check Vercel env | `vercel env ls \| grep POST_FOR_ME` |
| Test API | `curl https://hypesocial-post.vercel.app/api/posts` |
| Type check | `pnpm type-check` |
| Build | `pnpm build` |

---

## Last Updated

2025-03-01 - Migration from `POSTFORME_*` to `POST_FOR_ME_*` completed.

See also: [docs/ENV_VAR_MIGRATION_GUIDE.md](./docs/ENV_VAR_MIGRATION_GUIDE.md) for quick reference card.
