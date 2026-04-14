"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Home,
  Settings,
  FileText,
  Plus,
  Sun,
  Moon,
  BarChart3,
  Layers,
  Users,
  Palette,
  MessageSquare,
  Paintbrush,
  Image as ImageIcon,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
} from "@/components/design-system";
import { pfmKeys } from "@/lib/hooks";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home, prefetch: false },
  { name: "Posts", href: "/posts", icon: FileText, prefetch: true },
  { name: "People", href: "/people", icon: Users, prefetch: true },
  { name: "Chat", href: "/chat", icon: MessageSquare, prefetch: true },
  { name: "Analytics", href: "/analytics", icon: BarChart3, prefetch: true },
  { name: "Accounts", href: "/accounts", icon: Layers, prefetch: true },
  { name: "Builder", href: "/builder", icon: Paintbrush, prefetch: false },
  { name: "Canva", href: "/canva/editor", icon: Palette, prefetch: false },
  { name: "Studio", href: "/studio", icon: ImageIcon, prefetch: false },
];

export function SidebarNavigation() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => setMounted(true), []);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sidebar className="hidden md:flex">
      {/* Header with Logo */}
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="https://pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev/HypeSocial.png"
            alt="HypePost"
            width={40}
            height={40}
            priority
            className="w-10 h-10 rounded-xl shadow-sm"
          />
          <span className="text-lg font-bold text-foreground">
            HypePost
          </span>
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarNav aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <SidebarNavItem
                key={item.name}
                href={item.href}
                active={active}
                aria-current={active ? "page" : undefined}
                className="group"
                onMouseEnter={() => {
                  // Prefetch data on hover for instant navigation
                  if (item.prefetch && item.href === "/posts") {
                    queryClient.prefetchQuery({
                      queryKey: pfmKeys.posts(),
                      staleTime: 30 * 1000,
                    });
                  }
                  if (item.prefetch && item.href === "/accounts") {
                    queryClient.prefetchQuery({
                      queryKey: pfmKeys.accounts(),
                      staleTime: 60 * 1000,
                    });
                  }
                }}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
              </SidebarNavItem>
            );
          })}
        </SidebarNav>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className="flex items-center gap-2">
          {/* New Post Button */}
          <Link
            href="/posts/new"
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-primary-foreground transition-all",
              "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
              "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            New Post
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )
            ) : (
              <div className="w-5 h-5 animate-pulse bg-muted rounded-sm" />
            )}
          </button>

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              "p-2.5 rounded-lg transition-colors",
              pathname === "/settings"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

/* ==================== MOBILE NAVIGATION ==================== */

export function MobileNavigation() {
  const pathname = usePathname();

  const isNewPostActive =
    pathname === "/posts/new" || pathname.startsWith("/posts/new");

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const mobileItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "People", href: "/people", icon: Users },
    { name: "New", href: "/posts/new", icon: Plus, isFab: true },
    { name: "Posts", href: "/posts", icon: FileText },
    { name: "More", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]" aria-label="Mobile navigation">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {mobileItems.map((item) => {
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center -mt-5",
                  isNewPostActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all",
                    "bg-gradient-to-r from-blue-600 to-blue-500",
                    isNewPostActive
                      ? "shadow-blue-500/40 scale-105"
                      : "shadow-blue-500/20"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium mt-1">
                  {item.name}
                </span>
              </Link>
            );
          }

          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[56px] py-1",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
