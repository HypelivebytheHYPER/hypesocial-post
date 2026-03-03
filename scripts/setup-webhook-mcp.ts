#!/usr/bin/env tsx
/**
 * Setup webhook using MCP or direct API
 * This script registers the webhook with your public URL
 */

const API_BASE = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;
if (!API_KEY) {
  console.error("Error: POST_FOR_ME_API_KEY environment variable is required");
  process.exit(1);
}

// All 6 official webhook events
const ALL_EVENTS = [
  "social.post.created",
  "social.post.updated",
  "social.post.deleted",
  "social.post.result.created",
  "social.account.created",
  "social.account.updated",
] as const;

async function setupWebhook() {
  // Get public URL from args or environment
  const args = process.argv.slice(2);
  const urlFlag = args.find((arg) => arg.startsWith("--url="));
  const ngrokFlag = args.find((arg) => arg.startsWith("--ngrok="));

  let webhookUrl: string;

  if (ngrokFlag) {
    const ngrokUrl = ngrokFlag.split("=")[1];
    webhookUrl = `${ngrokUrl}/api/webhooks/post-for-me`;
  } else if (urlFlag) {
    const customUrl = urlFlag.split("=")[1];
    webhookUrl = `${customUrl}/api/webhooks/post-for-me`;
  } else {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    webhookUrl = `${appUrl}/api/webhooks/post-for-me`;
  }

  console.log("=".repeat(60));
  console.log("Setting up Post For Me Webhook");
  console.log("=".repeat(60));
  console.log("\n📋 Webhook URL Standards:");
  console.log("  Format: api.{domain}/webhooks/{service}");
  console.log("  Example: api.hypelive.app/webhooks/post-for-me");
  console.log(`\n🎯 Your Webhook URL: ${webhookUrl}`);
  console.log(`Events: ${ALL_EVENTS.join(", ")}`);

  try {
    // Check if webhook already exists
    const listRes = await fetch(
      `${API_BASE}/v1/webhooks?url=${encodeURIComponent(webhookUrl)}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!listRes.ok) {
      throw new Error(`Failed to list webhooks: ${listRes.status}`);
    }

    const existing = await listRes.json();

    if (existing.data?.length > 0) {
      console.log("\n⚠️  Webhook already registered:");
      console.log(`  ID: ${existing.data[0].id}`);
      console.log(`  URL: ${existing.data[0].url}`);
      console.log(`  Events: ${existing.data[0].event_types?.join(", ")}`);
      console.log("\nTo update, delete it first or use a different URL.");
      return;
    }

    // Create new webhook
    console.log("\n📝 Registering new webhook...");
    const createRes = await fetch(`${API_BASE}/v1/webhooks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        event_types: ALL_EVENTS,
      }),
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      throw new Error(`Failed to create webhook: ${createRes.status} - ${error}`);
    }

    const webhook = await createRes.json();

    console.log("\n✅ Webhook registered successfully!");
    console.log(`  ID: ${webhook.id}`);
    console.log(`  Secret: ${webhook.secret}`);
    console.log(`  URL: ${webhook.url}`);
    console.log(`\n🔐 Add this to your .env.local:`);
    console.log(`  POST_FOR_ME_WEBHOOK_SECRET=${webhook.secret}`);
    console.log(`\n📡 Your app will now receive real-time events at:`);
    console.log(`  ${webhookUrl}`);
    console.log("\nEvents received:");
    console.log("  - social.post.created");
    console.log("  - social.post.updated");
    console.log("  - social.post.deleted");
    console.log("  - social.post.result.created ← Posted to platform!");
    console.log("  - social.account.created");
    console.log("  - social.account.updated");
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

setupWebhook();
