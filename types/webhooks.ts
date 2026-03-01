// Re-export webhook types from Zod validation schemas
// This file exists for backward compatibility
// Use @/lib/validations/webhooks for new code

export {
  PostForMeEventTypeSchema,
  PostCreatedDataSchema,
  PostUpdatedDataSchema,
  PostDeletedDataSchema,
  PostResultCreatedDataSchema,
  AccountCreatedDataSchema,
  AccountUpdatedDataSchema,
  PostForMeWebhookPayloadSchema,
} from "@/lib/validations/webhooks";

export type {
  PostForMeEventType,
  PostCreatedData,
  PostUpdatedData,
  PostDeletedData,
  PostResultCreatedData,
  AccountCreatedData,
  AccountUpdatedData,
  PostForMeWebhookPayload,
} from "@/lib/validations/webhooks";

// Additional types not in Zod schema
export interface WebhookDto {
  id: string;
  url: string;
  secret: string;
  event_types: import("@/lib/validations/webhooks").PostForMeEventType[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateWebhookDto {
  url: string;
  event_types: import("@/lib/validations/webhooks").PostForMeEventType[];
}

export interface UpdateWebhookDto {
  url?: string;
  event_types?: import("@/lib/validations/webhooks").PostForMeEventType[];
}

export interface WebhookListResponse {
  data: WebhookDto[];
  meta: {
    total: number;
    offset: number;
    limit: number;
    next: string | null;
  };
}

export type PostForMeWebhook = WebhookDto;
export type PostForMeWebhookListResponse = WebhookListResponse;
