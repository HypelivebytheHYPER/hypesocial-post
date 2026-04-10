# HypePostSocial Workflow Guide

## Complete Route Structure

### Public Pages

```
/                    → Landing page (marketing)
```

### Dashboard Pages (require auth)

```
/posts               → Posts list (NEW)
/posts/new           → Create new post
/posts/[id]          → Edit/view post (TODO)
/accounts/connect    → Connect social accounts
/analytics           → Performance dashboard
/webhooks            → Webhook management
/settings            → App settings
```

### API Routes

```
POST /api/posts              → Create post
GET  /api/posts              → List posts
GET  /api/posts/[id]         → Get post
PATCH /api/posts/[id]        → Update post
DELETE /api/posts/[id]       → Delete post

GET  /api/accounts           → List accounts
POST /api/accounts           → Connect account
GET  /api/accounts/[id]      → Get account
DELETE /api/accounts/[id]    → Disconnect account

GET  /api/webhooks           → List webhooks
POST /api/webhooks           → Create webhook
GET  /api/webhooks/[id]      → Get webhook
PATCH /api/webhooks/[id]    → Update webhook
DELETE /api/webhooks/[id]   → Delete webhook

POST /api/media              → Get upload URL
POST /api/webhooks/post-for-me → Webhook receiver
```

## User Workflow

### 1. Landing Page → Dashboard

- Hero CTA: "Start Creating" → /posts/new
- Stats: 6+ platforms, real-time webhooks, 99.9% uptime

### 2. Posts Management (/posts)

- View all posts with status badges
- Filter by status (pending, processing, published, failed, scheduled)
- Media preview thumbnails
- Action buttons: Edit, View, Delete
- "New Post" button → /posts/new

### 3. Create Post (/posts/new)

```
Content Editor
├── Text area for post content
├── Add Media button (upload to storage)
└── Add Link button

Platform Selection
├── Show connected accounts per platform
└── Toggle to select which platforms

Scheduling
├── Date picker
├── Time picker
└── Timezone (default to user)

Action: Schedule Post
```

### 4. Connect Accounts (/accounts/connect)

- List of 6 platforms: X, Facebook, Instagram, LinkedIn, TikTok, YouTube
- Show connection status (connected/disconnected)
- Connect button initiates OAuth flow
- Shows connected username when active

### 5. Webhooks (/webhooks)

- TanStack Query powered real-time list
- Register new webhook with one click
- Copy webhook secret to clipboard
- Delete webhooks
- Toast notifications for all actions

### 6. Analytics (/analytics)

- Stats cards: Posts, Reach, Engagement, Followers
- Recent posts performance list
- Platform breakdown (coming soon)

## Data Flow

### Creating a Post

```
User → /posts/new
     ├── Select platforms (from /api/accounts)
     ├── Write content
     ├── Upload media → /api/media → Presigned URL → Upload
     └── Submit → POST /api/posts → Post For Me API
         └── Webhook: social.post.created → Update cache
```

### Webhook Processing

```
Post For Me API
     └── POST /api/webhooks/post-for-me
         ├── Verify secret
         ├── Route to handler
         ├── Revalidate pages
         └── (TODO) Send to WebSocket clients
```

### Loading States

Every page has skeleton loading:

- `loading.tsx` in each route directory
- Matches layout structure exactly
- Smooth fade transitions via Framer Motion

## Error Handling

### Client-side

- Error boundaries: `error.tsx` in route groups
- Toast notifications for mutations
- Form validation with Zod (TODO)
- Retry logic for failed requests

### Server-side

- API route error handling
- Webhook secret verification
- Post For Me API error forwarding
- 500 error pages with retry

## Missing Features (TODO)

### Critical

- [ ] Post edit page (/posts/[id])
- [ ] Post detail view with results
- [ ] Real-time updates (WebSocket/SSE)
- [ ] Database for local caching
- [ ] OAuth callback handler

### Media

- [ ] Media upload progress indicator
- [ ] Image preview/crop
- [ ] Video upload support
- [ ] Media library

### Posts

- [ ] Bulk actions
- [ ] Post templates
- [ ] Content calendar view
- [ ] Approval workflows

### Analytics

- [ ] Time-series charts
- [ ] Platform comparison
- [ ] Audience insights
- [ ] Export reports

### Settings

- [ ] Profile editing
- [ ] Notification preferences
- [ ] Team management
- [ ] API keys management
