/**
 * Post For Me MCP Server on Cloudflare Workers
 * Implements MCP 2025-03-26 Streamable HTTP protocol
 * 
 * Features:
 * - Streamable HTTP transport (single endpoint)
 * - Session management via Mcp-Session-Id
 * - Support for both stateless and stateful modes
 * - Optional SSE streaming for multiple responses
 * - JSON-RPC batching support
 * - Proper error handling per MCP spec
 */

import { z } from "zod";
import { 
  tools, 
  createJsonResult, 
  createErrorResult,
  type MCPToolResult 
} from "./tools";
import {
  ErrorCodes,
  MCPErrorException,
  createParseError,
  createInvalidRequest,
  createMethodNotFound,
  createInvalidParams,
  createInternalError,
  createSessionNotFound,
  createToolExecutionError,
  createValidationError,
  formatZodErrors,
  safeJsonParse,
  validateJsonRpcRequest,
} from "./errors";

// ============================================================================
// Types
// ============================================================================

interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

type MCPBatchRequest = MCPRequest[];

interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

type MCPBatchResponse = MCPResponse[];

interface Session {
  id: string;
  createdAt: number;
  lastActivity: number;
}

// ============================================================================
// Environment
// ============================================================================

export interface Env {
  POST_FOR_ME_API_KEY: string;
  POST_FOR_ME_BASE_URL: string;
  POST_FOR_ME_WEBHOOK_SECRET?: string;
  MCP_SESSIONS?: KVNamespace;
}

// ============================================================================
// Session Management
// ============================================================================

class SessionManager {
  private sessions = new Map<string, Session>();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  create(): Session {
    const id = crypto.randomUUID();
    const session: Session = {
      id,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
    this.sessions.set(id, session);
    return session;
  }

  get(id: string): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    if (Date.now() - session.lastActivity > this.SESSION_TIMEOUT) {
      this.sessions.delete(id);
      return undefined;
    }
    
    session.lastActivity = Date.now();
    return session;
  }

  delete(id: string): boolean {
    return this.sessions.delete(id);
  }

  isValid(id: string): boolean {
    return this.get(id) !== undefined;
  }
}

const sessionManager = new SessionManager();

// ============================================================================
// Post For Me API Client
// ============================================================================

class PostForMeClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(env: Env) {
    this.baseUrl = env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";
    this.apiKey = env.POST_FOR_ME_API_KEY;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: { message?: string } | null = null;
      try {
        errorData = JSON.parse(errorText) as { message?: string };
      } catch {
        // Not JSON, use text as-is
      }
      
      throw new MCPErrorException(
        ErrorCodes.API_ERROR,
        errorData?.message || `API error: ${response.status}`,
        { statusCode: response.status, response: errorText }
      );
    }

    return response.json() as Promise<T>;
  }

  async listAccounts(params?: { limit?: number; offset?: number; platform?: string[]; status?: string[] }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    params?.platform?.forEach(p => searchParams.append("platform", p));
    params?.status?.forEach(s => searchParams.append("status", s));
    
    return this.request("GET", `/v1/social-accounts?${searchParams}`);
  }

  async getAccount(id: string) {
    return this.request("GET", `/v1/social-accounts/${id}`);
  }

  async disconnectAccount(id: string) {
    return this.request("POST", `/v1/social-accounts/${id}/disconnect`);
  }

  async listPosts(params?: { 
    limit?: number; 
    offset?: number; 
    status?: string[];
    platform?: string[];
    external_id?: string[];
    social_account_id?: string[];
  }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    params?.status?.forEach(s => searchParams.append("status", s));
    params?.platform?.forEach(p => searchParams.append("platform", p));
    params?.external_id?.forEach(e => searchParams.append("external_id", e));
    params?.social_account_id?.forEach(sa => searchParams.append("social_account_id", sa));
    
    return this.request("GET", `/v1/social-posts?${searchParams}`);
  }

  async createPost(post: {
    caption: string;
    social_accounts: string[];
    media?: { url: string; type?: string }[];
    scheduled_at?: string;
    external_id?: string;
  }) {
    return this.request("POST", "/v1/social-posts", post);
  }

  async getPost(id: string) {
    return this.request("GET", `/v1/social-posts/${id}`);
  }

  async deletePost(id: string) {
    return this.request("DELETE", `/v1/social-posts/${id}`);
  }

  async listPostResults(params?: { limit?: number; offset?: number; post_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    if (params?.post_id) searchParams.set("post_id", params.post_id);
    
    return this.request("GET", `/v1/social-post-results?${searchParams}`);
  }

  async searchPosts(params: { query: string; limit?: number; sort?: string }) {
    const searchParams = new URLSearchParams();
    searchParams.set("q", params.query);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.sort) searchParams.set("sort", params.sort);
    
    return this.request("GET", `/v1/social-posts/search?${searchParams}`);
  }

  async getAccountStats(accountId: string, period?: string) {
    const params = new URLSearchParams();
    if (period) params.set("period", period);
    
    return this.request("GET", `/v1/social-accounts/${accountId}/stats?${params}`);
  }

  async batchDeletePosts(postIds: string[]) {
    return this.request("POST", "/v1/social-posts/batch-delete", { post_ids: postIds });
  }
}

// ============================================================================
// Tool Schemas (Centralized in ./schemas)
// ============================================================================

import { ToolSchemas, type ToolName, PLATFORM_CAPTION_LIMITS, getCaptionLimits } from "./schemas";

const toolSchemas = ToolSchemas;

async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  client: PostForMeClient
): Promise<MCPToolResult> {
  // Validate tool exists
  const schema = toolSchemas[name];
  if (!schema) {
    return createErrorResult(`Unknown tool: ${name}`);
  }

  // Validate input
  let validatedArgs: Record<string, unknown>;
  try {
    validatedArgs = schema.parse(args);
  } catch (error) {
    const { message, details } = formatZodErrors(error);
    return createErrorResult(`Validation failed: ${message}`, { validationErrors: details });
  }

  // Execute tool
  try {
    let result: unknown;
    
    switch (name) {
      case "list_social_accounts":
        result = await client.listAccounts(validatedArgs);
        break;
      case "get_social_account":
        result = await client.getAccount(validatedArgs.id as string);
        break;
      case "disconnect_social_account":
        result = await client.disconnectAccount(validatedArgs.id as string);
        break;
      case "list_posts":
        result = await client.listPosts(validatedArgs);
        break;
      case "create_post":
        result = await client.createPost(validatedArgs as {
          caption: string;
          social_accounts: string[];
          media?: { url: string; type?: string }[];
          scheduled_at?: string;
          external_id?: string;
        });
        break;
      case "get_post":
        result = await client.getPost(validatedArgs.id as string);
        break;
      case "get_post_with_accounts": {
        const post = await client.getPost(validatedArgs.id as string);
        // Enrich with full account details
        if (post.social_accounts && post.social_accounts.length > 0) {
          const enrichedAccounts = await Promise.all(
            post.social_accounts.map(async (ref: { id: string }) => {
              try {
                return await client.getAccount(ref.id);
              } catch {
                return ref; // Fallback to reference if fetch fails
              }
            })
          );
          result = { ...post, social_accounts: enrichedAccounts };
        } else {
          result = post;
        }
        break;
      }
      case "delete_post":
        result = await client.deletePost(validatedArgs.id as string);
        break;
      case "list_post_results":
        result = await client.listPostResults(validatedArgs);
        break;
      case "search_posts":
        result = await client.searchPosts(validatedArgs as { query: string; limit?: number; sort?: string });
        break;
      case "get_account_stats":
        result = await client.getAccountStats(
          validatedArgs.account_id as string,
          validatedArgs.period as string
        );
        break;
      case "batch_delete_posts":
        result = await client.batchDeletePosts(validatedArgs.post_ids as string[]);
        break;
      case "get_caption_limits": {
        const platform = validatedArgs.platform as string | undefined;
        const contentType = validatedArgs.content_type as string | undefined;
        
        if (platform) {
          // Return specific platform limits
          const limits = getCaptionLimits(platform, contentType);
          if (limits) {
            result = {
              platform,
              content_type: contentType || "feed",
              limits,
            };
          } else {
            return createErrorResult(`Platform not found: ${platform}`);
          }
        } else {
          // Return all platform limits
          result = {
            platforms: PLATFORM_CAPTION_LIMITS,
            summary: {
              instagram: "2,200 chars (Feed, Reels) | Stories: captions not supported",
              facebook: "63,206 chars | Reels: 2,200 chars",
              tiktok: "2,200 chars (Photos & Videos)",
              twitter: "280 chars (Premium: 25,000)",
              linkedin: "3,000 chars",
              youtube: "5,000 chars (Description) | Shorts: 100 chars (Title)",
              pinterest: "500 chars",
              bluesky: "300 chars",
              threads: "500 chars per post",
            },
          };
        }
        break;
      }
      default:
        return createErrorResult(`Tool not implemented: ${name}`);
    }

    return createJsonResult(result);
  } catch (error) {
    if (error instanceof MCPErrorException) {
      return createErrorResult(error.message, error.data);
    }
    
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResult(`Tool execution failed: ${message}`);
  }
}

// ============================================================================
// MCP Request Handler
// ============================================================================

async function handleMCPRequest(
  request: MCPRequest,
  env: Env
): Promise<{ response: MCPResponse; newSessionId?: string }> {
  const client = new PostForMeClient(env);

  switch (request.method) {
    case "initialize": {
      const session = sessionManager.create();
      
      return {
        response: {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2025-03-26",
            capabilities: {
              tools: {},
              logging: {},
            },
            serverInfo: {
              name: "post-for-me-mcp",
              version: "1.0.0",
            },
          },
        },
        newSessionId: session.id,
      };
    }

    case "tools/list":
      return {
        response: {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools,
          },
        },
      };

    case "tools/call": {
      const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
      
      if (!params?.name) {
        return {
          response: {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: ErrorCodes.INVALID_PARAMS,
              message: "Missing required parameter: name",
            },
          },
        };
      }

      const result = await handleToolCall(params.name, params.arguments || {}, client);
      
      return {
        response: {
          jsonrpc: "2.0",
          id: request.id,
          result,
        },
      };
    }

    default:
      return {
        response: {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: ErrorCodes.METHOD_NOT_FOUND,
            message: `Method not found: ${request.method}`,
          },
        },
      };
  }
}

// ============================================================================
// HTTP Response Helpers
// ============================================================================

function createJSONResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function createSSEResponse(stream: ReadableStream, headers: Record<string, string> = {}): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      ...headers,
    },
  });
}

// ============================================================================
// Main Worker
// ============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Last-Event-ID",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return createJSONResponse({ 
        status: "ok", 
        service: "post-for-me-mcp",
        protocol: "2025-03-26",
        transport: "streamable-http",
      });
    }

    // Only handle MCP requests on root "/" or "/mcp" paths
    if (url.pathname !== "/" && url.pathname !== "/mcp") {
      return createJSONResponse(
        { 
          jsonrpc: "2.0", 
          id: null, 
          error: { 
            code: ErrorCodes.METHOD_NOT_FOUND, 
            message: "Not found" 
          } 
        },
        404,
        corsHeaders
      );
    }

    // Handle DELETE - session termination
    if (method === "DELETE") {
      const sessionId = request.headers.get("Mcp-Session-Id");
      if (sessionId) {
        const deleted = sessionManager.delete(sessionId);
        if (deleted) {
          return new Response(null, { 
            status: 200, 
            headers: corsHeaders 
          });
        }
        return createJSONResponse(
          { 
            jsonrpc: "2.0", 
            id: null, 
            error: { 
              code: ErrorCodes.SESSION_NOT_FOUND, 
              message: "Session not found" 
            } 
          },
          404,
          corsHeaders
        );
      }
      return new Response(null, { status: 405, headers: corsHeaders });
    }

    // Handle GET - SSE streaming endpoint
    if (method === "GET") {
      const sessionId = request.headers.get("Mcp-Session-Id");
      
      if (sessionId && !sessionManager.isValid(sessionId)) {
        return createJSONResponse(
          { 
            jsonrpc: "2.0", 
            id: null, 
            error: { 
              code: ErrorCodes.SESSION_NOT_FOUND, 
              message: "Session not found" 
            } 
          },
          404,
          corsHeaders
        );
      }

      const stream = new ReadableStream({
        start(controller) {
          const endpoint = url.pathname;
          controller.enqueue(`event: endpoint\ndata: ${endpoint}\n\n`);
          
          const keepAlive = setInterval(() => {
            controller.enqueue(`: ping\n\n`);
          }, 30000);

          setTimeout(() => {
            clearInterval(keepAlive);
            controller.close();
          }, 5 * 60 * 1000);
        },
      });

      return createSSEResponse(stream, {
        ...corsHeaders,
        ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
      });
    }

    // Handle POST - JSON-RPC requests
    if (method !== "POST") {
      return createJSONResponse(
        { 
          jsonrpc: "2.0", 
          id: null, 
          error: { 
            code: ErrorCodes.INVALID_REQUEST, 
            message: "Method not allowed" 
          } 
        },
        405,
        corsHeaders
      );
    }

    // Parse and validate body
    let body: unknown;
    try {
      body = safeJsonParse(await request.text());
    } catch (error) {
      if (error instanceof MCPErrorException) {
        return createJSONResponse(error.toJSON(null), 400, corsHeaders);
      }
      return createJSONResponse(
        { 
          jsonrpc: "2.0", 
          id: null, 
          error: { 
            code: ErrorCodes.PARSE_ERROR, 
            message: String(error) 
          } 
        },
        400,
        corsHeaders
      );
    }

    // Handle batch requests
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return createJSONResponse(
          { 
            jsonrpc: "2.0", 
            id: null, 
            error: { 
              code: ErrorCodes.INVALID_REQUEST, 
              message: "Batch request cannot be empty" 
            } 
          },
          400,
          corsHeaders
        );
      }

      const responses: MCPResponse[] = [];
      let newSessionId: string | undefined;
      const sessionId = request.headers.get("Mcp-Session-Id");

      for (const reqBody of body) {
        try {
          const validatedReq = validateJsonRpcRequest(reqBody);
          
          // For batch requests, only the first initialize creates a session
          if (validatedReq.method === "initialize" && !newSessionId) {
            const result = await handleMCPRequest(validatedReq, env);
            newSessionId = result.newSessionId;
            responses.push(result.response);
          } else {
            // Validate session for non-initialization requests
            if (sessionId && !sessionManager.isValid(sessionId)) {
              responses.push({
                jsonrpc: "2.0",
                id: validatedReq.id,
                error: { 
                  code: ErrorCodes.SESSION_NOT_FOUND, 
                  message: "Session not found" 
                },
              });
            } else {
              const { response } = await handleMCPRequest(validatedReq, env);
              responses.push(response);
            }
          }
        } catch (error) {
          if (error instanceof MCPErrorException) {
            responses.push(error.toJSON((reqBody as { id?: string | number }).id ?? null));
          } else {
            responses.push({
              jsonrpc: "2.0",
              id: (reqBody as { id?: string | number }).id ?? null,
              error: { 
                code: ErrorCodes.INTERNAL_ERROR, 
                message: String(error) 
              },
            });
          }
        }
      }

      const headers: Record<string, string> = { ...corsHeaders };
      if (newSessionId) {
        headers["Mcp-Session-Id"] = newSessionId;
      } else if (sessionId && sessionManager.isValid(sessionId)) {
        headers["Mcp-Session-Id"] = sessionId;
      }

      return createJSONResponse(responses, 200, headers);
    }

    // Single request
    try {
      const validatedReq = validateJsonRpcRequest(body);
      const isInitialization = validatedReq.method === "initialize";
      const sessionId = request.headers.get("Mcp-Session-Id");
      
      // Validate session for non-initialization requests
      if (!isInitialization && sessionId && !sessionManager.isValid(sessionId)) {
        return createJSONResponse(
          { 
            jsonrpc: "2.0", 
            id: validatedReq.id, 
            error: { 
              code: ErrorCodes.SESSION_NOT_FOUND, 
              message: "Session not found" 
            } 
          },
          404,
          corsHeaders
        );
      }

      const { response, newSessionId } = await handleMCPRequest(validatedReq, env);

      const headers: Record<string, string> = { ...corsHeaders };
      
      if (newSessionId) {
        headers["Mcp-Session-Id"] = newSessionId;
      } else if (sessionId && sessionManager.isValid(sessionId)) {
        headers["Mcp-Session-Id"] = sessionId;
      }

      return createJSONResponse(response, 200, headers);

    } catch (error) {
      if (error instanceof MCPErrorException) {
        const id = (body as { id?: string | number }).id ?? null;
        return createJSONResponse(error.toJSON(id), 400, corsHeaders);
      }
      
      return createJSONResponse(
        {
          jsonrpc: "2.0",
          id: (body as { id?: string | number }).id ?? null,
          error: { 
            code: ErrorCodes.INTERNAL_ERROR, 
            message: String(error) 
          },
        },
        500,
        corsHeaders
      );
    }
  },
};
