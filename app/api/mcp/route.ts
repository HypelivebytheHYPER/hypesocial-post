import { NextRequest, NextResponse } from "next/server";
import { getAllHypeSocialTools, handleHypeSocialTool } from "@/lib/mcp-hypesocial-tools";

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

function jsonrpcResponse(id: string | number, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function jsonrpcError(id: string | number, code: number, message: string, data?: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message, data } });
}

/**
 * POST /api/mcp
 *
 * Lightweight JSON-RPC MCP server exposing HypeSocial's existing APIs as tools.
 */
export async function POST(request: NextRequest) {
  let body: JSONRPCRequest;
  try {
    body = await request.json();
  } catch {
    return jsonrpcError(0, -32700, "Parse error: invalid JSON");
  }

  const { id, method, params = {} } = body;

  // Notifications have no id
  const isNotification = id === undefined;

  switch (method) {
    case "initialize": {
      if (isNotification) return new Response(null, { status: 204 });
      return jsonrpcResponse(id!, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "hypesocial-mcp",
          version: "1.0.0",
        },
      });
    }

    case "notifications/initialized": {
      // No response needed for notifications
      return new Response(null, { status: 204 });
    }

    case "tools/list": {
      if (isNotification) return new Response(null, { status: 204 });
      const tools = getAllHypeSocialTools().map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));
      return jsonrpcResponse(id!, { tools });
    }

    case "tools/call": {
      if (isNotification) return new Response(null, { status: 204 });
      const toolName = String(params.name || "");
      const toolArgs = (params.arguments || {}) as Record<string, unknown>;
      const result = await handleHypeSocialTool(toolName, toolArgs);
      return jsonrpcResponse(id!, result);
    }

    default: {
      if (isNotification) return new Response(null, { status: 204 });
      return jsonrpcError(id!, -32601, `Method not found: ${method}`);
    }
  }
}
