# Cloudflare AI Chat Agent

A Cloudflare Worker that combines **Cloudflare Native AI** (Llama 3.3) with MCP (Model Context Protocol) tools for the HypeSocial chat.

## Architecture

```
User → /chat → Next.js API Route → Cloudflare AI Agent → Native AI (Llama) + MCP Tools → Response
```

## Deployment

```bash
# Install dependencies
npm install

# Login to Cloudflare
wrangler login

# Deploy the worker
wrangler deploy
```

## No API Keys Needed! 🎉

This agent uses **Cloudflare's native AI models**:
- Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- No OpenAI API key required
- No AI Gateway token needed
- Runs on Cloudflare's edge infrastructure

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `MCP_SERVER_URL` | MCP server HTTP endpoint | Yes (set in wrangler.toml) |

The AI binding is automatically configured via `wrangler.toml`.

## API Usage

```bash
curl -X POST https://chat-agent.YOUR_SUBDOMAIN.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How many posts do I have?",
    "userId": "user-123",
    "history": []
  }'
```

## Response

```json
{
  "response": "You have 5 posts scheduled and 3 drafts...",
  "toolsUsed": ["get_posts"],
  "model": "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
}
```

## Available Tools

The AI can call these MCP tools:
- `get_posts` - Get user's social media posts
- `get_social_accounts` - Get connected accounts
- `get_analytics` - Get performance metrics
- `create_post` - Create a new post
