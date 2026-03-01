"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Plus,
  Clock,
  BarChart3,
  ArrowUpRight,
  ChevronRight,
  Calendar,
  MessageSquare,
  Send,
  Check,
  Eye,
  Heart,
  Users,
  Loader2,
} from "lucide-react";
import { platformIconsMap } from "@/lib/social-platforms";
import { proxyMediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useAccounts,
  usePosts,
  usePostResultsList,
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

export default function HomePage() {
  // Data fetching
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: postsData, isLoading: postsLoading } = usePosts();
  const { data: resultsData, isLoading: resultsLoading } = usePostResultsList({
    limit: 100,
  });

  const accounts = accountsData?.data || [];
  const posts = postsData?.data || [];
  const results = resultsData?.data || [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");

  const isLoading = accountsLoading || postsLoading || resultsLoading;

  // Calculate real stats
  const stats: StatItem[] = useMemo(() => {
    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p) => p.status === "processed").length;
    const scheduledPosts = posts.filter((p) => p.status === "scheduled").length;

    const successfulResults = results.filter((r) => r.success).length;
    const failedResults = results.filter((r) => !r.success).length;

    return [
      {
        label: "Total Posts",
        value: totalPosts.toString(),
        subtext: `${publishedPosts} published, ${failedResults} failed, ${scheduledPosts} scheduled`,
        icon: BarChart3,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Post Results",
        value: results.length.toString(),
        subtext: `${successfulResults} successful, ${failedResults} failed`,
        icon: Eye,
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
      {
        label: "Success Rate",
        value:
          results.length > 0
            ? `${Math.round((successfulResults / results.length) * 100)}%`
            : "N/A",
        subtext: "Of post attempts",
        icon: Heart,
        color: "text-pink-600",
        bg: "bg-pink-50",
      },
      {
        label: "Connected Accounts",
        value: connectedAccounts.length.toString(),
        subtext: `${accounts.length} total accounts`,
        icon: Users,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
    ];
  }, [posts, results, accounts, connectedAccounts.length]);

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

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8" data-testid="dashboard-loading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="badge-soft live">
                Live
              </Badge>
            </div>
            <h1 className="greeting-title">
              Welcome to <span>HypePost</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Your social media dashboard
            </p>
          </div>
        </div>
        <div className="card-premium p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          <p className="text-slate-400 mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="badge-soft live">
              Live
            </Badge>
          </div>
          <h1 className="greeting-title">
            Welcome to <span>HypePost</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Your social media dashboard
          </p>
        </div>

        <Link href="/posts/new">
          <Button className="btn-gradient gap-2">
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </Link>
      </div>

      <div className="divider-soft" />

      {/* Quick Actions Row */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "New Post",
              href: "/posts/new",
              icon: Send,
              count: null,
            },
            {
              label: "All Posts",
              href: "/posts",
              icon: MessageSquare,
              count: posts.length.toString(),
            },
            {
              label: "Analytics",
              href: "/analytics",
              icon: BarChart3,
              count: null,
            },
            {
              label: "Accounts",
              href: "/accounts/connect",
              icon: Users,
              count: connectedAccounts.length.toString(),
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="card-premium p-4 flex items-center gap-3 hover:shadow-lg transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-800 transition-colors flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">
                    {action.label}
                  </span>
                  {action.count && (
                    <p className="text-xs text-slate-400">
                      {action.count} items
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Stats Grid */}
      <section data-testid="analytics-section">
        <h2 className="section-title mb-4">Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="stat-card"
                data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}
                  >
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {stat.label}
                  </span>
                </div>
                <div className="stat-value">{stat.value}</div>
                {stat.subtext && (
                  <p className="text-xs text-slate-400 mt-2">{stat.subtext}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <section className="card-premium p-6" data-testid="recent-posts">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-slate-800 font-semibold">Recent Posts</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Last {recentPosts.length} posts
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-600"
              asChild
            >
              <Link href="/posts">
                View all
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          {recentPosts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No posts yet</p>
              <p className="text-xs mt-1">
                Create your first post to see analytics
              </p>
            </div>
          ) : (
            <div
              className="space-y-3 max-h-80 overflow-y-auto"
              data-testid="posts-list"
            >
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  data-testid={`post-item-${post.id}`}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {post.platforms.map((platform, idx) => {
                          const Icon = getPlatformIcon(platform);
                          return (
                            <div
                              key={`${platform}-${idx}`}
                              className={`w-5 h-5 rounded flex items-center justify-center ${getPlatformColor(platform)}`}
                            >
                              {Icon && <Icon className="w-3 h-3 text-white" />}
                            </div>
                          );
                        })}
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            post.status === "processed"
                              ? "border-emerald-200 text-emerald-600"
                              : post.status === "scheduled"
                                ? "border-blue-200 text-blue-600"
                                : "border-amber-200 text-amber-600"
                          }`}
                        >
                          {post.status}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-sm truncate">
                        {post.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-slate-600 font-medium">
                          {post.results.filter((r) => r.success).length}/
                          {post.results.length} platforms
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {post.successfulPlatforms
                          .slice(0, 3)
                          .map((platform, i) => {
                            const Icon = getPlatformIcon(platform);
                            return (
                              <div
                                key={i}
                                className={`w-4 h-4 rounded flex items-center justify-center ${getPlatformColor(platform)}`}
                              >
                                {Icon && (
                                  <Icon className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Platform Breakdown */}
        <section className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-slate-800 font-semibold">
                Platform Breakdown
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Performance by platform
              </p>
            </div>
          </div>
          {platformStats.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No platform data yet</p>
              <p className="text-xs mt-1">Post results will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {platformStats.map(([platform, data]) => {
                const Icon = getPlatformIcon(platform);
                const maxPosts = Math.max(
                  ...platformStats.map(([, d]) => d.posts),
                  1,
                );
                const postPercent = (data.posts / maxPosts) * 100;

                return (
                  <div key={platform} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center ${getPlatformColor(platform)}`}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-sm font-medium capitalize text-slate-700">
                          {platform.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{data.posts} posts</span>
                        <span className="text-emerald-600">
                          {data.success} success
                        </span>
                        {data.failed > 0 && (
                          <span className="text-red-500">
                            {data.failed} failed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getPlatformColor(platform)}`}
                        style={{ width: `${postPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Connected Accounts */}
      <section className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-slate-800 font-semibold">
              Connected Accounts
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {connectedAccounts.length} active platform
              {connectedAccounts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/accounts/connect" className="btn-ghost text-xs">
            Manage
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {accounts.slice(0, 4).map((account) => (
            <div
              key={account.id}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={account.profile_photo_url ? proxyMediaUrl(account.profile_photo_url) : ""} />
                  <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                    {account.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    account.status === "connected"
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                />
              </div>
              <p className="text-sm font-medium text-slate-700 truncate">
                {account.username}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {account.platform}
              </p>
            </div>
          ))}
          {accounts.length === 0 && (
            <Link
              href="/accounts/connect"
              className="p-4 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-slate-300 transition-colors"
            >
              <Plus className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-500">
                Connect Account
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="stat-value text-emerald-600">
            {posts.filter((p) => p.status === "draft").length}
          </div>
          <div className="stat-label">Drafts</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="stat-value text-blue-600">
            {posts.filter((p) => p.status === "scheduled").length}
          </div>
          <div className="stat-label">Scheduled</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="stat-value text-purple-600">
            {posts.filter((p) => p.status === "processing").length}
          </div>
          <div className="stat-label">Processing</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
              <Check className="w-4 h-4 text-pink-600" />
            </div>
          </div>
          <div className="stat-value text-pink-600">
            {posts.filter((p) => p.status === "processed").length}
          </div>
          <div className="stat-label">Published</div>
        </div>
      </div>

      {/* API Status Bar */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Post For Me API</span>
          </div>
          <Separator orientation="vertical" className="h-3" />
          <span>{connectedAccounts.length} connected</span>
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          Settings
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
