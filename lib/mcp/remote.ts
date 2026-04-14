import { BaseMCPClient } from "./client";

const MCP_SERVER_URL =
  process.env.MCP_SERVER_URL ||
  "https://mcp-post-for-me.hypelive.workers.dev/mcp";

export class RemoteMCPClient extends BaseMCPClient {
  constructor() {
    super(MCP_SERVER_URL);
  }
}

export async function listMCPTools() {
  const client = new RemoteMCPClient();
  return client.listTools();
}

export async function callMCPTool(
  toolName: string,
  args: Record<string, unknown>
) {
  const client = new RemoteMCPClient();
  return client.callTool(toolName, args);
}
