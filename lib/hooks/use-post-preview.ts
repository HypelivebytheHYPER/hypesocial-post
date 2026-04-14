/**
 * Post Preview Hooks
 * @module lib/hooks/use-post-preview
 * 
 * Generate preview of how posts will look on social platforms.
 * Useful for validating content before publishing.
 * 
 * @example
 * ```tsx
 * const preview = usePostPreview();
 * preview.mutate({
 *   caption: "Hello world",
 *   preview_social_accounts: [{ id: "acc_123", platform: "instagram" }],
 *   media: [{ url: "https://cdn.example.com/image.jpg" }]
 * });
 * ```
 * 
 * @see https://api.postforme.dev/docs#tag/social-post-previews
 */

import { useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

import {
  SocialPostPreview,
  SocialPostPreviewRequest,
} from "@/types/post-for-me-types";
import { PostForMeEventType } from "@/types/webhook-types";
import { getWebhookUrl } from "@/lib/config";

/**
 * Generate post preview mutation
 * API: POST /v1/social-post-previews
 */
export function usePostPreview() {
  return useMutation<
    SocialPostPreview[],
    Error,
    SocialPostPreviewRequest
  >({
    mutationFn: (data) =>
      apiClient<SocialPostPreview[]>("/api/social-post-previews", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// ==================== App Webhook Registration ====================

/**
 * Import from use-webhooks.ts to avoid circular dependency
 * This is imported dynamically within the hook
 */
import { useWebhooks, useCreateWebhook } from "./use-webhooks";

/**
 * Register app webhook helper
 * 
 * Uses a ref to ensure registration is only attempted once per mount,
 * preventing infinite retry loops on auth errors (401).
 * 
 * This hook checks if a webhook for this app URL already exists before
 * attempting to create one.
 */
export function useRegisterAppWebhook() {
  const createWebhook = useCreateWebhook();
  
  // Get webhook URL - works on Vercel without .env.local
  const webhookUrl = getWebhookUrl();
    
  const attempted = useRef(false);

  // Query webhooks filtered by our app URL to check if already registered
  // retry: false prevents TanStack Query from retrying 401 errors
  const { data: existingWebhooks, isLoading: isChecking } = useWebhooks(
    { url: [webhookUrl] },
    { retry: false, staleTime: Infinity },
  );

  const register = useCallback(
    async (eventTypes?: PostForMeEventType[]) => {
      // Only attempt once per app mount
      if (attempted.current) return;

      // Don't mark as attempted until query has loaded
      if (isChecking) return;
      attempted.current = true;

      // Check if webhook already exists
      const exists = existingWebhooks?.some((w) => w.url === webhookUrl);
      if (exists) {
        return existingWebhooks?.find((w) => w.url === webhookUrl);
      }

      return createWebhook.mutateAsync({
        url: webhookUrl,
        event_types: eventTypes || [
          "social.post.created",
          "social.post.updated",
          "social.post.deleted",
          "social.post.result.created",
          "social.account.created",
          "social.account.updated",
        ],
      });
    },
    [existingWebhooks, isChecking, webhookUrl, createWebhook],
  );

  return {
    register,
    isLoading: createWebhook.isPending,
    error: createWebhook.error,
  };
}
