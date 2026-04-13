"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useState } from "react";
import { WebhookRegistration } from "@/components/webhook-registration";
import { useEvents } from "@/lib/hooks";
import { TIME } from "@/lib/constants";

/** Wraps Toaster so it respects next-themes. */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} />;
}

/**
 * Subscribes to /api/events/stream (server-push event stream). On each event, 
 * invalidates the affected React Query keys. Renders nothing. 
 */
function EventsMonitor() {
  useEvents();
  return null;
}

/**
 * Create QueryClient with optimized defaults.
 * 
 * NOTE: We intentionally do NOT use persistQueryClient because:
 * 1. Source of truth is Post For Me API (already persisted)
 * 2. EventSource streaming keeps cache fresh in real-time
 * 3. No offline write capability (API calls fail offline anyway)
 * 4. Adds complexity without significant benefit for this architecture
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 5 minutes
        staleTime: TIME.STALE_TIME_DEFAULT,
        // Keep unused data for 30 minutes (back navigation)
        gcTime: TIME.GC_TIME_DEFAULT,
        // Retry failed queries
        retry: 2,
        // Exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Streaming handles updates, no need for window focus refetch
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <WebhookRegistration />
        <EventsMonitor />
        {children}
        <ThemedToaster />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
