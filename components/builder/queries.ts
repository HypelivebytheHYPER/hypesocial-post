"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BuilderTemplateV2, Page } from "./types";

const TEMPLATES_KEY = ["builder", "templates"] as const;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const json = (await res.json()) as { data?: T; error?: string };
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  if (json.error) throw new Error(json.error);
  return json.data as T;
}

export function useTemplates() {
  return useQuery<BuilderTemplateV2[]>({
    queryKey: TEMPLATES_KEY,
    queryFn: () => apiFetch<BuilderTemplateV2[]>("/api/builder/templates"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveTemplate() {
  const queryClient = useQueryClient();
  return useMutation<
    BuilderTemplateV2,
    Error,
    {
      name: string;
      format: string;
      pages: Page[];
      theme: Record<string, unknown>;
    }
  >({
    mutationFn: async ({ name, format, pages, theme }) => {
      const payload = {
        name,
        format,
        pages,
        theme,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return apiFetch<BuilderTemplateV2>("/api/builder/templates", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success("Template saved");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save template");
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiFetch(`/api/builder/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success("Template deleted");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete template");
    },
  });
}

export function useRenameTemplate() {
  const queryClient = useQueryClient();
  return useMutation<BuilderTemplateV2, Error, { id: string; name: string }>({
    mutationFn: ({ id, name }) =>
      apiFetch<BuilderTemplateV2>(`/api/builder/templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), updatedAt: Date.now() }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success("Template renamed");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to rename template");
    },
  });
}
