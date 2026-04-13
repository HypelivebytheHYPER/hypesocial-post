/**
 * Posts Hooks - Mutations
 * @module lib/hooks/posts/mutations
 * 
 * All post mutations with optimistic updates.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { pfmKeys } from "../keys";
import type { SocialPost, SocialPostListResponse, CreateSocialPostDto } from "@/types/post-for-me-types";
import { toast } from "sonner";

// ==================== Create ====================

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<SocialPost, Error, CreateSocialPostDto>({
    mutationFn: (data) =>
      apiClient<SocialPost>("/api/posts", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    onMutate: async (newPost) => {
      await queryClient.cancelQueries({ queryKey: pfmKeys.posts() });
      
      const previousPosts = queryClient.getQueryData<SocialPostListResponse>(pfmKeys.posts());

      const optimistic: SocialPost = {
        id: `temp-${Date.now()}`,
        caption: newPost.caption,
        social_accounts: [],
        media: newPost.media || null,
        scheduled_at: newPost.scheduled_at || null,
        status: newPost.scheduled_at ? "scheduled" : "processing",
        platform_configurations: newPost.platform_configurations || null,
        account_configurations: newPost.account_configurations || null,
        external_id: newPost.external_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<SocialPostListResponse>(pfmKeys.posts(), (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [optimistic, ...old.data],
          meta: { ...old.meta, total: (old.meta?.total ?? 0) + 1 },
        };
      });

      return { previousPosts };
    },

    onError: (error, _vars, context) => {
      const ctx = context as { previousPosts?: SocialPostListResponse } | undefined;
      if (ctx?.previousPosts) {
        queryClient.setQueryData(pfmKeys.posts(), ctx.previousPosts);
      }
      toast.error(error.message || "Failed to create post");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
      toast.success("Post created");
    },
  });
}

// ==================== Update ====================

interface UpdatePostVariables {
  id: string;
  data: Partial<CreateSocialPostDto>;
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation<SocialPost, Error, UpdatePostVariables>({
    mutationFn: ({ id, data }) =>
      apiClient<SocialPost>(`/api/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: pfmKeys.post(id) });
      await queryClient.cancelQueries({ queryKey: pfmKeys.posts() });

      const previousPost = queryClient.getQueryData<SocialPost>(pfmKeys.post(id));
      const previousPosts = queryClient.getQueryData<SocialPostListResponse>(pfmKeys.posts());

      // Update single post cache
      queryClient.setQueryData<SocialPost>(pfmKeys.post(id), (old) => {
        if (!old) return old;
        return {
          ...old,
          caption: data.caption ?? old.caption,
          media: data.media ?? old.media,
          scheduled_at: data.scheduled_at ?? old.scheduled_at,
          updated_at: new Date().toISOString(),
        };
      });

      // Update list cache
      queryClient.setQueryData<SocialPostListResponse>(pfmKeys.posts(), (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((p) =>
            p.id === id
              ? {
                  ...p,
                  caption: data.caption ?? p.caption,
                  media: data.media ?? p.media,
                  scheduled_at: data.scheduled_at ?? p.scheduled_at,
                  updated_at: new Date().toISOString(),
                }
              : p
          ),
        };
      });

      return { previousPost, previousPosts };
    },

    onError: (error, vars, context) => {
      const ctx = context as { previousPost?: SocialPost; previousPosts?: SocialPostListResponse } | undefined;
      if (ctx?.previousPost) {
        queryClient.setQueryData(pfmKeys.post(vars.id), ctx.previousPost);
      }
      if (ctx?.previousPosts) {
        queryClient.setQueryData(pfmKeys.posts(), ctx.previousPosts);
      }
      toast.error(error.message || "Failed to update post");
    },

    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
      queryClient.invalidateQueries({ queryKey: pfmKeys.post(vars.id) });
      toast.success("Post updated");
    },
  });
}

// ==================== Delete ====================

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      apiClient<{ success: boolean }>(`/api/posts/${id}`, { method: "DELETE" }),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: pfmKeys.posts() });
      
      const previousPosts = queryClient.getQueryData<SocialPostListResponse>(pfmKeys.posts());

      queryClient.setQueryData<SocialPostListResponse>(pfmKeys.posts(), (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((p) => p.id !== id),
          meta: { ...old.meta, total: Math.max(0, (old.meta?.total ?? 0) - 1) },
        };
      });

      queryClient.removeQueries({ queryKey: pfmKeys.post(id) });

      return { previousPosts };
    },

    onError: (error, _id, context) => {
      const ctx = context as { previousPosts?: SocialPostListResponse } | undefined;
      if (ctx?.previousPosts) {
        queryClient.setQueryData(pfmKeys.posts(), ctx.previousPosts);
      }
      toast.error(error.message || "Failed to delete post");
    },

    onSuccess: () => {
      toast.success("Post deleted");
    },
  });
}

// ==================== Retry ====================

export function useRetryPost() {
  const queryClient = useQueryClient();

  return useMutation<SocialPost, Error, SocialPost>({
    mutationFn: (failedPost) => {
      const retryData: CreateSocialPostDto = {
        caption: failedPost.caption,
        social_accounts: failedPost.social_accounts?.map((a) => a.id) || [],
        scheduled_at: failedPost.scheduled_at,
        media: failedPost.media?.map((m) => ({
          url: m.url,
          thumbnail_url: m.thumbnail_url,
          thumbnail_timestamp_ms: m.thumbnail_timestamp_ms,
          tags: m.tags,
          skip_processing: m.skip_processing,
        })),
        platform_configurations: failedPost.platform_configurations,
        account_configurations: failedPost.account_configurations,
      };

      return apiClient<SocialPost>("/api/posts", {
        method: "POST",
        body: JSON.stringify(retryData),
      });
    },

    onMutate: async (failedPost) => {
      await queryClient.cancelQueries({ queryKey: pfmKeys.posts() });
      
      const previousPosts = queryClient.getQueryData<SocialPostListResponse>(pfmKeys.posts());

      queryClient.setQueryData<SocialPostListResponse>(pfmKeys.posts(), (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((p) =>
            p.id === failedPost.id ? { ...p, status: "processing" as const } : p
          ),
        };
      });

      return { previousPosts };
    },

    onError: (error, failedPost, context) => {
      const ctx = context as { previousPosts?: SocialPostListResponse } | undefined;
      if (ctx?.previousPosts) {
        queryClient.setQueryData(pfmKeys.posts(), ctx.previousPosts);
      }
      toast.error(error.message || "Failed to retry post");
    },

    onSuccess: (newPost, failedPost) => {
      queryClient.setQueryData<SocialPostListResponse>(pfmKeys.posts(), (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((p) => (p.id === failedPost.id ? newPost : p)),
        };
      });
      toast.success("Post retry initiated");
    },
  });
}
