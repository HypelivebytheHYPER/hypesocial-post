import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streaming skeleton for /accounts/connect — surfaces immediately while
 * the auth-url query and Post For Me redirect prep run on the server.
 */
export default function ConnectAccountLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[280px] rounded-full" />
        <Skeleton className="h-4 w-[220px] rounded-full" />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[120px] rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
