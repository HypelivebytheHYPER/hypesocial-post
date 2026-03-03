import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

const LOGO_URL =
  "https://pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev/HypeSocial.png";

export const metadata: Metadata = {
  title: {
    default: "HypePostSocial - Social Media Management",
    template: "%s | HypePostSocial",
  },
  description: "Manage your social media posts across multiple platforms",
  metadataBase: new URL("https://hypesocial-post.vercel.app"),
  icons: {
    icon: LOGO_URL,
    apple: LOGO_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hypesocial-post.vercel.app",
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
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
