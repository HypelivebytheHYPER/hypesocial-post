#!/bin/bash

echo "============================================================"
echo "Cloudflare API Token Setup for Custom Domain"
echo "============================================================"
echo ""
echo "Step 1: Create API Token"
echo "========================"
echo ""
echo "Please visit: https://dash.cloudflare.com/profile/api-tokens"
echo ""
echo "Click 'Create Token' then 'Get started' next to 'Create Custom Token'"
echo ""
echo "Token Name: HypeSocial Webhook Setup"
echo ""
echo "Permissions:"
echo "  - Zone:Read (All zones)"
echo "  - Workers Scripts:Edit (All accounts)"
echo "  - Account:Read (All accounts)"
echo "  - Workers Routes:Edit (All zones)"
echo ""
echo "OR use the simpler template:"
echo "  - 'Edit Cloudflare Workers' template"
echo ""
echo "Step 2: Save the Token"
echo "========================"
echo ""
echo "Copy the token (starts with letters/numbers, ~40 chars)"
echo ""
read -p "Paste your API Token here: " CF_TOKEN

if [ -z "$CF_TOKEN" ]; then
    echo "No token provided. Exiting."
    exit 1
fi

# Validate token format
if [ ${#CF_TOKEN} -lt 30 ]; then
    echo "Token looks too short. Please check and try again."
    exit 1
fi

echo ""
echo "Step 3: Testing Token..."
echo "========================"

# Test token
TEST_RESULT=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
    -H "Authorization: Bearer $CF_TOKEN" \
    -H "Content-Type: application/json")

if echo "$TEST_RESULT" | grep -q "\"success\":true"; then
    echo "✅ Token is valid!"
    echo ""
else
    echo "❌ Token validation failed:"
    echo "$TEST_RESULT" | grep -o '"message":"[^"]*"' | head -1
    echo ""
    echo "Please check your token and try again."
    exit 1
fi

# Get zones
ZONES_RESULT=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones" \
    -H "Authorization: Bearer $CF_TOKEN" \
    -H "Content-Type: application/json")

if echo "$ZONES_RESULT" | grep -q "hypelive.app"; then
    echo "✅ Found hypelive.app zone access!"
    echo ""
else
    echo "⚠️  Zone access check:"
    echo "$ZONES_RESULT" | grep -o '"name":"[^"]*"' | head -5
    echo ""
fi

# Save to env files
echo "Step 4: Saving Token"
echo "===================="

# Add to .env.local
ENV_FILE="/Users/mdch/PROJECTS/HypePostSocial/.env.local"
if [ -f "$ENV_FILE" ]; then
    # Remove old token if exists
    grep -v "CLOUDFLARE_API_TOKEN" "$ENV_FILE" > "$ENV_FILE.tmp" 2>/dev/null || true
    mv "$ENV_FILE.tmp" "$ENV_FILE" 2>/dev/null || true
fi

echo "" >> "$ENV_FILE"
echo "# Cloudflare API Token (for custom domain management)" >> "$ENV_FILE"
echo "CLOUDFLARE_API_TOKEN=$CF_TOKEN" >> "$ENV_FILE"

echo "✅ Saved to .env.local"

# Add to wrangler.toml
WRANGLER_FILE="/Users/mdch/PROJECTS/HypePostSocial/workers/webhook/wrangler.toml"
if [ -f "$WRANGLER_FILE" ]; then
    # Check if token already set
    if ! grep -q "CLOUDFLARE_API_TOKEN" "$WRANGLER_FILE"; then
        echo "" >> "$WRANGLER_FILE"
        echo "# For custom domain management" >> "$WRANGLER_FILE"
        echo "CLOUDFLARE_API_TOKEN = \"$CF_TOKEN\"" >> "$WRANGLER_FILE"
        echo "✅ Added to wrangler.toml"
    fi
fi

echo ""
echo "============================================================"
echo "Token Setup Complete!"
echo "============================================================"
echo ""
echo "Next, run the setup script to configure the custom domain:"
echo ""
echo "  export CLOUDFLARE_API_TOKEN=$CF_TOKEN"
echo "  npx tsx /Users/mdch/PROJECTS/HypePostSocial/scripts/cloudflare-mcp-setup.ts"
echo ""
