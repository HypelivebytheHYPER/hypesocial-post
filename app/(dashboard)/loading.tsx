import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-[250px] rounded-full" />
        <Skeleton className="h-4 w-[180px] rounded-full" />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      {/* Two Column Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[200px] w-full rounded-3xl" />
          <Skeleton className="h-[250px] w-full rounded-3xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[100px] w-full rounded-2xl" />
          <Skeleton className="h-[100px] w-full rounded-2xl" />
          <Skeleton className="h-[180px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
