import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { larkSearchRecords, filterAnd, eq, larkText, larkBool } from "@/lib/lark";

/**
 * Hash a password using scrypt (Node.js built-in, zero dependencies).
 * Format: <hex-salt>:<hex-hash>
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash.
 */
function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const derivedBuffer = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, derivedBuffer);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const tableId = process.env.LARK_USERS_TABLE_ID;
        if (!tableId) return null; // auth disabled if no table configured

        const inputEmail = (credentials?.email as string)?.trim().toLowerCase();
        const inputPassword = credentials?.password as string;
        if (!inputEmail || !inputPassword) return null;

        // Query Lark for user by email
        const result = await larkSearchRecords(
          tableId,
          filterAnd(eq("Email", inputEmail)),
          1,
        );
        const record = result.items?.[0];
        if (!record) return null;

        const fields = record.fields;

        // Check active status
        if (!larkBool(fields["Is Active"])) return null;

        // Verify password
        const storedHash = larkText(fields["Password Hash"]);
        if (!verifyPassword(inputPassword, storedHash)) return null;

        return {
          id: record.record_id,
          email: larkText(fields["Email"]),
          name: larkText(fields["Name"]),
          role: larkText(fields["Role"]),
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: { signIn: "/login" },
});
