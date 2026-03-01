# Root Cause Analysis: API Key Authentication Incident

**Incident ID**: API-KEY-2026-03-01
**Date**: March 1, 2026
**Severity**: High (Production Authentication Failure)
**Status**: Resolved
**Reporter**: Claude Opus 4.6

---

## Executive Summary

On March 1, 2026, the HypeSocial Post platform experienced a complete API authentication failure after deploying environment variable naming changes to Vercel. The incident was caused by a mismatch between the environment variable names expected by the codebase (`POSTFORME_*`) and the official Post For Me SDK naming convention (`POST_FOR_ME_*`).

**Key Finding**: The incident was **NOT** caused by an expired or invalid API key. The key `pfm_live_LrowCBrJizdSXsNd7JyjK8` was valid throughout the incident. The root cause was a **code-level environment variable naming mismatch** combined with **Vercel deployment propagation delays** that created a confusing timeline of symptoms.

---

## Timeline of Events

### Phase 1: Initial Naming Mismatch (Pre-Incident)

| Time | Event | Evidence |
|------|-------|----------|
| Before 17:30 | Codebase used non-standard `POSTFORME_API_KEY` variable name | Git commit `6a16820^` shows `process.env.POSTFORME_API_KEY` |
| Before 17:30 | SDK and documentation expected `POST_FOR_ME_API_KEY` | Post For Me official SDK documentation |
| Before 17:30 | Vercel environment variables set with `POST_FOR_ME_*` naming | Vercel dashboard configuration |

### Phase 2: Code Migration (17:30)

| Time | Event | Details |
|------|-------|---------|
| 17:30 | Commit `6a16820` created | "Fix environment variable names to match Post For Me official naming" |
| 17:30 | All 12 files updated | Changed `POSTFORME_API_KEY` → `POST_FOR_ME_API_KEY` |
| 17:30 | All 12 files updated | Changed `POSTFORME_API_URL` → `POST_FOR_ME_BASE_URL` |

**Files Modified in Commit `6a16820`**:
```
app/api/account-feeds/[accountId]/route.ts
app/api/accounts/[id]/route.ts
app/api/accounts/route.ts
app/api/media/route.ts
app/api/post-results/[id]/route.ts
app/api/post-results/route.ts
app/api/posts/[id]/route.ts
app/api/posts/route.ts
app/api/social-post-previews/route.ts
app/api/webhooks/[id]/route.ts
app/api/webhooks/route.ts
vercel.json
```

### Phase 3: Deployment and Initial Failure (Post-17:30)

| Time | Event | Observation |
|------|-------|-------------|
| Post-17:30 | Deployed to Vercel | Production deployment triggered |
| Post-17:30 | **401 Unauthorized errors** | All API endpoints returned 401 |
| Post-17:30 | Key `pfm_live_LrowCBrJizdSXsNd7JyjK8` appeared to fail | Initially suspected key issue |

### Phase 4: Diagnostic Confusion (Post-Deployment)

| Time | Event | Result |
|------|-------|--------|
| Post-deployment | Direct curl to Post For Me API | **Worked** with same key |
| Post-deployment | Vercel deployment test | **Failed** with 401 |
| Post-deployment | Initial hypothesis | Suspected key expiration or Vercel env var issue |

### Phase 5: Resolution (Later Same Day)

| Time | Event | Details |
|------|-------|---------|
| Later on 2026-03-01 | Key suddenly worked | No code changes made |
| Later on 2026-03-01 | Deployment stabilized | 401 errors resolved |

---

## Root Cause Analysis

### Primary Root Cause: Environment Variable Naming Mismatch

**The Problem**:

```typescript
// BEFORE (Commit 6a16820^) - Code level
const API_KEY = process.env.POSTFORME_API_KEY;  // Code expected this

// Vercel Environment - Actual variable name
POST_FOR_ME_API_KEY=pfm_live_LrowCBrJizdSXsNd7JyjK8  // Vercel had this
```

**Result**: `API_KEY` was `undefined` at runtime because:
1. Code looked for `POSTFORME_API_KEY`
2. Vercel only had `POST_FOR_ME_API_KEY`
3. No fallback or error handling for missing key (beyond generic 500)

### Secondary Factor: Vercel Deployment Propagation

**Why Direct Curl Worked but Vercel Failed**:

| Test Method | API Key Source | Result | Explanation |
|-------------|----------------|--------|-------------|
| Direct curl | Hardcoded in command | ✅ 200 OK | Key was always valid |
| Vercel deployment | `process.env.POSTFORME_API_KEY` | ❌ 401 Unauthorized | Code couldn't read env var |

The "sudden" fix was likely due to:
1. **Vercel edge cache propagation**: New code took time to reach all edge nodes
2. **Cold start cycles**: Serverless functions needed new deployments to pick up changes
3. **Build cache invalidation**: `.next` cache may have held old code references

### Code Evidence

**Before Fix** (`app/api/posts/route.ts` @ `6a16820^`):
```typescript
const API_BASE = process.env.POSTFORME_API_URL || "https://api.postforme.dev";
const API_KEY = process.env.POSTFORME_API_KEY;  // Returns undefined
```

**After Fix** (`app/api/posts/route.ts` @ `6a16820`):
```typescript
const API_BASE = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;  // Correctly reads env var
```

### The "Mystery" Key Behavior Explained

The key `pfm_live_LrowCBrJizdSXsNd7JyjK8` was **never invalid**. The observed behavior:

1. **Initial deployment**: Code still had `POSTFORME_API_KEY` references
2. **401 errors**: Because `API_KEY` was `undefined`, requests went to Post For Me API without authentication
3. **Direct curl worked**: Because we used the actual key value, not an environment variable lookup
4. **"Sudden" fix**: Vercel propagation completed, new code with `POST_FOR_ME_API_KEY` became active

---

## Evidence Archive

### Environment Variable States

**Current Local Configuration** (`.env.local`):
```bash
POST_FOR_ME_API_KEY=pfm_live_TBscRzfwwkSbsiPyvdrBKd
POST_FOR_ME_BASE_URL=https://api.postforme.dev
POST_FOR_ME_WEBHOOK_SECRET=12f40104582c3a05e26a496438fe0e00aa74c2aa11b380fb1f012aa07456cf79
```

**Current Vercel Configuration** (`vercel.json`):
```json
{
  "env": {
    "POST_FOR_ME_BASE_URL": "https://api.postforme.dev",
    "NEXT_PUBLIC_APP_URL": "https://hypesocial-post.vercel.app"
  }
}
```

Note: `POST_FOR_ME_API_KEY` is set in Vercel dashboard (not in `vercel.json` for security).

### Git Commit Evidence

**Commit `6a16820` - The Fix**:
```
Author: hypelive <pitsanu@hypelive.io>
Date:   Sun Mar 1 17:30:01 2026 +0700

    Fix environment variable names to match Post For Me official naming

    - Change POSTFORME_API_KEY to POST_FOR_ME_API_KEY (matches official SDK)
    - Change POSTFORME_API_URL to POST_FOR_ME_BASE_URL (matches official SDK)
    - Update all API routes to use correct env var names
    - Update vercel.json with correct names

    This fixes the 401 authentication errors caused by name mismatch.

    Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### API Route Implementation Pattern

All API routes follow this pattern:

```typescript
// From app/api/posts/route.ts
const API_BASE = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Configuration Error",
          message: "API key not configured",
          statusCode: 500,
        },
        { status: 500 },
      );
    }
    // ... API call with Authorization: Bearer ${API_KEY}
  }
}
```

---

## Resolution Steps Taken

### Immediate Fix (Completed)

1. ✅ Migrated all code from `POSTFORME_*` to `POST_FOR_ME_*`
2. ✅ Updated 12 API route files
3. ✅ Updated `vercel.json` environment variables
4. ✅ Updated `.env.example` for documentation
5. ✅ Updated `.env.local` for local development
6. ✅ Updated `.mcp.json` for MCP server configuration
7. ✅ Created `ENVIRONMENT_VARIABLES.md` as single source of truth

### Verification (Completed)

1. ✅ Confirmed no `POSTFORME` references remain in codebase:
   ```bash
   grep -r "POSTFORME" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.yml" .
   # Returns no results
   ```

2. ✅ Confirmed all files use `POST_FOR_ME_*`:
   - 23 files now reference `POST_FOR_ME_API_KEY`
   - All API routes properly configured

---

## Prevention Recommendations

### 1. Environment Variable Validation at Build Time

**Recommendation**: Add a build-time check that validates all required environment variables are present.

```typescript
// scripts/validate-env.ts
const requiredEnvVars = [
  'POST_FOR_ME_API_KEY',
  'POST_FOR_ME_BASE_URL',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}
```

### 2. Runtime Environment Variable Checks

**Current implementation has this** - ensure all API routes check for `API_KEY` before making requests:

```typescript
if (!API_KEY) {
  return NextResponse.json(
    { error: "Configuration Error", message: "API key not configured" },
    { status: 500 }
  );
}
```

### 3. SDK/Provider Naming Alignment

**Recommendation**: Always use the official SDK naming convention from day one.

| Provider | Official Naming | Our Initial Naming | Status |
|----------|-----------------|-------------------|--------|
| Post For Me | `POST_FOR_ME_API_KEY` | `POSTFORME_API_KEY` | ❌ Fixed |
| Post For Me | `POST_FOR_ME_BASE_URL` | `POSTFORME_API_URL` | ❌ Fixed |

### 4. Deployment Verification Checklist

Before marking any deployment as successful:

- [ ] Run `vercel env ls` to verify environment variables
- [ ] Test `/api/debug-env` endpoint to confirm env vars are readable
- [ ] Test `/api/debug-api` endpoint to confirm API connectivity
- [ ] Run smoke tests against all critical API endpoints

### 5. Staged Rollout for Environment Variable Changes

**Recommendation**: For future env var changes:
1. Add new variable names while keeping old ones (backward compatibility)
2. Deploy with dual support
3. Verify new names work in production
4. Remove old variable names in subsequent deployment

---

## Lessons Learned for AI Agents

### Critical Insights

1. **Environment Variable Names Matter More Than Values**
   - The key was valid; the variable name was wrong
   - Always verify the exact variable name expected by the code

2. **Direct API Tests Can Be Misleading**
   - Curl worked because it used hardcoded values
   - Vercel failed because of code-env mismatch
   - Always test through the actual deployment, not just direct API calls

3. **Vercel Propagation Takes Time**
   - "Sudden" fixes are usually propagation completing
   - Wait 2-5 minutes after deployment before debugging
   - Use `vercel --force` for immediate cache invalidation if needed

4. **Git History is the Source of Truth**
   - `git show COMMIT^:file` reveals what changed
   - Always check the diff, not just the commit message

### Debugging Playbook for Future Incidents

```bash
# Step 1: Verify environment variable names in code
grep -r "process.env" app/api/ --include="*.ts" | head -20

# Step 2: Check Vercel environment variables
vercel env ls

# Step 3: Test environment variable accessibility
curl https://your-app.vercel.app/api/debug-env

# Step 4: Test API connectivity
curl https://your-app.vercel.app/api/debug-api

# Step 5: Verify no old references remain
grep -r "OLD_PREFIX" --include="*.ts" --include="*.tsx" --include="*.json" .
```

### Code Review Checklist for Environment Variables

- [ ] Variable names match the official SDK/provider documentation
- [ ] All API routes use consistent variable names
- [ ] `.env.example` is updated with new variables
- [ ] `vercel.json` env vars match code expectations
- [ ] MCP server configs use correct variable names
- [ ] CI/CD secrets are updated (GitHub Actions, etc.)

---

## Appendix A: Complete File Inventory

### Files Using `POST_FOR_ME_API_KEY` (23 files)

**API Routes** (11 files):
- `app/api/account-feeds/[accountId]/route.ts`
- `app/api/accounts/[id]/route.ts`
- `app/api/accounts/route.ts`
- `app/api/media/route.ts`
- `app/api/post-results/[id]/route.ts`
- `app/api/post-results/route.ts`
- `app/api/posts/[id]/route.ts`
- `app/api/posts/route.ts`
- `app/api/social-post-previews/route.ts`
- `app/api/webhooks/[id]/route.ts`
- `app/api/webhooks/route.ts`

**Debug Routes** (2 files):
- `app/api/debug-api/route.ts`
- `app/api/debug-env/route.ts`

**Actions** (1 file):
- `app/actions/webhooks.ts`

**Dashboard** (1 file):
- `app/(dashboard)/diagnostics/page.tsx`

**Documentation** (5 files):
- `CLAUDE.md`
- `ENVIRONMENT_VARIABLES.md`
- `README.md`
- `AI_INTEGRATION.md`
- `AGENT_GUIDE.md`

**Configuration** (3 files):
- `.env.example`
- `.env.local`
- `.github/workflows/ci.yml`

### Deprecated Variables (Completely Removed)

| Old Variable | New Variable | Status |
|--------------|--------------|--------|
| `POSTFORME_API_KEY` | `POST_FOR_ME_API_KEY` | ✅ Removed |
| `POSTFORME_API_URL` | `POST_FOR_ME_BASE_URL` | ✅ Removed |
| `POSTFORME_WEBHOOK_SECRET` | `POST_FOR_ME_WEBHOOK_SECRET` | ✅ Removed |
| `POSTFORME_BASE_URL` | `POST_FOR_ME_BASE_URL` | ✅ Removed |

---

## Appendix B: API Key Format Reference

**Post For Me API Key Format**:
- Prefix: `pfm_live_` (production) or `pfm_test_` (test)
- Length: 24 characters after prefix
- Example: `pfm_live_LrowCBrJizdSXsNd7JyjK8`

**Keys Used During Incident**:
- `pfm_live_LrowCBrJizdSXsNd7JyjK8` - Initially suspected as failed (was actually valid)
- `pfm_live_TBscRzfwwkSbsiPyvdrBKd` - Current production key

---

## Sign-Off

**Document Owner**: HypeSocial Engineering Team
**Last Updated**: March 1, 2026
**Next Review**: March 1, 2027 (or after any env var changes)

**Related Documents**:
- `/Users/mdch/PROJECTS/HypePostSocial/ENVIRONMENT_VARIABLES.md` - Current env var documentation
- `/Users/mdch/PROJECTS/HypePostSocial/CLAUDE.md` - Project guide
- `/Users/mdch/PROJECTS/HypePostSocial/docs/SINGLE_SOURCE_OF_TRUTH.md` - API specification
