export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export class BaseMCPClient {
  protected sessionId?: string;
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  protected async rpcRequest(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<any> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.sessionId) {
      headers["Mcp-Session-Id"] = this.sessionId;
    }

    const response = await fetch(this.serverUrl, {
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

    const newSessionId = response.headers.get("Mcp-Session-Id");
    if (newSessionId) {
      this.sessionId = newSessionId;
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `MCP RPC error: ${data.error.message || JSON.stringify(data.error)}`
      );
    }

    return data.result;
  }

  protected async sendNotification(method: string): Promise<void> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.sessionId) {
      headers["Mcp-Session-Id"] = this.sessionId;
    }

    await fetch(this.serverUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
      }),
    });
  }

  protected async ensureInitialized(): Promise<void> {
    if (this.sessionId) return;

    await this.rpcRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "hypesocial-chat", version: "1.0.0" },
    });

    await this.sendNotification("notifications/initialized");
    // Small delay required for the MCP server to fully register the session
    await new Promise((r) => setTimeout(r, 300));
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

  async callTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    await this.ensureInitialized();
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
