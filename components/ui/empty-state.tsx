"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action link */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Visual variant */
  variant?: "default" | "compact" | "card";
  /** Custom className */
  className?: string;
}

/**
 * Empty State Component
 * 
 * Used when there's no data to display but the space is reserved for content.
 * Provides context and clear next steps to the user.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={FileText}
 *   title="No posts yet"
 *   description="Create your first post to get started"
 *   action={{ label: "Create Post", onClick: () => {} }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
  className,
}: EmptyStateProps) {
  const variants = {
    default: "py-16 px-8",
    compact: "py-8 px-6",
    card: "py-12 px-8 rounded-2xl border border-dashed border-border-default bg-bg-elevated",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variants[variant],
        className
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-brand-subtle mb-6",
          variant === "compact" ? "w-12 h-12" : "w-16 h-16"
        )}
      >
        <Icon
          className={cn(
            "text-brand",
            variant === "compact" ? "w-6 h-6" : "w-8 h-8"
          )}
        />
      </div>

      {/* Title */}
      <h3
        className={cn(
          "font-semibold text-text-primary mb-2",
          variant === "compact" ? "text-base" : "text-lg"
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-text-secondary max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Empty States for common scenarios
 */

import { FileText, Users, BarChart3, ImageIcon, Search } from "lucide-react";

export function EmptyPostsState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No posts yet"
      description="Create your first post to start publishing across your social channels."
      action={onCreate ? { label: "Create Post", onClick: onCreate } : undefined}
    />
  );
}

export function EmptyAccountsState({ onConnect }: { onConnect?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No accounts connected"
      description="Connect your social media accounts to start publishing content."
      action={onConnect ? { label: "Connect Account", onClick: onConnect } : undefined}
    />
  );
}

export function EmptyAnalyticsState() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No analytics data"
      description="Analytics will appear once your posts start getting engagement."
    />
  );
}

export function EmptyMediaState({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={ImageIcon}
      title="No media files"
      description="Upload images or videos to use in your posts."
      action={onUpload ? { label: "Upload Media", onClick: onUpload } : undefined}
      variant="compact"
    />
  );
}

export function EmptySearchState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
      variant="compact"
    />
  );
}
