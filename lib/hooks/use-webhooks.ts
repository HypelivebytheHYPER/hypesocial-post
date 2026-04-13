/**
 * Webhook Hooks
 * @module lib/hooks/use-webhooks
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { pfmKeys } from "./keys";
import { TIME, PAGINATION } from "@/lib/constants";
import {
  WebhookDtoSchema,
  WebhookListResponseSchema,
  CreateWebhookRequestSchema,
  UpdateWebhookRequestSchema,
  type WebhookDto,
  type CreateWebhookRequest,
  type UpdateWebhookRequest,
} from "@/lib/validations/webhook-api-schemas";
import type { PostForMeEventType } from "@/lib/validations/webhook-schemas";

// ==================== Types ====================

interface WebhooksFilter {
  url?: string[];
  event_type?: PostForMeEventType[];
  id?: string[];
  offset?: number;
  limit?: number;
}

// ==================== Queries ====================

/**
 * Get all webhooks with optional filtering
 * Returns unwrapped array from { data: [...], meta: {...} }
 */
export function useWebhooks(
  filters?: WebhooksFilter,
  options?: Omit<UseQueryOptions<WebhookDto[], Error>, "queryKey" | "queryFn">
) {
  return useQuery<WebhookDto[], Error>({
    // TanStack Query handles key serialization internally - no useMemo needed
    queryKey: [
      ...pfmKeys.webhooks(),
      filters?.limit ?? PAGINATION.DEFAULT_LIMIT,
      filters?.event_type?.join(",") ?? null,
      filters?.offset ?? 0,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (filters?.offset != null)
        searchParams.set("offset", filters.offset.toString());
      if (filters?.limit != null)
        searchParams.set("limit", filters.limit.toString());
      filters?.url?.forEach((u) => searchParams.append("url", u));
      filters?.event_type?.forEach((e) => searchParams.append("event_type", e));
      filters?.id?.forEach((i) => searchParams.append("id", i));

      const query = searchParams.toString();
      const response = await apiClient<unknown>(
        `/api/webhooks${query ? `?${query}` : ""}`
      );
      
      // Validate full response and unwrap data
      const validated = WebhookListResponseSchema.parse(response);
      return validated.data;
    },
    // Show cached data immediately while fetching
    placeholderData: (previousData) => previousData,
    staleTime: TIME.MINUTE * 2,
    gcTime: TIME.MINUTE * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false, // Webhooks change rarely
    ...options,
  });
}

/**
 * Get single webhook by ID
 */
export function useWebhook(id: string) {
  return useQuery<WebhookDto, Error>({
    queryKey: pfmKeys.webhook(id),
    queryFn: async () => {
      const data = await apiClient<unknown>(`/api/webhooks/${id}`);
      return WebhookDtoSchema.parse(data);
    },
    enabled: !!id,
    placeholderData: (previousData) => previousData,
  });
}

// ==================== Mutations ====================

/**
 * Create webhook mutation
 */
export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation<WebhookDto, Error, CreateWebhookRequest>({
    mutationFn: async (input) => {
      // Validate input with Zod before sending
      const validated = CreateWebhookRequestSchema.parse(input);
      const data = await apiClient<unknown>("/api/webhooks", {
        method: "POST",
        body: JSON.stringify(validated),
      });
      return WebhookDtoSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.webhooks() });
    },
  });
}

/**
 * Update webhook mutation
 */
export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation<WebhookDto, Error, { id: string; updates: UpdateWebhookRequest }>({
    mutationFn: async ({ id, updates }) => {
      // Validate input with Zod before sending
      const validated = UpdateWebhookRequestSchema.parse(updates);
      const data = await apiClient<unknown>(`/api/webhooks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(validated),
      });
      return WebhookDtoSchema.parse(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.webhooks() });
      queryClient.invalidateQueries({ queryKey: pfmKeys.webhook(variables.id) });
    },
  });
}

/**
 * Delete webhook mutation
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id) => {
      const data = await apiClient<unknown>(`/api/webhooks/${id}`, {
        method: "DELETE",
      });
      // Validate response
      if (typeof data === "object" && data !== null && "success" in data) {
        return { success: Boolean(data.success) };
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.webhooks() });
    },
  });
}
