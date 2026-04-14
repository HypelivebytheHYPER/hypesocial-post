# HypeSocial Post - Claude Code Guide

**Project**: @hypelive/hypesocial-post
**Description**: Social media management platform with Post For Me API integration
**API Docs**: https://api.postforme.dev/docs#models

## Stack

- **Frontend**: Next.js + Vercel
- **Backend**: Cloudflare Worker HTTP API → `https://lark-http-hype.hypelive.workers.dev/`
- **Database**: Lark Base (via the worker)

## Architecture

```
Next.js (Vercel) → Cloudflare Worker (lark-http-hype) → Lark Base
```

## Deploy

- Frontend: `npx vercel --prod`
- Worker: `wrangler deploy` from `~/hypelive/internal/02-integrations/lark/lark-http-hype/`

## Note

- `lark-http-hype.hypelive.workers.dev` ≠ `lark-mcp.hypelive.app`
- lark-http-hype = custom HTTP API worker (Lark Base backend)
- lark-mcp = MCP protocol server (300+ tools)

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build (auto-updates SSOT docs)
pnpm build

# Type check
pnpm type-check
```

---

## Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Auth**: NextAuth.js

### Project Structure

```
app/
  (dashboard)/          # Dashboard pages
    posts/              # Posts list (Kanban view)
    posts/new/          # Create post (50:50 layout)
    feed/               # Social account feeds
    analytics/          # Analytics dashboard
    accounts/connect/   # Connect social accounts
  api/                  # Next.js API routes
    posts/              # Posts CRUD
    accounts/           # Accounts CRUD
    media/              # Media upload
    social-post-previews/  # Post previews
    post-results/       # Post results
    webhooks/post-for-me/ # Webhook receiver (from CF Worker)
components/ui/          # shadcn/ui components
lib/
  api-client.ts         # Shared fetch wrapper (SSOT)
  hooks/usePostForMe.ts # All API hooks
  social-platforms.ts   # Platform config
scripts/
  update-ssot.js        # Auto-generate docs
types/
  post-for-me-types.ts  # Main API types
  webhook-types.ts      # Webhook types
```

---

## Single Source of Truth

### API Specification (Authoritative)

**OpenAPI JSON Spec**: `/Users/mdch/Downloads/api-post-for-me.json`

This is the machine-readable source of truth for all API types. All TypeScript types in `types/post-for-me.ts` are derived from this specification.

**Verification command:**

```bash
grep -A 10 '"SocialPostMediaDto"' /Users/mdch/Downloads/api-post-for-me.json
```

**Auto-Generated Documentation**: `docs/SINGLE_SOURCE_OF_TRUTH.md`

Updated automatically on every build via `prebuild` hook.

### Key Files

| File                                         | Purpose                         | Derived From |
| -------------------------------------------- | ------------------------------- | ------------ |
| `/Users/mdch/Downloads/api-post-for-me.json` | **SSOT - OpenAPI spec**         | Original     |
| `types/post-for-me-types.ts`                 | TypeScript types                | OpenAPI JSON |
| `lib/api-client.ts`                          | **SSOT - Shared fetch wrapper** | -            |
| `lib/hooks/usePostForMe.ts`                  | TanStack Query hooks            | -            |
| `lib/validations/webhook-schemas.ts`         | Zod schemas (event types)       | OpenAPI JSON |
| `lib/social-platforms.ts`                    | Platform icons & config         | -            |

### Type Imports

```typescript
// ✅ Correct
import type {
  SocialPost,
  SocialAccount,
  CreateSocialPostDto,
} from "@/types/post-for-me-types";
import {
  PLATFORM_CHARACTER_LIMITS,
  getMostRestrictiveLimit,
} from "@/types/post-for-me-types";
import { platformIconsMap } from "@/lib/social-platforms";
import { usePosts, useAccounts, pfmKeys } from "@/lib/hooks/usePostForMe";
```

---

## Post For Me API Integration

### MCP Server

Configured in `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "post-for-me": {
      "command": "npx",
      "args": ["-y", "post-for-me-mcp"],
      "env": {
        "POST_FOR_ME_API_KEY": "pfm_live_..."
      }
    }
  }
}
```

### Environment Variables

```bash
# Required
POST_FOR_ME_API_KEY=pfm_live_...
POST_FOR_ME_BASE_URL=https://api.postforme.dev

# Webhooks
POST_FOR_ME_WEBHOOK_SECRET=...           # Verifies CF Worker → Vercel forwarding
NEXT_PUBLIC_WEBHOOK_URL=https://api.hypelive.app/webhooks/post-for-me  # Auto-registration target

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Database (if needed)
DATABASE_URL=...
```

### API Endpoints Used

| Endpoint                      | Method   | Purpose                 |
| ----------------------------- | -------- | ----------------------- |
| `/v1/social-posts`            | GET/POST | List/Create posts       |
| `/v1/social-accounts`         | GET      | List connected accounts |
| `/v1/social-post-results`     | GET      | Get post results        |
| `/v1/social-post-previews`    | POST     | Generate previews       |
| `/v1/media/create-upload-url` | POST     | Get upload URL          |
| `/v1/webhooks`                | GET/POST | Manage webhooks         |

---

## Webhook & Real-Time Architecture (rewritten 2026-04-10)

The system uses an **event-bus architecture**: every webhook delivery is
persisted as a row in the Lark Base **EVENTS** table, then streamed to
authenticated browsers via **Server-Sent Events**. The EVENTS table is the
single source of truth for "what has happened" — UIs are derived state.

```
┌──────────────────┐                ┌──────────────────┐
│ Post For Me API  │                │ Lark Open Platform│
└────────┬─────────┘                └─────────┬────────┘
         │ webhook                            │ webhook
         ▼                                    ▼
┌──────────────────┐                ┌──────────────────┐
│ CF Worker        │                │ /api/webhooks/   │
│ (api.hypelive)   │                │ lark-base        │
│ verify secret    │                └─────────┬────────┘
└────────┬─────────┘                          │
         │ forward                            │
         ▼                                    │
┌──────────────────┐                          │
│ /api/webhooks/   │                          │
│ post-for-me      │                          │
└────────┬─────────┘                          │
         │                                    │
         │ both call appendEvent()            │
         ▼                                    ▼
       ┌──────────────────────────────────────────┐
       │         Lark Base EVENTS table           │
       │  event_id (PK) | source | event_type |   │
       │  resource_id | post_id | payload_json |  │
       │  user_id | received_at | seq (auto)      │
       └──────────────┬───────────────────────────┘
                      │
                      │ getEventsSince(lastSeq)
                      ▼
           ┌──────────────────────────┐
           │ /api/events/stream (SSE) │
           │ - replay since Last-Event-ID
           │ - tail every 3s          │
           │ - heartbeat every 25s    │
           │ - X-Accel-Buffering: no  │
           └────────────┬─────────────┘
                        │ EventSource
                        ▼
              ┌──────────────────┐
              │ useEvents() hook │
              │ → setQueryData() │
              │ → invalidate()   │
              └──────────────────┘
```

### Key properties

- **Idempotent persistence**: every event has a stable `event_id` (synthetic
  hash if upstream doesn't provide one). Duplicate webhook deliveries
  collapse to one row in EVENTS via `appendEvent()` lookup-then-insert.
- **Last-Event-ID catch-up**: SSE streams the Lark auto-number `seq` as the
  message id. Browser EventSource sends it back on reconnect, server
  replays everything since. No events lost across disconnects.
- **Three-second budget**: webhook receivers persist synchronously and
  return 200 within Lark's 3s response window.
- **Polling fallback**: `usePostResults()` polls every 30s while processing
  as a safety net if SSE is blocked. `usePosts()` relies on
  `staleTime: 5min` + `refetchOnWindowFocus` + SSE invalidation.
- **Auth**: SSE channel requires NextAuth session. Per-user filtering is
  not yet enforced — see `lib/lark-events.ts` header for the multi-tenant
  filtering plan.
- **Diagnostics**: `/api/webhooks/lark-base` GET returns endpoint status.
  Query the EVENTS table directly via `lark-http-hype` for full audit log.

### Required env

| Var | Purpose |
|---|---|
| `LARK_HTTP_WORKER_URL` | `https://lark-http-hype.hypelive.workers.dev` |
| `LARK_APP_TOKEN` | Lark Base app token for the workspace |
| `LARK_EVENTS_TABLE_ID` | The EVENTS table id (see ENVIRONMENT_VARIABLES.md for schema) |
| `POST_FOR_ME_WEBHOOK_SECRET` | Shared secret with the CF Worker relay |

### Files

| File | Purpose |
|---|---|
| `lib/lark-events.ts` | `appendEvent()`, `getEventsSince()`, `getEventById()` |
| `lib/validations/events.ts` | Zod `EventSchema` + `EVENT_FIELD` constants |
| `app/api/webhooks/post-for-me/route.ts` | PFM webhook → EVENTS |
| `app/api/webhooks/lark-base/route.ts` | Lark Open Platform webhook → EVENTS |
| `app/api/events/stream/route.ts` | SSE catch-up + tail endpoint |
| `lib/hooks/useEvents.ts` | Client EventSource → React Query invalidation |

### Future scaling path

Current SSE tail loop polls Lark every 3s per connection. For >50 concurrent
users, swap the polling tail for a Cloudflare Durable Object pub/sub bridge
in `lark-http-hype`. The SSE wire format and `useEvents()` client stay
identical — only the server tail loop changes.

---

## Critical Type Mappings (Verified via OpenAPI Spec)

### SocialPost

- `social_accounts`: Returns `SocialAccount[]` (not `string[]`)
- `status`: `"draft" | "scheduled" | "processing" | "processed"` (no `"failed"`)
- `isDraft`: Use `isDraft?: boolean` in Create/Update DTOs (NOT deprecated)

### MediaItem

- `thumbnail_url`: `object | null` (per OpenAPI spec)
- `thumbnail_timestamp_ms`: `object | null` (per OpenAPI spec)
- `skip_processing`: Available for large videos

### PlatformConfig

- **TikTok privacy_status**: Only `"public" | "private"` (no `"unlisted"`)
- **YouTube privacy_status**: `"public" | "private" | "unlisted"`

### SocialPostResult

- `error`, `details`, `platform_data`: Required fields (can be null)

---

## Common Tasks

### Adding a New API Hook

```typescript
// In lib/hooks/usePostForMe.ts
export function useNewFeature() {
  return useQuery({
    queryKey: pfmKeys.all,
    queryFn: () => apiClient("/api/new-feature"),
  });
}
```

### Adding Platform-Specific Config

```typescript
// In types/post-for-me.ts PlatformConfig
export interface PlatformConfig {
  // Existing fields...

  // New platform
  new_platform?: {
    specific_field?: string;
  };
}
```

### Running MCP Queries

```bash
# List MCP tools
POST_FOR_ME_API_KEY=pfm_live_... npx post-for-me-mcp

# Search docs via MCP
claude mcp use post-for-me
```

---

## Documentation

| Document                                     | Purpose                                   |
| -------------------------------------------- | ----------------------------------------- |
| `/Users/mdch/Downloads/api-post-for-me.json` | **OpenAPI Spec - Single Source of Truth** |
| `docs/SINGLE_SOURCE_OF_TRUTH.md`             | Auto-generated types reference            |
| `docs/archive/`                              | Historical audit reports (outdated)       |
| `CLAUDE.md`                                  | This file - project guide                 |

---

## Admin operations — `lark-cli`

Lark Base is the project's database. Runtime traffic goes through
`lib/lark.ts` → `lark-http-hype` worker. For **admin** operations
(inspecting schemas, seeding rows, one-off migrations, backups) the right
tool is the official `@larksuite/cli`.

Do **not** add shell-outs to `lark-cli` in route handlers or hot paths — the
CLI is a Go binary with interactive OAuth auth and is not suitable for
request-time calls.

### One-time setup

```bash
npm install -g @larksuite/cli
npx skills add larksuite/cli -g -y   # installs Lark Agent Skills for Claude Code
lark-cli config init                 # paste app_id / app_secret
lark-cli auth login --recommend      # browser OAuth, grants recommended scopes
lark-cli doctor                      # sanity check
```

### Project admin scripts

Scripts live under `scripts/lark/`. They read `LARK_APP_TOKEN` and the
table-id env vars from your shell, so source `.env.local` first:

```bash
set -a && source .env.local && set +a
./scripts/lark/inspect-builder-templates.sh
```

See `scripts/lark/README.md` for the full list.

### When to add a new admin script vs. a Next.js API route

| Need | Use |
|---|---|
| User-facing CRUD served from the app | Next.js API route → `lib/lark.ts` |
| Webhook receiver writing to EVENTS | `/api/webhooks/**` → `lib/lark-events.ts` |
| One-off seed / backup / schema change | `scripts/lark/*.sh` calling `lark-cli` |
| Cross-session realtime fan-out | EVENTS table + `/api/events/stream` (SSE) |

---

## Troubleshooting

### Type Errors

```bash
# Regenerate SSOT and type check
pnpm update:ssot && pnpm type-check
```

### Build Failures

```bash
# Clean build
rm -rf .next && pnpm build
```

### API Issues

- Check `POST_FOR_ME_API_KEY` is set
- Verify MCP server is configured in `~/.claude/mcp.json`
- Check API status at https://api.postforme.dev/docs

---

## Conventions

### Naming

- Types: PascalCase (`SocialPost`, `CreateSocialPostDto`)
- Hooks: camelCase with `use` prefix (`usePosts`, `useAccounts`)
- Query Keys: Use `pfmKeys` object (not hardcoded strings)

### Imports

- Use `@/` path aliases
- Import types separately: `import type { ... }`
- Use `platformIconsMap` for icons (not direct imports)

### Error Handling

- API errors return `{ error: string, message: string, statusCode: number }`
- Use `toast` from sonner for user-facing errors
- Log errors to console in development

---

## Performance & Optimization

### Bundle Analysis

```bash
# Analyze bundle size
pnpm analyze

# Check chunk sizes
ls -la .next/static/chunks/
du -sh .next/static/chunks/*.js | sort -rh | head -10
```

### Current Optimizations (2026-03-13)

| Package | Status | Reason |
|---------|--------|--------|
| `@aws-sdk/client-s3` | **Removed** | Unused after R2 → Lark Drive migration |
| `@aws-sdk/s3-request-presigner` | **Removed** | Unused after R2 → Lark Drive migration |
| `@opennextjs/cloudflare` | **Removed** | Was causing build failures |
| `recharts` | **Lazy loaded** | Only loaded on analytics page via `next/dynamic` |

### Lazy Loading Pattern

```typescript
// app/(dashboard)/analytics/page.tsx
import dynamic from "next/dynamic";

const TikTokInsightsCharts = dynamic(() => import("./analytics-charts"), {
  ssr: false,
  loading: () => <SkeletonLoader />,
});
```

### Image Optimization

Images served from:
- `data.postforme.dev` (Post For Me CDN)
- `cjsgitiiwhrsfolwmtby.supabase.co` (Supabase Storage)
- `*.larksuite.com` / `*.feishu.cn` (Lark Drive)

Configured in `next.config.ts` under `images.remotePatterns`.

### Tree Shaking

The following packages are configured for `optimizePackageImports`:
- `lucide-react`
- `date-fns`
- `framer-motion`
- `recharts`
- `@radix-ui/react-icons`

### Performance Checklist

- [ ] Run `pnpm analyze` to check bundle sizes
- [ ] Use `next/dynamic` for heavy components (charts, editors)
- [ ] Check Vercel Analytics for Core Web Vitals
- [ ] Run Lighthouse audit in production
- [ ] Verify CSP headers don't block resources

---

## External Resources

- **Post For Me API Docs**: https://api.postforme.dev/docs#models
- **Post For Me Resources**: https://www.postforme.dev/resources
- **shadcn/ui**: https://ui.shadcn.com
- **TanStack Query**: https://tanstack.com/query
