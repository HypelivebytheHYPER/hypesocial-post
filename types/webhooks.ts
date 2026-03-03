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
  WebhookDto,
  WebhookListResponse,
} from "@/lib/validations/webhooks";

// Legacy aliases
export type PostForMeWebhook = import("@/lib/validations/webhooks").WebhookDto;
export type PostForMeWebhookListResponse =
  import("@/lib/validations/webhooks").WebhookListResponse;

export type { CreateWebhookDto, UpdateWebhookDto } from "@/lib/validations/webhooks";
