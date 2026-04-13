# MCP Agent Discovery - Quick Reference

## Protocol Flow

```
┌─────────┐    POST /mcp (initialize)    ┌─────────┐
│  Agent  │ ───────────────────────────▶ │ Server  │
└─────────┘    ◀── 200 + Mcp-Session-Id  └─────────┘
      │
      │    POST /mcp (tools/list)
      │ ───────────────────────────▶
      │    ◀── { tools: [...] }
      │
      │    POST /mcp (tools/call)
      │ ───────────────────────────▶
      │    ◀── { content: [...] }
```

## Tool Annotations

| Annotation | Meaning | Example Tools |
|------------|---------|---------------|
| `readOnlyHint: true` | Does not modify state | `list_*`, `get_*` |
| `destructiveHint: true` | Cannot be undone | `delete_*` |
| `idempotentHint: true` | Same result if called multiple times | `get_*`, `delete_*` |
| `openWorldHint: true` | Interacts with external systems | `create_*`, `publish_*` |

## Tool Naming Conventions

```
list_{resources}          # Read collection
create_{resource}         # Create new
get_{resource}            # Read single
update_{resource}         # Update single
delete_{resource}         # Delete single
{verb}_{resource}         # Action (connect, disconnect, publish)
batch_{action}_{resources} # Batch operation
```

## Error Codes

| Code | Meaning | Retry? |
|------|---------|--------|
| -32700 | Parse error | No |
| -32600 | Invalid request | No |
| -32601 | Method not found | No |
| -32602 | Invalid params | No |
| -32603 | Internal error | Yes |
| -32001 | Session not found | Re-initialize |
| -32002 | Tool execution error | Depends |
| -32003 | Validation error | No |
| -32004 | API error | Yes |

## Request/Response Pattern

```typescript
// Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_social_accounts",
    "arguments": { "limit": 10 }
  }
}

// Success Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"accounts\":[...]}"
      }
    ]
  }
}

// Error Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32002,
    "message": "Tool execution failed"
  }
}
```

## Session Management

```typescript
// Store session ID from initialize response
const sessionId = response.headers.get("Mcp-Session-Id");

// Include in subsequent requests
fetch('/mcp', {
  headers: {
    'Content-Type': 'application/json',
    'Mcp-Session-Id': sessionId
  },
  ...
});
```

## Query Pattern Template

```typescript
{
  name: "list_posts",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "integer", default: 20, maximum: 100 },
      offset: { type: "integer", default: 0 },
      status: { 
        type: "array", 
        items: { enum: ["pending", "scheduled", "posted", "failed"] }
      },
      sort: {
        type: "object",
        properties: {
          field: { type: "string" },
          order: { enum: ["asc", "desc"], default: "desc" }
        }
      },
      dateRange: {
        type: "object",
        properties: {
          from: { type: "string", format: "date-time" },
          to: { type: "string", format: "date-time" }
        }
      }
    }
  }
}
```

## Agent Decision Tree

```
User Intent
     │
     ▼
┌─────────────┐
│ Match Tools │
└─────────────┘
     │
     ├──────────▶ No match ──▶ "I don't understand"
     │
     ├──────────▶ Multiple high ──▶ Ask clarification
     │
     └──────────▶ Single match
                      │
                      ▼
               ┌─────────────┐
               │ Destructive?│
               └─────────────┘
                    │
                    ├─────────▶ Yes ──▶ Confirm with user
                    │
                    └─────────▶ No ──▶ Execute
```
