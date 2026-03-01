import { Skeleton } from "@/components/ui/skeleton";

export default function MoodboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-4 w-2 rounded-full" />
            <Skeleton className="h-5 w-48 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64 rounded-full mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-48 rounded-full" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* Moodboard Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex flex-col">
            <div className="flex flex-col items-center mb-4">
              <Skeleton className="h-4 w-6 rounded-full mb-1" />
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 card-premium p-6">
          <Skeleton className="h-3 w-16 rounded-full mb-4" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
        <div className="card-premium p-6">
          <Skeleton className="h-5 w-24 mx-auto rounded-full mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-8 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                  <Skeleton key={j} className="h-6 rounded" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
