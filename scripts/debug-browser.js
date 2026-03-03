#!/usr/bin/env node
/**
 * Debug browser errors on posts/new page
 */

const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Launching browser with DevTools...\n');

  const browser = await chromium.launch({
    headless: false,
    devtools: true,
    args: ['--window-size=1400,900']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 800 },
    recordVideo: { dir: 'test-results/videos/' }
  });

  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`\n❌ CONSOLE ERROR: ${text}`);
    } else if (type === 'warning') {
      console.log(`\n⚠️  CONSOLE WARN: ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`\n💥 PAGE ERROR: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  });

  // Capture network failures
  page.on('requestfailed', request => {
    console.log(`\n🌐 NETWORK FAILED: ${request.method()} ${request.url()}`);
    console.log(`   Error: ${request.failure()?.errorText}`);
  });

  // Navigate to page
  console.log('Navigating to http://localhost:3000/posts/new...');
  await page.goto('http://localhost:3000/posts/new');

  console.log('\n✅ Page loaded. Watch the browser window for errors.');
  console.log('DevTools is open. Try uploading a video and watch the console.\n');

  // Keep browser open
  await new Promise(() => {});
})();
