/**
 * Type-safe search parameter utilities
 * Uses Zod for validation - lightweight alternative to TanStack Router's search params
 */

import { z } from "zod";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { PAGINATION } from "@/lib/constants";

// ============================================================================
// Schema Definitions
// ============================================================================

export const PostsSearchSchema = z.object({
  status: z.enum(["draft", "scheduled", "publishing", "published", "failed"]).optional(),
  platform: z.string().optional(),
  accountId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(PAGINATION.DEFAULT_LIMIT),
});

export const FeedSearchSchema = z.object({
  accountId: z.string().optional(),
  platform: z.string().optional(),
});

export const AnalyticsSearchSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
  accountId: z.string().optional(),
  platform: z.string().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type PostsSearchParams = z.infer<typeof PostsSearchSchema>;
export type FeedSearchParams = z.infer<typeof FeedSearchSchema>;
export type AnalyticsSearchParams = z.infer<typeof AnalyticsSearchSchema>;

// ============================================================================
// Hook Factory
// ============================================================================

function createSearchParamsHook<T extends z.ZodTypeAny>(schema: T) {
  type Params = z.infer<T>;

  return function useTypedSearchParams() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Parse and validate current params
    const params = useMemo(() => {
      const raw: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        raw[key] = value;
      });

      const result = schema.safeParse(raw);
      if (!result.success) {
        console.warn("Invalid search params:", result.error.issues);
        return schema.parse({}); // Return defaults
      }
      return result.data;
    }, [searchParams]);

    // Update params with partial merge
    const setParams = useCallback(
      (updates: Partial<Params>, options?: { replace?: boolean; scroll?: boolean }) => {
        const newParams = new URLSearchParams(searchParams);

        // Apply updates
        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") {
            newParams.delete(key);
          } else {
            newParams.set(key, String(value));
          }
        });

        const url = `${pathname}?${newParams.toString()}`;
        const scroll = options?.scroll ?? false;
        if (options?.replace) {
          router.replace(url, { scroll });
        } else {
          router.push(url, { scroll });
        }
      },
      [pathname, router, searchParams]
    );

    // Reset to defaults
    const resetParams = useCallback(
      (options?: { replace?: boolean }) => {
        const defaults = schema.parse({});
        const newParams = new URLSearchParams();
        Object.entries(defaults).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            newParams.set(key, String(value));
          }
        });

        const url = `${pathname}?${newParams.toString()}`;
        if (options?.replace) {
          router.replace(url);
        } else {
          router.push(url);
        }
      },
      [pathname, router]
    );

    return {
      params,
      setParams,
      resetParams,
    };
  };
}

// ============================================================================
// Exported Hooks
// ============================================================================

export const usePostsSearchParams = createSearchParamsHook(PostsSearchSchema);
export const useFeedSearchParams = createSearchParamsHook(FeedSearchSchema);
export const useAnalyticsSearchParams = createSearchParamsHook(AnalyticsSearchSchema);
