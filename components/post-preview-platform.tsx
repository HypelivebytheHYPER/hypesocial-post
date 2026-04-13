"use client";

import { cn } from "@/lib/utils";
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Repeat2,
  BarChart3,
  Send,
  ImageIcon
} from "lucide-react";
import { PLATFORM_CHARACTER_LIMITS } from "@/types/post-for-me-types";

interface PlatformPreviewProps {
  caption: string;
  media: { url: string }[];
  account: {
    id: string;
    platform: string;
    username?: string | null;
    profile_photo_url?: string | null;
  };
  isLoading?: boolean;
}

const PLATFORM_CONFIG: Record<string, {
  icon: React.ElementType;
  colors: { header: string; accent: string };
  name: string;
}> = {
  instagram: {
    icon: Instagram,
    colors: { 
      header: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400",
      accent: "text-pink-500"
    },
    name: "Instagram"
  },
  facebook: {
    icon: Facebook,
    colors: { 
      header: "bg-[#1877F2]",
      accent: "text-[#1877F2]"
    },
    name: "Facebook"
  },
  twitter: {
    icon: Twitter,
    colors: { 
      header: "bg-black",
      accent: "text-black dark:text-white"
    },
    name: "X (Twitter)"
  },
  x: {
    icon: Twitter,
    colors: { 
      header: "bg-black",
      accent: "text-black dark:text-white"
    },
    name: "X"
  },
  linkedin: {
    icon: Linkedin,
    colors: { 
      header: "bg-[#0A66C2]",
      accent: "text-[#0A66C2]"
    },
    name: "LinkedIn"
  },
  youtube: {
    icon: Youtube,
    colors: { 
      header: "bg-[#FF0000]",
      accent: "text-[#FF0000]"
    },
    name: "YouTube"
  },
  tiktok: {
    icon: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    colors: { 
      header: "bg-black",
      accent: "text-white"
    },
    name: "TikTok"
  },
  threads: {
    icon: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.695 6.54 2.717 1.986-.013 3.758-.46 5.268-1.33 1.816-1.043 3.013-2.574 3.555-4.55.204-.742.312-1.578.32-2.485l.001-1.092h-4.41v-2.03h6.61l.001 1.041c-.003 1.168-.143 2.256-.417 3.234-.73 2.668-2.296 4.79-4.653 6.143-1.977 1.123-4.332 1.69-7.266 1.707z"/>
      </svg>
    ),
    colors: { 
      header: "bg-black",
      accent: "text-black dark:text-white"
    },
    name: "Threads"
  },
  bluesky: {
    icon: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 2.435 0 2.76c0 .8.684 3.323 1.276 4.796.568 1.408 1.32 2.916 2.442 2.916.63 0 1.09-.406 1.71-.406.598 0 1.012.406 1.712.406 1.122 0 1.972-1.552 2.54-2.96.338-.837.613-1.722.828-2.548-.06-.024-1.173-.48-1.51-1.48zM8.436 5.66c.558-1.028.976-2.113 1.227-3.066.245.938.655 2.02 1.206 3.066.284.536.644 1.07 1.069 1.552-.438.03-.878.095-1.304.195a5.74 5.74 0 0 1-1.95 0 4.967 4.967 0 0 1-1.303-.195c.424-.482.784-1.016 1.055-1.552z"/>
      </svg>
    ),
    colors: { 
      header: "bg-[#0085FF]",
      accent: "text-[#0085FF]"
    },
    name: "Bluesky"
  }
};

// ==================== INSTAGRAM-STYLE PREVIEW ====================
function InstagramPreview({ caption, media, account }: { caption: string; media: { url: string }[]; account: any }) {
  const limit = PLATFORM_CHARACTER_LIMITS.instagram ?? 2200;
  const isOverLimit = caption.length > limit;
  
  // Filter out empty URLs
  const validMedia = media.filter(m => m.url && m.url.trim() !== '');

  return (
    <div className="bg-white dark:bg-black max-w-[375px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-white p-[1px]">
              {account.profile_photo_url ? (
                <img src={account.profile_photo_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-200" />
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{account.username || "username"}</p>
            <p className="text-xs text-slate-500">Original audio</p>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-slate-700" />
      </div>

      {/* Media */}
      {validMedia.length > 0 && validMedia[0]?.url ? (
        <div className="relative bg-slate-100 aspect-square">
          <img 
            src={validMedia[0].url} 
            alt="" 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken images
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {validMedia.length > 1 && (
            <div className="absolute top-2 right-2 bg-slate-900/70 text-white text-xs px-2 py-1 rounded-full">
              1/{validMedia.length}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 aspect-square flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-slate-300" />
        </div>
      )}

      {/* Actions */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-slate-900 hover:scale-110 transition-transform cursor-pointer" />
            <MessageCircle className="w-6 h-6 text-slate-900 hover:scale-110 transition-transform cursor-pointer" />
            <Send className="w-6 h-6 text-slate-900 hover:scale-110 transition-transform cursor-pointer -rotate-45" />
          </div>
          <Bookmark className="w-6 h-6 text-slate-900 hover:scale-110 transition-transform cursor-pointer" />
        </div>

        {/* Likes */}
        <p className="text-sm font-semibold text-slate-900 mb-1">0 likes</p>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-semibold text-slate-900 mr-1">{account.username || "username"}</span>
          <span className={cn("text-slate-900", isOverLimit && "text-rose-500")}>
            {caption || "Your caption will appear here..."}
          </span>
        </div>

        {/* View comments */}
        <p className="text-sm text-slate-500 mt-1">View all 0 comments</p>
        <p className="text-[10px] text-slate-400 uppercase mt-1">Just now</p>
      </div>
    </div>
  );
}

// ==================== X/TWITTER-STYLE PREVIEW ====================
function XPreview({ caption, media, account }: { caption: string; media: { url: string }[]; account: any }) {
  const limit = PLATFORM_CHARACTER_LIMITS.x ?? 280;
  const isOverLimit = caption.length > limit;
  
  // Filter out empty URLs
  const validMedia = media.filter(m => m.url && m.url.trim() !== '');

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="flex gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="shrink-0">
          {account.profile_photo_url ? (
            <img src={account.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-bold text-slate-900 text-[15px]">
              {account.username || "Display Name"}
            </span>
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span className="text-slate-500 text-[15px]">@{account.username || "username"} · Just now</span>
            <MoreHorizontal className="w-4 h-4 text-slate-500 ml-auto" />
          </div>

          {/* Caption */}
          <p className={cn("text-[15px] text-slate-900 whitespace-pre-wrap", isOverLimit && "text-rose-500")}>
            {caption || "Your post content will appear here..."}
          </p>

          {/* Media Grid */}
          {validMedia.length > 0 && (
            <div className={cn(
              "grid gap-0.5 mt-3 rounded-2xl overflow-hidden border border-slate-200",
              validMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"
            )}>
              {validMedia.slice(0, 4).map((m, i) => (
                <div key={i} className="aspect-video bg-slate-100 relative">
                  <img 
                    src={m.url} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 max-w-[425px]">
            <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-sm">0</span>
            </button>
            <button className="flex items-center gap-2 text-slate-500 hover:text-emerald-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-emerald-50">
                <Repeat2 className="w-4 h-4" />
              </div>
              <span className="text-sm">0</span>
            </button>
            <button className="flex items-center gap-2 text-slate-500 hover:text-rose-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-rose-50">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-sm">0</span>
            </button>
            <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-sm">0</span>
            </button>
            <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== FACEBOOK-STYLE PREVIEW ====================
function FacebookPreview({ caption, media, account }: { caption: string; media: { url: string }[]; account: any }) {
  const validMedia = media.filter(m => m.url && m.url.trim() !== '');
  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {account.profile_photo_url ? (
            <img src={account.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200" />
          )}
          <div>
            <p className="font-semibold text-slate-900 text-[15px]">
              {account.username || "Page Name"}
            </p>
            <p className="text-xs text-slate-500">Just now · 🌎</p>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-slate-500" />
      </div>

      {/* Caption */}
      <div className="px-4 pb-3">
        <p className="text-[17px] text-slate-900">
          {caption || "What's on your mind?"}
        </p>
      </div>

      {/* Media */}
      {validMedia.length > 0 && validMedia[0]?.url ? (
        <div className="bg-slate-100">
          <img 
            src={validMedia[0].url} 
            alt="" 
            className="w-full max-h-[500px] object-contain mx-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : null}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">👍</div>
            <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs">❤️</div>
          </div>
          <span className="text-sm text-slate-500">0</span>
        </div>
        <span className="text-sm text-slate-500">0 comments · 0 shares</span>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.77 11h-4.23l1.52-4.94C16.38 5.03 15.54 4 14.38 4c-.75 0-1.4.43-1.73 1.06L9.83 11H5v2h4.23l-1.52 4.94c-.17.55.11 1.15.69 1.38.19.08.39.12.6.12.75 0 1.4-.43 1.73-1.06l3.83-7.24H19v-2h-1.23z"/>
          </svg>
          <span className="text-sm font-semibold">Like</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">Comment</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-semibold">Share</span>
        </button>
      </div>
    </div>
  );
}

// ==================== LINKEDIN-STYLE PREVIEW ====================
function LinkedInPreview({ caption, media, account }: { caption: string; media: { url: string }[]; account: any }) {
  const validMedia = media.filter(m => m.url && m.url.trim() !== '');
  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      {/* Header */}
      <div className="flex items-start gap-2 p-3">
        {account.profile_photo_url ? (
          <img src={account.profile_photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-200" />
        )}
        <div className="flex-1">
          <p className="font-semibold text-slate-900 text-sm">
            {account.username || "Your Name"}
          </p>
          <p className="text-xs text-slate-500">Job Title · Company</p>
          <p className="text-xs text-slate-500">Just now · 🌎</p>
        </div>
        <MoreHorizontal className="w-5 h-5 text-slate-500" />
      </div>

      {/* Caption */}
      <div className="px-3 pb-2">
        <p className="text-sm text-slate-900">
          {caption || "What do you want to talk about?"}
        </p>
      </div>

      {/* Media */}
      {validMedia.length > 0 && validMedia[0]?.url ? (
        <div className="border-y border-slate-100">
          <img 
            src={validMedia[0].url} 
            alt="" 
            className="w-full max-h-[500px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : null}

      {/* Reactions */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">0 reactions</span>
        </div>
        <span className="text-xs text-slate-500">0 comments</span>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center border-t border-slate-100">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.46 11l-3.91-3.91a7 7 0 0 1-1.44-7.66A9.5 9.5 0 1 0 11 19.46l3.91-3.91a5 5 0 0 1 4.55-4.55zM5.71 5.71a7.5 7.5 0 0 1 10.61 0 7.5 7.5 0 0 1 0 10.61 7.5 7.5 0 0 1-10.61 0 7.5 7.5 0 0 1 0-10.61z"/>
          </svg>
          <span className="text-sm font-semibold">Like</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">Comment</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          <Repeat2 className="w-5 h-5" />
          <span className="text-sm font-semibold">Repost</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          <Send className="w-5 h-5" />
          <span className="text-sm font-semibold">Send</span>
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN EXPORT ====================
export function PlatformPreview({ caption, media, account, isLoading }: PlatformPreviewProps) {
  const config = PLATFORM_CONFIG[account.platform] || {
    icon: () => null,
    colors: { header: "bg-gray-400", accent: "text-gray-500" },
    name: account.platform
  };

  const Icon = config.icon;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={cn("h-1", config.colors.header)} />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
            <div className="space-y-1">
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-2 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Render platform-specific preview
  const renderPreview = () => {
    switch (account.platform) {
      case "instagram":
        return <InstagramPreview caption={caption} media={media} account={account} />;
      case "twitter":
      case "x":
        return <XPreview caption={caption} media={media} account={account} />;
      case "facebook":
        return <FacebookPreview caption={caption} media={media} account={account} />;
      case "linkedin":
        return <LinkedInPreview caption={caption} media={media} account={account} />;
      default: {
        // Generic fallback
        const validMedia = media.filter(m => m.url && m.url.trim() !== '');
        return (
          <div className="bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              {account.profile_photo_url ? (
                <img src={account.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
              )}
              <div>
                <p className="font-semibold text-sm text-slate-900">{account.username || "Account"}</p>
                <p className="text-xs text-slate-500">Just now</p>
              </div>
            </div>
            <p className="text-sm text-slate-800 mb-3">{caption || "Your content here..."}</p>
            {validMedia.length > 0 && validMedia[0]?.url ? (
              <img 
                src={validMedia[0].url} 
                alt="" 
                className="w-full rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
          </div>
        );
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Platform Header Bar */}
      <div className={cn("h-1", config.colors.header)} />
      
      {/* Platform Label */}
      <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100 bg-slate-50/80">
        <Icon className={cn("w-4 h-4", config.colors.accent)} />
        <span className="text-xs font-medium text-slate-600">{config.name} Preview</span>
        {PLATFORM_CHARACTER_LIMITS[account.platform] && (
          <span className={cn(
            "text-xs ml-auto font-medium",
            caption.length > (PLATFORM_CHARACTER_LIMITS[account.platform] ?? 0) ? "text-rose-500" : "text-slate-400"
          )}>
            {caption.length}/{PLATFORM_CHARACTER_LIMITS[account.platform] ?? "∞"}
          </span>
        )}
      </div>

      {/* Platform-Specific Preview */}
      {renderPreview()}
    </div>
  );
}
