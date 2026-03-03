/**
 * CLI utility to generate a password hash for ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   npx tsx scripts/generate-password-hash.ts "MySecureP@ss"
 */
import { hashPassword } from "../lib/auth";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npx tsx scripts/generate-password-hash.ts <password>");
  process.exit(1);
}

const hash = hashPassword(password);
console.log(`\nADMIN_PASSWORD_HASH=${hash}\n`);
console.log("Add this to your .env.local file along with:");
console.log("ADMIN_EMAIL=your@email.com");
