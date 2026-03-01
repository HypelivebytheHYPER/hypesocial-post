// Post For Me Webhook Types
// https://api.postforme.dev/docs/webhooks
// https://api.postforme.dev/docs#model/webhookdto
// https://api.postforme.dev/docs#model/createwebhookdto
// https://api.postforme.dev/docs#model/updatewebhookdto

export type PostForMeEventType =
  | "social.post.created"
  | "social.post.updated"
  | "social.post.deleted"
  | "social.post.result.created"
  | "social.account.created"
  | "social.account.updated";

export interface PostForMeWebhookPayload {
  event_type: PostForMeEventType;
  data: PostForMeWebhookData;
}

export type PostForMeWebhookData =
  | PostCreatedData
  | PostUpdatedData
  | PostDeletedData
  | PostResultCreatedData
  | AccountCreatedData
  | AccountUpdatedData;

// Post Events
export interface PostCreatedData {
  id: string;
  social_accounts: string[]; // Array of social account IDs
  caption: string;
  media?: { url: string; type?: string }[];
  status: "draft" | "scheduled" | "processing" | "processed" | "failed";
  scheduled_at?: string;
  created_at: string;
  updated_at?: string;
}

// Same as PostCreatedData but triggered on updates
export type PostUpdatedData = PostCreatedData;

export interface PostDeletedData {
  id: string;
  deleted_at: string;
}

export interface PostResultCreatedData {
  post_id: string;
  platform_post_id?: string;
  platform_post_url?: string;
  status: "success" | "failed";
  error_message?: string;
  metrics?: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
  created_at: string;
}

// Account Events
export interface AccountCreatedData {
  id: string;
  platform: string;
  username: string | null;
  profile_photo_url?: string | null;
  status: "connected" | "disconnected";
  created_at: string;
  updated_at?: string;
}

export interface AccountUpdatedData extends AccountCreatedData {
  updated_at: string;
}

// WebhookDto - Official Post For Me API type
// https://api.postforme.dev/docs#model/webhookdto
export interface WebhookDto {
  /** The unique identifier of the webhook */
  id: string;
  /** The public webhook url */
  url: string;
  /** Secret key used to verify webhook post */
  secret: string;
  /** Events that will be sent to the webhook */
  event_types: PostForMeEventType[];
  /** When the webhook was created */
  created_at: string;
  /** When the webhook was last updated */
  updated_at: string;
  /** When the webhook was deleted (null if not deleted) */
  deleted_at: string | null;
}

// CreateWebhookDto - Official Post For Me API type
// https://api.postforme.dev/docs#model/createwebhookdto
export interface CreateWebhookDto {
  /** Public url to receive event data */
  url: string;
  /** List of events the webhook will receive */
  event_types: PostForMeEventType[];
}

// UpdateWebhookDto - Official Post For Me API type
// https://api.postforme.dev/docs#model/updatewebhookdto
export interface UpdateWebhookDto {
  /** Public url to receive event data */
  url?: string;
  /** List of events the webhook will receive */
  event_types?: PostForMeEventType[];
}

// Legacy alias for backward compatibility
export interface PostForMeWebhook {
  id: string;
  url: string;
  secret: string;
  event_types: PostForMeEventType[];
}

export interface PostForMeWebhookListResponse {
  data: WebhookDto[];
  meta: {
    total: number;
    offset: number;
    limit: number;
    next?: string;
  };
}
