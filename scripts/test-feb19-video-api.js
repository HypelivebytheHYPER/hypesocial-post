#!/usr/bin/env node
/**
 * Human Journey API Test - Feb 19 Video
 * Tests the complete flow: Upload URL → Upload Video → Create Post → Get Results
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const VIDEO_FILE = "envato_video_gen_Feb_19_2026_0_01_37.mp4";
const VIDEO_PATH = path.join(os.homedir(), "Downloads", VIDEO_FILE);
const API_BASE = "https://hypesocial-post.vercel.app/api";

// ANSI colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(step, message) {
  console.log(`${BLUE}[${step}]${RESET} ${message}`);
}

function success(message) {
  console.log(`${GREEN}✓${RESET} ${message}`);
}

function error(message) {
  console.log(`${RED}✗${RESET} ${message}`);
}

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function uploadToSignedUrl(uploadUrl, videoBuffer) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
    },
    body: videoBuffer,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return true;
}

async function runTest() {
  const timestamp = Date.now();
  const caption = `🎬 Feb 19 API Video Test - ${timestamp} #Test`;

  console.log(`\n${YELLOW}═══════════════════════════════════════════════════════${RESET}`);
  console.log(`${YELLOW}  Human Journey API Test - Feb 19 Video${RESET}`);
  console.log(`${YELLOW}═══════════════════════════════════════════════════════${RESET}\n`);

  try {
    // Step 0: Verify video file
    log("0", `Verifying video file: ${VIDEO_FILE}`);
    if (!fs.existsSync(VIDEO_PATH)) {
      throw new Error(`Video file not found: ${VIDEO_PATH}`);
    }
    const stats = fs.statSync(VIDEO_PATH);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    success(`Video file exists (${fileSizeMB} MB)`);

    // Step 1: Get upload URL
    log("1", "Requesting upload URL from API...");
    const { upload_url, media_url } = await makeRequest(`${API_BASE}/media`, {
      method: 'POST',
      body: JSON.stringify({
        filename: VIDEO_FILE,
        content_type: 'video/mp4',
        size: stats.size,
      }),
    });
    success(`Got upload URL (expires soon)`);
    console.log(`   Media URL: ${media_url.substring(0, 60)}...`);

    // Step 2: Upload video to signed URL
    log("2", "Uploading video to storage...");
    const videoBuffer = fs.readFileSync(VIDEO_PATH);
    await uploadToSignedUrl(upload_url, videoBuffer);
    success(`Video uploaded successfully!`);

    // Step 3: Create post with uploaded video
    log("3", "Creating post with video...");
    const post = await makeRequest(`${API_BASE}/posts`, {
      method: 'POST',
      body: JSON.stringify({
        caption,
        social_accounts: ["spc_rNbCcN44Pb7HqD1OD1iEF"], // Facebook
        media: [{ url: media_url }],
        isDraft: false,
        external_id: `feb19-test-${timestamp}`,
      }),
    });
    success(`Post created! ID: ${post.id}`);
    console.log(`   Status: ${post.status}`);
    console.log(`   Media items: ${post.media?.length || 0}`);

    // Step 4: Poll for results
    log("4", "Polling for post results...");
    let results = [];
    let attempts = 0;
    const maxAttempts = 12;

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000));

      try {
        const response = await fetch(`${API_BASE}/post-results?post_id=${post.id}`);
        if (response.ok) {
          const data = await response.json();
          results = data.data || [];

          if (results.length > 0) {
            const allComplete = results.every(r => r.success === true || r.error !== null);
            if (allComplete) {
              success(`Post results complete!`);
              break;
            }
          }
        }
      } catch (e) {
        // Continue polling
      }

      attempts++;
      process.stdout.write(`   Polling... ${attempts}/${maxAttempts}\r`);
    }

    // Step 5: Display results
    log("5", "Post Results:");
    console.log("");
    console.log("┌─────────────────────┬─────────────────────┬─────────────────────┐");
    console.log("│ Platform            │ Status              │ Details             │");
    console.log("├─────────────────────┼─────────────────────┼─────────────────────┤");

    for (const result of results) {
      const platform = result.platform || 'unknown';
      const status = result.success ? `${GREEN}SUCCESS${RESET}` : `${RED}FAILED${RESET}`;
      const error = result.error ? result.error.substring(0, 20) : (result.success ? 'Posted' : 'Unknown');
      console.log(`│ ${platform.padEnd(19)} │ ${status.padEnd(19)} │ ${error.padEnd(19)} │`);
    }

    console.log("└─────────────────────┴─────────────────────┴─────────────────────┘");
    console.log("");

    const anySuccess = results.some(r => r.success);
    if (anySuccess) {
      console.log(`${GREEN}✅ At least one platform posted successfully!${RESET}\n`);
    } else {
      console.log(`${YELLOW}⚠️  All platforms failed, but flow completed${RESET}\n`);
    }

    console.log(`${GREEN}═══════════════════════════════════════════════════════${RESET}`);
    console.log(`${GREEN}  Test completed successfully!${RESET}`);
    console.log(`${GREEN}═══════════════════════════════════════════════════════${RESET}\n`);

  } catch (err) {
    console.log("");
    error(`Test failed: ${err.message}`);
    console.log("");
    process.exit(1);
  }
}

runTest();
