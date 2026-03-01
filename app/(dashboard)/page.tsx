"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Plus,
  Clock,
  BarChart3,
  Link2,
  Zap,
  ArrowUpRight,
  Bell,
  Search,
  ChevronRight,
  Calendar,
  MessageSquare,
  TrendingUp,
  MoreHorizontal,
  ImageIcon,
  Video,
  Link as LinkIcon,
  Send,
  Check,
  Hash,
  Smile,
  MapPin,
  Eye,
  Heart,
  Users,
  Loader2,
} from "lucide-react";
import { socialPlatforms, platformIconsMap } from "@/lib/social-platforms";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useAccounts,
  useCreatePost,
  usePosts,
  usePostResultsList,
} from "@/lib/hooks/usePostForMe";

// Use first 4 platforms from centralized config for the composer
const platforms = socialPlatforms.slice(0, 4).map((p) => ({
  id: p.id,
  name: p.name,
  Icon: p.Icon,
  connected: p.id === "instagram" ? false : true, // Instagram not connected by default
  color: p.color,
}));

const recentActivity = [
  {
    action: "Posted to X",
    target: "Product launch update",
    time: "2m ago",
    type: "post",
  },
  {
    action: "Scheduled LinkedIn",
    target: "Company milestone",
    time: "1h ago",
    type: "schedule",
  },
  {
    action: "Webhook triggered",
    target: "post.created",
    time: "3h ago",
    type: "webhook",
  },
];

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
  // Composer state
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "X",
    "Facebook",
    "LinkedIn",
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Data fetching - merged from analytics
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: postsData, isLoading: postsLoading } = usePosts();
  const { data: resultsData, isLoading: resultsLoading } = usePostResultsList({
    limit: 100,
  });
  const createPost = useCreatePost();

  const accounts = accountsData?.data || [];
  const posts = postsData?.data || [];
  const results = resultsData?.data || [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");

  const isLoading = accountsLoading || postsLoading || resultsLoading;

  // Calculate real stats - from analytics
  const stats: StatItem[] = useMemo(() => {
    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p) => p.status === "processed").length;
    const scheduledPosts = posts.filter((p) => p.status === "scheduled").length;

    // Count successful/failed post results
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

  // Get recent posts with their results - from analytics
  const recentPosts = useMemo(() => {
    return posts.slice(0, 5).map((post) => {
      const postResults = results.filter((r) => r.post_id === post.id);
      const successfulPlatforms = postResults
        .filter((r) => r.success)
        .map((r) => {
          const account = accounts.find((a) => a.id === r.social_account_id);
          return account?.platform || "unknown";
        });

      // Get platforms from social_accounts (returns full account objects)
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

  // Platform breakdown - from analytics
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

  const togglePlatform = (name: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    try {
      // Find account IDs for selected platforms
      const selectedAccounts = accounts.filter((a) =>
        selectedPlatforms.some((p) =>
          a.platform.toLowerCase().includes(p.toLowerCase()),
        ),
      );

      if (selectedAccounts.length === 0) {
        toast.error("No connected accounts for selected platforms");
        return;
      }

      // Create post for each selected account
      for (const account of selectedAccounts.slice(0, 1)) {
        // Start with first account
        await createPost.mutateAsync({
          caption: content,
          social_accounts: [account.id],
          scheduled_at:
            scheduledDate && scheduledTime
              ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
              : undefined,
        });
      }

      toast.success("Post created successfully!");
      setContent("");
      setIsExpanded(false);
      setScheduledDate("");
      setScheduledTime("");
    } catch (error) {
      toast.error("Failed to create post");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8" data-testid="dashboard-loading">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="badge-soft live">
                Live
              </Badge>
              <span className="text-slate-400 text-xs font-medium">v2.4.0</span>
            </div>
            <h1 className="greeting-title">
              Hello, <span>Alif Reza</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Create and manage your social content
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
            <span className="text-slate-400 text-xs font-medium">v2.4.0</span>
          </div>
          <h1 className="greeting-title">
            Hello, <span>Alif Reza</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create and manage your social content
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-soft w-10 h-10 p-0 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </button>
          <button className="btn-soft w-10 h-10 p-0 flex items-center justify-center">
            <Search className="w-4 h-4" />
          </button>
          <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-slate-800 text-white text-sm font-medium">
              AR
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="divider-soft" />

      {/* Main Post Composer - Focal Point */}
      <section className="card-premium p-6 lg:p-8" data-testid="post-composer">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Create Post
              </h2>
              <p className="text-slate-400 text-sm">
                Share across your connected platforms
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Posting to</span>
            <div className="flex -space-x-2">
              {selectedPlatforms.slice(0, 3).map((platform) => (
                <div
                  key={platform}
                  className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600"
                >
                  {platform[0]}
                </div>
              ))}
              {selectedPlatforms.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                  +{selectedPlatforms.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Composer Area */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              data-testid="post-caption-input"
              className="w-full min-h-[140px] p-5 bg-slate-50 rounded-2xl text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all text-base leading-relaxed"
              placeholder="What's on your mind? Share your thoughts, ideas, or updates..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
            />
            <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-medium">
              {content.length}/280
            </div>
          </div>

          {/* Platform Selector */}
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="platform-selector"
          >
            <span className="text-xs text-slate-400 font-medium mr-2">
              Platforms:
            </span>
            {platforms.map((platform) => {
              const Icon = platform.Icon;
              const isSelected = selectedPlatforms.includes(platform.name);
              return (
                <button
                  key={platform.id}
                  data-testid={`platform-${platform.id}`}
                  onClick={() =>
                    platform.connected && togglePlatform(platform.name)
                  }
                  disabled={!platform.connected}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    isSelected
                      ? "bg-slate-800 text-white"
                      : platform.connected
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-slate-50 text-slate-300 cursor-not-allowed"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{platform.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Expanded Options */}
          {isExpanded && (
            <div className="pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-2 block">
                      Schedule Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-2 block">
                      Schedule Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="soft" size="sm">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Media
                  </Button>
                  <Button variant="soft" size="sm">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Link
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    <Hash className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    data-testid="submit-post-button"
                    variant="premium"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={createPost.isPending || !content.trim()}
                  >
                    {createPost.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Posting...
                      </>
                    ) : scheduledDate ? (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions Row */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "All Posts",
              href: "/posts",
              icon: MessageSquare,
              count: posts.length.toString(),
            },
            {
              label: "Scheduled",
              href: "/posts",
              icon: Clock,
              count: posts
                .filter((p) => p.status === "scheduled")
                .length.toString(),
            },
            {
              label: "Analytics",
              href: "/analytics",
              icon: BarChart3,
              count: null,
            },
            { label: "Moodboard", href: "/moodboard", icon: Zap, count: null },
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

      {/* Real Stats Grid - From Analytics */}
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

      {/* Two Column Layout - From Analytics */}
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

      {/* Main Dashboard Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Connected Accounts - Combined from both pages */}
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
                      <AvatarImage src={account.profile_photo_url || ""} />
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

          {/* Recent Activity */}
          <section className="card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-slate-800 font-semibold">
                  Recent Activity
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  Your latest actions
                </p>
              </div>
              <Link href="/posts" className="btn-ghost text-xs">
                View all
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-icon">
                    {item.type === "post" && (
                      <Zap className="w-4 h-4 text-emerald-500" />
                    )}
                    {item.type === "schedule" && (
                      <Calendar className="w-4 h-4 text-blue-500" />
                    )}
                    {item.type === "webhook" && (
                      <Link2 className="w-4 h-4 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">
                      {item.action}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {item.target}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats - Kept from original but now using real data */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Best Times */}
          <section className="card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-slate-800 font-semibold">
                Best Times to Post
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">Morning</span>
                <Badge variant="outline" className="text-xs">
                  9-11 AM
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">Lunch</span>
                <Badge variant="outline" className="text-xs">
                  12-1 PM
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">Evening</span>
                <Badge variant="outline" className="text-xs">
                  6-8 PM
                </Badge>
              </div>
            </div>
          </section>

          {/* AI Integration - MCP */}
          <div className="card-premium p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <Badge
                variant="outline"
                className="text-[10px] border-purple-200 text-purple-600"
              >
                Beta
              </Badge>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">
              AI-Powered Posting
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Use Claude or other AI assistants to post on your behalf via MCP
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-500" />
                <span>Natural language commands</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-500" />
                <span>Schedule posts with AI</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-500" />
                <span>Query analytics via chat</span>
              </div>
            </div>
          </div>

          {/* Pro Upgrade */}
          <div className="card-premium p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <MoreHorizontal className="w-5 h-5 text-white/40" />
            </div>
            <h3 className="font-semibold mb-1">Need more features?</h3>
            <p className="text-white/60 text-sm mb-4">
              Upgrade to Pro for advanced analytics and unlimited scheduling
            </p>
            <Button className="w-full bg-white text-slate-800 hover:bg-white/90">
              Go Pro
            </Button>
          </div>
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
