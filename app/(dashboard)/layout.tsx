"use client";

import { Navigation } from "@/components/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container-premium pt-32 md:pt-28 pb-24 md:pb-12">
        {children}
      </main>
    </div>
  );
}
