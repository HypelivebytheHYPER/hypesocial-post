# HypeSocial Webhook Worker

Cloudflare Worker that receives Post For Me webhooks at the edge.

## URL Standard

This project follows the REST API webhook standard:

```
api.{domain}/webhooks/{service}
```

**Example:** `api.hypelive.app/webhooks/post-for-me`

## Why Cloudflare Worker?

- **0ms cold start** - Instant response time
- **Global edge network** - Closest to Post For Me servers
- **< 100ms response** - Well under Post For Me's 1s requirement
- **Reliable** - Never misses a webhook

## Architecture

```
Post For Me API
      ↓ POST webhook
Cloudflare Worker (edge)
      ↓ Verify + Return 200 OK (immediately)
      ↓ Forward to Next.js (async)
Next.js App
      ↓ Cache revalidation
```

## Setup

```bash
cd workers/webhook

# Install dependencies
pnpm install

# Set secrets
wrangler secret put POST_FOR_ME_WEBHOOK_SECRET

# Deploy
wrangler deploy
```

## Webhook URL

After deploy, use this URL in Post For Me:

```
https://hypesocial-webhook.your-subdomain.workers.dev
```

Or with custom domain:

```
https://webhook.your-domain.com
```

## Register with Post For Me

```bash
npx tsx scripts/setup-webhook-mcp.ts --url=https://hypesocial-webhook.your-subdomain.workers.dev
```
