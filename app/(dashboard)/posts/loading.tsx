import { Skeleton } from "@/components/ui/skeleton";

export default function PostsLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[150px] rounded-full" />
          <Skeleton className="h-4 w-[250px] rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[100px] rounded-full" />
          <Skeleton className="h-9 w-[120px] rounded-full" />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Posts List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-premium p-5">
            <div className="flex gap-4">
              <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-3 w-32 rounded-full" />
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
