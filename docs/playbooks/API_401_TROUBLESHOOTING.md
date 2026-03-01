# Post For Me API 401 Unauthorized Troubleshooting Playbook

Quick reference guide for diagnosing and fixing 401 Unauthorized errors with the Post For Me API.

---

## Decision Tree

```
                    Start Here
                         |
                         v
            +------------------------+
            | Direct curl test fails |----> Key is INVALID
            +------------------------+      Get new key from
                         |                Post For Me dashboard
                         v NO
            +------------------------+
            | Direct curl works but  |----> Environment variable
            | Vercel app fails       |     issue or cache
            +------------------------+
                         |
                         v NO
            +------------------------+
            | Both work but app      |----> Code issue
            | still shows 401        |     Check route handlers
            +------------------------+
```

---

## Step 1: Quick Checks (30 seconds)

### 1.1 Check if environment variable is set on Vercel

```bash
vercel env ls
```

Look for `POST_FOR_ME_API_KEY` in the list. If missing:

```bash
# Add the key (run from project root)
vercel env add POST_FOR_ME_API_KEY
# Enter the key when prompted
# Select "Production" and "Preview" environments
```

### 1.2 Check if code uses correct variable name

```bash
grep -r "POST_FOR_ME_API_KEY" app/api/*/route.ts
```

Expected output should show multiple files using `process.env.POST_FOR_ME_API_KEY`.

Common mistakes:
- `POSTFORME_API_KEY` (missing underscores)
- `POST_FOR_ME_KEY` (missing `_API`)
- `PFM_API_KEY` (wrong prefix)

---

## Step 2: Direct API Test (1 minute)

Test the API key directly from your terminal:

```bash
# Set your key
export KEY="pfm_live_your_actual_key_here"

# Test the API directly
curl -H "Authorization: Bearer $KEY" \
  https://api.postforme.dev/v1/social-accounts
```

### Expected responses:

**Success (200):**
```json
{"data":[],"total":0}
```

**Invalid key (401):**
```json
{"message":"Unauthorized","statusCode":401}
```

### If direct curl fails:

1. Your key is invalid or expired
2. Get a new key from: https://dashboard.postforme.dev
3. Update the key in Vercel: `vercel env add POST_FOR_ME_API_KEY`
4. Redeploy: `vercel --prod`

---

## Step 3: Debug Endpoints (2 minutes)

The project includes debug endpoints to inspect what's happening.

### 3.1 Check environment variable loading

**Local:**
```bash
curl http://localhost:3000/api/debug-env
```

**Vercel (Production):**
```bash
curl https://your-app.vercel.app/api/debug-env
```

Expected response:
```json
{
  "hasApiKey": true,
  "apiKeyLength": 32,
  "apiKeyPrefix": "pfm_live_xxxxxxx",
  "apiBase": "https://api.postforme.dev",
  "nodeEnv": "production"
}
```

**If `hasApiKey` is false:**
- Environment variable is not set
- Run: `vercel env add POST_FOR_ME_API_KEY`
- Then redeploy

### 3.2 Check API connectivity from the app

**Local:**
```bash
curl http://localhost:3000/api/debug-api
```

**Vercel (Production):**
```bash
curl https://your-app.vercel.app/api/debug-api
```

Expected response:
```json
{
  "status": 200,
  "statusText": "OK",
  "apiKeyUsed": "pfm_live_xxxxxxx..."
}
```

**If status is 401:**
- The key is being passed but is invalid
- Check that the key prefix matches `pfm_live_` or `pfm_test_`
- Get a new key from the dashboard

---

## Step 4: Key Validation (1 minute)

### 4.1 Test key locally

Create a test script:

```bash
# Save your key
export POST_FOR_ME_API_KEY="pfm_live_your_key"

# Run local dev server
pnpm dev

# In another terminal, test
curl http://localhost:3000/api/debug-api
```

### 4.2 Compare local vs Vercel

| Test | Local | Vercel |
|------|-------|--------|
| debug-env | Working? | Working? |
| debug-api | Working? | Working? |

**If local works but Vercel fails:**
- Environment variable not synced to Vercel
- Run: `vercel env pull` to sync local .env
- Or set directly: `vercel env add POST_FOR_ME_API_KEY`

**If both fail:**
- Key is invalid
- Get new key from https://dashboard.postforme.dev

### 4.3 Check if key is expired

Post For Me keys don't expire automatically, but can be:
- Revoked from dashboard
- Deleted by team member
- Invalidated due to account changes

**Check key format:**
- Live keys: `pfm_live_xxxxxxxxxxxxxxxx`
- Test keys: `pfm_test_xxxxxxxxxxxxxxxx`

---

## Step 5: Redeploy if Needed (5 minutes)

If the key is confirmed working via direct curl but the app still fails:

### 5.1 Force clean redeploy

```bash
# Pull latest env vars
vercel env pull

# Deploy with clean build
vercel --prod --force
```

### 5.2 Verify the fix

```bash
# Test the debug endpoint
curl https://your-app.vercel.app/api/debug-api

# Should return status 200
```

### 5.3 Test actual functionality

Navigate to your app and try:
1. Loading accounts page
2. Creating a post
3. Checking feed

---

## Quick Reference Commands

```bash
# Check Vercel env vars
vercel env ls

# Add/update env var
vercel env add POST_FOR_ME_API_KEY

# Pull env vars locally
vercel env pull

# Force redeploy
vercel --prod --force

# Test API directly
curl -H "Authorization: Bearer $POST_FOR_ME_API_KEY" \
  https://api.postforme.dev/v1/social-accounts

# Test local debug endpoints
curl http://localhost:3000/api/debug-env
curl http://localhost:3000/api/debug-api

# Test production debug endpoints
curl https://your-app.vercel.app/api/debug-env
curl https://your-app.vercel.app/api/debug-api
```

---

## Common Issues and Solutions

### Issue: "Unauthorized" in production but works locally

**Cause:** Environment variable not set in Vercel

**Fix:**
```bash
vercel env add POST_FOR_ME_API_KEY
vercel --prod
```

### Issue: Key shows as set but API calls fail

**Cause:** Key might have extra whitespace or quotes

**Fix:**
```bash
# Remove and re-add without quotes
vercel env rm POST_FOR_ME_API_KEY
vercel env add POST_FOR_ME_API_KEY
# Paste key WITHOUT quotes when prompted
```

### Issue: 401 after team member rotated keys

**Cause:** Old key revoked, new key not updated

**Fix:**
1. Get new key from dashboard
2. Update in Vercel: `vercel env add POST_FOR_ME_API_KEY`
3. Redeploy: `vercel --prod`

### Issue: Works in preview but not production

**Cause:** Environment variable only set for Preview

**Fix:**
```bash
vercel env add POST_FOR_ME_API_KEY
# Select BOTH "Production" and "Preview" when prompted
```

---

## Debug Endpoint Code

If debug endpoints are missing, create them:

**`/app/api/debug-env/route.ts`:**
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.POST_FOR_ME_API_KEY;
  const apiBase = process.env.POST_FOR_ME_BASE_URL;

  return NextResponse.json({
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPrefix: apiKey?.substring(0, 15) || null,
    apiBase: apiBase || "not set",
    nodeEnv: process.env.NODE_ENV,
  });
}
```

**`/app/api/debug-api/route.ts`:**
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.POST_FOR_ME_API_KEY;
  const apiBase = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";

  try {
    const response = await fetch(`${apiBase}/v1/social-accounts`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText.substring(0, 500),
      apiKeyUsed: apiKey?.substring(0, 15) + "...",
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      apiKeyPrefix: apiKey?.substring(0, 15),
    }, { status: 500 });
  }
}
```

---

## Resources

- Post For Me Dashboard: https://dashboard.postforme.dev
- API Documentation: https://api.postforme.dev/docs
- Environment Variables Guide: `/docs/ENVIRONMENT_VARIABLES.md`
