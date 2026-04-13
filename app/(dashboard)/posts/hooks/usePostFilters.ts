"use client";

import { useState, useMemo } from "react";
import type { SocialPost } from "@/types/post-for-me-types";
import type { StatusFilter, ViewMode } from "../config";

interface UsePostFiltersResult {
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Status filter
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  
  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Filtered data
  filteredPosts: SocialPost[];
  postsByStatus: Record<string, SocialPost[]>;
  
  // Stats
  totalCount: number;
  filteredCount: number;
}

export function usePostFilters(posts: SocialPost[]): UsePostFiltersResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("board");

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus =
        statusFilter === "all" || post.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [posts, searchQuery, statusFilter]);

  const postsByStatus = useMemo(() => {
    const grouped: Record<string, SocialPost[]> = {
      draft: [],
      scheduled: [],
      processing: [],
      processed: [],
      failed: [],
    };
    
    filteredPosts.forEach((post) => {
      const status = post.status;
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(post);
    });
    
    return grouped;
  }, [filteredPosts]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    filteredPosts,
    postsByStatus,
    totalCount: posts.length,
    filteredCount: filteredPosts.length,
  };
}
