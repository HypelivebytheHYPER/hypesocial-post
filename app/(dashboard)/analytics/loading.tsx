import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[160px] rounded-full" />
          <Skeleton className="h-4 w-[220px] rounded-full" />
        </div>
        <Skeleton className="h-9 w-[140px] rounded-full" />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-3 w-14 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full mb-2" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        ))}
      </div>

      {/* Two Column Skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] w-full rounded-3xl" />
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    </div>
  );
}
