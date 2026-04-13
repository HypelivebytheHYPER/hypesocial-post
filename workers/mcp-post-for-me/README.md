# Post For Me MCP Server on Cloudflare Workers

A production-ready MCP (Model Context Protocol) server for Post For Me API, running on Cloudflare Workers with **MCP 2025-03-26 Streamable HTTP** protocol support.

## 🚀 Features

- ✅ **MCP 2025-03-26 Streamable HTTP** - Latest protocol with session management
- ✅ **Bidirectional Streaming** - HTTP POST + SSE streaming support
- ✅ **Session Management** - Stateful sessions with `Mcp-Session-Id` header
- ✅ **JSON-RPC Batching** - Multiple requests in a single call
- ✅ **Tool Annotations** - Read-only, destructive, idempotent hints
- ✅ **Social Accounts** - List, get, disconnect accounts
- ✅ **Social Posts** - Create, list, get, delete posts
- ✅ **Post Results** - Track publishing status
- ✅ **Stateless Mode** - Works without sessions for simple use cases
- ✅ **Type-safe** - Zod validation for all inputs

## 📡 Protocol: MCP 2025-03-26 Streamable HTTP

This server implements the **Streamable HTTP** transport from MCP specification 2025-03-26:

| Feature | Support |
|---------|---------|
| Single endpoint (POST/GET/DELETE) | ✅ |
| Session management (`Mcp-Session-Id`) | ✅ |
| SSE streaming (GET) | ✅ |
| JSON-RPC batching | ✅ |
| Tool annotations | ✅ |
| Stateless mode | ✅ |

### Transport Details

```
Base URL:  https://mcp-post-for-me.hypelive.workers.dev
MCP Path:  / or /mcp
Methods:   POST (JSON-RPC), GET (SSE), DELETE (terminate)
Headers:   Mcp-Session-Id, Content-Type, Last-Event-ID
```

### Endpoints

| Path | Purpose |
|------|---------|
| `/` | MCP endpoint (root) |
| `/mcp` | MCP endpoint (recommended) |
| `/health` | Health check |

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd workers/mcp-post-for-me
npm install
```

### 2. Configure Secrets

```bash
# Set your Post For Me API key
npx wrangler secret put POST_FOR_ME_API_KEY

# Optional: Set webhook secret for verification
npx wrangler secret put POST_FOR_ME_WEBHOOK_SECRET
```

### 3. Deploy

```bash
npm run deploy
```

## 🔌 Usage Examples

### Initialize Session (Stateful Mode)

```bash
# Initialize and get session ID
curl -X POST https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {"name": "my-client", "version": "1.0"}
    }
  }'

# Response includes Mcp-Session-Id header
```

### List Tools (With Session)

```bash
curl -X POST https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'
```

### Call Tool (Stateless Mode)

```bash
curl -X POST https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "list_posts",
      "arguments": {"limit": 5}
    }
  }'
```

### JSON-RPC Batching

```bash
curl -X POST https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '[
    {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
    {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
    {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "list_social_accounts"}}
  ]'
```

### SSE Streaming (GET)

```bash
curl -N -X GET https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Mcp-Session-Id: YOUR_SESSION_ID" \
  -H "Accept: text/event-stream"
```

### Terminate Session

```bash
curl -X DELETE https://mcp-post-for-me.hypelive.workers.dev/mcp \
  -H "Mcp-Session-Id: YOUR_SESSION_ID"
```

## 🛠️ Available Tools

| Tool | Description | Annotations |
|------|-------------|-------------|
| `list_social_accounts` | List connected accounts | read-only ✅ |
| `get_social_account` | Get account details | read-only ✅ |
| `disconnect_social_account` | Disconnect account | destructive ⚠️ |
| `list_posts` | List all posts | read-only ✅ |
| `create_post` | Create new post | - |
| `get_post` | Get post details | read-only ✅ |
| `delete_post` | Delete post | destructive ⚠️ |
| `list_post_results` | List publishing results | read-only ✅ |

## 🔧 Claude Configuration

Add to `~/.config/claude/config.json`:

```json
{
  "mcpServers": {
    "post_for_me": {
      "url": "https://mcp-post-for-me.hypelive.workers.dev/mcp",
      "protocol": "2025-03-26",
      "transport": "streamable-http",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│   MCP Client    │────▶│  Cloudflare Worker       │────▶│  Post For Me    │
│  (Claude, etc)  │◀────│  (Streamable HTTP)       │◀────│     API         │
└─────────────────┘     └──────────────────────────┘     └─────────────────┘
                              │
                              ├── POST /mcp (JSON-RPC)
                              ├── GET /mcp (SSE streaming)
                              └── DELETE /mcp (session terminate)
```

### Session Flow

```
1. Client ──POST /mcp──► Server (initialize)
                         │
2. Client ◄─Mcp-Session-Id─ Server (response)
                         │
3. Client ──POST /mcp──► Server (with Mcp-Session-Id)
                         │
4. Client ◄─────────── Server (response)
```

## 🔄 Protocol Comparison

| Feature | HTTP+SSE (2024-11) | Streamable HTTP (2025-03) |
|---------|-------------------|---------------------------|
| Endpoints | 2 (HTTP + SSE) | 1 (unified) |
| Methods | POST only | POST, GET, DELETE |
| Session | ❌ | ✅ `Mcp-Session-Id` |
| Batching | ❌ | ✅ |
| Streaming | SSE | SSE (optional) |
| Stateless | ❌ | ✅ Supported |

## 🧪 Development

```bash
# Local development
npm run dev

# Type check
npm run typecheck

# View logs
npm run logs
```

## 📚 References

- [MCP Specification 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26)
- [Streamable HTTP Transport](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http)
- [Post For Me API Docs](https://api.postforme.dev/docs)

## License

MIT
