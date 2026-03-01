import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HypePostSocial - Social Media Management",
  description: "Manage your social media posts across multiple platforms",
  icons: {
    icon: "https://pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev/HypeSocial.png",
    apple: "https://pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev/HypeSocial.png",
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
