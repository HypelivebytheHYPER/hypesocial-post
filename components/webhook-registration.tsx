"use client";

import { useEffect } from "react";
import { useRegisterAppWebhook } from "@/lib/hooks/usePostForMe";

/**
 * Webhook Registration Component
 * Automatically registers app webhooks on startup if not already registered
 *
 * Docs: https://www.postforme.dev/resources/webhooks
 * Registered Events:
 * - social.post.result.created - Track post publishing results per platform
 * - social.post.updated - Track post status changes (scheduled -> processing -> published)
 * - social.account.updated - Track account status changes (connected/disconnected)
 */
export function WebhookRegistration() {
  const { register } = useRegisterAppWebhook();

  useEffect(() => {
    // Register webhooks on app startup
    // This is idempotent - checks if webhook already exists before creating
    register([
      "social.post.result.created",
      "social.post.updated",
      "social.account.updated",
    ]).catch((error) => {
      // Silently fail - webhook registration is non-critical
      // App will fall back to polling for updates
      console.log("[Webhook] Registration skipped:", error.message);
    });
  }, [register]);

  // This component renders nothing
  return null;
}
