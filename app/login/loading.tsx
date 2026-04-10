import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streaming skeleton for the login page — keeps the layout stable
 * while NextAuth's CSRF token + provider list resolve.
 */
export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-3xl border p-8">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-2xl" />
          <Skeleton className="mx-auto h-6 w-[160px] rounded-full" />
          <Skeleton className="mx-auto h-3 w-[200px] rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-11 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
