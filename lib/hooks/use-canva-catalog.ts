/**
 * Canva Catalog Hooks - TanStack Query
 * @module lib/hooks/use-canva-catalog
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

// ==================== Query Keys ====================

export const canvaCatalogKeys = {
  all: ["canva-catalog"] as const,
  campaigns: () => [...canvaCatalogKeys.all, "campaigns"] as const,
  campaign: (id: string) => [...canvaCatalogKeys.all, "campaign", id] as const,
  products: (campaignId: string) => [...canvaCatalogKeys.all, "products", campaignId] as const,
  pages: (campaignId: string) => [...canvaCatalogKeys.all, "pages", campaignId] as const,
};

// ==================== Types ====================

export interface Campaign {
  record_id: string;
  Name: string;
  "Date Start"?: string;
  "Date End"?: string;
  Status?: string;
}

export interface Product {
  record_id: string;
  "Campaign ID": string;
  SKU?: string;
  Name: string;
  Price: string;
  Promo?: string;
  "Image URL": string;
  Category?: string;
  "Sort Order"?: number;
}

export interface Page {
  record_id: string;
  "Campaign ID": string;
  "Page Name": string;
  "Template ID": string;
  "Mappings JSON": string;
  "Design ID"?: string;
  "Resize Jobs JSON"?: string;
  "Export Jobs JSON"?: string;
  "Layers JSON"?: string;
  "Sort Order"?: number;
}

// ==================== Campaigns ====================

export function useCanvaCampaigns() {
  return useQuery<{ data: Campaign[] }, Error>({
    queryKey: canvaCatalogKeys.campaigns(),
    queryFn: async () => apiClient("/api/canva/campaigns"),
    staleTime: 1000 * 30,
  });
}

export function useCreateCanvaCampaign() {
  const queryClient = useQueryClient();
  return useMutation<{ record_id: string }, Error, Partial<Campaign>>({
    mutationFn: async (body) => apiClient("/api/canva/campaigns", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canvaCatalogKeys.campaigns() });
      toast.success("Campaign created");
    },
    onError: (error) => toast.error(`Failed to create campaign: ${error.message}`),
  });
}

export function useUpdateCanvaCampaign() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { record_id: string; fields: Partial<Campaign> }>({
    mutationFn: async ({ record_id, fields }) =>
      apiClient(`/api/canva/campaigns/${record_id}`, { method: "PATCH", body: JSON.stringify(fields) }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: canvaCatalogKeys.campaigns() });
      queryClient.invalidateQueries({ queryKey: canvaCatalogKeys.campaign(vars.record_id) });
      toast.success("Campaign updated");
    },
    onError: (error) => toast.error(`Failed to update campaign: ${error.message}`),
  });
}

export function useDeleteCanvaCampaign() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (record_id) => apiClient(`/api/canva/campaigns/${record_id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canvaCatalogKeys.campaigns() });
      toast.success("Campaign deleted");
    },
    onError: (error) => toast.error(`Failed to delete campaign: ${error.message}`),
  });
}

// ==================== Products ====================

export function useCanvaProducts(campaignId: string) {
  return useQuery<{ data: Product[] }, Error>({
    queryKey: canvaCatalogKeys.products(campaignId),
    queryFn: async () => apiClient(`/api/canva/campaigns/${campaignId}/products`),
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  });
}

export function useCreateCanvaProducts() {
  const queryClient = useQueryClient();
  return useMutation<{ record_ids: string[] }, Error, { campaignId: string; products: Omit<Product, "record_id">[] }>({
    mutationFn: async ({ campaignId, products }) =>
      apiClient(`/api/canva/campaigns/${campaignId}/products`, { method: "POST", body: JSON.stringify(products) }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: canvaCatalogKeys.products(vars.campaignId) });
      toast.success("Products added");
    },
    onError: (error) => toast.error(`Failed to add products: ${error.message}`),
  });
}

export function useUpdateCanvaProducts() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean },
    Error,
    { campaignId: string; updates: Array<{ record_id: string; fields: Partial<Product> }> }
  >({
    mutationFn: async ({ campaignId, updates }) =>
      apiClient(`/api/canva/campaigns/${campaignId}/products`, { method: "PATCH", body: JSON.stringify(updates) }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: canvaCatalogKeys.products(vars.campaignId) });
      toast.success("Products updated");
    },
    onError: (error) => toast.error(`Failed to update products: ${error.message}`),
  });
}

export function useDeleteCanvaProducts() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { campaignId: string; recordIds: string[] }>({
    mutationFn: async ({ campaignId, recordIds }) =>
      apiClient(`/api/canva/campaigns/${campaignId}/products`, { method: "DELETE", body: JSON.stringify(recordIds) }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: canvaCatalogKeys.products(vars.campaignId) });
      toast.success("Products deleted");
    },
    onError: (error) => toast.error(`Failed to delete products: ${error.message}`),
  });
}

// ==================== Pages ====================

export function useCanvaPages(campaignId: string) {
  return useQuery<{ data: Page[] }, Error>({
    queryKey: canvaCatalogKeys.pages(campaignId),
    queryFn: async () => apiClient(`/api/canva/campaigns/${campaignId}/pages`),
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  });
}

export function useCreateCanvaPage() {
  const queryClient = useQueryClient();
  return useMutation<{ record_id: string }, Error, { campaignId: string; page: Omit<Page, "record_id"> }>({
    mutationFn: async ({ campaignId, page }) =>
      apiClient(`/api/canva/campaigns/${campaignId}/pages`, { method: "POST", body: JSON.stringify(page) }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: canvaCatalogKeys.pages(vars.campaignId) });
      toast.success("Page created");
    },
    onError: (error) => toast.error(`Failed to create page: ${error.message}`),
  });
}

export function useUpdateCanvaPage() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { campaignId: string; pageId: string; fields: Partial<Page> }>({
    mutationFn: async ({ pageId, fields }) =>
      apiClient(`/api/canva/pages/${pageId}`, { method: "PATCH", body: JSON.stringify(fields) }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: canvaCatalogKeys.pages(vars.campaignId) });
      toast.success("Page updated");
    },
    onError: (error) => toast.error(`Failed to update page: ${error.message}`),
  });
}

export function useDeleteCanvaPage() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { campaignId: string; pageId: string }>({
    mutationFn: async ({ pageId }) => apiClient(`/api/canva/pages/${pageId}`, { method: "DELETE" }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: canvaCatalogKeys.pages(vars.campaignId) });
      toast.success("Page deleted");
    },
    onError: (error) => toast.error(`Failed to delete page: ${error.message}`),
  });
}
