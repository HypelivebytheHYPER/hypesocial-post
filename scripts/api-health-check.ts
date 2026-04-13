#!/usr/bin/env tsx
/**
 * API Health Check Script
 * Tests all API routes and verifies wire logic
 */

import { getBaseUrl } from "../lib/config";

const BASE_URL = process.env.HEALTH_CHECK_URL || getBaseUrl();

interface HealthCheckResult {
  endpoint: string;
  method: string;
  status: "ok" | "warning" | "error" | "skipped";
  statusCode?: number;
  responseTime?: number;
  message: string;
}

const endpoints = [
  // Health
  { path: "/api/health", method: "GET", description: "Health check" },

  // Accounts
  { path: "/api/accounts", method: "GET", description: "List accounts" },
  { path: "/api/accounts/auth-url", method: "POST", description: "Get OAuth URL", body: { platform: "instagram" } },

  // Posts
  { path: "/api/posts", method: "GET", description: "List posts" },

  // Post Results
  { path: "/api/post-results", method: "GET", description: "List post results" },

  // Media
  { path: "/api/media", method: "POST", description: "Create upload URL", body: { filename: "test.jpg", content_type: "image/jpeg", size: 1024 } },

  // Webhooks
  { path: "/api/webhooks", method: "GET", description: "List webhooks" },

  // Events
  { path: "/api/events/verify", method: "GET", description: "Verify event endpoint" },
];

async function checkEndpoint(endpoint: typeof endpoints[0]): Promise<HealthCheckResult> {
  const url = `${BASE_URL}${endpoint.path}`;
  const startTime = Date.now();

  try {
    const options: RequestInit = {
      method: endpoint.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;

    // Determine status based on response
    let status: HealthCheckResult["status"] = "ok";
    let message = "OK";

    if (response.status === 401) {
      status = "warning";
      message = "Authentication required (expected in production)";
    } else if (response.status === 404) {
      status = "warning";
      message = "Not found or no data";
    } else if (response.status >= 500) {
      status = "error";
      message = `Server error: ${response.status}`;
    } else if (!response.ok) {
      status = "warning";
      message = `Unexpected status: ${response.status}`;
    }

    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status,
      statusCode: response.status,
      responseTime,
      message,
    };
  } catch (error) {
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                    API HEALTH CHECK                            ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("");

  const results: HealthCheckResult[] = [];

  for (const endpoint of endpoints) {
    process.stdout.write(`Checking ${endpoint.method} ${endpoint.path}... `);
    const result = await checkEndpoint(endpoint);
    results.push(result);

    const icon = result.status === "ok" ? "✅" : result.status === "warning" ? "⚠️" : "❌";
    console.log(`${icon} ${result.message} (${result.responseTime}ms)`);
  }

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                         SUMMARY                               ");
  console.log("═══════════════════════════════════════════════════════════════");

  const ok = results.filter((r) => r.status === "ok").length;
  const warning = results.filter((r) => r.status === "warning").length;
  const error = results.filter((r) => r.status === "error").length;

  console.log(`✅ OK: ${ok}`);
  console.log(`⚠️  Warning: ${warning}`);
  console.log(`❌ Error: ${error}`);
  console.log("");

  if (error > 0) {
    console.log("Failed endpoints:");
    results
      .filter((r) => r.status === "error")
      .forEach((r) => console.log(`  - ${r.method} ${r.endpoint}: ${r.message}`));
    process.exit(1);
  }

  console.log("All critical checks passed!");
}

main();
