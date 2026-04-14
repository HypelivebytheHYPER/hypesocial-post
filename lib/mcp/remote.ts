import { BaseMCPClient } from "./client";

const MCP_SERVER_URL =
  process.env.MCP_SERVER_URL ||
  "https://mcp-post-for-me.hypelive.workers.dev/mcp";

export class RemoteMCPClient extends BaseMCPClient {
  constructor() {
    super(MCP_SERVER_URL);
  }
}

export async function listMCPTools(client?: RemoteMCPClient) {
  const c = client || new RemoteMCPClient();
  return c.listTools();
}

export async function callMCPTool(
  toolName: string,
  args: Record<string, unknown>,
  client?: RemoteMCPClient
) {
  const c = client || new RemoteMCPClient();
  return c.callTool(toolName, args);
}
