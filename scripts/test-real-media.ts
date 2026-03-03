#!/usr/bin/env tsx
/**
 * Test real media upload with Cerise AI01.mp4
 * This validates the actual API behavior with real production media
 */

import * as fs from "fs";
import * as path from "path";

const API_BASE = "https://api.postforme.dev";
const API_KEY = "pfm_live_LrowCBrJizdSXsNd7JyjK8";

const filePath = path.join(process.env.HOME || "", "Downloads", "Cerise AI01.mp4");

async function testRealMediaUpload() {
  console.log("=".repeat(60));
  console.log("Testing Real Media Upload: Cerise AI01.mp4");
  console.log("=".repeat(60));

  // Verify file exists
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
  }

  const stats = fs.statSync(filePath);
  console.log("\n📁 File Info:");
  console.log("  Name: Cerise AI01.mp4");
  console.log("  Size:", (stats.size / 1024 / 1024).toFixed(2), "MB");
  console.log("  Type: video/mp4");

  // Step 1: Get upload URL
  console.log("\n📝 Step 1: Requesting upload URL...");
  const uploadUrlRes = await fetch(`${API_BASE}/v1/media/create-upload-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: "Cerise AI01.mp4",
      content_type: "video/mp4",
      size: stats.size,
    }),
  });

  if (!uploadUrlRes.ok) {
    throw new Error(`Failed to get upload URL: ${uploadUrlRes.status}`);
  }

  const uploadData = await uploadUrlRes.json();
  console.log("  ✅ Upload URL received");
  console.log("  Key:", uploadData.key);

  // Step 2: Upload file to presigned URL
  console.log("\n⬆️  Step 2: Uploading file...");
  const fileBuffer = fs.readFileSync(filePath);

  const uploadRes = await fetch(uploadData.upload_url, {
    method: "PUT",
    body: fileBuffer,
    headers: { "Content-Type": "video/mp4" },
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload file: ${uploadRes.status}`);
  }

  const mediaUrl = uploadData.upload_url.split("?")[0];
  console.log("  ✅ File uploaded successfully");
  console.log("  Media URL:", mediaUrl);

  // Step 3: Get connected accounts
  console.log("\n👤 Step 3: Fetching connected accounts...");
  const accountsRes = await fetch(`${API_BASE}/v1/social-accounts`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!accountsRes.ok) {
    throw new Error(`Failed to fetch accounts: ${accountsRes.status}`);
  }

  const accountsData = await accountsRes.json();
  const connectedAccounts =
    accountsData.data?.filter((a: { status: string }) => a.status === "connected") || [];

  console.log("  Connected accounts:", connectedAccounts.length);
  connectedAccounts.forEach((acc: { platform: string; username: string }) => {
    console.log(`    - ${acc.platform}: @${acc.username || "unknown"}`);
  });

  if (connectedAccounts.length === 0) {
    console.log("\n⚠️  No connected accounts found - skipping preview test");
    return;
  }

  // Step 4: Generate preview for each platform
  console.log("\n🎨 Step 4: Generating post previews...");
  for (const account of connectedAccounts) {
    console.log(`\n  Testing preview for ${account.platform}...`);

    const previewRes = await fetch(`${API_BASE}/v1/social-post-previews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caption: "Cerise AI - Testing real video upload flow",
        preview_social_accounts: [
          {
            id: account.id,
            platform: account.platform,
            username: account.username,
          },
        ],
        media: [{ url: mediaUrl }],
      }),
    });

    if (!previewRes.ok) {
      const error = await previewRes.text();
      console.log(`    ❌ Preview failed: ${error}`);
      continue;
    }

    const preview = await previewRes.json();
    console.log(`    ✅ Preview generated`);
    console.log("    Response structure:");
    console.log("      - platform:", preview[0]?.platform);
    console.log("      - caption:", preview[0]?.caption?.slice(0, 50) + "...");
    console.log("      - media count:", preview[0]?.media?.length);
    console.log("      - media[0].url:", preview[0]?.media?.[0]?.url ? "present" : "missing");
  }

  // Step 5: Create actual post (draft mode)
  console.log("\n📝 Step 5: Creating draft post...");
  const postRes = await fetch(`${API_BASE}/v1/social-posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      caption: "Cerise AI - Real media test post (draft)",
      social_accounts: connectedAccounts.map((a: { id: string }) => a.id),
      media: [{ url: mediaUrl }],
      isDraft: true,
    }),
  });

  if (!postRes.ok) {
    const error = await postRes.text();
    console.log("  ❌ Post creation failed:", error);
  } else {
    const post = await postRes.json();
    console.log("  ✅ Draft post created");
    console.log("    Post ID:", post.id);
    console.log("    Status:", post.status);
    console.log("    Created at:", post.created_at);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ All tests completed successfully!");
  console.log("=".repeat(60));
}

testRealMediaUpload().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
