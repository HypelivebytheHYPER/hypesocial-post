# HypeSocial Architecture

## Overview

HypeSocial is a social media management platform built with Next.js 16, TanStack Query v5, and TypeScript. It integrates with the Post For Me API for social media posting and analytics.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5.7 |
| State Management | TanStack Query v5 |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| API Client | Post For Me SDK |
| Database | Lark Base (via HTTP Worker) |

## Architecture Patterns

### 1. Feature-Based Organization

```
app/
├── (dashboard)/           # Authenticated routes
│   ├── posts/            # Posts feature
│   ├── accounts/         # Accounts feature
│   ├── webhooks/         # Webhooks feature
│   ├── feed/            # Feed feature
│   └── analytics/       # Analytics feature
├── api/                  # API routes
└── layout.tsx           # Root layout

lib/
├── hooks/               # React Query hooks
│   ├── posts/          # Posts hooks (new architecture)
│   ├── use-*.ts        # Feature hooks
│   └── index.ts        # Central exports
├── lark.ts             # Lark Base client
├── post-for-me-client.ts # Post For Me SDK
└── config.ts           # Configuration

types/
├── index.ts            # Type exports
├── post-for-me-types.ts # API types
└── webhook-types.ts    # Webhook types
```

### 2. Clean Architecture Principles

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (React Components)                  │
│  - UI components (shadcn/ui)                           │
│  - Page components                                     │
│  - Custom hooks (composition)                          │
├─────────────────────────────────────────────────────────┤
│  Application Layer (TanStack Query)                     │
│  - Query hooks (lib/hooks/)                            │
│  - Mutations with optimistic updates                   │
│  - Cache invalidation                                  │
├─────────────────────────────────────────────────────────┤
│  Infrastructure Layer (API Clients)                     │
│  - Post For Me SDK (lib/post-for-me-client.ts)         │
│  - Lark HTTP Worker (lib/lark.ts)                      │
│  - API Routes (app/api/)                               │
└─────────────────────────────────────────────────────────┘
```

### 3. Data Flow

```
User Action → React Component → TanStack Query Hook → API Client → External API
                  ↑                    ↓                    ↓
                  └──── Cache Update ←─┘              Response
```

## Key Design Decisions

### TanStack Query Best Practices

1. **No useMemo for data transformation** - Use `select` option
   ```typescript
   // ✅ Correct
   const { data: posts } = useSocialPosts({ limit: 100 }, {
     select: (res) => res?.data ?? [],
   });
   
   // ❌ Anti-pattern
   const posts = useMemo(() => data?.data ?? [], [data]);
   ```

2. **Generic hooks with select support**
   ```typescript
   export function useSocialPosts<T = SocialPostListResponse>(
     params?: PostsFilter,
     options?: { select?: (data: SocialPostListResponse) => T }
   ) {
     return useQuery<SocialPostListResponse, Error, T>({ ... });
   }
   ```

3. **Optimistic updates with rollback**
   ```typescript
   onMutate: async (newPost) => {
     await queryClient.cancelQueries({ queryKey: pfmKeys.posts() });
     const previousPosts = queryClient.getQueryData(pfmKeys.posts());
     queryClient.setQueryData(pfmKeys.posts(), (old) => ...);
     return { previousPosts }; // For rollback
   },
   onError: (error, vars, context) => {
     if (context?.previousPosts) {
       queryClient.setQueryData(pfmKeys.posts(), context.previousPosts);
     }
   },
   ```

### API Limits

| Endpoint | Max Limit | Default |
|----------|-----------|---------|
| `/api/accounts` | 100 | 50 |
| `/api/posts` | 100 | 50 |
| `/api/post-results` | 100 | 50 |
| `/api/account-feeds` | 100 | 20 |

### Webhook Architecture

```
Post For Me → POST /api/webhooks/[id]
                    │
                    ├─ Verify secret (Post-For-Me-Webhook-Secret header)
                    ├─ Validate payload (Zod)
                    ├─ Check idempotency (syntheticEventId)
                    ├─ Store in EVENTS table
                    └─ Return 200 within 1s
```

**Features:**
- Secret verification with timing-safe compare
- Idempotent event handling (deterministic event IDs)
- Automatic retry support (exponential backoff handled by Post For Me)
- Event streaming via `/api/events/stream` (SSE)

## Configuration

### Environment Variables

```bash
# Post For Me
POST_FOR_ME_API_KEY=pfm_live_...
POST_FOR_ME_BASE_URL=https://api.postforme.dev

# Webhook (auto-derived if not set)
NEXT_PUBLIC_WEBHOOK_URL=https://hypesocial-post.vercel.app/api/webhooks/post-for-me

# Lark Base
LARK_HTTP_WORKER_URL=https://lark-http-hype.hypelive.workers.dev
LARK_APP_TOKEN=...
LARK_EVENTS_TABLE_ID=...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### URL Resolution Priority

```typescript
// getBaseUrl()
1. NEXT_PUBLIC_APP_URL (custom domain)
2. VERCEL_URL (auto-detected)
3. localhost:3000 (fallback - throws in production)

// getWebhookUrl()
1. NEXT_PUBLIC_WEBHOOK_URL (override)
2. Derived from getBaseUrl()
```

## Type Safety

### API Types (OpenAPI Spec)

All types match Post For Me OpenAPI spec with corrections for known issues:

| Field | Spec Says | Actual | Our Type |
|-------|-----------|--------|----------|
| `MediaItem.thumbnail_url` | `object` | `string` | `string \| null` |
| `MediaItem.thumbnail_timestamp_ms` | `object` | `number` | `number \| null` |

### Platform Support

| Platform | Post | Feed | Metrics | Config |
|----------|------|------|---------|--------|
| Instagram | ✅ | ✅ | ✅ | ✅ |
| Facebook | ✅ | ✅ | ✅ | ✅ |
| TikTok | ✅ | ✅ | ✅ | ✅ |
| TikTok Business | ✅ | ✅ | ✅ | ✅ |
| YouTube | ✅ | ✅ | ✅ | ✅ |
| X/Twitter | ✅ | ✅ | ✅ | ✅ |
| LinkedIn | ✅ | ✅ | ✅* | ✅ |
| Bluesky | ✅ | ✅ | ✅ | ✅ |
| Threads | ✅ | ✅ | ✅ | ✅ |
| Pinterest | ✅ | ✅ | ✅ | ✅ |

\* LinkedIn metrics only for Company Pages (not personal profiles)

## Performance

### Caching Strategy

```typescript
// Posts
staleTime: 2 minutes
gcTime: 10 minutes

// Accounts
staleTime: 2 minutes
gcTime: 10 minutes

// Events (SSE streaming)
No caching - real-time updates

// Feed
staleTime: 2 minutes
```

### Bundle Optimization

- Dynamic imports for heavy components
- Lazy loading for modals
- Virtual scrolling for large lists
- Image optimization via Next.js

## Security

### Webhook Security
- Secret verification with `secureCompare` (timing-safe)
- `Post-For-Me-Webhook-Secret` header validation
- 401 response for invalid secrets

### API Security
- Zod validation on all inputs
- Rate limiting (handled by Post For Me)
- No sensitive data in client bundles

## Development

### Scripts

```bash
npm run dev          # Development server (turbo)
npm run type-check   # TypeScript check
npm run lint         # ESLint
npm run format       # Prettier
```

### Adding a New Feature

1. **Types** - Add to `types/post-for-me-types.ts`
2. **Hooks** - Add to `lib/hooks/` with `select` support
3. **API Route** - Add to `app/api/[feature]/route.ts` if needed
4. **Component** - Add to `app/(dashboard)/[feature]/`
5. **Export** - Add to `lib/hooks/index.ts`

## Deployment

### Vercel

```bash
vercel --prod
```

### Environment

- Production: `hypesocial-post.vercel.app`
- Webhook endpoint: `https://hypesocial-post.vercel.app/api/webhooks/post-for-me`

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 on webhooks | Check `Post-For-Me-Webhook-Secret` header |
| Limit errors | Max is 100 for Post For Me API |
| Type errors | Run `npm run type-check` |
| Cache issues | Invalidate queries or clear localStorage |

---

*Last updated: 2026-04-10*
