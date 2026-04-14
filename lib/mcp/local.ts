import { BaseMCPClient } from "./client";

const LOCAL_MCP_URL = process.env.LOCAL_MCP_URL || "http://localhost:3000/api/mcp";

export class LocalMCPClient extends BaseMCPClient {
  constructor() {
    super(LOCAL_MCP_URL);
  }
}

export async function listLocalMCPTools(client?: LocalMCPClient) {
  const c = client || new LocalMCPClient();
  try {
    return await c.listTools();
  } catch (err) {
    console.error("[LocalMCP] Failed to list tools:", err);
    return [];
  }
}

export async function callLocalMCPTool(
  toolName: string,
  args: Record<string, unknown>,
  client?: LocalMCPClient
) {
  const c = client || new LocalMCPClient();
  return c.callTool(toolName, args);
}
