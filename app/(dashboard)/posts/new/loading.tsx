import { Skeleton } from "@/components/ui/skeleton";

export default function NewPostLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-[180px] rounded-full" />
          <Skeleton className="h-4 w-[140px] rounded-full" />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Editor Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-[80px] rounded-full" />
              <Skeleton className="h-3 w-[60px] rounded-full" />
            </div>
            <Skeleton className="h-[180px] w-full rounded-2xl" />
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-9 w-[100px] rounded-full" />
              <Skeleton className="h-9 w-[90px] rounded-full" />
            </div>
          </div>

          <div className="card-premium p-6">
            <Skeleton className="h-5 w-[90px] rounded-full mb-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-[40px] rounded-full" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-[40px] rounded-full" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <div className="card-premium p-6">
            <Skeleton className="h-5 w-[90px] rounded-full mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 w-[80px] rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
