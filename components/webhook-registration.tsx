"use client";

import { useEffect, useRef } from "react";
import { useRegisterAppWebhook } from "@/lib/hooks/usePostForMe";

/**
 * Webhook Registration Component
 * Automatically registers app webhooks on startup if not already registered.
 * Uses a ref guard to ensure registration is attempted only once,
 * preventing infinite retry loops on 401/auth errors.
 *
 * Docs: https://www.postforme.dev/resources/webhooks
 * Registered Events:
 * - social.post.result.created - Track post publishing results per platform
 * - social.post.updated - Track post status changes (scheduled -> processing -> published)
 * - social.account.updated - Track account status changes (connected/disconnected)
 */
export function WebhookRegistration() {
  const { register } = useRegisterAppWebhook();
  const hasRun = useRef(false);

  useEffect(() => {
    // Guard: only attempt once per app lifecycle
    if (hasRun.current) return;
    hasRun.current = true;

    register([
      "social.post.result.created",
      "social.post.updated",
      "social.account.updated",
    ]).catch((error) => {
      // Silently fail - webhook registration is non-critical
      // App will fall back to polling for updates
      console.log("[Webhook] Registration skipped:", error?.message);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This component renders nothing
  return null;
}
