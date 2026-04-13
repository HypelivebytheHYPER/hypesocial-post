/**
 * Typography Component
 * Text variants for consistent typography across the app
 * 
 * Truncation options:
 * - truncate: Single line with ellipsis (requires max-width or container)
 * - clamp: Multi-line clamp (2, 3, or 4 lines)
 * - break: Word break behavior (words = break-words, all = break-all, none = keep-all)
 */

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const textVariants = cva("", {
  variants: {
    variant: {
      // Headings
      "heading-1":
        "text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100",
      "heading-2":
        "text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100",
      "heading-3":
        "text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100",
      "heading-4":
        "text-xl font-semibold text-slate-900 dark:text-slate-100",
      "heading-5":
        "text-lg font-semibold text-slate-900 dark:text-slate-100",
      "heading-6":
        "text-base font-semibold text-slate-900 dark:text-slate-100",

      // Body text
      "body-large":
        "text-lg leading-relaxed text-slate-600 dark:text-slate-400",
      body: "text-base leading-normal text-slate-600 dark:text-slate-400",
      "body-small":
        "text-sm leading-normal text-slate-600 dark:text-slate-400",
      "body-xs": "text-xs leading-normal text-slate-500 dark:text-slate-500",

      // Special
      caption:
        "text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500",
      label: "text-sm font-medium text-slate-700 dark:text-slate-300",
      helper: "text-xs text-slate-500 dark:text-slate-500",

      // Interactive
      link: "text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline",
      button: "text-sm font-semibold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    truncate: {
      true: "truncate overflow-hidden whitespace-nowrap",
      false: "",
    },
    clamp: {
      none: "",
      2: "line-clamp-2",
      3: "line-clamp-3",
      4: "line-clamp-4",
    },
    break: {
      normal: "break-normal",
      words: "break-words",
      all: "break-all",
      keep: "break-keep",
    },
  },
  defaultVariants: {
    variant: "body",
    align: "left",
    truncate: false,
    clamp: "none",
    break: "normal",
  },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?:
    | "p"
    | "span"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "label"
    | "div"
    | "small"
    | "strong";
  /** Single line truncation with ellipsis (requires max-width container) */
  truncate?: boolean;
  /** Multi-line clamping (2, 3, or 4 lines) */
  clamp?: 2 | 3 | 4 | "none";
  /** Word break behavior */
  break?: "normal" | "words" | "all" | "keep";
}

function Text({
  className,
  variant,
  align,
  truncate,
  clamp,
  break: breakProp,
  as: Component = "p",
  ...props
}: TextProps) {
  return (
    <Component
      className={cn(
        textVariants({ variant, align, truncate, clamp, break: breakProp }),
        className
      )}
      {...props}
    />
  );
}

/* ==================== HEADING SHORTCUTS ==================== */

export interface HeadingProps extends Omit<TextProps, "variant" | "as"> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

function Heading({ level = 1, ...props }: HeadingProps) {
  const variant = `heading-${level}` as const;
  const Component = `h${level}` as const;
  return <Text as={Component} variant={variant} {...props} />;
}

/* ==================== EXPORT ==================== */

export { Text, textVariants, Heading };
