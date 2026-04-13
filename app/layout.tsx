import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getBaseUrl } from "@/lib/config";

// Primary image CDN domains - preconnect for faster LCP
const IMAGE_CDNS = [
  "https://pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev",  // R2 primary
  "https://pub-483f816788534334817c49941fb59b23.r2.dev",  // R2 secondary
] as const;

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const LOGO_URL =
  "https://pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev/HypeSocial.png";

// Get base URL for metadata (server-side only)
const baseUrl = getBaseUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "HypePostSocial - Social Media Management",
    template: "%s | HypePostSocial",
  },
  description: "Manage your social media posts across multiple platforms",
  metadataBase: new URL(baseUrl),
  icons: {
    icon: LOGO_URL,
    apple: LOGO_URL,
  },
  // Preconnect to image CDNs for faster loading
  other: {
    link: JSON.stringify([
      // Preconnect establishes early connection to image CDNs
      ...IMAGE_CDNS.map(url => ({
        rel: "preconnect",
        href: url,
        crossOrigin: "anonymous",
      })),
      // DNS prefetch as fallback
      ...IMAGE_CDNS.map(url => ({
        rel: "dns-prefetch",
        href: url,
      })),
    ]),
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "HypePostSocial",
    title: "HypePostSocial - Social Media Management",
    description: "Manage your social media posts across multiple platforms",
    images: [
      {
        url: LOGO_URL,
        width: 512,
        height: 512,
        alt: "HypePostSocial Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "HypePostSocial - Social Media Management",
    description: "Manage your social media posts across multiple platforms",
    images: [LOGO_URL],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
