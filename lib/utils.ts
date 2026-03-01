import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PROXY_DOMAINS = [
  "data.postforme.dev",
  "cjsgitiiwhrsfolwmtby.supabase.co",
  "pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev",
  "pub-483f816788534334817c49941fb59b23.r2.dev",
];

export function proxyMediaUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (PROXY_DOMAINS.includes(parsed.hostname)) {
      return `/api/media/proxy?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // Invalid URL — return as-is
  }
  return url;
}
