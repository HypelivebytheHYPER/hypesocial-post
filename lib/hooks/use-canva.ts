/**
 * Canva Connect Hooks - TanStack Query
 * @module lib/hooks/use-canva
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

// ==================== Query Keys ====================

export const canvaKeys = {
  all: ["canva"] as const,
  token: () => [...canvaKeys.all, "token"] as const,
  designs: (params?: { continuation?: string; limit?: number; sort_by?: string }) =>
    [...canvaKeys.all, "designs", params ?? {}] as const,
  templates: (params?: { continuation?: string; limit?: number; query?: string }) =>
    [...canvaKeys.all, "templates", params ?? {}] as const,
  dataset: (templateId: string) => [...canvaKeys.all, "dataset", templateId] as const,
  autofill: (jobId: string) => [...canvaKeys.all, "autofill", jobId] as const,
  export: (exportId: string) => [...canvaKeys.all, "export", exportId] as const,
  resize: (jobId: string) => [...canvaKeys.all, "resize", jobId] as const,
  assetUpload: (jobId: string) => [...canvaKeys.all, "asset-upload", jobId] as const,
};

// ==================== Types ====================

interface CanvaTokenStatus {
  connected: boolean;
  configured: boolean;
  scope: string | null;
}

interface CanvaAuthUrlResponse {
  auth_url: string;
}

interface CanvaDesignsQuery {
  continuation?: string;
  limit?: number;
  sort_by?: string;
}

interface CanvaTemplatesQuery {
  continuation?: string;
  limit?: number;
  query?: string;
}

interface CreateAutofillBody {
  brand_template_id: string;
  title?: string;
  data: Record<string, unknown>;
}

interface CreateExportBody {
  designId: string;
  format: Record<string, unknown>;
}

interface CreateResizeBody {
  design_id: string;
  design_type:
    | { type: "Template" }
    | { type: "custom"; width: number; height: number };
}

interface CreateAssetUploadBody {
  name: string;
  url: string;
}

// ==================== Token / Auth ====================

export function useCanvaToken() {
  return useQuery<CanvaTokenStatus, Error>({
    queryKey: canvaKeys.token(),
    queryFn: async () => apiClient<CanvaTokenStatus>("/api/canva/token"),
    staleTime: 1000 * 30,
  });
}

export function useConnectCanva() {
  return useMutation<CanvaAuthUrlResponse, Error, { redirect_path?: string }>({
    mutationFn: async (body) => {
      return apiClient<CanvaAuthUrlResponse>("/api/canva/auth", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (data) => {
      window.location.href = data.auth_url;
    },
    onError: (error) => {
      toast.error(`Failed to start Canva connection: ${error.message}`);
    },
  });
}

export function useDisconnectCanva() {
  const queryClient = useQueryClient();

  return useMutation<CanvaTokenStatus, Error>({
    mutationFn: async () => {
      return apiClient<CanvaTokenStatus>("/api/canva/token", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canvaKeys.token() });
      queryClient.invalidateQueries({ queryKey: canvaKeys.designs() });
      toast.success("Canva disconnected");
    },
    onError: (error) => {
      toast.error(`Failed to disconnect Canva: ${error.message}`);
    },
  });
}

// ==================== Designs ====================

export function useCanvaDesigns(query: CanvaDesignsQuery = {}) {
  const params = new URLSearchParams();
  if (query.continuation) params.set("continuation", query.continuation);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.sort_by) params.set("sort_by", query.sort_by);
  const queryString = params.toString();

  return useQuery<unknown, Error>({
    queryKey: canvaKeys.designs(query),
    queryFn: async () => {
      return apiClient(`/api/canva/designs${queryString ? `?${queryString}` : ""}`);
    },
    enabled: true,
    staleTime: 1000 * 60,
  });
}

// ==================== Brand Templates ====================

export function useCanvaBrandTemplates(query: CanvaTemplatesQuery = {}) {
  const params = new URLSearchParams();
  if (query.continuation) params.set("continuation", query.continuation);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.query) params.set("query", query.query);
  const queryString = params.toString();

  return useQuery<unknown, Error>({
    queryKey: canvaKeys.templates(query),
    queryFn: async () => {
      return apiClient(`/api/canva/templates${queryString ? `?${queryString}` : ""}`);
    },
    enabled: true,
    staleTime: 1000 * 60,
  });
}

export function useCanvaTemplateDataset(templateId: string) {
  return useQuery<unknown, Error>({
    queryKey: canvaKeys.dataset(templateId),
    queryFn: async () => {
      return apiClient(`/api/canva/templates/${templateId}/dataset`);
    },
    enabled: !!templateId,
    staleTime: 1000 * 60,
  });
}

// ==================== Autofill ====================

export function useCreateAutofillJob() {
  return useMutation<unknown, Error, CreateAutofillBody>({
    mutationFn: async (body) => {
      return apiClient("/api/canva/autofills", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onError: (error) => {
      toast.error(`Failed to create autofill job: ${error.message}`);
    },
  });
}

export function useAutofillJob(jobId: string, options?: { refetchInterval?: number | false }) {
  return useQuery<unknown, Error>({
    queryKey: canvaKeys.autofill(jobId),
    queryFn: async () => {
      return apiClient(`/api/canva/autofills/${jobId}`);
    },
    enabled: !!jobId,
    refetchInterval: options?.refetchInterval ?? 3000,
  });
}

// ==================== Export ====================

export function useCreateExportJob() {
  return useMutation<unknown, Error, CreateExportBody>({
    mutationFn: async (body) => {
      return apiClient("/api/canva/exports", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onError: (error) => {
      toast.error(`Failed to create export job: ${error.message}`);
    },
  });
}

export function useExportJob(exportId: string, options?: { refetchInterval?: number | false }) {
  return useQuery<unknown, Error>({
    queryKey: canvaKeys.export(exportId),
    queryFn: async () => {
      return apiClient(`/api/canva/exports/${exportId}`);
    },
    enabled: !!exportId,
    refetchInterval: options?.refetchInterval ?? 3000,
  });
}

// ==================== Resize ====================

export function useCreateResizeJob() {
  return useMutation<unknown, Error, CreateResizeBody>({
    mutationFn: async (body) => {
      return apiClient("/api/canva/resizes", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onError: (error) => {
      toast.error(`Failed to create resize job: ${error.message}`);
    },
  });
}

export function useResizeJob(jobId: string, options?: { refetchInterval?: number | false }) {
  return useQuery<unknown, Error>({
    queryKey: canvaKeys.resize(jobId),
    queryFn: async () => {
      return apiClient(`/api/canva/resizes/${jobId}`);
    },
    enabled: !!jobId,
    refetchInterval: options?.refetchInterval ?? 3000,
  });
}

// ==================== Asset Upload ====================

export function useCreateAssetUploadJob() {
  return useMutation<unknown, Error, CreateAssetUploadBody>({
    mutationFn: async (body) => {
      return apiClient("/api/canva/asset-uploads", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onError: (error) => {
      toast.error(`Failed to create asset upload job: ${error.message}`);
    },
  });
}

export function useAssetUploadJob(jobId: string, options?: { refetchInterval?: number | false }) {
  return useQuery<unknown, Error>({
    queryKey: canvaKeys.assetUpload(jobId),
    queryFn: async () => {
      return apiClient(`/api/canva/asset-uploads/${jobId}`);
    },
    enabled: !!jobId,
    refetchInterval: options?.refetchInterval ?? 3000,
  });
}
