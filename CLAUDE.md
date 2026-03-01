# HypeSocial Post - Claude Code Guide

**Project**: @hypelive/hypesocial-post
**Description**: Social media management platform with Post For Me API integration
**API Docs**: https://api.postforme.dev/docs#models

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
components/ui/          # shadcn/ui components
lib/
  hooks/usePostForMe.ts # All API hooks
  social-platforms.ts   # Platform config
scripts/
  update-ssot.js        # Auto-generate docs
types/
  post-for-me.ts        # Main API types
  webhooks.ts           # Webhook types
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

| File                                         | Purpose                 | Derived From |
| -------------------------------------------- | ----------------------- | ------------ |
| `/Users/mdch/Downloads/api-post-for-me.json` | **SSOT - OpenAPI spec** | Original     |
| `types/post-for-me.ts`                       | TypeScript types        | OpenAPI JSON |
| `lib/hooks/usePostForMe.ts`                  | TanStack Query hooks    | -            |
| `lib/social-platforms.ts`                    | Platform icons & config | -            |

### Type Imports

```typescript
// ✅ Correct
import type {
  SocialPost,
  SocialAccount,
  CreateSocialPostDto,
} from "@/types/post-for-me";
import {
  PLATFORM_CHARACTER_LIMITS,
  getMostRestrictiveLimit,
} from "@/types/post-for-me";
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
POSTFORME_API_KEY=pfm_live_...
POSTFORME_API_URL=https://api.postforme.dev

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

- Check `POSTFORME_API_KEY` is set
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

## External Resources

- **Post For Me API Docs**: https://api.postforme.dev/docs#models
- **Post For Me Resources**: https://www.postforme.dev/resources
- **shadcn/ui**: https://ui.shadcn.com
- **TanStack Query**: https://tanstack.com/query
