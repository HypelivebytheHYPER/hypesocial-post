import type { NextConfig } from "next";
import withBundleAnalyzerImport from "@next/bundle-analyzer";
import path from "path";

// Q1 (2026-04-10): Wrap config with @next/bundle-analyzer so
// `ANALYZE=true pnpm build` actually emits the chunk report. Next.js 16
// removed bundle size from default build output, so this is the only way
// to see what's in your chunks.
const withBundleAnalyzer = withBundleAnalyzerImport({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Q2 (2026-04-10): Pin Turbopack root to this project so Next.js stops
  // walking up to ~/package-lock.json (npm) and selecting that as the
  // workspace root. The project is pnpm.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "data.postforme.dev" },
      // Post For Me legacy profile-photo CDN (not our Supabase — see ENVIRONMENT_VARIABLES.md)
      { protocol: "https", hostname: "cjsgitiiwhrsfolwmtby.supabase.co" },
      // R2 CDN — static assets (logo, etc.) and legacy media
      { protocol: "https", hostname: "pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev" },
      { protocol: "https", hostname: "pub-483f816788534334817c49941fb59b23.r2.dev" },
      // Lark Drive media URLs (dynamic)
      { protocol: "https", hostname: "*.larksuite.com" },
      { protocol: "https", hostname: "*.feishu.cn" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https: data.postforme.dev cjsgitiiwhrsfolwmtby.supabase.co *.larksuite.com *.feishu.cn",
              "connect-src 'self' api.postforme.dev data.postforme.dev cjsgitiiwhrsfolwmtby.supabase.co lark-http-hype.hypelive.workers.dev",
              "font-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "recharts",
      "@radix-ui/react-icons",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
