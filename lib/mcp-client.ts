/**
 * Lightweight MCP HTTP Client for Next.js
 * Uses simple fetch with JSON-RPC instead of the heavy SDK
 */

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "https://mcp-post-for-me.hypelive.workers.dev/mcp";
const LOCAL_MCP_URL = process.env.LOCAL_MCP_URL || "http://localhost:3000/api/mcp";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

class MCPClient {
  private sessionId?: string;

  private async rpcRequest(method: string, params: Record<string, unknown> = {}): Promise<any> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (this.sessionId) {
      headers["Mcp-Session-Id"] = this.sessionId;
    }

    const response = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MCP HTTP ${response.status}: ${error}`);
    }

    // Capture session ID from response
    const newSessionId = response.headers.get("Mcp-Session-Id");
    if (newSessionId) {
      this.sessionId = newSessionId;
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`MCP RPC error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data.result;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.sessionId) return;
    
    await this.rpcRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "hypesocial-chat", version: "1.0.0" }
    });

    // MCP spec requires sending initialized notification before using the session
    await this.sendNotification("notifications/initialized");
    // Small delay required for the MCP server to fully register the session
    await new Promise((r) => setTimeout(r, 300));
  }

  private async sendNotification(method: string): Promise<void> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.sessionId) {
      headers["Mcp-Session-Id"] = this.sessionId;
    }

    await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
      }),
    });
  }

  async listTools(): Promise<MCPTool[]> {
    await this.ensureInitialized();
    const result = await this.rpcRequest("tools/list", {});
    
    return (result?.tools || []).map((tool: any) => ({
      name: tool.name,
      description: tool.description || "No description",
      inputSchema: tool.inputSchema,
    }));
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    await this.ensureInitialized();
    const result = await this.rpcRequest("tools/call", {
      name: toolName,
      arguments: args,
    });

    // Extract text content from MCP tool result
    if (result && Array.isArray(result.content)) {
      const textContent = result.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
      
      try {
        return JSON.parse(textContent);
      } catch {
        return { result: textContent };
      }
    }

    return result;
  }
}

/**
 * List available tools from MCP server
 */
export async function listMCPTools(): Promise<MCPTool[]> {
  const client = new MCPClient();
  return client.listTools();
}

/**
 * Call an MCP tool
 */
export async function callMCPTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const client = new MCPClient();
  return client.callTool(toolName, args);
}

// Local HypeSocial MCP client
class LocalMCPClient {
  private async rpcRequest(method: string, params: Record<string, unknown> = {}): Promise<any> {
    const response = await fetch(LOCAL_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Local MCP HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Local MCP RPC error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    return data.result;
  }

  private async sendNotification(method: string): Promise<void> {
    await fetch(LOCAL_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
      }),
    });
  }

  async listTools(): Promise<MCPTool[]> {
    await this.rpcRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "hypesocial-chat", version: "1.0.0" },
    });
    await this.sendNotification("notifications/initialized");

    const result = await this.rpcRequest("tools/list", {});
    return (result?.tools || []).map((tool: any) => ({
      name: tool.name,
      description: tool.description || "No description",
      inputSchema: tool.inputSchema,
    }));
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    await this.rpcRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "hypesocial-chat", version: "1.0.0" },
    });
    await this.sendNotification("notifications/initialized");

    const result = await this.rpcRequest("tools/call", {
      name: toolName,
      arguments: args,
    });

    if (result && Array.isArray(result.content)) {
      const textContent = result.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
      try {
        return JSON.parse(textContent);
      } catch {
        return { result: textContent };
      }
    }
    return result;
  }
}

/**
 * List available tools from local HypeSocial MCP server
 */
export async function listLocalMCPTools(): Promise<MCPTool[]> {
  const client = new LocalMCPClient();
  try {
    return await client.listTools();
  } catch (err) {
    console.error("[LocalMCP] Failed to list tools:", err);
    return [];
  }
}

/**
 * Call a tool on the local HypeSocial MCP server
 */
export async function callLocalMCPTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const client = new LocalMCPClient();
  return client.callTool(toolName, args);
}

/**
 * Parse tool calls from AI response
 */
export function parseToolCalls(content: string): Array<{ name: string; arguments: Record<string, unknown> }> | undefined {
  const toolCalls: Array<{ name: string; arguments: Record<string, unknown> }> = [];
  const regex = /<tool_call>(.*?)<\/tool_call>/gs;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    try {
      const matchText = match[1];
      if (!matchText) continue;
      const toolCall = JSON.parse(matchText.trim());
      if (toolCall.name) {
        toolCalls.push({
          name: toolCall.name,
          arguments: toolCall.arguments || {},
        });
      }
    } catch (e) {
      console.error("[MCP] Failed to parse tool call:", match[1]);
    }
  }
  
  return toolCalls.length > 0 ? toolCalls : undefined;
}
