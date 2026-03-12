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
  WebhookDtoSchema,
  WebhookListResponseSchema,
} from "@/lib/validations/webhook-schemas";

export type {
  PostForMeEventType,
  PostCreatedData,
  PostUpdatedData,
  PostDeletedData,
  PostResultCreatedData,
  AccountCreatedData,
  AccountUpdatedData,
  PostForMeWebhookPayload,
  WebhookDto,
  WebhookListResponse,
} from "@/lib/validations/webhook-schemas";

// Legacy aliases
export type PostForMeWebhook =
  import("@/lib/validations/webhook-schemas").WebhookDto;
export type PostForMeWebhookListResponse =
  import("@/lib/validations/webhook-schemas").WebhookListResponse;

export type {
  CreateWebhookDto,
  UpdateWebhookDto,
} from "@/lib/validations/webhook-schemas";
