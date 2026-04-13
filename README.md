# HypeSocial

Social Media Management Platform with Post For Me integration.

## Features

- 🔐 **Authentication** - LINE Login OAuth 2.0
- 📝 **Post Management** - Create, schedule, and publish posts across platforms
- 📊 **Analytics** - Track post performance with real-time metrics
- 🔗 **Multi-Platform** - Facebook, Instagram, TikTok, YouTube, LinkedIn, X, Bluesky, Threads, Pinterest
- 🔔 **Real-time Updates** - Webhook integration with event streaming
- 📱 **Responsive Design** - Mobile-first with Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 + React 19 + TypeScript 5.7 |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query v5 |
| Auth | NextAuth.js v5 |
| API | Post For Me SDK |
| Events | Lark Base (via HTTP Worker) |

## Quick Start

### Prerequisites

- Node.js 18+
- npm/pnpm
- Post For Me API key

### Installation

```bash
# Clone repository
git clone <repo-url>
cd hype-social

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open http://localhost:3000

## Available Scripts

```bash
# Development
npm run dev              # Start dev server (turbo)
npm run type-check       # TypeScript check
npm run lint            # ESLint check
npm run format          # Prettier format

# Testing
npm run health-check     # Test all API endpoints
npm run test            # Run unit tests
npm run test:e2e        # Run E2E tests

# Build
npm run build           # Production build
npm run start           # Start production server
```

## Project Structure

```
app/                    # Next.js App Router
├── (dashboard)/        # Protected routes
│   ├── posts/          # Post management
│   ├── accounts/       # Social accounts
│   ├── webhooks/       # Webhook management
│   ├── feed/          # Social feed
│   └── analytics/     # Analytics dashboard
├── api/               # API routes (19 endpoints)
└── layout.tsx         # Root layout

lib/                   # Application code
├── hooks/            # TanStack Query hooks
│   ├── posts/        # New hook architecture
│   ├── use-*.ts      # Feature hooks
│   └── index.ts      # Central exports
├── lark.ts           # Lark Base client
├── post-for-me-client.ts  # Post For Me SDK
└── config.ts         # Configuration

types/                 # TypeScript definitions
├── post-for-me-types.ts   # API types
├── webhook-types.ts       # Webhook types
└── index.ts              # Type exports

scripts/               # Utility scripts
└── api-health-check.ts   # Health check script
```

## API Routes (19 Endpoints)

### Accounts
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/[id]` - Get account
- `PATCH /api/accounts/[id]` - Update account
- `POST /api/accounts/[id]/disconnect` - Disconnect account
- `POST /api/accounts/auth-url` - Get OAuth URL
- `GET /api/accounts/callback/[platform]` - OAuth callback

### Posts
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `GET /api/posts/[id]` - Get post
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post

### Post Results
- `GET /api/post-results` - List results
- `GET /api/post-results/[id]` - Get result

### Media
- `POST /api/media` - Create upload URL
- `GET /api/media/proxy` - Proxy media

### Webhooks
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `GET/POST/PATCH/DELETE /api/webhooks/[id]` - Webhook CRUD + receive
- `POST /api/webhooks/lark-base` - Lark events

### Events
- `GET /api/events/stream` - SSE streaming
- `GET /api/events/verify` - Verify event

### Account Feeds
- `GET /api/account-feeds/[accountId]` - Get feed

### Health
- `GET /api/health` - Health check

## Environment Variables

```env
# Required
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
POST_FOR_ME_API_KEY=pfm_live_...

# Optional - Webhook (auto-derived if not set)
NEXT_PUBLIC_WEBHOOK_URL=https://your-app.com/api/webhooks/post-for-me

# Optional - Lark Base (for event logging)
LARK_HTTP_WORKER_URL=https://lark-http-hype.hypelive.workers.dev
LARK_APP_TOKEN=...
LARK_EVENTS_TABLE_ID=...

# Optional - LINE Login
LINE_CHANNEL_ID=...
LINE_CHANNEL_SECRET=...
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

See [WIRE_LOGIC_WORKFLOW.md](./WIRE_LOGIC_WORKFLOW.md) for API data flow documentation.

## Health Check

Run automated health check:

```bash
# Local development
npm run health-check

# Production
HEALTH_CHECK_URL=https://hypesocial-post.vercel.app npm run health-check
```

## Deployment

### Vercel

```bash
# Build and deploy
vercel --prod
```

### Environment Setup

1. Add environment variables in Vercel dashboard
2. Set `NEXT_PUBLIC_WEBHOOK_URL` to your production URL
3. Configure webhook in Post For Me to point to `/api/webhooks/post-for-me`

## Documentation

| File | Description |
|------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture patterns & best practices |
| [WIRE_LOGIC_WORKFLOW.md](./WIRE_LOGIC_WORKFLOW.md) | API data flow documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude-specific context |

## License

MIT
