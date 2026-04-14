/**
 * Canva Connect API Client
 *
 * Server-side only client for the Canva REST API.
 * Tokens are stored in encrypted HTTP-only cookies.
 */

import { EncryptJWT, jwtDecrypt, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";
import type { CanvaTokenResponse } from "@/lib/validations/canva";

// ==================== Config ====================

export class CanvaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanvaConfigError";
  }
}

export function isCanvaConfigured(): boolean {
  return !!(
    process.env.CANVA_CLIENT_ID &&
    process.env.CANVA_CLIENT_SECRET &&
    process.env.CANVA_COOKIE_SECRET
  );
}

function getConfig() {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  const cookieSecret = process.env.CANVA_COOKIE_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!clientId) throw new CanvaConfigError("CANVA_CLIENT_ID is not set");
  if (!clientSecret) throw new CanvaConfigError("CANVA_CLIENT_SECRET is not set");
  if (!cookieSecret) throw new CanvaConfigError("CANVA_COOKIE_SECRET is not set");

  return {
    clientId,
    clientSecret,
    cookieSecret,
    apiBaseUrl: "https://api.canva.com/rest",
    oauthBaseUrl: "https://api.canva.com/rest/v1/oauth",
    redirectUri: `${baseUrl}/api/canva/callback`,
  };
}

const COOKIE_NAME = "canva_session";

async function getSecretKey() {
  const { cookieSecret } = getConfig();
  return new TextEncoder().encode(cookieSecret.slice(0, 32).padEnd(32, "0"));
}

// ==================== Cookie Encryption ====================

export interface CanvaSession extends JWTPayload {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
}

export async function encryptSession(session: CanvaSession): Promise<string> {
  const secret = await getSecretKey();
  const jwt = await new EncryptJWT(session)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(secret);
  return jwt;
}

export async function decryptSession(token: string): Promise<CanvaSession | null> {
  try {
    const secret = await getSecretKey();
    const { payload } = await jwtDecrypt(token, secret);
    return payload as CanvaSession;
  } catch {
    return null;
  }
}

export async function setCanvaCookie(session: CanvaSession) {
  const encrypted = await encryptSession(session);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getCanvaSession(): Promise<CanvaSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function clearCanvaCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ==================== OAuth ====================

export function generatePKCE() {
  const codeVerifier = crypto.randomBytes(96).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function buildCanvaAuthUrl(state: string, codeChallenge: string): string {
  const { clientId, redirectUri } = getConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "asset:read asset:write design:content:read design:content:write design:meta:read brandtemplate:meta:read brandtemplate:content:read autofill:read autofill:write folder:read folder:write",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://www.canva.com/api/oauth/authorize?${params.toString()}`;
}

export async function exchangeCanvaCode(code: string, codeVerifier: string): Promise<CanvaTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getConfig();

  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Canva token exchange failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as CanvaTokenResponse;
  return data;
}

export async function refreshCanvaToken(refreshToken: string): Promise<CanvaTokenResponse> {
  const { clientId, clientSecret } = getConfig();

  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Canva token refresh failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as CanvaTokenResponse;
  return data;
}

// ==================== API Client ====================

class CanvaAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "CanvaAPIError";
  }
}

async function canvaFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const session = await getCanvaSession();
  if (!session) {
    throw new CanvaAPIError("Canva session not found", 401);
  }

  let accessToken = session.access_token;

  // Refresh if expired (with 60s buffer)
  if (session.expires_at && Date.now() >= session.expires_at - 60_000 && session.refresh_token) {
    const refreshed = await refreshCanvaToken(session.refresh_token);
    const newSession: CanvaSession = {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token || session.refresh_token,
      scope: refreshed.scope,
      expires_at: refreshed.expires_in ? Date.now() + refreshed.expires_in * 1000 : undefined,
    };
    await setCanvaCookie(newSession);
    accessToken = refreshed.access_token;
  }

  const { apiBaseUrl } = getConfig();
  const url = endpoint.startsWith("http") ? endpoint : `${apiBaseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new CanvaAPIError(
      body?.message || `Canva API error: ${response.statusText}`,
      response.status,
      body,
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ==================== Exported API Methods ====================

export async function listCanvaDesigns(params?: {
  continuation?: string;
  limit?: number;
  sort_by?: string;
}): Promise<unknown> {
  const searchParams = new URLSearchParams();
  if (params?.continuation) searchParams.set("continuation", params.continuation);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sort_by) searchParams.set("sort_by", params.sort_by);

  const query = searchParams.toString();
  return canvaFetch(`/v1/designs${query ? `?${query}` : ""}`);
}

export async function getCanvaDesign(designId: string): Promise<unknown> {
  return canvaFetch(`/v1/designs/${designId}`);
}

export async function exportCanvaDesign(designId: string, body: unknown): Promise<unknown> {
  return canvaFetch(`/v1/designs/${designId}/exports`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listCanvaBrandTemplates(params?: {
  continuation?: string;
  limit?: number;
  query?: string;
}): Promise<unknown> {
  const searchParams = new URLSearchParams();
  if (params?.continuation) searchParams.set("continuation", params.continuation);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.query) searchParams.set("query", params.query);

  const query = searchParams.toString();
  return canvaFetch(`/v1/brand-templates${query ? `?${query}` : ""}`);
}

export async function createAutofillJob(body: unknown): Promise<unknown> {
  return canvaFetch(`/v1/autofills`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getAutofillJob(jobId: string): Promise<unknown> {
  return canvaFetch(`/v1/autofills/${jobId}`);
}

export async function getBrandTemplateDataset(brandTemplateId: string): Promise<unknown> {
  return canvaFetch(`/v1/brand-templates/${brandTemplateId}/dataset`);
}

export async function createExportJob(designId: string, body: unknown): Promise<unknown> {
  return canvaFetch(`/v1/designs/${designId}/exports`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getExportJob(exportId: string): Promise<unknown> {
  return canvaFetch(`/v1/exports/${exportId}`);
}

export async function createResizeJob(body: unknown): Promise<unknown> {
  return canvaFetch(`/v1/resizes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getResizeJob(jobId: string): Promise<unknown> {
  return canvaFetch(`/v1/resizes/${jobId}`);
}

export async function createUrlAssetUploadJob(body: unknown): Promise<unknown> {
  return canvaFetch(`/v1/url-asset-uploads`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getUrlAssetUploadJob(jobId: string): Promise<unknown> {
  return canvaFetch(`/v1/url-asset-uploads/${jobId}`);
}

// ==================== Folders ====================

export async function searchCanvaFolders(params?: {
  query?: string;
  parent_folder_id?: string;
  continuation?: string;
  limit?: number;
}): Promise<unknown> {
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.set("query", params.query);
  if (params?.parent_folder_id) searchParams.set("parent_folder_id", params.parent_folder_id);
  if (params?.continuation) searchParams.set("continuation", params.continuation);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return canvaFetch(`/v1/folders${query ? `?${query}` : ""}`);
}

export async function createCanvaFolder(body: { name: string; parent_folder_id?: string }): Promise<unknown> {
  return canvaFetch(`/v1/folders`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listCanvaFolderItems(folderId: string, params?: {
  continuation?: string;
  limit?: number;
}): Promise<unknown> {
  const searchParams = new URLSearchParams();
  if (params?.continuation) searchParams.set("continuation", params.continuation);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return canvaFetch(`/v1/folders/${folderId}/items${query ? `?${query}` : ""}`);
}

export async function moveCanvaItemToFolder(folderId: string, body: { item_type: string; item_id: string }): Promise<unknown> {
  return canvaFetch(`/v1/folders/${folderId}/items`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export { CanvaAPIError };
