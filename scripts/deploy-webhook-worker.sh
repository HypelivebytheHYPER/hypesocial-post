#!/bin/bash
set -e

echo "============================================================"
echo "Deploying Cloudflare Webhook Worker"
echo "============================================================"

cd workers/webhook

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare first:"
    wrangler login
fi

# Deploy
echo ""
echo "🚀 Deploying worker..."
wrangler deploy

echo ""
echo "✅ Worker deployed!"
echo ""
echo "Next steps:"
echo "1. Set the webhook secret:"
echo "   wrangler secret put POST_FOR_ME_WEBHOOK_SECRET"
echo ""
echo "2. Register with Post For Me:"
echo "   npx tsx scripts/setup-webhook-mcp.ts --url=https://hypesocial-webhook.YOUR_SUBDOMAIN.workers.dev"
echo ""
echo "Or with custom domain:"
echo "   npx tsx scripts/setup-webhook-mcp.ts --url=https://webhook.YOUR_DOMAIN.com"
