/**
 * Get environment variables from Vercel CLI
 * Usage: npx tsx scripts/get-vercel-env.ts
 * 
 * This script pulls environment variables from Vercel
 * and generates/updates a .env.local file.
 * 
 * Requirements:
 * - Vercel CLI installed: npm i -g vercel
 * - Logged in: vercel login
 * - Linked project: vercel link
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

interface EnvVar {
  key: string;
  value: string;
}

function execVercelCommand(command: string): string {
  try {
    return execSync(command, { 
      encoding: "utf-8", 
      stdio: ["pipe", "pipe", "pipe"],
      cwd: process.cwd()
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("not logged in")) {
      console.error("❌ Not logged in to Vercel. Run: vercel login");
    } else if (errorMsg.includes("not linked")) {
      console.error("❌ Project not linked. Run: vercel link");
    } else {
      console.error("❌ Command failed:", command);
      console.error("Error:", errorMsg);
    }
    process.exit(1);
  }
}

function parseEnvList(output: string): Array<{ name: string; environments: string[] }> {
  const lines = output.trim().split("\n");
  const envs: Array<{ name: string; environments: string[] }> = [];
  
  // Skip header lines and empty lines
  let inTable = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("─") || trimmed.startsWith("┌") || trimmed.startsWith("├") || trimmed.startsWith("└")) {
      if (trimmed.includes("name")) inTable = true;
      continue;
    }
    if (!inTable) continue;
    
    // Parse table row: │ KEY   │ production, preview, development │
    const match = trimmed.match(/│\s*(\S+)\s*│\s*(.+)\s*│/);
    if (match && match[1] && match[2]) {
      const name = match[1].trim();
      const envsStr = match[2].trim();
      const environments = envsStr.split(",").map(e => e.trim());
      envs.push({ name, environments });
    }
  }
  
  return envs;
}

function getEnvValue(key: string): string | null {
  try {
    // vercel env pull downloads all env vars to .env
    execVercelCommand("vercel env pull .env.vercel --yes");
    
    const envContent = readFileSync(join(process.cwd(), ".env.vercel"), "utf-8");
    const lines = envContent.split("\n");
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) continue;
      
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex > 0) {
        const k = trimmed.slice(0, equalIndex).trim();
        const v = trimmed.slice(equalIndex + 1).trim();
        if (k === key) {
          // Remove quotes if present
          return v.replace(/^["'](.+)["']$/, "$1");
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getAllEnvVars(): EnvVar[] {
  console.log("📡 Fetching environment variables from Vercel...\n");
  
  // Get list of env vars
  const listOutput = execVercelCommand("vercel env ls");
  const envList = parseEnvList(listOutput);
  
  if (envList.length === 0) {
    console.log("⚠️  No environment variables found in Vercel.");
    return [];
  }
  
  console.log(`Found ${envList.length} environment variable(s)\n`);
  
  // Pull all values
  execVercelCommand("vercel env pull .env.vercel --yes");
  const envContent = readFileSync(join(process.cwd(), ".env.vercel"), "utf-8");
  
  const envVars: EnvVar[] = [];
  const lines = envContent.split("\n");
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed) continue;
    
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex > 0) {
      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();
      // Remove quotes if present
      value = value.replace(/^["'](.+)["']$/, "$1");
      envVars.push({ key, value });
    }
  }
  
  // Clean up temp file
  try {
    const { unlinkSync } = require("fs");
    unlinkSync(join(process.cwd(), ".env.vercel"));
  } catch {}
  
  return envVars;
}

function mergeWithExistingEnv(envVars: EnvVar[]): string {
  const envPath = join(process.cwd(), ".env.local");
  let existing: Record<string, string> = {};
  
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    const lines = content.split("\n");
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || !trimmed) {
        existing[`__COMMENT_${Object.keys(existing).length}`] = line;
        continue;
      }
      
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmed.slice(0, equalIndex).trim();
        const value = trimmed.slice(equalIndex + 1).trim();
        existing[key] = value;
      }
    }
  }
  
  // Update with new values
  for (const { key, value } of envVars) {
    existing[key] = value;
  }
  
  // Generate content
  const lines: string[] = [];
  lines.push("# Auto-generated from Vercel environment variables");
  lines.push(`# Updated: ${new Date().toISOString()}`);
  lines.push("");
  
  for (const [key, value] of Object.entries(existing)) {
    if (key.startsWith("__COMMENT")) {
      lines.push(value);
    } else {
      // Quote value if it contains spaces
      const needsQuotes = value.includes(" ") || value.includes("#");
      lines.push(`${key}=${needsQuotes ? `"${value}"` : value}`);
    }
  }
  
  return lines.join("\n");
}

function main() {
  console.log("🚀 Vercel Environment Sync\n");
  
  const envVars = getAllEnvVars();
  
  if (envVars.length === 0) {
    console.log("\n⚠️  No variables to sync.");
    process.exit(0);
  }
  
  console.log("📋 Variables to sync:");
  for (const { key } of envVars) {
    const masked = "****";
    console.log(`   • ${key}=${masked}`);
  }
  
  console.log("\n📝 Updating .env.local...");
  const content = mergeWithExistingEnv(envVars);
  writeFileSync(join(process.cwd(), ".env.local"), content);
  
  console.log(`✅ Synced ${envVars.length} variable(s) to .env.local`);
  console.log("\n💡 Tip: Restart your dev server to load new environment variables");
}

main();
