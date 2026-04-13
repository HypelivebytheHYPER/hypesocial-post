"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TikTokIcon } from "@/components/icons/social-icons";
import type { SocialAccount } from "@/types/post-for-me-types";

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: TikTokIcon,
  tiktok_business: TikTokIcon,
};

const platformColors: Record<string, string> = {
  instagram: "from-pink-500 via-purple-500 to-orange-400",
  facebook: "from-blue-600 to-blue-500",
  twitter: "from-slate-800 to-slate-700 dark:from-slate-200 dark:to-slate-300",
  linkedin: "from-blue-700 to-blue-600",
  youtube: "from-red-600 to-red-500",
  tiktok: "from-black to-slate-900",
  tiktok_business: "from-cyan-500 to-pink-500",
};

interface PlatformIconBarProps {
  accounts: SocialAccount[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function PlatformIconBar({ accounts, selectedIds, onToggle }: PlatformIconBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group by platform and get first account of each
  const platformGroups = accounts.reduce((acc, account) => {
    const platform = account.platform.toLowerCase();
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(account);
    return acc;
  }, {} as Record<string, SocialAccount[]>);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 120;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (accounts.length === 0) return null;

  return (
    <div className="relative group">
      {/* Left Arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background/90 backdrop-blur border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-7"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {Object.entries(platformGroups).map(([platform, platformAccounts]) => {
          const Icon = platformIcons[platform] || Globe;
          const gradient = platformColors[platform] || "from-slate-400 to-slate-500";
          
          // Check if any account from this platform is selected
          const selectedFromPlatform = platformAccounts.filter((a) =>
            selectedIds.includes(a.id)
          );
          const isSelected = selectedFromPlatform.length > 0;
          const allSelected = selectedFromPlatform.length === platformAccounts.length;

          // Toggle handler - cycles through: none -> first -> all -> none
          const handleToggle = () => {
            if (!isSelected) {
              // Select first account
              const firstAccount = platformAccounts[0];
              if (firstAccount) onToggle(firstAccount.id);
            } else if (!allSelected) {
              // Select all remaining
              platformAccounts.forEach((a) => {
                if (!selectedIds.includes(a.id)) onToggle(a.id);
              });
            } else {
              // Deselect all
              platformAccounts.forEach((a) => {
                if (selectedIds.includes(a.id)) onToggle(a.id);
              });
            }
          };

          return (
            <motion.button
              key={platform}
              onClick={handleToggle}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                "border-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                isSelected
                  ? cn("bg-gradient-to-br", gradient, "border-transparent text-white shadow-md")
                  : "bg-muted border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
              )}
              title={`${platform} (${selectedFromPlatform.length}/${platformAccounts.length})`}
            >
              <Icon className="w-5 h-5" />
              
              {/* Selection indicator dot */}
              {isSelected && !allSelected && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
              )}
              
              {/* Count badge for multiple accounts */}
              {platformAccounts.length > 1 && isSelected && (
                <span className="absolute -bottom-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-medium flex items-center justify-center border-2 border-background">
                  {selectedFromPlatform.length}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background/90 backdrop-blur border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
