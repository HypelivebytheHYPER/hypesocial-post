import { ComponentType } from "react";
import {
  XIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  TikTokBusinessIcon,
  YouTubeIcon,
  PinterestIcon,
  IconProps,
} from "@/components/icons/social-icons";

export interface SocialPlatform {
  /** Unique identifier for the platform */
  id: string;
  /** Display name */
  name: string;
  /** Company/owner name */
  handle: string;
  /** Icon component */
  Icon: ComponentType<IconProps>;
  /** Background color class for the platform badge */
  color: string;
  /** Text color class for the platform name */
  textColor: string;
  /** Whether the platform supports video content */
  supportsVideo: boolean;
  /** Whether the platform supports image content */
  supportsImage: boolean;
  /** Maximum character limit (null if no limit) */
  characterLimit: number | null;
  /** Connected status (for UI state) */
  connected?: boolean;
  /** Username when connected */
  username?: string;
}

/**
 * Centralized social platform definitions with official SVG icons
 * Used across the dashboard, accounts, posts, and moodboard pages
 */
export const socialPlatforms: SocialPlatform[] = [
  {
    id: "x",
    name: "X",
    handle: "Twitter",
    Icon: XIcon,
    color: "bg-slate-900",
    textColor: "text-slate-900",
    supportsVideo: true,
    supportsImage: true,
    characterLimit: 280,
  },
  {
    id: "facebook",
    name: "Facebook",
    handle: "Meta",
    Icon: FacebookIcon,
    color: "bg-blue-600",
    textColor: "text-blue-600",
    supportsVideo: true,
    supportsImage: true,
    characterLimit: 63206,
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "Meta",
    Icon: InstagramIcon,
    color: "bg-gradient-to-br from-purple-500 to-pink-500",
    textColor: "text-pink-600",
    supportsVideo: true,
    supportsImage: true,
    characterLimit: 2200,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "Microsoft",
    Icon: LinkedInIcon,
    color: "bg-blue-700",
    textColor: "text-blue-700",
    supportsVideo: true,
    supportsImage: true,
    characterLimit: 3000,
  },
  {
    id: "tiktok",
    name: "TikTok",
    handle: "ByteDance",
    Icon: TikTokIcon,
    color: "bg-slate-900",
    textColor: "text-slate-900",
    supportsVideo: true,
    supportsImage: true,
    characterLimit: 2200,
  },
  {
    id: "tiktok_business",
    name: "TikTok Business",
    handle: "ByteDance",
    Icon: TikTokBusinessIcon,
    color: "bg-gradient-to-r from-cyan-500 to-pink-500",
    textColor: "text-pink-600",
    supportsVideo: true,
    supportsImage: true,
    characterLimit: 2200,
    // TikTok Business API provides advanced analytics:
    // - total_time_watched, average_time_watched
    // - video_view_retention graphs
    // - audience demographics
    // - Custom thumbnails support
  },
  {
    id: "youtube",
    name: "YouTube",
    handle: "Google",
    Icon: YouTubeIcon,
    color: "bg-red-600",
    textColor: "text-red-600",
    supportsVideo: true,
    supportsImage: false,
    characterLimit: null,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    handle: "Pinterest Inc.",
    Icon: PinterestIcon,
    color: "bg-red-700",
    textColor: "text-red-700",
    supportsVideo: true,
    supportsImage: true,
    characterLimit: 500,
  },
];

/**
 * Get a platform by its ID
 */
export function getPlatformById(id: string): SocialPlatform | undefined {
  return socialPlatforms.find((p) => p.id === id.toLowerCase());
}

/**
 * Get a platform by its name (case-insensitive)
 */
export function getPlatformByName(name: string): SocialPlatform | undefined {
  return socialPlatforms.find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  );
}

/**
 * Get platform icon component by platform ID
 */
export function getPlatformIcon(
  id: string,
): ComponentType<IconProps> | undefined {
  return getPlatformById(id)?.Icon;
}

/**
 * Platform icons map for quick lookup by platform ID
 * Useful for mapping API responses to icons
 */
export const platformIconsMap: Record<string, ComponentType<IconProps>> = {
  x: XIcon,
  twitter: XIcon,
  facebook: FacebookIcon,
  fb: FacebookIcon,
  instagram: InstagramIcon,
  ig: InstagramIcon,
  linkedin: LinkedInIcon,
  li: LinkedInIcon,
  tiktok: TikTokIcon,
  tiktok_business: TikTokBusinessIcon,
  youtube: YouTubeIcon,
  yt: YouTubeIcon,
  pinterest: PinterestIcon,
};

/**
 * Get connected platforms (for UI state management)
 * Returns platforms with their connected status set
 */
export function getPlatformsWithStatus(
  connectedIds: string[],
  usernameMap?: Record<string, string>,
): SocialPlatform[] {
  return socialPlatforms.map((platform) => ({
    ...platform,
    connected: connectedIds.includes(platform.id),
    username: usernameMap?.[platform.id],
  }));
}

/**
 * Default connected platforms for initial state
 */
export const defaultConnectedPlatforms = ["x", "facebook", "linkedin"];
