"use client";

import { useEffect } from "react";
import { useRegisterAppWebhook } from "@/lib/hooks/usePostForMe";

/**
 * Webhook Registration Component
 * Automatically registers app webhooks on startup if not already registered.
 * The register() function is stable and internally guards against duplicate attempts
 * via `attempted.current`. It safely no-ops while the webhook list query is loading
 * and retries once the data is ready.
 *
 * Docs: https://www.postforme.dev/resources/webhooks
 * Subscribes to all 6 Post For Me event types (default from useRegisterAppWebhook).
 */
export function WebhookRegistration() {
  const { register } = useRegisterAppWebhook();

  useEffect(() => {
    // Called on mount AND when register() identity changes (after query loads).
    // register() internally guards against duplicate calls via attempted.current.
    register().catch((error) => {
      // Silently fail - webhook registration is non-critical
      // App will fall back to polling for updates
      console.log("[Webhook] Registration skipped:", error?.message);
    });
  }, [register]);

  // This component renders nothing
  return null;
}
