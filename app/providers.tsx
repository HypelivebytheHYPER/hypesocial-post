"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useState } from "react";
import { WebhookRegistration } from "@/components/webhook-registration";
import { useEvents } from "@/lib/hooks/useEvents";

/** Wraps Toaster so it respects next-themes. */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} />;
}

/**
 * Subscribes to /api/events/stream (SSE). On each event, invalidates the
 * affected React Query keys. Renders nothing. See lib/hooks/useEvents.ts.
 */
function EventsMonitor() {
  useEvents();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min — data stays fresh across page navigations
            gcTime: 30 * 60 * 1000, // 30 min — keep cache alive even after unmount
            // refetchOnWindowFocus: true (default) — v5 only triggers on visibility
            // change, and staleTime gates it so no refetch while data is fresh
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WebhookRegistration />
          <EventsMonitor />
          {children}
          <ThemedToaster />
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
