import type { SocialPost } from "@/types/post-for-me-types";

// ============================================
// DRAG & DROP TYPES
// ============================================
export interface DragItem {
  id: string;
  type: "post" | "media" | "template";
  data: unknown;
}

export interface DragAndDropState<T extends DragItem> {
  isDragging: boolean;
  draggedItem: T | null;
  dragOverId: string | null;
  dragOverColumn: string | null;
  handleDragStart: (item: T) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, targetId?: string, columnId?: string) => void;
  handleDrop: (e: React.DragEvent, targetId?: string, columnId?: string) => { item: T; targetId?: string; columnId?: string } | null;
}

// ============================================
// BULK SELECTION TYPES
// ============================================
export interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (ids: string[]) => Promise<void> | void;
  variant?: "default" | "destructive" | "primary";
}

export interface SelectionState {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  toggleSelection: (id: string) => void;
  toggleAll: () => void;
  clearSelection: () => void;
  selectRange: (startId: string, endId: string) => void;
}

// ============================================
// CALENDAR TYPES
// ============================================
export type CalendarViewMode = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string; // ISO date string
  post?: SocialPost;
  status: "draft" | "scheduled" | "processing" | "processed" | "failed";
  platform?: string;
  color?: string;
}

export interface CalendarViewState {
  mode: CalendarViewMode;
  currentDate: Date;
  events: CalendarEvent[];
  onEventMove?: (eventId: string, newDate: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date) => void;
}

// ============================================
// MEDIA LIBRARY TYPES
// ============================================
export interface MediaAsset {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: "image" | "video";
  name: string;
  size: number;
  dimensions?: { width: number; height: number };
  duration?: number;
  createdAt: string;
  tags: string[];
  usedInPosts: number;
}

export interface MediaUploadState {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  result?: MediaAsset;
}

export interface MediaLibraryState {
  assets: MediaAsset[];
  selectedAssets: Set<string>;
  filter: {
    type: "all" | "image" | "video";
    tags: string[];
    search: string;
  };
  viewMode: "grid" | "list";
  sortBy: "date" | "name" | "size" | "usage";
}

// ============================================
// TEMPLATE TYPES
// ============================================
export type TemplateCategory = "promotional" | "engagement" | "educational" | "announcement" | "custom";

export interface PostTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: TemplateCategory;
  tags: string[];
  platforms: string[];
  media?: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// COLLABORATION TYPES
// ============================================
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  resolved: boolean;
}

export interface Assignment {
  postId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
  status: "pending" | "in_review" | "approved" | "rejected";
}

// ============================================
// PERFORMANCE TYPES
// ============================================
export interface PostMetrics {
  postId: string;
  impressions: number;
  engagements: number;
  clicks: number;
  shares: number;
  comments: number;
  likes: number;
  reach: number;
  engagementRate: number;
  performanceScore: "high" | "medium" | "low";
  comparisonToAverage: number;
}

// ============================================
// QUICK EDIT TYPES
// ============================================
export interface QuickEditField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "datetime" | "platforms";
  value: unknown;
  options?: { label: string; value: string }[];
}

// ============================================
// PREVIEW TYPES
// ============================================
export interface PlatformPreview {
  platform: string;
  previewUrl: string;
  characterLimit: number;
  mediaLimit: number;
  supportedMedia: ("image" | "video" | "carousel")[];
  aspectRatios: string[];
}

// ============================================
// ANIMATION TYPES
// ============================================
export interface AnimationConfig {
  duration: number;
  easing: string;
  stagger?: number;
}

export interface TransitionState {
  entering: boolean;
  exiting: boolean;
  mounted: boolean;
}
