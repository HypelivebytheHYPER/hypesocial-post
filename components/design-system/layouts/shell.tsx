/**
 * Shell Layout
 * Dashboard shell with sidebar and header
 */

"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import Link from "next/link";

/* ==================== SHELL ==================== */

const shellVariants = cva("min-h-screen flex", {
  variants: {
    variant: {
      sidebar: "",
      topnav: "flex-col",
    },
  },
  defaultVariants: {
    variant: "sidebar",
  },
});

export interface ShellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof shellVariants> {}

const Shell = forwardRef<HTMLDivElement, ShellProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(shellVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Shell.displayName = "Shell";

/* ==================== SIDEBAR ==================== */

const sidebarVariants = cva(
  "fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-background border-r border-border transition-all duration-300",
  {
    variants: {
      width: {
        sm: "w-16",
        md: "w-64",
        lg: "w-72",
      },
      collapsed: {
        true: "w-16",
        false: "",
      },
    },
    defaultVariants: {
      width: "md",
      collapsed: false,
    },
  }
);

export interface SidebarProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sidebarVariants> {}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ className, width, collapsed, ...props }, ref) => {
    return (
      <aside
        ref={ref}
        className={cn(
          sidebarVariants({ width, collapsed }),
          "hidden md:flex",
          className
        )}
        {...props}
      />
    );
  }
);
Sidebar.displayName = "Sidebar";

/* ==================== SIDEBAR HEADER ==================== */

const SidebarHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center h-16 px-4 border-b border-border",
        className
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

/* ==================== SIDEBAR CONTENT ==================== */

const SidebarContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto py-4", className)}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

/* ==================== SIDEBAR FOOTER ==================== */

const SidebarFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "p-4 border-t border-border",
        className
      )}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

/* ==================== SIDEBAR NAVIGATION ==================== */

const SidebarNav = forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => {
  return (
    <nav ref={ref} className={cn("px-2 space-y-1", className)} {...props} />
  );
});
SidebarNav.displayName = "SidebarNav";

/* ==================== SIDEBAR NAV ITEM ==================== */

const sidebarNavItemVariants = cva(
  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
  {
    variants: {
      active: {
        true: "bg-accent text-accent-foreground",
        false:
          "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface SidebarNavItemProps
  extends React.HTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof sidebarNavItemVariants> {
  href?: string;
}

const SidebarNavItem = forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({ className, active, href = "#", ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        className={cn(sidebarNavItemVariants({ active }), className)}
        {...props}
      />
    );
  }
);
SidebarNavItem.displayName = "SidebarNavItem";

/* ==================== MAIN CONTENT AREA ==================== */

const Main = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          "md:ml-64 lg:ml-72", // Match sidebar widths
          className
        )}
        {...props}
      />
    );
  }
);
Main.displayName = "Main";

/* ==================== HEADER ==================== */

const Header = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-40 h-16 flex items-center justify-between px-4 md:px-8",
          "bg-background/80 backdrop-blur-xl",
          "border-b border-border",
          className
        )}
        {...props}
      />
    );
  }
);
Header.displayName = "Header";

/* ==================== HEADER LEFT/RIGHT ==================== */

const HeaderLeft = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("flex items-center gap-4", className)} {...props} />
  );
});
HeaderLeft.displayName = "HeaderLeft";

const HeaderRight = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("flex items-center gap-4", className)} {...props} />
  );
});
HeaderRight.displayName = "HeaderRight";

/* ==================== CONTENT ==================== */

const Content = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 p-4 md:p-6 lg:p-8", className)}
        {...props}
      />
    );
  }
);
Content.displayName = "Content";

/* ==================== MOBILE NAVIGATION ==================== */

const MobileNav = forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => {
  return (
    <nav
      ref={ref}
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        "bg-background border-t border-border",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
      {...props}
    />
  );
});
MobileNav.displayName = "MobileNav";

/* ==================== EXPORTS ==================== */

export {
  Shell,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
  Main,
  Header,
  HeaderLeft,
  HeaderRight,
  Content,
  MobileNav,
  shellVariants,
  sidebarVariants,
  sidebarNavItemVariants,
};
