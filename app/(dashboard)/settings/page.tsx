"use client";

import Link from "next/link";
import {
  Bell,
  Shield,
  User,
  Moon,
  Globe,
  Mail,
  Trash2,
  ChevronRight,
  CreditCard,
  Key,
  Webhook,
  Activity,
  Users,
  LogOut,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { pfmKeys } from "@/lib/hooks";

const settingsSections = [
  {
    title: "Connected Accounts",
    description: "Manage social channels",
    icon: Users,
    href: "/accounts/connect",
  },
  {
    title: "Profile",
    description: "Account information",
    icon: User,
    href: null,
  },
  {
    title: "Notifications",
    description: "Email and push settings",
    icon: Bell,
    href: null,
  },
  {
    title: "Security",
    description: "Password and 2FA",
    icon: Shield,
    href: null,
  },
  {
    title: "Billing",
    description: "Subscription and payments",
    icon: CreditCard,
    href: null,
  },
  {
    title: "Webhooks",
    description: "API integrations",
    icon: Webhook,
    href: "/webhooks",
  },
  {
    title: "API Keys",
    description: "Developer settings",
    icon: Key,
    href: null,
  },
  {
    title: "Diagnostics",
    description: "Check API connections",
    icon: Activity,
    href: "/diagnostics",
  },
  {
    title: "Language",
    description: "Interface language",
    icon: Globe,
    href: null,
  },
];

// Map settings routes to prefetch configs
// Query keys must match exactly what the destination page's hooks produce
// Note: accounts + posts are already server-side prefetched via layout HydrationBoundary
const PREFETCH_MAP: Record<
  string,
  { queryKey: readonly unknown[]; endpoint: string }[]
> = {
  "/webhooks": [
    {
      queryKey: [...pfmKeys.webhooks(), undefined], // useWebhooks() appends filters (undefined when no filters)
      endpoint: "/api/webhooks",
    },
  ],
  "/diagnostics": [
    {
      // useSocialPosts({ limit: 1 }) — not covered by server-side prefetch (different query key)
      queryKey: [...pfmKeys.posts(), { limit: 1 }],
      endpoint: "/api/posts?limit=1",
    },
    {
      queryKey: [...pfmKeys.webhooks(), undefined],
      endpoint: "/api/webhooks",
    },
  ],
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const userName = "Admin";
  const userEmail = "admin@hypesocial.app";
  const userInitials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handlePrefetch = (href: string) => {
    const configs = PREFETCH_MAP[href];
    if (!configs) return;
    for (const config of configs) {
      queryClient.prefetchQuery({
        queryKey: config.queryKey,
        queryFn: () => fetch(config.endpoint).then((r) => r.json()),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Minimal */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your preferences</p>
      </div>

      {/* Profile Card */}
      <section className="p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#111111]">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-base font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-slate-900 dark:text-white font-medium">{userName}</h2>
            <p className="text-slate-400 text-sm">{userEmail}</p>
          </div>
          <Badge className="badge-soft success">Admin</Badge>
        </div>
      </section>

      {/* Sign Out - Disabled (no auth) */}
      <section className="card-premium p-5 opacity-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <LogOut className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <h3 className="text-slate-700 font-medium text-sm">Authentication</h3>
              <p className="text-slate-400 text-xs">Sign in disabled for testing</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-slate-200 text-slate-600"
          >
            Disabled
          </Button>
        </div>
      </section>

      {/* Settings Grid */}
      <section>
        <h2 className="section-title mb-4">General</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            if (section.href) {
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  onMouseEnter={() => handlePrefetch(section.href)}
                  className="card-premium p-4 text-left hover:scale-[1.02] transition-transform block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-slate-700 font-medium text-sm">
                        {section.title}
                      </h3>
                      <p className="text-slate-400 text-xs">
                        {section.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </Link>
              );
            }
            return (
              <button
                key={section.title}
                onClick={() => toast.info("Coming soon")}
                className="card-premium p-4 text-left hover:scale-[1.02] transition-transform w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-slate-700 font-medium text-sm">
                      {section.title}
                    </h3>
                    <p className="text-slate-400 text-xs">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Two Column - Preferences */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Email Preferences */}
        <section className="card-premium p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Mail className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <h2 className="text-slate-800 font-semibold">
                Email Preferences
              </h2>
              <p className="text-slate-400 text-xs">
                Manage your notifications
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              "Weekly digest",
              "Post notifications",
              "Security alerts",
              "Marketing updates",
            ].map((item) => (
              <label
                key={item}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer"
              >
                <span className="text-slate-600 text-sm">{item}</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Appearance */}
        <section className="card-premium p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Moon className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <h2 className="text-slate-800 font-semibold">Appearance</h2>
              <p className="text-slate-400 text-xs">Customize your interface</p>
            </div>
          </div>
          <div className="space-y-3">
            {(["light", "dark", "system"] as const).map((t) => {
              const isActive = theme === t;
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`w-full p-3 rounded-xl text-left transition-colors ${
                    isActive
                      ? "bg-slate-50 border-2 border-accent"
                      : "bg-slate-100 border-2 border-transparent hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${isActive ? "text-slate-800 font-medium" : "text-slate-600"}`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </span>
                    {isActive ? (
                      <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Danger Zone */}
      <section>
        <h2 className="text-red-500 text-xs font-semibold uppercase tracking-wider mb-4">
          Danger Zone
        </h2>
        <div className="card-premium p-5 border-red-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <h3 className="text-slate-700 font-medium">Delete Account</h3>
                <p className="text-slate-400 text-xs">
                  Permanently remove your data
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove all your data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      toast.info("Account deletion is not available yet")
                    }
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>
    </div>
  );
}
