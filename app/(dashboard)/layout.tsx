import { Suspense } from "react";
import { HydrationBoundary } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { prefetchDashboardData } from "@/lib/prefetch";
import DashboardLoading from "./loading";

/**
 * Async component that prefetches data and hydrates the cache.
 * Wrapped in Suspense so the shell + loading.tsx stream immediately
 * while this resolves in the background.
 */
async function PrefetchedContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const dehydratedState = await prefetchDashboardData();

  return (
    <HydrationBoundary state={dehydratedState}>
      {children}
    </HydrationBoundary>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container-premium pt-20 md:pt-28 pb-24 md:pb-12">
        <Suspense fallback={<DashboardLoading />}>
          <PrefetchedContent>{children}</PrefetchedContent>
        </Suspense>
      </main>
    </div>
  );
}
