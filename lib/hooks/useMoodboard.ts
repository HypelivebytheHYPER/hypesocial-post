/**
 * Moodboard TanStack Query Hooks
 * Follows the same patterns as usePostForMe.ts
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

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
  itemsByProject: (projectId: string, weekStart: string) =>
    [...moodboardKeys.items(), projectId, weekStart] as const,
};

// ==================== API Client ====================

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || `API error: ${response.status} ${response.statusText}`,
    );
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

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

export function useMoodboardItems(projectId: string, weekStart: string) {
  // Calculate end date (7 days after start)
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const endDateStr = endDate.toISOString().split("T")[0];

  return useQuery<{ items: MoodboardItem[] }>({
    queryKey: moodboardKeys.itemsByProject(projectId, weekStart),
    queryFn: () =>
      apiClient(
        `/api/moodboard/items?project_id=${projectId}&start_date=${weekStart}&end_date=${endDateStr}`,
      ),
    enabled: !!projectId && !!weekStart,
    staleTime: 30000, // 30s to avoid refetch spam during DnD
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation<
    MoodboardItem,
    Error,
    Omit<MoodboardItem, "id" | "record_id" | "created_at" | "updated_at">
  >({
    mutationFn: (data) =>
      apiClient("/api/moodboard/items", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moodboardKeys.items() });
    },
  });
}

export function useUpdateItem() {
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
      queryClient.invalidateQueries({ queryKey: moodboardKeys.items() });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (itemId) =>
      apiClient(`/api/moodboard/items/${itemId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moodboardKeys.items() });
    },
  });
}

/**
 * Batch reorder items after DnD — with optimistic update.
 * Updates the query cache immediately, then syncs to API in background.
 */
export function useReorderItems(projectId: string, weekStart: string) {
  const queryClient = useQueryClient();
  const queryKey = moodboardKeys.itemsByProject(projectId, weekStart);

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
    onMutate: async (reorderItems) => {
      // Cancel in-flight fetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previous = queryClient.getQueryData<{ items: MoodboardItem[] }>(queryKey);

      // Optimistically update
      if (previous) {
        const updatedItems = previous.items.map((item) => {
          const update = reorderItems.find((r) => r.item_id === item.id);
          if (update) {
            return {
              ...item,
              column_date: update.column_date,
              sort_order: update.sort_order,
            };
          }
          return item;
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
