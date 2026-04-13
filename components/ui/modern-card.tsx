"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

/**
 * Modern Card Component - Tsuika-inspired Design
 * 
 * Features:
 * - Extra-large rounded corners (not square!)
 * - Soft shadows instead of hard borders
 * - Glassmorphism option
 * - Gradient backgrounds
 * - Smooth hover transitions
 */

const modernCardVariants = cva(
  "relative overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        // Soft shadow card - no harsh borders
        soft: [
          "rounded-[2rem]",
          "bg-white dark:bg-slate-900/80",
          "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
          "dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          "hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]",
          "dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]",
          "hover:-translate-y-1",
        ],
        // Glassmorphism card
        glass: [
          "rounded-[2rem]",
          "bg-white/70 dark:bg-slate-900/60",
          "backdrop-blur-xl",
          "border border-white/20 dark:border-white/10",
          "shadow-[0_8px_32px_rgba(0,0,0,0.1)]",
          "hover:bg-white/80 dark:hover:bg-slate-900/70",
          "hover:-translate-y-1",
        ],
        // Gradient background card
        gradient: [
          "rounded-[2rem]",
          "bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10",
          "dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20",
          "border border-blue-200/50 dark:border-blue-700/30",
          "shadow-[0_4px_24px_rgba(59,130,246,0.15)]",
          "hover:shadow-[0_8px_32px_rgba(59,130,246,0.25)]",
        ],
        // Minimal clean card
        minimal: [
          "rounded-[1.5rem]",
          "bg-slate-50 dark:bg-slate-800/50",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          "transition-colors",
        ],
        // Floating card with colored border accent
        floating: [
          "rounded-[2rem]",
          "bg-white dark:bg-slate-900",
          "shadow-[0_4px_20px_rgba(0,0,0,0.05)]",
          "border-l-4 border-blue-500",
          "hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]",
          "hover:translate-x-1",
        ],
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "soft",
      padding: "md",
      interactive: false,
    },
  }
);

export interface ModernCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modernCardVariants> {
  /** Optional top accent line */
  accent?: boolean;
  /** Optional gradient overlay at top */
  topGradient?: boolean;
}

const ModernCard = forwardRef<HTMLDivElement, ModernCardProps>(
  (
    {
      className,
      variant,
      padding,
      interactive,
      accent = false,
      topGradient = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          modernCardVariants({ variant, padding, interactive }),
          className
        )}
        {...props}
      >
        {/* Top accent line */}
        {accent && (
          <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full" />
        )}
        
        {/* Top gradient overlay */}
        {topGradient && (
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
        )}
        
        {children}
      </div>
    );
  }
);
ModernCard.displayName = "ModernCard";

/**
 * Modern Button - Pill-shaped, soft shadows
 */
const modernButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        primary: [
          "px-6 py-3",
          "rounded-full",
          "bg-blue-500",
          "text-white",
          "shadow-[0_4px_14px_rgba(59,130,246,0.4)]",
          "hover:shadow-[0_6px_20px_rgba(59,130,246,0.5)]",
          "hover:bg-blue-600",
          "active:scale-95",
        ],
        secondary: [
          "px-6 py-3",
          "rounded-full",
          "bg-white dark:bg-slate-800",
          "text-slate-700 dark:text-slate-200",
          "shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
          "hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)]",
          "border border-slate-200 dark:border-slate-700",
          "active:scale-95",
        ],
        ghost: [
          "px-4 py-2",
          "rounded-full",
          "text-slate-600 dark:text-slate-400",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          "active:scale-95",
        ],
        gradient: [
          "px-6 py-3",
          "rounded-full",
          "bg-gradient-to-r from-blue-500 to-purple-500",
          "text-white",
          "shadow-[0_4px_14px_rgba(99,102,241,0.4)]",
          "hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)]",
          "hover:opacity-90",
          "active:scale-95",
        ],
      },
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg px-8 py-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ModernButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof modernButtonVariants> {}

const ModernButton = forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(modernButtonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
ModernButton.displayName = "ModernButton";

/**
 * Modern Input - Soft, rounded, no harsh borders
 */
const ModernInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full px-5 py-3",
        "rounded-2xl",
        "bg-white dark:bg-slate-800",
        "border-0",
        "shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]",
        "dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        "placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        "transition-shadow",
        className
      )}
      {...props}
    />
  );
});
ModernInput.displayName = "ModernInput";

/**
 * Modern Badge - Pill-shaped, soft colors
 */
const modernBadgeVariants = cva(
  "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
        green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
        red: "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ModernBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof modernBadgeVariants> {}

const ModernBadge = forwardRef<HTMLSpanElement, ModernBadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(modernBadgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
ModernBadge.displayName = "ModernBadge";

/**
 * Blob Background - Organic shapes (not squares!)
 */
function BlobBackground({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Blob 1 - Blue */}
      <div 
        className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"
        style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
      />
      {/* Blob 2 - Purple */}
      <div 
        className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
        style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
      />
      {/* Blob 3 - Pink */}
      <div 
        className="absolute -bottom-40 left-1/3 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl"
        style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
      />
    </div>
  );
}

export {
  ModernCard,
  ModernButton,
  ModernInput,
  ModernBadge,
  BlobBackground,
  modernCardVariants,
  modernButtonVariants,
};
