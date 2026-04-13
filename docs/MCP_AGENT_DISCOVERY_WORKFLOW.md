# MCP Agent Discovery Workflow

Complete guide for AI agent discovery, tool preset patterns, and workflow logic using MCP 2025-03-26 protocol.

## Table of Contents

1. [Discovery Protocol](#1-discovery-protocol)
2. [Tool Preset Patterns](#2-tool-preset-patterns)
3. [Workflow Logic](#3-workflow-logic)
4. [Agent Implementation](#4-agent-implementation)
5. [Error Recovery](#5-error-recovery)

---

## 1. Discovery Protocol

### 1.1 Initialization Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Agent     │────▶│    MCP      │────▶│   Server    │
│  (Client)   │◀────│   Server    │◀────│  (Remote)   │
└─────────────┘     └─────────────┘     └─────────────┘

Step 1: Initialize
  POST /mcp
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {
        "roots": { "listChanged": true },
        "sampling": {}
      },
      "clientInfo": {
        "name": "claude-desktop",
        "version": "1.0.0"
      }
    }
  }

Step 2: Server Response + Session ID
  HTTP/1.1 200 OK
  Mcp-Session-Id: abc-123-xyz
  {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "protocolVersion": "2025-03-26",
      "capabilities": {
        "tools": {},
        "resources": {},
        "prompts": {}
      },
      "serverInfo": {
        "name": "post-for-me-mcp",
        "version": "1.0.0"
      }
    }
  }
```

### 1.2 Capability Negotiation

| Client Capability | Server Response | Meaning |
|-------------------|-----------------|---------|
| `roots` | `roots: {}` | Server can access filesystem roots |
| `sampling` | `sampling: {}` | Server can request LLM sampling |
| `tools` | `tools: {}` | Server provides tools |
| `resources` | `resources: {}` | Server provides resources |
| `prompts` | `prompts: {}` | Server provides prompts |

### 1.3 Tool Discovery

```typescript
// After initialization, discover available tools
const discoveryRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
  params: {} // Optional: cursor for pagination
};

// Server responds with tool catalog
const discoveryResponse = {
  jsonrpc: "2.0",
  id: 2,
  result: {
    tools: [
      {
        name: "list_social_accounts",
        description: "List all connected social media accounts...",
        inputSchema: { /* JSON Schema */ },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }
      }
      // ... more tools
    ],
    // nextCursor: "..." // If pagination needed
  }
};
```

---

## 2. Tool Preset Patterns

### 2.1 CRUD Pattern

```typescript
// Standard CRUD operations mapped to MCP tools
const crudPattern = {
  create: {
    name: "create_${resource}",
    method: "POST",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false, // POST is not idempotent
      openWorldHint: true
    }
  },
  read: {
    name: "get_${resource}",    // Single item
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  readAll: {
    name: "list_${resources}",  // Collection
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  update: {
    name: "update_${resource}",
    annotations: { 
      readOnlyHint: false, 
      idempotentHint: true // PUT semantics
    }
  },
  delete: {
    name: "delete_${resource}",
    annotations: { 
      destructiveHint: true, 
      idempotentHint: true // DELETE is idempotent
    }
  }
};
```

### 2.2 Action Pattern

```typescript
// For operations that don't fit CRUD
const actionPattern = {
  name: "${verb}_${resource}",
  examples: [
    "disconnect_social_account",
    "publish_post",
    "schedule_post",
    "revoke_token"
  ],
  annotations: {
    // Depends on action nature
    destructiveHint: true,  // If irreversible
    idempotentHint: false   // If creates new state each time
  }
};
```

### 2.3 Query Pattern

```typescript
// For complex queries with filtering
const queryPattern = {
  name: "list_${resources}",
  inputSchema: {
    type: "object",
    properties: {
      // Pagination
      limit: { type: "integer", default: 20, maximum: 100 },
      offset: { type: "integer", default: 0 },
      cursor: { type: "string" }, // Alternative to offset
      
      // Filtering
      filter: {
        type: "object",
        properties: {
          status: { enum: ["active", "inactive"] },
          dateFrom: { type: "string", format: "date-time" },
          dateTo: { type: "string", format: "date-time" }
        }
      },
      
      // Sorting
      sort: {
        type: "object",
        properties: {
          field: { type: "string" },
          order: { enum: ["asc", "desc"], default: "desc" }
        }
      },
      
      // Search
      search: { type: "string" },
      
      // Expansion
      expand: { 
        type: "array", 
        items: { type: "string" },
        description: "Related resources to include"
      }
    }
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true
  }
};
```

### 2.4 Batch Pattern

```typescript
// For operations on multiple items
const batchPattern = {
  name: "batch_${action}_${resources}",
  examples: [
    "batch_delete_posts",
    "batch_update_status"
  ],
  inputSchema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: { type: "string" }, // IDs
        minItems: 1,
        maxItems: 100 // Batch limit
      },
      operation: {
        type: "object",
        description: "Operation to apply to all items"
      }
    },
    required: ["items"]
  },
  outputSchema: {
    type: "object",
    properties: {
      succeeded: { type: "array" },
      failed: {
        type: "array",
        items: {
          properties: {
            id: { type: "string" },
            error: { type: "string" }
          }
        }
      }
    }
  }
};
```

---

## 3. Workflow Logic

### 3.1 Discovery Workflow

```typescript
class MCPAgent {
  private sessionId: string | null = null;
  private tools: Map<string, MCPTool> = new Map();
  private capabilities: MCPServerCapabilities = {};

  async discover(url: string): Promise<DiscoveryResult> {
    // Step 1: Initialize connection
    const initResult = await this.initialize(url);
    this.sessionId = initResult.sessionId;
    this.capabilities = initResult.capabilities;

    // Step 2: Discover tools if supported
    if (this.capabilities.tools) {
      await this.discoverTools(url);
    }

    // Step 3: Build tool index
    return this.buildToolIndex();
  }

  private async initialize(url: string): Promise<InitializeResult> {
    const response = await fetch(`${url}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "mcp-agent", version: "1.0.0" }
        }
      })
    });

    const sessionId = response.headers.get("Mcp-Session-Id");
    const data = await response.json();

    return {
      sessionId,
      capabilities: data.result.capabilities,
      serverInfo: data.result.serverInfo
    };
  }

  private async discoverTools(url: string): Promise<void> {
    const response = await fetch(`${url}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.sessionId && { "Mcp-Session-Id": this.sessionId })
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list"
      })
    });

    const data = await response.json();
    
    // Index tools by name
    for (const tool of data.result.tools) {
      this.tools.set(tool.name, tool);
    }
  }

  private buildToolIndex(): DiscoveryResult {
    // Categorize tools
    const categories = {
      read: [] as string[],
      write: [] as string[],
      delete: [] as string[],
      query: [] as string[]
    };

    for (const [name, tool] of this.tools) {
      if (tool.annotations?.readOnlyHint) {
        categories.read.push(name);
      } else if (tool.annotations?.destructiveHint) {
        categories.delete.push(name);
      } else if (name.startsWith("list_") || name.startsWith("search_")) {
        categories.query.push(name);
      } else {
        categories.write.push(name);
      }
    }

    return {
      tools: Array.from(this.tools.values()),
      categories,
      capabilities: this.capabilities
    };
  }
}
```

### 3.2 Intent Matching Workflow

```typescript
// Match user intent to available tools
class IntentMatcher {
  constructor(private tools: Map<string, MCPTool>) {}

  matchIntent(userIntent: string): ToolMatch[] {
    const matches: ToolMatch[] = [];
    const intent = userIntent.toLowerCase();

    for (const [name, tool] of this.tools) {
      let score = 0;

      // Exact name match
      if (intent.includes(name.toLowerCase())) {
        score += 100;
      }

      // Keyword matching
      const keywords = this.extractKeywords(tool.description);
      for (const keyword of keywords) {
        if (intent.includes(keyword)) {
          score += 10;
        }
      }

      // Action verb matching
      const verbs = this.extractActionVerbs(name);
      for (const verb of verbs) {
        if (intent.includes(verb)) {
          score += 20;
        }
      }

      if (score > 0) {
        matches.push({ tool, score, confidence: this.calculateConfidence(score) });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  private extractKeywords(description: string): string[] {
    // Extract meaningful keywords from description
    const stopWords = new Set(["the", "a", "an", "and", "or", "to", "for", "of", "with"]);
    return description
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
  }

  private extractActionVerbs(name: string): string[] {
    const verbMap: Record<string, string[]> = {
      "create": ["create", "make", "new", "add"],
      "list": ["list", "show", "get all", "find all"],
      "get": ["get", "retrieve", "fetch", "find"],
      "update": ["update", "edit", "modify", "change"],
      "delete": ["delete", "remove", "destroy", "trash"],
      "disconnect": ["disconnect", "unlink", "detach"]
    };

    for (const [prefix, verbs] of Object.entries(verbMap)) {
      if (name.startsWith(prefix)) return verbs;
    }
    return [];
  }

  private calculateConfidence(score: number): "high" | "medium" | "low" {
    if (score >= 100) return "high";
    if (score >= 50) return "medium";
    return "low";
  }
}
```

### 3.3 Tool Selection Logic

```typescript
// Smart tool selection with validation
class ToolSelector {
  selectTool(
    intent: string,
    availableTools: ToolMatch[],
    context?: ExecutionContext
  ): ToolSelection {
    // Filter by confidence
    const highConfidence = availableTools.filter(m => m.confidence === "high");
    
    if (highConfidence.length === 1) {
      // Single high-confidence match
      return {
        tool: highConfidence[0].tool,
        params: this.inferParams(intent, highConfidence[0].tool),
        needsConfirmation: highConfidence[0].tool.annotations?.destructiveHint ?? false
      };
    }

    if (highConfidence.length > 1) {
      // Multiple matches - need clarification
      return {
        ambiguous: true,
        candidates: highConfidence.map(m => m.tool.name),
        message: `Multiple tools match your intent: ${highConfidence.map(m => m.tool.name).join(", ")}. Which one would you like to use?`
      };
    }

    // Check for destructive operations requiring confirmation
    const destructive = availableTools.find(m => 
      m.tool.annotations?.destructiveHint && m.confidence === "medium"
    );

    if (destructive) {
      return {
        tool: destructive.tool,
        params: this.inferParams(intent, destructive.tool),
        needsConfirmation: true,
        warning: `This will ${destructive.tool.description.toLowerCase()}. Are you sure?`
      };
    }

    // Fall back to best medium match
    const bestMatch = availableTools[0];
    if (bestMatch?.confidence === "medium") {
      return {
        tool: bestMatch.tool,
        params: this.inferParams(intent, bestMatch.tool),
        needsConfirmation: false
      };
    }

    // No good match
    return {
      notFound: true,
      message: "I couldn't find a suitable tool for that request. Available operations: " +
        availableTools.slice(0, 5).map(m => m.tool.name).join(", ")
    };
  }

  private inferParams(intent: string, tool: MCPTool): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    const schema = tool.inputSchema;

    if (!schema?.properties) return params;

    for (const [key, prop] of Object.entries(schema.properties)) {
      const property = prop as { type: string; description?: string };
      
      // Try to extract value from intent
      const value = this.extractValue(intent, key, property);
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return params;
  }

  private extractValue(
    intent: string, 
    key: string, 
    property: { type: string; description?: string }
  ): unknown | undefined {
    // Extract values using patterns
    const patterns: Record<string, RegExp> = {
      "limit": /limit\s+(\d+)/i,
      "id": /id[\s:]+([a-z_0-9]+)/i,
      "platform": /platform[\s:]+(\w+)/i,
    };

    const pattern = patterns[key];
    if (pattern) {
      const match = intent.match(pattern);
      if (match) {
        return property.type === "integer" || property.type === "number"
          ? parseInt(match[1], 10)
          : match[1];
      }
    }

    return undefined;
  }
}
```

---

## 4. Agent Implementation

### 4.1 Complete Agent Class

```typescript
class MCPAgent {
  private baseUrl: string;
  private sessionId: string | null = null;
  private tools: Map<string, MCPTool> = new Map();
  private intentMatcher: IntentMatcher;
  private toolSelector: ToolSelector;

  constructor(url: string) {
    this.baseUrl = url;
    this.intentMatcher = new IntentMatcher(this.tools);
    this.toolSelector = new ToolSelector();
  }

  async initialize(): Promise<void> {
    // Initialize and discover
    const response = await this.rpc("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "mcp-agent", version: "1.0.0" }
    });

    this.sessionId = response.sessionId;

    // Discover tools
    const toolsResult = await this.rpc("tools/list", {});
    for (const tool of toolsResult.tools) {
      this.tools.set(tool.name, tool);
    }

    // Update intent matcher with discovered tools
    this.intentMatcher = new IntentMatcher(this.tools);
  }

  async executeIntent(userIntent: string): Promise<ExecutionResult> {
    // Match intent to tools
    const matches = this.intentMatcher.matchIntent(userIntent);
    
    if (matches.length === 0) {
      return {
        success: false,
        message: "No matching tool found for your request."
      };
    }

    // Select best tool
    const selection = this.toolSelector.selectTool(userIntent, matches);

    if ("notFound" in selection) {
      return { success: false, message: selection.message };
    }

    if ("ambiguous" in selection) {
      return {
        success: false,
        ambiguous: true,
        message: selection.message,
        candidates: selection.candidates
      };
    }

    // Confirm if needed
    if (selection.needsConfirmation) {
      return {
        success: false,
        needsConfirmation: true,
        tool: selection.tool.name,
        warning: selection.warning,
        params: selection.params
      };
    }

    // Execute tool
    return this.executeTool(selection.tool.name, selection.params);
  }

  async executeTool(
    name: string, 
    params: Record<string, unknown>
  ): Promise<ExecutionResult> {
    try {
      const result = await this.rpc("tools/call", {
        name,
        arguments: params
      });

      if (result.isError) {
        return {
          success: false,
          message: result.content[0].text
        };
      }

      return {
        success: true,
        data: JSON.parse(result.content[0].text)
      };
    } catch (error) {
      return {
        success: false,
        message: `Execution failed: ${error}`
      };
    }
  }

  private async rpc(method: string, params: Record<string, unknown>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.sessionId && { "Mcp-Session-Id": this.sessionId })
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params
      })
    });

    // Update session ID if returned
    const newSessionId = response.headers.get("Mcp-Session-Id");
    if (newSessionId) {
      this.sessionId = newSessionId;
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result;
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolInfo(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }
}
```

### 4.2 Usage Example

```typescript
// Initialize agent
const agent = new MCPAgent("https://mcp-post-for-me.hypelive.workers.dev");
await agent.initialize();

// Execute intents
const result1 = await agent.executeIntent("List my social accounts");
console.log(result1);
// { success: true, data: { accounts: [...] } }

const result2 = await agent.executeIntent("Create a post saying Hello World");
console.log(result2);
// { success: false, needsConfirmation: true, tool: "create_post", ... }

// Confirm and execute
if (result2.needsConfirmation) {
  const confirmed = await agent.executeTool(result2.tool, result2.params);
  console.log(confirmed);
}
```

---

## 5. Error Recovery

### 5.1 Retry Logic

```typescript
class ResilientRPC {
  private maxRetries = 3;
  private retryDelay = 1000;

  async callWithRetry(
    fn: () => Promise<Response>,
    isRetryable: (error: Error) => boolean
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (!isRetryable(lastError)) {
          throw lastError;
        }

        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const resilient = new ResilientRPC();

const response = await resilient.callWithRetry(
  () => fetch(`${url}/mcp`, { ... }),
  (error) => {
    // Retry on network errors or 5xx
    return error.message.includes("network") || 
           error.message.includes("timeout") ||
           error.message.includes("500");
  }
);
```

### 5.2 Session Recovery

```typescript
class SessionManager {
  private sessionId: string | null = null;
  private isRecovering = false;

  async withSession<T>(fn: (sessionId: string) => Promise<T>): Promise<T> {
    try {
      if (!this.sessionId) {
        await this.createSession();
      }
      return await fn(this.sessionId!);
    } catch (error) {
      // Check if session expired
      if (this.isSessionExpiredError(error)) {
        this.sessionId = null;
        await this.createSession();
        return await fn(this.sessionId!);
      }
      throw error;
    }
  }

  private isSessionExpiredError(error: unknown): boolean {
    return error instanceof Error && 
           error.message.includes("Session not found");
  }

  private async createSession(): Promise<void> {
    // Initialize new session
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { ... }
      })
    });

    this.sessionId = response.headers.get("Mcp-Session-Id");
  }
}
```

---

## Summary

| Component | Purpose |
|-----------|---------|
| **Discovery** | Find available tools and capabilities |
| **Intent Matching** | Map user requests to tools |
| **Tool Selection** | Choose best tool with validation |
| **Execution** | Call tools with proper error handling |
| **Recovery** | Handle failures gracefully |

---

## Reference

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-03-26)
- [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
