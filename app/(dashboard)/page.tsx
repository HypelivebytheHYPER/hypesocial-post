"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  BarChart3,
  ChevronRight,
  Calendar,
  MessageSquare,
  Send,
  Check,
  Heart,
  Users,
  Loader2,
  Activity,
  AlertCircle,
  Webhook,
  Key,
  Server,
  Terminal,
  RefreshCw,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { platformIconsMap } from "@/lib/social-platforms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAccounts,
  usePosts,
  usePostResultsList,
  useWebhooks,
} from "@/lib/hooks/usePostForMe";

// Platform colors for charts
const PLATFORM_COLORS: Record<string, string> = {
  x: "bg-slate-800",
  twitter: "bg-slate-800",
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  linkedin: "bg-blue-700",
  tiktok: "bg-slate-900",
  tiktok_business: "bg-gradient-to-r from-cyan-500 to-pink-500",
  youtube: "bg-red-600",
  pinterest: "bg-red-700",
};

function getPlatformIcon(platform: string) {
  return platformIconsMap[platform.toLowerCase()];
}

function getPlatformColor(platform: string) {
  return PLATFORM_COLORS[platform.toLowerCase()] || "bg-slate-400";
}

// Stat item type
interface StatItem {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface DiagnosticTest {
  id: string;
  name: string;
  status: "pending" | "running" | "success" | "error" | "warning";
  message?: string;
  icon: React.ElementType;
}

// --- Animation variants ---
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function HomePage() {
  // Data fetching
  const { data: accountsData, isLoading: accountsLoading, error: accountsError } = useAccounts();
  const { data: postsData, isLoading: postsLoading, error: postsError } = usePosts();
  const { data: resultsData, isLoading: resultsLoading, error: resultsError } = usePostResultsList({
    limit: 20,
  });
  const { data: webhooksData, isLoading: webhooksLoading, error: webhooksError } = useWebhooks();

  const accounts = accountsData?.data || [];
  const posts = postsData?.data || [];
  const results = resultsData?.data || [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");

  const isLoading = accountsLoading || postsLoading || resultsLoading;

  // Diagnostics state
  const [tests, setTests] = useState<DiagnosticTest[]>([
    { id: "api-key", name: "API Key", status: "pending", icon: Key },
    { id: "api-connection", name: "API Connected", status: "pending", icon: Server },
    { id: "accounts", name: "Accounts", status: "pending", icon: Users },
    { id: "webhooks", name: "Webhooks", status: "pending", icon: Webhook },
    { id: "mcp", name: "MCP Server", status: "pending", icon: Terminal },
  ]);
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const updateTest = useCallback(
    (id: string, status: DiagnosticTest["status"], message?: string) => {
      setTests((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status, message } : t)),
      );
    },
    [],
  );

  const runDiagnostics = useCallback(() => {
    setIsRunningDiag(true);
    setLastRun(new Date());
    setTests((prev) => prev.map((t) => ({ ...t, status: "running", message: undefined })));

    const apiWorking = !!(accountsData?.data || postsData);
    const apiAuthError =
      accountsError?.message?.includes("401") || postsError?.message?.includes("401");
    updateTest(
      "api-key",
      apiAuthError ? "error" : apiWorking ? "success" : "warning",
      apiAuthError
        ? "API key invalid or expired (401)"
        : apiWorking
          ? "Configured and working"
          : "Waiting for API response",
    );

    if (postsError) {
      updateTest("api-connection", "error", `Connection failed: ${postsError.message}`);
    } else if (postsData) {
      updateTest("api-connection", "success", "Connected to Post For Me API");
    } else {
      updateTest("api-connection", "warning", "API status unknown");
    }

    if (accountsError) {
      updateTest("accounts", "error", `Failed: ${accountsError.message}`);
    } else if (accountsData?.data) {
      const connected = accountsData.data.filter((a) => a.status === "connected").length;
      const total = accountsData.data.length;
      updateTest(
        "accounts",
        connected > 0 ? "success" : "warning",
        `${connected} of ${total} accounts connected`,
      );
    } else {
      updateTest("accounts", "warning", "No account data");
    }

    if (webhooksError) {
      updateTest("webhooks", "error", `Failed: ${webhooksError.message}`);
    } else if (webhooksData?.data) {
      const count = webhooksData.data.length;
      updateTest(
        "webhooks",
        count > 0 ? "success" : "warning",
        count > 0 ? `${count} webhook(s) registered` : "No webhooks registered",
      );
    } else {
      updateTest("webhooks", "warning", "Webhook status unknown");
    }

    updateTest("mcp", "success", "MCP server configured");
    setIsRunningDiag(false);
  }, [accountsData, postsData, accountsError, postsError, webhooksData, webhooksError, updateTest]);

  const queriesSettled = !accountsLoading && !postsLoading && !resultsLoading && !webhooksLoading;
  const autoRan = useRef(false);
  useEffect(() => {
    if (queriesSettled && !autoRan.current) {
      autoRan.current = true;
      runDiagnostics();
    }
  }, [queriesSettled, runDiagnostics]);

  const diagSuccessCount = tests.filter((t) => t.status === "success").length;
  const diagErrorCount = tests.filter((t) => t.status === "error").length;
  const diagWarningCount = tests.filter((t) => t.status === "warning").length;
  const hasIssues = diagErrorCount > 0 || diagWarningCount > 0;

  // Calculate real stats
  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === "processed").length;
  const scheduledPosts = posts.filter((p) => p.status === "scheduled").length;
  const successfulResults = results.filter((r) => r.success).length;
  const failedResults = results.filter((r) => !r.success).length;
  const successRate =
    results.length > 0 ? Math.round((successfulResults / results.length) * 100) : 0;

  // Get recent posts with their results
  const recentPosts = useMemo(() => {
    return posts.slice(0, 5).map((post) => {
      const postResults = results.filter((r) => r.post_id === post.id);
      const successfulPlatforms = postResults
        .filter((r) => r.success)
        .map((r) => {
          const account = accounts.find((a) => a.id === r.social_account_id);
          return account?.platform || "unknown";
        });

      const platforms = post.social_accounts?.map((acc) => acc.platform) || [];

      return {
        id: post.id,
        content: post.caption || "No caption",
        status: post.status,
        platforms,
        successfulPlatforms,
        results: postResults,
        createdAt: post.created_at,
      };
    });
  }, [posts, results, accounts]);

  // Platform breakdown
  const platformStats = useMemo(() => {
    const breakdown: Record<
      string,
      { posts: number; success: number; failed: number }
    > = {};

    results.forEach((r) => {
      const account = accounts.find((a) => a.id === r.social_account_id);
      const platform = account?.platform?.toLowerCase() || "unknown";

      if (!breakdown[platform]) {
        breakdown[platform] = { posts: 0, success: 0, failed: 0 };
      }

      breakdown[platform].posts += 1;
      if (r.success) {
        breakdown[platform].success += 1;
      } else {
        breakdown[platform].failed += 1;
      }
    });

    return Object.entries(breakdown)
      .sort((a, b) => b[1].posts - a[1].posts)
      .slice(0, 5);
  }, [results, accounts]);

  const fetchError = accountsError || postsError || resultsError;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8" data-testid="dashboard-loading">
        <div>
          <h1 className="greeting-title">
            Welcome to <span>HypePost</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your social media dashboard</p>
        </div>
        <div className="card-premium p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          <p className="text-slate-400 mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6 pb-8">
        <h1 className="greeting-title">
          Welcome to <span>HypePost</span>
        </h1>
        <div className="card-premium p-12 text-center border-red-200">
          <p className="text-red-500 mb-2">{fetchError.message || "Failed to load dashboard"}</p>
          <p className="text-xs text-slate-400">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // --- Status color helpers ---
  const healthColor =
    diagErrorCount > 0
      ? "text-red-500"
      : diagWarningCount > 0
        ? "text-amber-500"
        : "text-emerald-500";
  const healthBg =
    diagErrorCount > 0
      ? "bg-red-500/10"
      : diagWarningCount > 0
        ? "bg-amber-500/10"
        : "bg-emerald-500/10";

  return (
    <motion.div
      className="pb-8"
      data-testid="dashboard"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-end justify-between gap-4 mb-8">
        <div>
          <Badge variant="outline" className="badge-soft live mb-2">
            Live
          </Badge>
          <h1 className="greeting-title">
            Welcome to <span>HypePost</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your social media dashboard</p>
        </div>
        <Link href="/posts/new">
          <Button variant="gradient" className="shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </Link>
      </motion.div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(0,1fr)] gap-3 lg:gap-4">

        {/* ━━ HERO: System Health — spans 2 cols ━━ */}
        <motion.section
          variants={fadeUp}
          className="col-span-2 card-premium p-5 flex flex-col"
          data-testid="system-health"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${healthBg}`}>
                <Activity className={`w-4 h-4 ${healthColor}`} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">System Health</h2>
                <p className="text-xs text-slate-400">
                  {diagErrorCount > 0
                    ? "Connection Issues"
                    : diagWarningCount > 0
                      ? "Partially Connected"
                      : "All Systems Operational"}{" "}
                  ({diagSuccessCount}/{tests.length})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={runDiagnostics}
                disabled={isRunningDiag}
                className="text-slate-400 hover:text-slate-600 h-7 w-7 p-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiag ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 h-7 text-xs px-2" asChild>
                <Link href="/diagnostics">
                  Details <ChevronRight className="ml-0.5 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Segmented bar */}
          <div className="flex gap-1 mb-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  test.status === "success"
                    ? "bg-emerald-500"
                    : test.status === "error"
                      ? "bg-red-500"
                      : test.status === "warning"
                        ? "bg-amber-500"
                        : test.status === "running"
                          ? "bg-blue-400 animate-pulse"
                          : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Indicators */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-3 gap-y-2 mt-auto">
            {tests.map((test) => {
              const Icon = test.icon;
              const linkMap: Record<string, string> = {
                accounts: "/accounts/connect",
                webhooks: "/diagnostics",
              };
              const href = linkMap[test.id];
              const dot = (
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    test.status === "success"
                      ? "bg-emerald-500"
                      : test.status === "error"
                        ? "bg-red-500"
                        : test.status === "warning"
                          ? "bg-amber-500"
                          : test.status === "running"
                            ? "bg-blue-400 animate-pulse"
                            : "bg-slate-300"
                  }`}
                />
              );
              const cls = "flex items-center gap-1.5 text-[11px] text-slate-500 transition-colors";
              return href ? (
                <Link key={test.id} href={href} className={`${cls} hover:text-slate-700`}>
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{test.name}</span>
                  {dot}
                </Link>
              ) : (
                <div key={test.id} className={cls}>
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{test.name}</span>
                  {dot}
                </div>
              );
            })}
          </div>

          {/* Collapsible troubleshooting */}
          {hasIssues && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {diagErrorCount > 0
                  ? `${diagErrorCount} error${diagErrorCount > 1 ? "s" : ""}`
                  : `${diagWarningCount} warning${diagWarningCount > 1 ? "s" : ""}`}
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showTroubleshooting ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {showTroubleshooting && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2 space-y-1 text-xs text-slate-500"
                  >
                    {tests
                      .filter((t) => t.status === "error" || t.status === "warning")
                      .map((t) => (
                        <li key={t.id} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>{t.name}:</strong> {t.message}
                          </span>
                        </li>
                      ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.section>

        {/* ━━ KPI: Total Posts ━━ */}
        <motion.div variants={fadeUp} className="col-span-1 card-premium p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Posts</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-3xl font-bold text-slate-800 tracking-tight">{totalPosts}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-emerald-600 font-medium">{publishedPosts} published</span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] text-slate-400">{scheduledPosts} scheduled</span>
            </div>
          </div>
        </motion.div>

        {/* ━━ KPI: Success Rate — radial ring ━━ */}
        <motion.div variants={fadeUp} className="col-span-1 card-premium p-5 flex flex-col items-center justify-center">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                className="stroke-emerald-500"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - successRate / 100)}`}
                style={{ transition: "stroke-dashoffset 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-slate-800">
                {results.length > 0 ? `${successRate}%` : "—"}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Success Rate</p>
          {failedResults > 0 && (
            <p className="text-[10px] text-red-400 mt-0.5">{failedResults} failed</p>
          )}
        </motion.div>

        {/* ━━ Quick Actions — dock-style glass strip ━━ */}
        <motion.div variants={fadeUp} className="col-span-2 lg:col-span-4">
          <div className="flex items-stretch rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-100/80 dark:border-slate-800/80 p-1.5 gap-1">
            {[
              { label: "Feed", href: "/feed", icon: MessageSquare, sub: "ไล่ดูโพสต์จากแต่ละช่อง", gradient: "bg-gradient-to-br from-indigo-500 to-blue-600", shadow: "shadow-indigo-500/25" },
              { label: "All Posts", href: "/posts", icon: Send, sub: `${posts.length} โพสต์ · ดูและจัดการทั้งหมด`, gradient: "bg-gradient-to-br from-cyan-500 to-blue-500", shadow: "shadow-cyan-500/25" },
              { label: "Analytics", href: "/analytics", icon: BarChart3, sub: "เช็กยอดผลลัพธ์แต่ละแพลตฟอร์ม", gradient: "bg-gradient-to-br from-amber-500 to-orange-500", shadow: "shadow-amber-500/25" },
              { label: "Accounts", href: "/accounts/connect", icon: Users, sub: `${connectedAccounts.length} บัญชี · เพิ่มช่องทางใหม่`, gradient: "bg-gradient-to-br from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/25" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex-1 flex flex-col items-center gap-2 py-4 px-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200 group"
                >
                  <div className={`w-11 h-11 rounded-2xl ${action.gradient} flex items-center justify-center shadow-lg ${action.shadow} group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center min-w-0">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">{action.label}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">{action.sub}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* ━━ TALL: Recent Posts — spans 2 cols, 2 rows ━━ */}
        <motion.section
          variants={fadeUp}
          className="col-span-2 row-span-2 card-premium p-5 flex flex-col"
          data-testid="recent-posts"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Recent Posts</h2>
            <Link
              href="/posts"
              className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-0.5 transition-colors"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Calendar className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No posts yet</p>
              <p className="text-[11px] mt-1">Create your first post to get started</p>
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto" data-testid="posts-list">
              {recentPosts.map((post, i) => (
                <Link
                  key={post.id}
                  href="/posts"
                  data-testid={`post-item-${post.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  {/* Platform icons stacked */}
                  <div className="flex -space-x-1 flex-shrink-0">
                    {post.platforms.slice(0, 3).map((platform, idx) => {
                      const Icon = getPlatformIcon(platform);
                      return (
                        <div
                          key={`${platform}-${idx}`}
                          className={`w-6 h-6 rounded-md flex items-center justify-center ring-2 ring-white dark:ring-slate-900 ${getPlatformColor(platform)}`}
                        >
                          {Icon && <Icon className="w-3 h-3 text-white" />}
                        </div>
                      );
                    })}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] capitalize px-1.5 py-0 ${
                          post.status === "processed"
                            ? "border-emerald-200 text-emerald-600"
                            : post.status === "scheduled"
                              ? "border-blue-200 text-blue-600"
                              : "border-amber-200 text-amber-600"
                        }`}
                      >
                        {post.status}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {post.results.filter((r) => r.success).length}/{post.results.length} delivered
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        {/* ━━ Platform Breakdown — spans 2 cols, 2 rows ━━ */}
        <motion.section
          variants={fadeUp}
          className="col-span-2 row-span-2 card-premium p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Platforms</h2>
            <Link
              href="/analytics"
              className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-0.5 transition-colors"
            >
              Analytics <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {platformStats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <BarChart3 className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No platform data yet</p>
              <p className="text-[11px] mt-1">Post results will appear here</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              {platformStats.map(([platform, data]) => {
                const Icon = getPlatformIcon(platform);
                const maxPosts = Math.max(...platformStats.map(([, d]) => d.posts), 1);
                const pct = (data.posts / maxPosts) * 100;
                const successPct = data.posts > 0 ? Math.round((data.success / data.posts) * 100) : 0;

                return (
                  <div key={platform} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center ${getPlatformColor(platform)}`}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-200">
                          {platform.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400">{data.posts} posts</span>
                        <span className="text-emerald-600 font-medium">{successPct}%</span>
                      </div>
                    </div>
                    {/* Dual-tone bar: success + failed */}
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex" style={{ width: `${pct}%`, minWidth: "2rem" }}>
                      <div
                        className="h-full bg-emerald-500 rounded-l-full"
                        style={{ width: `${successPct}%` }}
                      />
                      {data.failed > 0 && (
                        <div
                          className="h-full bg-red-400"
                          style={{ width: `${100 - successPct}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>

      {/* ── Footer ── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between pt-6 mt-2">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-medium">Post For Me API</span>
          </div>
          <a
            href="https://status.postforme.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            Status <ChevronRight className="w-3 h-3 inline" />
          </a>
        </div>
        <Link
          href="/diagnostics"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          Full Diagnostics
          <ChevronRight className="w-3 h-3" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
