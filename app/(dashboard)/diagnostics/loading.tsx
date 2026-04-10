import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streaming skeleton for /diagnostics — the page hits multiple status
 * endpoints (Lark, PFM, EVENTS table) so streaming the shell first
 * dramatically improves perceived load time.
 */
export default function DiagnosticsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[200px] rounded-full" />
        <Skeleton className="h-4 w-[300px] rounded-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3 rounded-3xl border p-6">
            <Skeleton className="h-5 w-[140px] rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-[80%] rounded-full" />
            <Skeleton className="h-8 w-[100px] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
