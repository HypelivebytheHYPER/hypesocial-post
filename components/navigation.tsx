"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Settings,
  Users,
  FileText,
  Plus,
  Newspaper,
  LayoutGrid,
  BarChart3,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Feed", href: "/feed", icon: Newspaper },
  { name: "Moodboard", href: "/moodboard", icon: LayoutGrid },
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Accounts", href: "/accounts/connect", icon: Users },
];

export function Navigation() {
  const pathname = usePathname();
  const isNewPostActive =
    pathname === "/posts/new" || pathname.startsWith("/posts/new");

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-4xl">
      <nav className="nav-floating">
        <div className="flex items-center gap-1">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 mr-2">
            <Image
              src="https://pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev/HypeSocial.png"
              alt="HypePost"
              width={32}
              height={32}
              className="w-8 h-8 rounded-xl shadow-sm"
            />
            <span className="hidden sm:inline-block text-sm font-semibold text-slate-700">
              HypePost
            </span>
          </Link>

          {/* Desktop Nav - Single Line */}
          <div
            className="hidden md:flex items-center gap-1"
            data-testid="desktop-nav"
          >
            {/* New Post - First Tab with Premium Gradient */}
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

            {/* Other Nav Items - Single Line Flow */}
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
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

            {/* Settings - Inline */}
            <Link
              href="/settings"
              className={cn(
                "relative p-2 rounded-full transition-all duration-300 ml-1",
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
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden ml-auto">
            <Link
              href="/posts/new"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full text-white transition-all duration-300",
                isNewPostActive
                  ? "shadow-lg shadow-violet-500/30"
                  : "shadow-md hover:shadow-lg hover:shadow-violet-500/20",
              )}
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
              <Plus className="h-4 w-4 relative" />
              <span className="relative">New</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav - Single Line */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 nav-floating">
        <div className="flex items-center gap-1">
          {/* New Post - Prominent on Mobile */}
          <Link
            href="/posts/new"
            className={cn(
              "p-3 rounded-full transition-all duration-300 flex items-center justify-center text-white",
              isNewPostActive
                ? "shadow-lg shadow-violet-500/30 scale-110"
                : "shadow-md hover:scale-110",
            )}
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
            <Plus className="h-5 w-5 relative" />
          </Link>

          {/* Other Items */}
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "p-3 rounded-full transition-all duration-300",
                  isActive
                    ? "text-slate-800 bg-slate-100"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
