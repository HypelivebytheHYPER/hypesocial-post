"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const dashboardCardVariants = cva(
  // Base styles using design tokens
  "relative overflow-hidden rounded-2xl border p-6 transition-shadow duration-150",
  {
    variants: {
      variant: {
        default: [
          // Light mode
          "bg-gradient-to-br from-white to-slate-50",
          "border-slate-200/60",
          "shadow-[0_1px_3px_rgba(148,163,184,0.1)]",
          "hover:shadow-[0_4px_6px_rgba(148,163,184,0.1),0_2px_8px_rgba(14,165,233,0.12)]",
          "hover:-translate-y-0.5",
          // Dark mode
          "dark:from-slate-900 dark:to-slate-800",
          "dark:border-slate-700/50",
          "dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
          "dark:hover:shadow-[0_4px_6px_rgba(0,0,0,0.4),0_2px_8px_rgba(14,165,233,0.15)]",
        ],
        gradient: [
          "bg-gradient-to-br from-blue-500 to-blue-600",
          "border-blue-400/30",
          "shadow-[0_4px_16px_rgba(14,165,233,0.25)]",
          "text-white",
        ],
        soft: [
          "bg-gradient-to-br from-blue-50 to-sky-50",
          "border-blue-100",
          "shadow-[0_1px_3px_rgba(148,163,184,0.08)]",
          "dark:from-blue-950/30 dark:to-sky-950/20",
          "dark:border-blue-800/30",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconContainerVariants = cva(
  "flex items-center justify-center rounded-xl shadow-sm",
  {
    variants: {
      variant: {
        default: [
          "w-12 h-12",
          "bg-gradient-to-br from-blue-500 to-blue-600",
          "text-white",
          "shadow-blue-500/25",
        ],
        soft: [
          "w-12 h-12",
          "bg-gradient-to-br from-blue-100 to-blue-200",
          "text-blue-600",
          "dark:from-blue-900/40 dark:to-blue-800/40",
          "dark:text-blue-400",
        ],
        minimal: [
          "w-10 h-10",
          "bg-slate-100",
          "text-slate-600",
          "dark:bg-slate-800",
          "dark:text-slate-400",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface DashboardCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dashboardCardVariants> {
  /** Card title */
  title: string;
  /** Optional description */
  description?: string;
  /** Icon component */
  icon?: LucideIcon;
  /** Icon variant */
  iconVariant?: VariantProps<typeof iconContainerVariants>["variant"];
  /** Stat value (large number) */
  value?: string | number;
  /** Change indicator (e.g., "+12%") */
  change?: {
    value: string;
    positive: boolean;
  };
  /** Footer content */
  footer?: React.ReactNode;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Premium Dashboard Card Component
 * 
 * Uses design system tokens:
 * - bg-elevated: Card background
 * - shadow-2: Default elevation
 * - space-4/space-6: Padding
 * - text-primary: Title color
 * - text-secondary: Description color
 * 
 * @example
 * ```tsx
 * <DashboardCard
 *   title="Total Posts"
 *   description="Published this month"
 *   icon={FileText}
 *   value="1,234"
 *   change={{ value: "+12%", positive: true }}
 * />
 * ```
 */
export function DashboardCard({
  title,
  description,
  icon: Icon,
  iconVariant = "default",
  value,
  change,
  footer,
  action,
  variant,
  className,
  children,
  ...props
}: DashboardCardProps) {
  const isGradient = variant === "gradient";

  return (
    <div
      className={cn(dashboardCardVariants({ variant }), className)}
      {...props}
    >
      {/* Top shine effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={cn(
              "text-lg font-semibold tracking-tight",
              isGradient ? "text-white" : "text-slate-900 dark:text-slate-100"
            )}
          >
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p
              className={cn(
                "mt-1 text-sm",
                isGradient
                  ? "text-blue-100"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              {description}
            </p>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div className={cn(iconContainerVariants({ variant: iconVariant }))}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Value Section */}
      {(value || change) && (
        <div className="mt-6 flex items-baseline gap-3">
          {value && (
            <span
              className={cn(
                "text-3xl font-bold tracking-tight",
                isGradient ? "text-white" : "text-slate-900 dark:text-slate-100"
              )}
            >
              {value}
            </span>
          )}

          {change && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium",
                change.positive
                  ? isGradient
                    ? "bg-white/20 text-white"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : isGradient
                  ? "bg-white/20 text-white"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
              )}
            >
              {change.positive ? "+" : ""}
              {change.value}
            </span>
          )}
        </div>
      )}

      {/* Custom Content */}
      {children && <div className="mt-4">{children}</div>}

      {/* Footer */}
      {(footer || action) && (
        <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
          {footer && (
            <span
              className={cn(
                "text-sm",
                isGradient
                  ? "text-blue-100"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              {footer}
            </span>
          )}

          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "text-sm font-medium transition-colors",
                isGradient
                  ? "text-white hover:text-blue-100"
                  : "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              )}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Dashboard Card Grid
 * Responsive grid layout for multiple cards
 */
export function DashboardCardGrid({
  children,
  className,
  columns = 4,
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
}) {
  const colClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  };

  return (
    <div className={cn("grid gap-4", colClasses[columns], className)}>
      {children}
    </div>
  );
}

/**
 * Pre-built dashboard cards for common use cases
 */

import { FileText, Users, Eye, Heart, TrendingUp, Calendar } from "lucide-react";

export function PostsCard({ count = 0 }: { count?: number }) {
  return (
    <DashboardCard
      title="Total Posts"
      description="Published across all platforms"
      icon={FileText}
      value={count.toLocaleString()}
      change={{ value: "12%", positive: true }}
      action={{ label: "View all", onClick: () => {} }}
    />
  );
}

export function EngagementCard({
  likes = 0,
  comments = 0,
}: {
  likes?: number;
  comments?: number;
}) {
  return (
    <DashboardCard
      title="Engagement"
      description="Likes & comments this month"
      icon={Heart}
      iconVariant="soft"
      value={(likes + comments).toLocaleString()}
      change={{ value: "8%", positive: true }}
    />
  );
}

export function ViewsCard({ views = 0 }: { views?: number }) {
  return (
    <DashboardCard
      title="Total Views"
      description="Post impressions"
      icon={Eye}
      iconVariant="soft"
      value={views.toLocaleString()}
      change={{ value: "24%", positive: true }}
    />
  );
}

export function AccountsCard({ count = 0 }: { count?: number }) {
  return (
    <DashboardCard
      title="Connected Accounts"
      description="Active social platforms"
      icon={Users}
      value={count}
      footer={`${count} platforms connected`}
      action={{ label: "Manage", onClick: () => {} }}
    />
  );
}

export function ScheduledCard({ count = 0 }: { count?: number }) {
  return (
    <DashboardCard
      title="Scheduled"
      description="Upcoming posts"
      icon={Calendar}
      iconVariant="minimal"
      value={count}
      variant="soft"
      action={{ label: "View calendar", onClick: () => {} }}
    />
  );
}

export function TrendingCard() {
  return (
    <DashboardCard
      title="Trending"
      description="Best performing content"
      icon={TrendingUp}
      variant="gradient"
      value="Top 5%"
      change={{ value: "This week", positive: true }}
    />
  );
}
