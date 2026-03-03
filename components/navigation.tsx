"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  Settings,
  FileText,
  Plus,
  LayoutGrid,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const desktopNavItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Moodboard", href: "/moodboard", icon: LayoutGrid },
];

// Mobile: Home | [New FAB] | Posts | Moodboard
const mobileNavItems = [
  { name: "Home", href: "/", icon: Home },
  // "New" button goes in center
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Moodboard", href: "/moodboard", icon: LayoutGrid },
];

export function Navigation() {
  const pathname = usePathname();
  const isNewPostActive =
    pathname === "/posts/new" || pathname.startsWith("/posts/new");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Desktop Top Nav */}
      <header className="hidden md:block fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <nav className="nav-floating">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center px-0.5 py-0.5 mr-1">
              <Image
                src="https://pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev/HypeSocial.png"
                alt="HypePost"
                width={52}
                height={52}
                priority
                className="w-[52px] h-[52px] rounded-2xl shadow-sm"
              />
            </Link>

            <div className="flex items-center gap-1" data-testid="desktop-nav">
              <Link
                href="/posts/new"
                data-testid="new-post-button"
                className={cn(
                  "relative px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 flex items-center gap-1.5",
                  isNewPostActive
                    ? "text-white shadow-lg shadow-blue-500/30"
                    : "text-white hover:shadow-lg hover:shadow-blue-500/20",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400",
                    isNewPostActive && "ring-2 ring-blue-400/40 ring-offset-1",
                  )}
                />
                <span className="relative flex items-center gap-1.5 whitespace-nowrap">
                  <Plus className="h-3.5 w-3.5" />
                  New Post
                </span>
              </Link>

              {desktopNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                    className={cn(
                      "relative px-4 py-2 text-xs font-medium rounded-full transition-all duration-300",
                      isActive
                        ? "text-slate-800"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    {isActive && (
                      <span className="absolute inset-0 rounded-full bg-slate-100" />
                    )}
                    <span className="relative">{item.name}</span>
                  </Link>
                );
              })}

              {/* Dark mode toggle */}
              <button
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                className="relative p-2 rounded-full transition-all duration-300 text-slate-400 hover:text-slate-600 ml-1"
                aria-label="Toggle theme"
              >
                {mounted ? (
                  resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )
                ) : (
                  <div className="h-4 w-4" />
                )}
              </button>

              <Link
                href="/settings"
                className={cn(
                  "relative p-2 rounded-full transition-all duration-300",
                  pathname === "/settings"
                    ? "text-slate-800"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {pathname === "/settings" && (
                  <span className="absolute inset-0 rounded-full bg-slate-100" />
                )}
                <Settings className="h-4 w-4 relative" />
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="relative p-2 rounded-full transition-all duration-300 text-slate-400 hover:text-red-500"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Top Bar - minimal */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev/HypeSocial.png"
              alt="HypePost"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-sm font-bold text-slate-800">HypePost</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="p-2 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              aria-label="Toggle theme"
            >
              {mounted ? (
                resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              ) : (
                <div className="h-5 w-5" />
              )}
            </button>
            <Link
              href="/settings"
              aria-label="Settings"
              className={cn(
                "p-2 rounded-full transition-colors",
                pathname === "/settings"
                  ? "text-slate-800 bg-slate-100"
                  : "text-slate-400",
              )}
            >
              <Settings className="h-5 w-5" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-full transition-colors text-slate-400 hover:text-red-500"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-end justify-around px-2 pt-1.5 pb-1">
          {/* Left items */}
          {mobileNavItems.slice(0, 1).map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center gap-0.5 min-w-[56px] py-1"
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-blue-600" : "text-slate-400",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-blue-600" : "text-slate-400",
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Center - New Post FAB */}
          <Link
            href="/posts/new"
            className="flex flex-col items-center gap-0.5 -mt-4"
          >
            <div
              className={cn(
                "relative w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all",
                isNewPostActive
                  ? "shadow-blue-500/40 scale-105"
                  : "shadow-blue-500/20",
              )}
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
              <Plus className="h-6 w-6 relative" />
            </div>
            <span
              className={cn(
                "text-[10px] font-medium",
                isNewPostActive ? "text-blue-600" : "text-slate-400",
              )}
            >
              New
            </span>
          </Link>

          {/* Right items */}
          {mobileNavItems.slice(1).map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center gap-0.5 min-w-[56px] py-1"
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-blue-600" : "text-slate-400",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-blue-600" : "text-slate-400",
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
