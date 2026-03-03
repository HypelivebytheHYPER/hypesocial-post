#!/usr/bin/env tsx
/**
 * Cloudflare MCP Setup Helper
 * Creates HTTP remote configuration for Cloudflare management
 */

import * as fs from "fs";
import * as path from "path";

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

async function setupCloudflareMcp() {
  console.log("=".repeat(60));
  console.log("Cloudflare MCP HTTP Remote Setup");
  console.log("=".repeat(60));

  // Check for credentials
  if (!CF_API_TOKEN) {
    console.log("\n❌ CLOUDFLARE_API_TOKEN not set");
    console.log("\nGet your API token from:");
    console.log("  https://dash.cloudflare.com/profile/api-tokens");
    console.log("\nRequired permissions:");
    console.log("  - Zone:Read");
    console.log("  - DNS:Edit");
    console.log("  - Workers Scripts:Edit");
    console.log("  - Account:Read");
    process.exit(1);
  }

  // Test API access
  console.log("\n🔑 Testing Cloudflare API access...");
  const userRes = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!userRes.ok) {
    console.error("❌ Invalid API token");
    process.exit(1);
  }

  const userData = await userRes.json();
  console.log("  ✅ API token valid");

  // Get zones (domains)
  console.log("\n📋 Fetching zones (domains)...");
  const zonesRes = await fetch("https://api.cloudflare.com/client/v4/zones", {
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  const zonesData = await zonesRes.json();

  if (!zonesData.success || zonesData.result.length === 0) {
    console.log("❌ No zones found");
    process.exit(1);
  }

  console.log("\nAvailable domains:");
  zonesData.result.forEach((zone: any, i: number) => {
    console.log(`  ${i + 1}. ${zone.name} (ID: ${zone.id})`);
  });

  // Get accounts
  console.log("\n🏢 Fetching accounts...");
  const accountsRes = await fetch("https://api.cloudflare.com/client/v4/accounts", {
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  const accountsData = await accountsRes.json();

  if (accountsData.success && accountsData.result.length > 0) {
    console.log("\nAvailable accounts:");
    accountsData.result.forEach((acc: any, i: number) => {
      console.log(`  ${i + 1}. ${acc.name} (ID: ${acc.id})`);
    });
  }

  // Generate MCP config
  console.log("\n" + "=".repeat(60));
  console.log("Generated MCP Configuration");
  console.log("=".repeat(60));

  const mcpConfig = {
    mcpServers: {
      cloudflare: {
        type: "http",
        url: `https://api.cloudflare.com/client/v4`,
        headers: {
          "Authorization": `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        env: {
          CLOUDFLARE_API_TOKEN: CF_API_TOKEN,
          CLOUDFLARE_ACCOUNT_ID: CF_ACCOUNT_ID || accountsData.result[0]?.id,
          CLOUDFLARE_ZONE_ID: CF_ZONE_ID || zonesData.result[0]?.id,
        }
      }
    }
  };

  console.log("\nAdd this to ~/.claude/mcp.json:\n");
  console.log(JSON.stringify(mcpConfig, null, 2));

  // Save to env file
  const envPath = path.join(process.cwd(), ".env.local");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

  if (!envContent.includes("CLOUDFLARE_API_TOKEN")) {
    envContent += `\n# Cloudflare\nCLOUDFLARE_API_TOKEN=${CF_API_TOKEN}\n`;
    if (CF_ACCOUNT_ID) envContent += `CLOUDFLARE_ACCOUNT_ID=${CF_ACCOUNT_ID}\n`;
    if (CF_ZONE_ID) envContent += `CLOUDFLARE_ZONE_ID=${CF_ZONE_ID}\n`;

    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Updated ${envPath}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Next Steps:");
  console.log("=".repeat(60));
  console.log("1. Add the MCP config to ~/.claude/mcp.json");
  console.log("2. Restart Claude Code");
  console.log("3. Use the cloudflare MCP to manage your domain");
  console.log("\nExample commands after setup:");
  console.log("  - List DNS records");
  console.log("  - Create subdomain for webhook");
  console.log("  - Deploy worker");
  console.log("  - Configure custom domain");
}

setupCloudflareMcp().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
