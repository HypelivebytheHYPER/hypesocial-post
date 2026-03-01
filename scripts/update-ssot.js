#!/usr/bin/env node
/**
 * Single Source of Truth Updater
 * Automatically updates docs/SINGLE_SOURCE_OF_TRUTH.md with current codebase state
 * Run via: node scripts/update-ssot.js or as part of build process
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const SSOT_PATH = path.join(PROJECT_ROOT, "docs/SINGLE_SOURCE_OF_TRUTH.md");

// Colors for console output
const colors = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Extract exports from a TypeScript file
function extractExports(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const exports = {
    interfaces: [],
    types: [],
    functions: [],
    consts: [],
  };

  // Match interface declarations
  const interfaceMatches = content.matchAll(/export interface (\w+)/g);
  for (const match of interfaceMatches) {
    exports.interfaces.push(match[1]);
  }

  // Match type declarations
  const typeMatches = content.matchAll(/export type (\w+)/g);
  for (const match of typeMatches) {
    exports.types.push(match[1]);
  }

  // Match function declarations
  const functionMatches = content.matchAll(/export function (\w+)/g);
  for (const match of functionMatches) {
    exports.functions.push(match[1]);
  }

  // Match const declarations
  const constMatches = content.matchAll(/export const (\w+)/g);
  for (const match of constMatches) {
    exports.consts.push(match[1]);
  }

  return exports;
}

// Generate the SSOT markdown content
function generateSSOT() {
  const typesPath = path.join(PROJECT_ROOT, "types/post-for-me.ts");
  const hooksPath = path.join(PROJECT_ROOT, "lib/hooks/usePostForMe.ts");
  const platformsPath = path.join(PROJECT_ROOT, "lib/social-platforms.ts");

  const typesExports = fs.existsSync(typesPath)
    ? extractExports(typesPath)
    : { interfaces: [], types: [], functions: [], consts: [] };
  const hooksExports = fs.existsSync(hooksPath)
    ? extractExports(hooksPath)
    : { interfaces: [], types: [], functions: [], consts: [] };
  const platformsExports = fs.existsSync(platformsPath)
    ? extractExports(platformsPath)
    : { interfaces: [], types: [], functions: [], consts: [] };

  // Get last updated timestamp
  const now = new Date().toISOString().split("T")[0];

  return `# Single Source of Truth Guide

> **Auto-generated:** ${now}
> **Regenerate:** \`node scripts/update-ssot.js\` or \`pnpm build\`

This document defines the canonical sources for types, configurations, and utilities in this project to avoid confusion and inconsistencies.

---

## Type Definitions

**Canonical Source:** \`types/post-for-me.ts\`

### Core Types

| Type | Kind | Description |
|------|------|-------------|
${typesExports.interfaces.map((t) => `| \`${t}\` | Interface | Post For Me API type |`).join("\n")}
${typesExports.types.map((t) => `| \`${t}\` | Type Alias | Post For Me API type |`).join("\n")}

### Helper Functions

| Function | Purpose |
|----------|---------|
${typesExports.functions.map((f) => `| \`${f}()\` | See types/post-for-me.ts |`).join("\n")}
${typesExports.consts.map((c) => `| \`${c}\` | Constant |`).join("\n")}

### Import Pattern

\`\`\`typescript
// ✅ Correct
import type { SocialPost, SocialAccount, CreateSocialPostDto } from "@/types/post-for-me";
import { PLATFORM_CHARACTER_LIMITS, getMostRestrictiveLimit } from "@/types/post-for-me";
\`\`\`

---

## Platform Configuration

**Canonical Source:** \`lib/social-platforms.ts\`

All platform-related configuration lives here.

### Exports

| Export | Kind |
|--------|------|
${platformsExports.consts.map((c) => `| \`${c}\` | Constant |`).join("\n")}
${platformsExports.functions.map((f) => `| \`${f}()\` | Function |`).join("\n")}

### Usage Pattern

\`\`\`typescript
import { platformIconsMap, getPlatformIcon } from "@/lib/social-platforms";

// Get icon component
const Icon = platformIconsMap[platform.toLowerCase()];
\`\`\`

---

## Character Limits

**Canonical Source:** \`types/post-for-me.ts\`

\`\`\`typescript
import { PLATFORM_CHARACTER_LIMITS, getMostRestrictiveLimit } from "@/types/post-for-me";

// Get limit for platforms
const limit = getMostRestrictiveLimit(["x", "instagram"]);
// Returns: 280 (X is more restrictive)
\`\`\`

---

## API Hooks

**Canonical Source:** \`lib/hooks/usePostForMe.ts\`

All TanStack Query hooks for Post For Me API.

### Available Hooks

| Hook | Kind |
|------|------|
${hooksExports.functions.map((f) => `| \`${f}()\` | Hook |`).join("\n")}

### Query Keys

All query keys are centralized in \`pfmKeys\`:

\`\`\`typescript
import { pfmKeys } from "@/lib/hooks/usePostForMe";

// Use for invalidation
queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
\`\`\`

---

## Webhook Types

**Canonical Source:** \`types/webhooks.ts\`

\`\`\`typescript
import type { PostForMeWebhook, PostForMeEventType } from "@/types/webhooks";
\`\`\`

---

## File Naming Convention

| File | Purpose |
|------|---------|
| \`types/post-for-me.ts\` | Post For Me API types |
| \`types/webhooks.ts\` | Webhook-specific types |
| \`lib/hooks/usePostForMe.ts\` | API hooks |
| \`lib/social-platforms.ts\` | Platform config |

---

## Migration History

### 2026-02-28: Type Naming Standardization

Legacy aliases removed:
- ~~\`PostForMePost\`~~ → Use \`SocialPost\`
- ~~\`PostForMeAccount\`~~ → Use \`SocialAccount\`
- ~~\`PostForMePostResult\`~~ → Use \`SocialPostResult\`
- ~~\`PostForMePostListResponse\`~~ → Use \`SocialPostListResponse\`
- ~~\`PostForMeAccountListResponse\`~~ → Use \`SocialAccountListResponse\`

---

## Checklist for New Code

- [ ] Import types from \`@/types/post-for-me\` using new naming
- [ ] Import platform config from \`@/lib/social-platforms\`
- [ ] Use \`pfmKeys\` for query keys (not hardcoded strings)
- [ ] Use \`platformIconsMap\` for icons (not hardcoded imports)
- [ ] Use helper functions from types (e.g., \`getMostRestrictiveLimit()\`)

---

*This document is auto-generated. Do not edit manually - instead update the source files and run \`node scripts/update-ssot.js\`.*
`;
}

// Main execution
function main() {
  log("🔍 Auditing codebase for Single Source of Truth...", "yellow");

  try {
    const content = generateSSOT();

    // Ensure docs directory exists
    const docsDir = path.dirname(SSOT_PATH);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(SSOT_PATH, content, "utf-8");

    log(`✅ Updated: ${path.relative(PROJECT_ROOT, SSOT_PATH)}`, "green");
    log("📋 Documentation synchronized with codebase", "green");

    // Also verify no legacy references exist
    try {
      const result = execSync(
        'grep -r "PostForMePost\\|PostForMeAccount" --include="*.ts" --include="*.tsx" --exclude-dir=.next --exclude-dir=node_modules . 2>/dev/null || true',
        { cwd: PROJECT_ROOT, encoding: "utf-8" },
      );
      if (result && result.trim()) {
        log("\n⚠️  Warning: Found legacy type references:", "yellow");
        console.log(result);
      } else {
        log("✅ No legacy type references found", "green");
      }
    } catch (e) {
      // grep returns non-zero if no matches, which is good
    }

    process.exit(0);
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
    process.exit(1);
  }
}

main();
