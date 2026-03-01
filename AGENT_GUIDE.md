# Agent Guide - HypeSocial Post

> **Purpose:** Help AI agents work effectively with this codebase
> **Version:** 2026-03-01

---

## 🎯 AGENT MANDATES

### DO ✅

- **Read CLAUDE.md first** before making changes
- **Check types/post-for-me.ts** for API type definitions
- **Follow the SSOT** (Single Source of Truth in `docs/SINGLE_SOURCE_OF_TRUTH.md`)
- **Run type-check** after modifications: `pnpm type-check`
- **Use existing hooks** in `lib/hooks/usePostForMe.ts`
- **Import from @/** path aliases, never relative `../../`

### DON'T ❌

- Don't guess API types - check OpenAPI JSON at `/Users/mdch/Downloads/api-post-for-me.json`
- Don't create duplicate types - use existing ones from `types/post-for-me.ts`
- Don't use `object` or `unknown` - define proper interfaces
- Don't modify `docs/SINGLE_SOURCE_OF_TRUTH.md` manually (auto-generated)
- Don't break the build - always run `pnpm type-check`

---

## 📁 CRITICAL FILE REFERENCE

| File                                         | Purpose          | When to Read                  |
| -------------------------------------------- | ---------------- | ----------------------------- |
| `CLAUDE.md`                                  | Project guide    | **Before ANY work**           |
| `types/post-for-me.ts`                       | API types        | When working with data models |
| `lib/hooks/usePostForMe.ts`                  | API hooks        | When adding API calls         |
| `lib/social-platforms.ts`                    | Platform config  | When working with platforms   |
| `docs/SINGLE_SOURCE_OF_TRUTH.md`             | Type reference   | To verify type sources        |
| `/Users/mdch/Downloads/api-post-for-me.json` | **OpenAPI SSOT** | To verify API types           |

---

## 🔧 COMMON TASKS

### Adding a New API Hook

```typescript
// lib/hooks/usePostForMe.ts
export function useNewFeature() {
  return useQuery({
    queryKey: pfmKeys.all,
    queryFn: () => apiClient("/api/new-feature"),
  });
}
```

### Adding a New Type

1. Check OpenAPI JSON first:
   ```bash
   grep -A 10 '"NewTypeDto"' /Users/mdch/Downloads/api-post-for-me.json
   ```
2. Add to `types/post-for-me.ts`
3. Export it
4. Run `pnpm type-check`

### Creating a New Page

```typescript
// app/(dashboard)/new-page/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Page - HypeSocial",
};

export default function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  );
}
```

---

## 🧪 TESTING REQUIREMENTS

### Before Committing Changes:

```bash
# 1. Type check
pnpm type-check

# 2. Lint
pnpm lint

# 3. Build
pnpm build
```

### If Adding New Features:

- Write unit tests in `tests/unit/`
- Write integration tests in `tests/integration/`
- Add E2E tests for user flows in `tests/e2e/`

---

## 🐛 TROUBLESHOOTING

### Type Errors

```bash
# Regenerate SSOT
pnpm update:ssot

# Then type check
pnpm type-check
```

### API Mismatch

Check the OpenAPI spec:

```bash
grep -B 2 -A 10 '"fieldName"' /Users/mdch/Downloads/api-post-for-me.json
```

### Build Failures

```bash
# Clean build
rm -rf .next && pnpm build
```

---

## 📝 DOCUMENTATION

### What to Document:

- New API hooks
- New components
- Configuration changes
- Environment variables

### Where to Document:

- `CLAUDE.md` - Project-wide changes
- `TESTING.md` - Test procedures
- Inline comments - Complex logic

---

## 🎨 CODE PATTERNS

### API Route Pattern

```typescript
// app/api/resource/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { ResourceType } from "@/types/post-for-me";

export async function GET() {
  try {
    const data = await fetchFromAPI();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
```

### Component Pattern

```typescript
"use client";

import { usePosts } from "@/lib/hooks/usePostForMe";
import type { SocialPost } from "@/types/post-for-me";

interface Props {
  post: SocialPost;
}

export function PostCard({ post }: Props) {
  // Implementation
}
```

---

## 🔄 WORKFLOW

### 1. Start Task

- Read `CLAUDE.md`
- Understand the current state
- Identify relevant files

### 2. Implement

- Make changes
- Follow existing patterns
- Run `pnpm type-check`

### 3. Verify

- Test manually if needed
- Run build: `pnpm build`
- Check for errors

### 4. Document

- Update relevant docs
- Add comments for complex logic

---

## 🆘 ESCALATION

If stuck or confused:

1. Check `CLAUDE.md` again
2. Check `docs/SINGLE_SOURCE_OF_TRUTH.md`
3. Verify against OpenAPI JSON
4. Ask user for clarification

---

## ✅ PRE-COMMIT CHECKLIST

- [ ] Read CLAUDE.md
- [ ] TypeScript check passes
- [ ] Build succeeds
- [ ] No duplicate types created
- [ ] Uses @/ path aliases
- [ ] Follows existing patterns
- [ ] Updated documentation if needed

---

## 🤖 AI TOOLS & MCP INTEGRATION

### Available MCP Servers

| MCP Server | Purpose | Configuration |
|------------|---------|---------------|
| `post-for-me` | Post For Me API operations | `POST_FOR_ME_API_KEY` required |
| `supabase` | Database operations | HTTP endpoint with bearer token |
| `perplexity` | Web search & research | `PERPLEXITY_API_KEY` required |
| `vercel` | Deployment management | `VERCEL_TOKEN` required |
| `shadcn_ui` | Component generation | No auth required |

### MCP Configuration

```json
// ~/.claude/mcp.json
{
  "mcpServers": {
    "post-for-me": {
      "command": "npx",
      "args": ["-y", "post-for-me-mcp"],
      "env": {
        "POST_FOR_ME_API_KEY": "your_api_key"
      }
    },
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=your_project",
      "headers": {
        "Authorization": "Bearer your_token"
      }
    }
  }
}
```

### Key Libraries for AI Agents

| Library | Version | Use Case |
|---------|---------|----------|
| `post-for-me` | 2.6.1 | Official Post For Me SDK |
| `post-for-me-mcp` | 2.6.1 | MCP server for AI integration |
| `@tanstack/react-query` | 5.90.21 | Data fetching & caching |
| `zod` | 3.25.76 | Schema validation |
| `framer-motion` | 11.18.2 | Animations |

### AI-Ready Patterns

#### Using Post For Me MCP

```typescript
// AI can execute Post For Me operations via MCP
// Tools available: execute, search_docs

// Example natural language commands:
// - "Schedule a post for Instagram tomorrow at 9 AM"
// - "Get analytics for last week's posts"
// - "List all connected accounts"
```

#### AI-Safe API Calls

```typescript
// Always use typed API hooks
const { data, error, isLoading } = usePosts();
const { data: accounts } = useAccounts();

// Handle loading and error states
if (isLoading) return <LoadingState />;
if (error) return <ErrorMessage error={error} />;
```

#### Schema Validation with Zod

```typescript
import { z } from "zod";

const CreatePostSchema = z.object({
  caption: z.string().min(1).max(2200),
  social_accounts: z.array(z.string()).min(1),
  scheduled_at: z.string().datetime().optional(),
});

// Use for AI-generated data validation
type CreatePostInput = z.infer<typeof CreatePostSchema>;
```

---

## 🛠️ SKILL INVOCATION GUIDE

### When to Use Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `vercel-deployment-guide` | Deploy issues, vercel.json config | Deployment troubleshooting |
| `vercel-react-best-practices` | React/Next.js code review | Performance optimization |
| `frontend-design` | UI component creation | Distinctive interface design |
| `claude-developer-platform` | Claude API integration | Building AI features |

### Using Skills

```bash
# Invoke a skill
/skill vercel-deployment-guide

# Or use Skill tool
Skill: "vercel-deployment-guide"
```

### Skill: vercel-deployment-guide

**When to use:** Environment variables not working, deployment cache issues, or production vs preview mismatches.

**Key commands from this skill:**

```bash
# Force redeploy (critical after env var changes)
vercel --prod --force

# Check env vars in production
vercel env ls

# Pull latest env vars locally
vercel env pull
```

---

## 🔧 VERCEL ENVIRONMENT VARIABLE DEPLOYMENT

### ⚠️ CRITICAL: Adding Environment Variables Correctly

The most common mistake is adding env vars with a trailing newline, which corrupts API keys and tokens.

#### WRONG - Adds Newline (Breaks API Keys)

```bash
# ❌ NEVER do this - echo adds a newline
echo "pfm_live_abc123" | vercel env add POST_FOR_ME_API_KEY
echo "my-secret-key" | vercel env add API_SECRET
```

#### RIGHT - No Newline (Correct)

```bash
# ✅ CORRECT - printf without newline
printf "pfm_live_abc123" | vercel env add POST_FOR_ME_API_KEY
printf "my-secret-key" | vercel env add API_SECRET

# Alternative using -n flag with echo
echo -n "pfm_live_abc123" | vercel env add POST_FOR_ME_API_KEY
```

#### Interactive Mode (Safest for Complex Values)

```bash
# ✅ SAFEST - Use interactive mode for multiline or special characters
vercel env add POST_FOR_ME_API_KEY
# Then paste the value directly (no echo/printf)
```

### Force Redeploy When Environment Variables Change

Vercel aggressively caches builds. After changing env vars, you **MUST** force a redeploy:

```bash
# Force production redeploy (ignores cache)
vercel --prod --force

# Force preview redeploy
vercel --force
```

**Without `--force`, Vercel uses cached build and ignores new env vars!**

### Debug Endpoints for Environment Variables

Create these endpoints to diagnose env var issues in production:

#### `/api/debug-env` - Check If Variables Are Set

```typescript
// app/api/debug-env/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // List of env vars to check (add your own)
  const envVars = [
    "POST_FOR_ME_API_KEY",
    "POST_FOR_ME_BASE_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    // Add other critical env vars here
  ];

  const status = envVars.map((key) => ({
    key,
    isSet: !!process.env[key],
    // Show first/last 4 chars only for security
    preview: process.env[key]
      ? `${process.env[key]!.slice(0, 4)}...${process.env[key]!.slice(-4)}`
      : null,
    length: process.env[key]?.length || 0,
  }));

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
    variables: status,
  });
}
```

**Access:** `https://your-app.vercel.app/api/debug-env`

#### `/api/debug-api` - Test API Connectivity

```typescript
// app/api/debug-api/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.POST_FOR_ME_API_KEY;
  const API_BASE = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";

  if (!API_KEY) {
    return NextResponse.json(
      { error: "POST_FOR_ME_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${API_BASE}/v1/social-accounts`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "API request failed",
          status: response.status,
          statusText: response.statusText,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      apiBase: API_BASE,
      // Show first/last 4 chars of key to verify it's correct
      keyPreview: `${API_KEY.slice(0, 4)}...${API_KEY.slice(-4)}`,
      keyLength: API_KEY.length,
      accountsCount: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "API connection failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

**Access:** `https://your-app.vercel.app/api/debug-api`

### Testing Before Deployment

Always test API connectivity locally before deploying:

```bash
# Test API with your key
curl -H "Authorization: Bearer $POST_FOR_ME_API_KEY" \
  https://api.postforme.dev/v1/social-accounts

# Test with explicit key (if env var not set)
curl -H "Authorization: Bearer pfm_live_abc123" \
  https://api.postforme.dev/v1/social-accounts

# Full test with verbose output
curl -v -H "Authorization: Bearer $POST_FOR_ME_API_KEY" \
  -H "Content-Type: application/json" \
  https://api.postforme.dev/v1/social-accounts
```

### Common Vercel Environment Variable Issues

#### 1. Cache Not Updating

**Symptom:** Changed env var but app still uses old value.

**Solution:**
```bash
# Must use --force to bypass build cache
vercel --prod --force
```

#### 2. Wrong Environment (Preview vs Production)

**Symptom:** Env var works locally but not in production.

**Diagnosis:**
```bash
# Check which env vars are set for production
vercel env ls production

# Check preview environment
vercel env ls preview

# Check development
vercel env ls development
```

**Solution:**
```bash
# Add to specific environment
printf "value" | vercel env add KEY production
printf "value" | vercel env add KEY preview
printf "value" | vercel env add KEY development
```

#### 3. Secrets Not Propagated

**Symptom:** `process.env.KEY` is undefined in production.

**Checklist:**
- [ ] Env var added to correct environment (production/preview)
- [ ] Redeployed with `--force` flag
- [ ] Variable name matches exactly (case-sensitive)
- [ ] Not using `NEXT_PUBLIC_` prefix for server-only vars incorrectly

**Debug:**
```bash
# Pull env vars and check
vercel env pull .env.production.local
cat .env.production.local
```

#### 4. Trailing Newline in API Keys

**Symptom:** API returns 401 "Unauthorized" even with correct key.

**Diagnosis:**
```bash
# Check if key has newline (should be 40 chars, not 41)
echo "$POST_FOR_ME_API_KEY" | wc -c

# Or use debug-env endpoint and check length
```

**Solution:**
```bash
# Remove and re-add without newline
vercel env rm POST_FOR_ME_API_KEY production
printf "pfm_live_abc123" | vercel env add POST_FOR_ME_API_KEY production
vercel --prod --force
```

#### 5. Build-Time vs Runtime Env Vars

**Symptom:** `process.env.KEY` works in API routes but not in client components.

**Explanation:** Only `NEXT_PUBLIC_` prefixed vars are available in browser.

**Solution:**
```typescript
// ❌ Won't work in client components
const apiKey = process.env.POST_FOR_ME_API_KEY;

// ✅ Only NEXT_PUBLIC_ vars work in browser
const publicUrl = process.env.NEXT_PUBLIC_API_URL;

// ✅ Server-only vars work in API routes
// app/api/example/route.ts
export async function GET() {
  const apiKey = process.env.POST_FOR_ME_API_KEY; // Works here
}
```

### Environment Variable Deployment Checklist

Before assuming API failures are code-related:

- [ ] Added env var with `printf` (not `echo`)
- [ ] Added to correct environment (production/preview/development)
- [ ] Redeployed with `vercel --prod --force`
- [ ] Verified with `/api/debug-env` endpoint
- [ ] Tested API connectivity with `/api/debug-api` endpoint
- [ ] Checked key length matches expected (no newlines)
- [ ] Confirmed variable name spelling matches exactly
- [ ] Verified `NEXT_PUBLIC_` prefix if needed for client

### Quick Recovery Commands

```bash
# Nuclear option: Remove all env vars and re-add
vercel env ls production --json | jq -r '.[].key' | xargs -I {} vercel env rm {} production

# Then re-add all correctly
printf "value1" | vercel env add KEY1 production
printf "value2" | vercel env add KEY2 production

# Force redeploy
vercel --prod --force

# Check deployment logs
vercel logs --production
```

---

## 🔌 API INTEGRATION PATTERNS

### Environment Variable Access

```typescript
// Always validate env vars at runtime
const API_KEY = process.env.POST_FOR_ME_API_KEY;
const API_BASE = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";

if (!API_KEY) {
  throw new Error("POST_FOR_ME_API_KEY is not configured");
}
```

### Error Handling for AI Agents

```typescript
// Standardized error response
interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Use in API routes
try {
  const data = await fetchFromAPI();
  return NextResponse.json(data);
} catch (error) {
  console.error("[API] Error:", error);
  return NextResponse.json(
    {
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
      statusCode: 500,
    },
    { status: 500 }
  );
}
```

### Webhook Handling

```typescript
// app/api/webhooks/post-for-me/route.ts
export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get("Post-For-Me-Webhook-Secret");
  const expected = process.env.POST_FOR_ME_WEBHOOK_SECRET;

  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Process webhook payload
  const payload = await request.json();
  // Handle event...

  return NextResponse.json({ success: true });
}
```

---

## 📊 AI MONITORING & DEBUGGING

### Debug Endpoints (Development Only)

```typescript
// app/api/debug-env/route.ts - Check env vars
// app/api/debug-api/route.ts - Test API connectivity

// Access via:
// GET /api/debug-env - Verify environment variables
// GET /api/debug-api - Test Post For Me API connection
```

### Logging for AI Agents

```typescript
// Use structured logging
console.log("[Agent] Starting operation", {
  timestamp: new Date().toISOString(),
  operation: "createPost",
  params: { /* sanitized params */ }
});

console.error("[Agent] Operation failed", {
  error: error.message,
  stack: error.stack,
});
```

---

## 🧠 AI AGENT BEST PRACTICES

### 1. Always Check Context First

```typescript
// Before making changes, verify current state
const currentPosts = await fetchPosts();
const currentAccounts = await fetchAccounts();

// Then propose changes based on actual data
```

### 2. Use Type-Safe Operations

```typescript
// ✅ Good - Type safe
const post: CreateSocialPostDto = {
  caption: "Hello",
  social_accounts: ["id1", "id2"],
};

// ❌ Bad - Untyped
createPost({ text: "Hello" }); // Wrong property name
```

### 3. Validate Before Mutating

```typescript
// Validate input before API call
const validation = CreatePostSchema.safeParse(input);
if (!validation.success) {
  return { error: validation.error.format() };
}

// Then proceed with validated data
await createPost(validation.data);
```

### 4. Handle Async Operations Correctly

```typescript
// Use proper async patterns
try {
  const result = await withTimeout(
    fetchPosts(),
    10000 // 10 second timeout
  );
  return result;
} catch (error) {
  if (error instanceof TimeoutError) {
    return { error: "Request timed out" };
  }
  throw error;
}
```

---

## 🚨 AI SAFETY CHECKS

### Before Executing Operations

- [ ] Verify API key is configured
- [ ] Confirm environment (prod vs dev)
- [ ] Validate all required parameters
- [ ] Check rate limits
- [ ] Ensure proper error handling

### Sensitive Operations Require Confirmation

```typescript
// Operations that modify data
const SENSITIVE_OPERATIONS = [
  "deletePost",
  "disconnectAccount",
  "publishPost",
  "deleteWebhook",
];

// Always confirm with user before executing
if (SENSITIVE_OPERATIONS.includes(operation)) {
  await confirmWithUser(`Are you sure you want to ${operation}?`);
}
```

---

## 📚 AI LEARNING RESOURCES

### Project-Specific Knowledge

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Project overview & quick start |
| `AGENT_GUIDE.md` | This file - AI agent operations |
| `ENVIRONMENT_VARIABLES.md` | Env var reference |
| `TESTING.md` | Testing procedures |
| `docs/SINGLE_SOURCE_OF_TRUTH.md` | API type reference |

### External Resources

- [Post For Me API Docs](https://api.postforme.dev/docs)
- [Post For Me Resources](https://www.postforme.dev/resources)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [TanStack Query Docs](https://tanstack.com/query/latest)

---

## ✅ AI PRE-COMMIT CHECKLIST

- [ ] Read CLAUDE.md for context
- [ ] Check AGENT_GUIDE.md for patterns
- [ ] TypeScript check passes (`pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No hardcoded secrets in code
- [ ] Uses environment variables correctly
- [ ] Error handling implemented
- [ ] Tested with debug endpoints if needed
- [ ] MCP tools configured if using AI features

---

**Remember:** This project has 138 types and 68 OpenAPI DTOs. When in doubt, check the types file or OpenAPI spec - don't guess!

**For AI Agents:** Always verify environment variables are correctly set before assuming API failures are code-related!
