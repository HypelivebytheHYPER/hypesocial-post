import { HydrationBoundary } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { prefetchDashboardData } from "@/lib/prefetch";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dehydratedState = await prefetchDashboardData();

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container-premium pt-20 md:pt-28 pb-24 md:pb-12">
        <HydrationBoundary state={dehydratedState}>
          {children}
        </HydrationBoundary>
      </main>
    </div>
  );
}
