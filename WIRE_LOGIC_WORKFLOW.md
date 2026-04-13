# Wire Logic Workflow

Complete data flow documentation for all API routes.

---

## 1. Accounts Flow

### 1.1 List Accounts
```
Client → GET /api/accounts
              │
              ▼
         Zod Validation (limit max 100)
              │
              ▼
         pfm.socialAccounts.list()
              │
              ▼
         Post For Me API
              │
              ▼
         Return JSON { data, meta }
```

### 1.2 Get OAuth URL
```
Client → POST /api/accounts/auth-url
              │
              ▼
         Zod Validation { platform }
              │
              ▼
         pfm.post("/v1/social-accounts/auth-url")
              │
              ▼
         Post For Me API
              │
              ▼
         Return { authorization_url, state }
```

### 1.3 OAuth Callback
```
Provider → GET /api/accounts/callback/[platform]
                │
                ▼
           Extract code + state
                │
                ▼
           POST /api/accounts (internal)
                │
                ▼
           pfm.post("/v1/social-accounts")
                │
                ▼
           Post For Me API
                │
                ▼
           Redirect to /accounts
```

### 1.4 Disconnect Account
```
Client → POST /api/accounts/[id]/disconnect
              │
              ▼
         pfm.post(`/v1/social-accounts/${id}/disconnect`)
              │
              ▼
         Post For Me API
              │
              ▼
         Invalidate cache (pfmKeys.accounts())
              │
              ▼
         Return { success: true }
```

---

## 2. Posts Flow

### 2.1 List Posts
```
Client → GET /api/posts
              │
              ▼
         Zod Validation (limit max 100, status enum)
              │
              ▼
         pfm.socialPosts.list(params)
              │
              ▼
         Post For Me API
              │
              ▼
         Return { data, meta }
```

### 2.2 Create Post
```
Client → POST /api/posts
              │
              ▼
         Zod Validation
              - caption max length
              - media domain whitelist
              - scheduled_at in future
              - TikTok privacy_status required
              │
              ▼
         pfm.socialPosts.create(body)
              │
              ▼
         Post For Me API
              │
              ▼
         Webhook: social.post.created
              │
              ▼
         Return 201 + post data
```

### 2.3 Update Post
```
Client → PUT /api/posts/[id]
              │
              ▼
         Zod Validation
              │
              ▼
         pfm.socialPosts.update(id, body)
              │
              ▼
         Post For Me API
              │
              ▼
         Webhook: social.post.updated
              │
              ▼
         Return updated post
```

### 2.4 Delete Post
```
Client → DELETE /api/posts/[id]
              │
              ▼
         pfm.socialPosts.delete(id)
              │
              ▼
         Post For Me API
              │
              ▼
         Webhook: social.post.deleted
              │
              ▼
         Return { success: true }
```

---

## 3. Post Results Flow

### 3.1 List Results
```
Client → GET /api/post-results
              │
              ▼
         Zod Validation (limit max 100)
              │
              ▼
         pfm.socialPostResults.list(params)
              │
              ▼
         Post For Me API
              │
              ▼
         Return { data, meta }
```

### 3.2 Result Creation (Webhook)
```
Post For Me → POST /api/webhooks/[id]
                   │
                   ▼
              Verify secret header
                   │
                   ▼
              Validate payload (Zod)
                   │
                   ▼
              Process event:
                social.post.result.created
                   │
              ┌────┴────┐
              ▼         ▼
          EVENTS    Cache Invalidation
          Table     (pfmKeys.postResults())
              │
              ▼
         Return 200
```

---

## 4. Media Flow

### 4.1 Create Upload URL
```
Client → POST /api/media
              │
              ▼
         Zod Validation
              - content_type whitelist
              - size limits (image: 10MB, video: 100MB)
              │
              ▼
         pfm.media.createUploadURL()
              │
              ▼
         Post For Me API
              │
              ▼
         Return { upload_url, media_url }
```

### 4.2 Upload Flow (Client-side)
```
Client → POST /api/media
              │
              ▼
         Get upload_url + media_url
              │
              ▼
         PUT upload_url (direct to Post For Me CDN)
              │
              ▼
         Return media_url
```

---

## 5. Webhooks Flow

### 5.1 Receive Webhook Event
```
Post For Me → POST /api/webhooks/[id]
                   │
                   ▼
              1. Extract secret from header
                   - Post-For-Me-Webhook-Secret
                   │
              2. Verify secret
                   - Check cache or fetch from API
                   - Timing-safe compare
                   │
              3. Parse + validate payload (Zod)
                   │
              4. Generate event_id
                   - Deterministic: hash(event_type + resource_id + post_id)
                   │
              5. Check idempotency
                   - getEventById(event_id)
                   │
              6. Store in EVENTS table
                   - appendEvent({ event_id, event_type, payload, ... })
                   │
              7. Return 200 within 1s
                   - { success: true, event_id, is_retry }
```

### 5.2 Event Types
| Event | Action |
|-------|--------|
| `social.post.created` | Store event, invalidate posts cache |
| `social.post.updated` | Store event, invalidate posts cache |
| `social.post.deleted` | Store event, invalidate posts cache |
| `social.post.result.created` | Store event, invalidate results cache |
| `social.account.created` | Store event, invalidate accounts cache |
| `social.account.updated` | Store event, invalidate accounts cache |

---

## 6. Event Streaming Flow

### 6.1 SSE Connection
```
Client → GET /api/events/stream
              │
              ▼
         1. Get Last-Event-ID header
              │
         2. Query EVENTS table
            getEventsSince(lastEventId)
              │
         3. Stream replay events
            ┌────────────────────┐
            │  id: seq           │
            │  event: type       │
            │  data: JSON        │
            └────────────────────┘
              │
         4. Poll for new events (every 3s)
              │
         5. Send heartbeat (every 25s)
              │
         6. Auto-reconnect on disconnect
```

### 6.2 Client Cache Invalidation
```
EventSource → Receive event
                  │
                  ▼
             Parse event.data
                  │
                  ▼
             Determine affected keys:
               - social.post.* → pfmKeys.posts()
               - social.post.result.* → pfmKeys.postResults()
               - social.account.* → pfmKeys.accounts()
                  │
                  ▼
             queryClient.invalidateQueries({ queryKey })
```

---

## 7. Feed Flow

### 7.1 Get Account Feed
```
Client → GET /api/account-feeds/[accountId]?limit=20&expand=metrics
              │
              ▼
         Zod Validation (limit max 100)
              │
              ▼
         pfm.socialAccountFeeds.list(accountId, params)
              │
              ▼
         Post For Me API
              │
              ▼
         Return { items: SocialAccountFeedItem[], meta }
```

### 7.2 Feed Metrics
```
SocialAccountFeedItem
├── platform_post_id
├── caption
├── media[]
├── posted_at
└── metrics? (if expand=metrics)
    ├── InstagramMetrics
    ├── FacebookMetrics
    ├── TikTokMetrics
    ├── LinkedInMetrics
    └── ...
```

---

## 8. Error Handling

### 8.1 Validation Errors (400)
```
ZodError → Format issues
              │
              ▼
         Return 400
         { error: "Invalid query parameters: ..." }
```

### 8.2 Not Found (404)
```
NotFoundError → Return 404
              { error: "Resource not found" }
```

### 8.3 Server Errors (500)
```
Error → Log with trace context
              │
              ▼
         Return 500
         { error: "Internal server error" }
```

---

## 9. Security Checkpoints

| Route | Security |
|-------|----------|
| `/api/webhooks/[id]` | Secret verification required |
| `/api/accounts/*` | Session/auth required (NextAuth) |
| `/api/posts/*` | Session/auth required |
| `/api/media` | Session/auth required |
| `/api/events/stream` | Session/auth required |
| `/api/health` | Public |

---

## 10. Cache Invalidation Map

| Operation | Invalidated Keys |
|-----------|------------------|
| Create post | `pfmKeys.posts()` |
| Update post | `pfmKeys.posts()`, `pfmKeys.post(id)` |
| Delete post | `pfmKeys.posts()`, `pfmKeys.post(id)` |
| Post result | `pfmKeys.postResults()`, `pfmKeys.posts()` |
| Connect account | `pfmKeys.accounts()` |
| Disconnect account | `pfmKeys.accounts()`, `pfmKeys.account(id)` |

---

*Last updated: 2026-04-10*
