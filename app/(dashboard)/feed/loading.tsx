import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {/* Left Sidebar Skeleton */}
      <aside className="hidden lg:block lg:col-span-3 space-y-4">
        <div className="card-premium overflow-hidden">
          <Skeleton className="h-24 w-full" />
          <div className="pt-10 pb-4 px-4">
            <Skeleton className="h-5 w-32 mx-auto mb-1" />
            <Skeleton className="h-3 w-20 mx-auto mb-4" />
            <div className="flex justify-center gap-6 mb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-6 w-10 mx-auto mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>
        <div className="card-premium p-4">
          <Skeleton className="h-5 w-28 mb-3" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main Feed Skeleton */}
      <main className="lg:col-span-6 space-y-4">
        {/* Composer Skeleton */}
        <div className="card-premium p-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="flex-1 h-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* Posts Skeleton */}
        {[1, 2].map((i) => (
          <div key={i} className="card-premium overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="px-4 pb-3">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton
              className="h-64 w-full mx-4"
              style={{ width: "calc(100% - 2rem)" }}
            />
            <div className="p-4 flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </main>

      {/* Right Sidebar Skeleton */}
      <aside className="hidden lg:block lg:col-span-3 space-y-4">
        <div className="card-premium p-4">
          <Skeleton className="h-5 w-20 mb-4" />
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-32 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </div>
        <div className="card-premium p-4">
          <Skeleton className="h-5 w-28 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
