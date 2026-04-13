import { getWebhookUrl } from "@/lib/config";
import { WebhookTestClient } from "./WebhookTestClient";

// Server component - gets webhook URL with Vercel auto-detection
export default function WebhookTestPage() {
  const webhookUrl = getWebhookUrl();
  return <WebhookTestClient webhookUrl={webhookUrl} />;
}
