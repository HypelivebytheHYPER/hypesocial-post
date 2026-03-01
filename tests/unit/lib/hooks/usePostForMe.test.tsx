import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePosts, useAccounts, useCreatePost } from "@/lib/hooks/usePostForMe";

// Mock fetch
global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("usePostForMe Hooks - Happy Path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("usePosts", () => {
    it("should fetch posts successfully", async () => {
      const mockPosts = {
        items: [
          {
            id: "post-1",
            caption: "Test post",
            status: "published",
            scheduled_at: null,
            created_at: "2026-03-01T00:00:00Z",
            updated_at: "2026-03-01T00:00:00Z",
            social_accounts: [],
            media: [],
          },
        ],
        total: 1,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });

      const { result } = renderHook(() => usePosts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPosts);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/posts",
        expect.any(Object),
      );
    });
  });

  describe("useAccounts", () => {
    it("should fetch accounts successfully", async () => {
      const mockAccounts = {
        items: [
          {
            id: "account-1",
            platform: "instagram",
            username: "testuser",
            status: "active",
            created_at: "2026-03-01T00:00:00Z",
            updated_at: "2026-03-01T00:00:00Z",
          },
        ],
        total: 1,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccounts,
      });

      const { result } = renderHook(() => useAccounts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockAccounts);
    });
  });

  describe("useCreatePost", () => {
    it("should create post successfully", async () => {
      const newPost = {
        id: "post-new",
        caption: "New post",
        status: "draft",
        scheduled_at: null,
        created_at: "2026-03-01T00:00:00Z",
        updated_at: "2026-03-01T00:00:00Z",
        social_accounts: [],
        media: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => newPost,
      });

      const { result } = renderHook(() => useCreatePost(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        caption: "New post",
        isDraft: true,
        social_accounts: [],
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: "New post",
          isDraft: true,
          social_accounts: [],
        }),
      });
    });
  });
});
