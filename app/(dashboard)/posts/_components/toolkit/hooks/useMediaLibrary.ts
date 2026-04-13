"use client";

import { useState, useCallback, useMemo } from "react";
import type { MediaAsset, MediaUploadState } from "../types";

export function useMediaLibrary(initialAssets: MediaAsset[] = []) {
  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets);
  const [uploadQueue, setUploadQueue] = useState<MediaUploadState[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = 
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === "all" || asset.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [assets, searchQuery, typeFilter]);

  const addAssets = useCallback((newAssets: MediaAsset[]) => {
    setAssets(prev => [...newAssets, ...prev]);
  }, []);

  const removeAssets = useCallback((ids: string[]) => {
    setAssets(prev => prev.filter(asset => !ids.includes(asset.id)));
  }, []);

  const updateAsset = useCallback((id: string, updates: Partial<MediaAsset>) => {
    setAssets(prev =>
      prev.map(asset =>
        asset.id === id ? { ...asset, ...updates } : asset
      )
    );
  }, []);

  const addToUploadQueue = useCallback((files: FileList) => {
    const newUploads: MediaUploadState[] = Array.from(files).map(file => ({
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: "pending" as const,
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);
    return newUploads;
  }, []);

  const updateUploadProgress = useCallback((id: string, progress: number) => {
    setUploadQueue(prev =>
      prev.map(upload =>
        upload.id === id ? { ...upload, progress } : upload
      )
    );
  }, []);

  const updateUploadStatus = useCallback((id: string, status: MediaUploadState["status"], error?: string) => {
    setUploadQueue(prev =>
      prev.map(upload =>
        upload.id === id ? { ...upload, status, error } : upload
      )
    );
  }, []);

  const completeUpload = useCallback((uploadId: string, asset: MediaAsset) => {
    setUploadQueue(prev => prev.filter(upload => upload.id !== uploadId));
    setAssets(prev => [asset, ...prev]);
  }, []);

  const cancelUpload = useCallback((id: string) => {
    setUploadQueue(prev => prev.filter(upload => upload.id !== id));
  }, []);

  const getAssetsByIds = useCallback((ids: string[]) => {
    return assets.filter(asset => ids.includes(asset.id));
  }, [assets]);

  return {
    assets: filteredAssets,
    allAssets: assets,
    uploadQueue,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    addAssets,
    removeAssets,
    updateAsset,
    addToUploadQueue,
    updateUploadProgress,
    updateUploadStatus,
    completeUpload,
    cancelUpload,
    getAssetsByIds,
  };
}
