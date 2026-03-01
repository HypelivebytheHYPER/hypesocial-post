"use server";

import {
  PostForMeWebhook,
  PostForMeWebhookListResponse,
  PostForMeEventType,
} from "@/types/webhooks";

const API_BASE = process.env.POSTFORME_API_URL || "https://api.post-for-me.com";
const API_KEY = process.env.POSTFORME_API_KEY;

/**
 * Post For Me Webhook Management Actions
 * https://api.postforme.dev/docs/webhooks
 */

// API client helper
async function pfmApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_KEY) {
    throw new Error("POSTFORME_API_KEY is not configured");
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Post For Me API error: ${response.status} ${response.statusText} - ${error}`,
    );
  }

  return response.json();
}

/**
 * Get all webhooks with optional filtering
 */
export async function getWebhooks(params?: {
  offset?: number;
  limit?: number;
  url?: string[];
  event_type?: PostForMeEventType[];
  id?: string[];
}): Promise<PostForMeWebhookListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  params?.url?.forEach((u) => searchParams.append("url", u));
  params?.event_type?.forEach((e) => searchParams.append("event_type", e));
  params?.id?.forEach((i) => searchParams.append("id", i));

  const query = searchParams.toString();
  return pfmApi<PostForMeWebhookListResponse>(
    `/v1/webhooks${query ? `?${query}` : ""}`,
  );
}

/**
 * Get a single webhook by ID
 */
export async function getWebhook(id: string): Promise<PostForMeWebhook> {
  return pfmApi<PostForMeWebhook>(`/v1/webhooks/${id}`);
}

/**
 * Create a new webhook
 * Returns the webhook with its secret for verification
 */
export async function createWebhook(
  url: string,
  eventTypes: PostForMeEventType[],
): Promise<PostForMeWebhook> {
  return pfmApi<PostForMeWebhook>("/v1/webhooks", {
    method: "POST",
    body: JSON.stringify({
      url,
      event_types: eventTypes,
    }),
  });
}

/**
 * Update an existing webhook
 */
export async function updateWebhook(
  id: string,
  updates: {
    url?: string;
    event_types?: PostForMeEventType[];
  },
): Promise<PostForMeWebhook> {
  return pfmApi<PostForMeWebhook>(`/v1/webhooks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(id: string): Promise<{ success: boolean }> {
  return pfmApi<{ success: boolean }>(`/v1/webhooks/${id}`, {
    method: "DELETE",
  });
}

/**
 * Register the app webhook with Post For Me
 * Uses NEXT_PUBLIC_APP_URL to construct webhook URL
 */
export async function registerAppWebhook(
  eventTypes: PostForMeEventType[] = [
    "social.post.created",
    "social.post.updated",
    "social.post.result.created",
    "social.account.created",
    "social.account.updated",
  ],
): Promise<PostForMeWebhook> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${appUrl}/api/webhooks/post-for-me`;

  // Check if webhook already exists
  const existing = await getWebhooks({ url: [webhookUrl] });
  if (existing.data.length > 0) {
    console.log("[Webhook] Webhook already exists:", existing.data[0].id);
    return existing.data[0];
  }

  // Create new webhook
  const webhook = await createWebhook(webhookUrl, eventTypes);
  console.log("[Webhook] Created new webhook:", webhook.id);

  // TODO: Store webhook.secret in environment or database
  // This is needed to verify incoming webhooks

  return webhook;
}

/**
 * Setup webhook for development (ngrok tunnel)
 * Call this when using ngrok to expose localhost
 */
export async function setupDevWebhook(
  ngrokUrl: string,
): Promise<PostForMeWebhook> {
  const webhookUrl = `${ngrokUrl}/api/webhooks/post-for-me`;

  return createWebhook(webhookUrl, [
    "social.post.created",
    "social.post.updated",
    "social.post.result.created",
    "social.account.created",
    "social.account.updated",
  ]);
}
