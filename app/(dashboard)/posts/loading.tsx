import { Skeleton } from "@/components/ui/skeleton";

export default function PostsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[140px] rounded-lg" />
          <Skeleton className="h-4 w-[220px] rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[90px] rounded-lg" />
          <Skeleton className="h-9 w-[110px] rounded-lg" />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Posts List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm"
          >
            <div className="flex gap-4">
              <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded-md" />
                  <Skeleton className="h-4 w-14 rounded-md" />
                </div>
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
