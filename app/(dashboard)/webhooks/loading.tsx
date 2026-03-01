import { Skeleton } from "@/components/ui/skeleton";

export default function WebhooksLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[180px] rounded-full" />
          <Skeleton className="h-4 w-[280px] rounded-full" />
        </div>
        <Skeleton className="h-9 w-[100px] rounded-full" />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Register Card Skeleton */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-[160px] rounded-full mb-1" />
            <Skeleton className="h-3 w-[200px] rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-[140px] rounded-full" />
        </div>
      </div>

      {/* Webhooks List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-premium p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-[100px] rounded-full" />
                  <Skeleton className="h-5 w-[60px] rounded-full" />
                </div>
                <Skeleton className="h-4 w-full max-w-md rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-[100px] rounded-full" />
                  <Skeleton className="h-5 w-[100px] rounded-full" />
                </div>
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
