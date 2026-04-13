import { getWebhookUrl } from "@/lib/config";
import { WebhooksClient } from "./WebhooksClient";

// Server component - gets webhook URL with Vercel auto-detection
export default function WebhooksPage() {
  const webhookUrl = getWebhookUrl();
  return <WebhooksClient webhookEndpoint={webhookUrl} />;
}
