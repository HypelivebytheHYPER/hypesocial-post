/**
 * Moodboard TanStack Query Hooks
 * Follows the same patterns as usePostForMe.ts
 */

import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ==================== Types ====================

export interface MoodboardProject {
  id: string;
  record_id?: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  week_notes: Record<string, string>;
}

export interface MoodboardItem {
  id: string;
  record_id?: string;
  project_id: string;
  column_date: string;
  sort_order: number;
  type: "image" | "video" | "note" | "tweet" | "link";
  content: string;
  media_url: string;
  platform: "x" | "instagram" | "facebook" | "linkedin" | "";
  video_ratio: "9:16" | "16:9" | "";
  author: string;
  tags: string[];
  likes: string;
  comments: string;
  linked_post_id: string;
  created_at: string;
  updated_at: string;
}

export interface DayColumnType {
  id: string;
  day: string;
  date: number;
  fullDate: string;
  isoDate: string;
  items: MoodboardItem[];
}

// ==================== Query Keys ====================

export const moodboardKeys = {
  all: ["moodboard"] as const,
  projects: () => [...moodboardKeys.all, "projects"] as const,
  project: (id: string) => [...moodboardKeys.projects(), id] as const,
  items: () => [...moodboardKeys.all, "items"] as const,
  itemsByProject: (projectId: string, dateRangeStart: string) =>
    [...moodboardKeys.items(), projectId, dateRangeStart] as const,
};

// ==================== Project Hooks ====================

export function useProjects() {
  return useQuery<{ projects: MoodboardProject[] }>({
    queryKey: moodboardKeys.projects(),
    queryFn: () => apiClient("/api/moodboard/projects"),
  });
}

export function useProject(projectId: string) {
  return useQuery<MoodboardProject>({
    queryKey: moodboardKeys.project(projectId),
    queryFn: () => apiClient(`/api/moodboard/projects/${projectId}`),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation<
    MoodboardProject,
    Error,
    { name: string; description?: string }
  >({
    mutationFn: (data) =>
      apiClient("/api/moodboard/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moodboardKeys.projects() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean },
    Error,
    { projectId: string; data: Partial<MoodboardProject> }
  >({
    mutationFn: ({ projectId, data }) =>
      apiClient(`/api/moodboard/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: moodboardKeys.project(projectId),
      });
      queryClient.invalidateQueries({ queryKey: moodboardKeys.projects() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (projectId) =>
      apiClient(`/api/moodboard/projects/${projectId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moodboardKeys.projects() });
    },
  });
}

// ==================== Item Hooks ====================

export function useMoodboardItems(projectId: string, startDate: string, endDate: string) {
  return useQuery<{ items: MoodboardItem[] }>({
    queryKey: moodboardKeys.itemsByProject(projectId, startDate),
    queryFn: () =>
      apiClient(
        `/api/moodboard/items?project_id=${projectId}&start_date=${startDate}&end_date=${endDate}`,
      ),
    enabled: !!projectId && !!startDate && !!endDate,
    staleTime: 30000, // 30s to avoid refetch spam during DnD
  });
}

export function useCreateItem(projectId?: string, dateRangeStart?: string) {
  const queryClient = useQueryClient();
  const queryKey =
    projectId && dateRangeStart
      ? moodboardKeys.itemsByProject(projectId, dateRangeStart)
      : moodboardKeys.items();

  const mutation = useMutation<
    MoodboardItem,
    Error,
    Omit<MoodboardItem, "id" | "record_id" | "created_at" | "updated_at">,
    { previous: { items: MoodboardItem[] } | undefined }
  >({
    mutationFn: (data) =>
      apiClient("/api/moodboard/items", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ items: MoodboardItem[] }>(queryKey);
      if (previous) {
        const placeholder: MoodboardItem = {
          ...newItem,
          id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData(queryKey, {
          items: [...previous.items, placeholder],
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    // No onSettled here — caller controls when to invalidate (sync real IDs).
    // This prevents parallel mutations from stomping each other's optimistic state.
  });

  /** Invalidate the items query to replace temp IDs with real server data. */
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, projectId, dateRangeStart],
  );

  return { ...mutation, invalidate };
}

export function useUpdateItem(projectId?: string, dateRangeStart?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean },
    Error,
    { itemId: string; data: Partial<MoodboardItem> }
  >({
    mutationFn: ({ itemId, data }) =>
      apiClient(`/api/moodboard/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      if (projectId && dateRangeStart) {
        queryClient.invalidateQueries({
          queryKey: moodboardKeys.itemsByProject(projectId, dateRangeStart),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: moodboardKeys.items() });
      }
    },
  });
}

export function useDeleteItem(projectId?: string, dateRangeStart?: string) {
  const queryClient = useQueryClient();
  const queryKey =
    projectId && dateRangeStart
      ? moodboardKeys.itemsByProject(projectId, dateRangeStart)
      : moodboardKeys.items();

  return useMutation<
    unknown,
    Error,
    string,
    { previous: { items: MoodboardItem[] } | undefined }
  >({
    mutationFn: (itemId) =>
      apiClient(`/api/moodboard/items/${itemId}`, {
        method: "DELETE",
      }),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ items: MoodboardItem[] }>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, {
          items: previous.items.filter((i) => i.id !== itemId),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Batch reorder items after DnD — with optimistic update.
 * Updates the query cache immediately, then syncs to API in background.
 */
export function useReorderItems(projectId: string, dateRangeStart: string) {
  const queryClient = useQueryClient();
  const queryKey = moodboardKeys.itemsByProject(projectId, dateRangeStart);

  type ReorderContext = {
    previous: { items: MoodboardItem[] } | undefined;
  };

  return useMutation<
    { success: boolean },
    Error,
    { item_id: string; column_date: string; sort_order: number }[],
    ReorderContext
  >({
    mutationFn: (items) =>
      apiClient("/api/moodboard/items/reorder", {
        method: "POST",
        body: JSON.stringify({ project_id: projectId, items }),
      }),
    onMutate: async (reorderPayload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ items: MoodboardItem[] }>(queryKey);

      if (previous) {
        // O(n+m) via Map instead of O(n*m) with nested find()
        const updates = new Map(
          reorderPayload.map((r) => [r.item_id, r] as const),
        );
        const updatedItems = previous.items.map((item) => {
          const update = updates.get(item.id);
          return update
            ? { ...item, column_date: update.column_date, sort_order: update.sort_order }
            : item;
        });
        queryClient.setQueryData(queryKey, { items: updatedItems });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ==================== Upload Hook ====================

interface UploadResult {
  upload_url: string;
  media_url: string;
  key: string;
}

/**
 * Upload media to R2:
 * 1. Get presigned URL from API
 * 2. PUT file directly to R2
 * 3. Return the public URL
 */
export function useUploadMoodboardMedia() {
  return useMutation<
    string,
    Error,
    { file: File; projectId: string }
  >({
    mutationFn: async ({ file, projectId }) => {
      // Step 1: Get presigned URL
      const { upload_url, media_url } = await apiClient<UploadResult>(
        "/api/moodboard/upload",
        {
          method: "POST",
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type,
            size: file.size,
            project_id: projectId,
          }),
        },
      );

      // Step 2: Upload directly to R2
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }

      // Step 3: Return the public URL
      return media_url;
    },
  });
}
