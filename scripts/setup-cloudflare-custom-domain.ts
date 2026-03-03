#!/usr/bin/env tsx
/**
 * Setup Cloudflare Custom Domain for Webhook Worker
 * Uses API Token to configure api.hypelive.app
 */

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = "0619ecb52e87d3d344645d271da236ee";
const DOMAIN = "hypelive.app";
const SUBDOMAIN = "api";
const WORKER_NAME = "hypesocial-webhook";

async function setupCustomDomain() {
  console.log("=".repeat(60));
  console.log("Cloudflare Custom Domain Setup");
  console.log("=".repeat(60));

  if (!CF_API_TOKEN) {
    console.log("\n❌ CLOUDFLARE_API_TOKEN not set");
    console.log("\nRun this first:");
    console.log("  /Users/mdch/PROJECTS/HypePostSocial/scripts/create-cloudflare-token.sh");
    process.exit(1);
  }

  // Step 1: Verify token
  console.log("\n🔑 Verifying API Token...");
  const verifyRes = await fetch(
    "https://api.cloudflare.com/client/v4/user/tokens/verify",
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!verifyRes.ok) {
    console.error("❌ Invalid API Token");
    process.exit(1);
  }

  console.log("  ✅ Token valid");

  // Step 2: Get Zone ID
  console.log("\n📋 Finding Zone ID for", DOMAIN);
  const zonesRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}`,
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  const zonesData = await zonesRes.json();

  if (!zonesData.success || zonesData.result.length === 0) {
    console.error("❌ Zone not found or no access to", DOMAIN);
    process.exit(1);
  }

  const zoneId = zonesData.result[0].id;
  console.log(`  ✅ Zone ID: ${zoneId}`);

  // Step 3: Check if custom domain already exists
  console.log("\n🔍 Checking existing custom domains...");
  const domainsRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/domains`,
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  const domainsData = await domainsRes.json();

  if (domainsData.success) {
    const existing = domainsData.result?.find(
      (d: any) => d.hostname === `${SUBDOMAIN}.${DOMAIN}`
    );

    if (existing) {
      console.log("  ✅ Custom domain already exists:");
      console.log(`     Hostname: ${existing.hostname}`);
      console.log(`     Service: ${existing.service}`);
      console.log(`     Status: ${existing.status || 'active'}`);
      console.log("\n✨ Setup complete!");
      console.log(`\n🌐 Your webhook URL:`);
      console.log(`   https://${SUBDOMAIN}.${DOMAIN}/webhooks/post-for-me`);
      return;
    }
  }

  // Step 4: Create custom domain
  console.log("\n📝 Creating custom domain...");
  const createRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/domains`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hostname: `${SUBDOMAIN}.${DOMAIN}`,
        service: WORKER_NAME,
        environment: "production",
      }),
    }
  );

  const createData = await createRes.json();

  if (!createData.success) {
    console.error("❌ Failed to create custom domain:");
    console.error(createData.errors?.[0]?.message || "Unknown error");

    if (createData.errors?.[0]?.message?.includes("authentication")) {
      console.log("\n⚠️  Your API Token needs more permissions:");
      console.log("  - Workers Scripts:Edit");
      console.log("  - Zone:Read");
      console.log("  - Account:Read");
    }

    process.exit(1);
  }

  console.log("  ✅ Custom domain created!");
  console.log(`     Hostname: ${createData.result.hostname}`);
  console.log(`     Service: ${createData.result.service}`);

  // Step 5: Check DNS record
  console.log("\n🌐 Checking DNS record...");
  const dnsRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${SUBDOMAIN}.${DOMAIN}`,
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  const dnsData = await dnsRes.json();

  if (dnsData.success && dnsData.result.length > 0) {
    console.log("  ✅ DNS record exists");
  } else {
    console.log("  ℹ️  DNS record will be created automatically by Cloudflare");
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Setup Complete!");
  console.log("=".repeat(60));
  console.log("\n🌐 Your webhook endpoint:");
  console.log(`   https://${SUBDOMAIN}.${DOMAIN}/webhooks/post-for-me`);
  console.log("\n📡 Update your webhook registration:");
  console.log(`   npx tsx scripts/setup-webhook-mcp.ts --url=https://${SUBDOMAIN}.${DOMAIN}`);
  console.log("\n⏰ DNS may take a few minutes to propagate worldwide.");
}

setupCustomDomain().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
