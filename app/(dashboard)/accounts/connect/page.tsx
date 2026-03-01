"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Link2,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { socialPlatforms, getPlatformIcon } from "@/lib/social-platforms";
import {
  useAccounts,
  useConnectAccount,
  usePausedAccounts,
} from "@/lib/hooks/usePostForMe";
import type { SocialAccount } from "@/types/post-for-me";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

/**
 * Check if token is expiring soon (within 7 days)
 */
function isTokenExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

/**
 * Format expiration date for display
 */
function formatExpiration(expiresAt: string | null): string {
  if (!expiresAt) return "No expiry";
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilExpiry < 0) return "Expired";
  if (daysUntilExpiry === 0) return "Expires today";
  if (daysUntilExpiry === 1) return "Expires tomorrow";
  if (daysUntilExpiry <= 7) return `Expires in ${daysUntilExpiry} days`;
  return `Expires ${expiryDate.toLocaleDateString()}`;
}

export default function ConnectAccountsPage() {
  // Fetch real accounts from API
  const {
    data: accountsData,
    isLoading: accountsLoading,
    error: accountsError,
  } = useAccounts();
  const connectAccount = useConnectAccount();
  const { pausedIds, isReady, toggleAccount, isPaused } = usePausedAccounts();

  // Map API accounts to lookup by platform
  const connectedAccounts = accountsData?.data || [];
  const accountsByPlatform = connectedAccounts.reduce(
    (acc, account) => {
      acc[account.platform] = account;
      return acc;
    },
    {} as Record<string, SocialAccount>,
  );

  // Merge static platform definitions with real connection status
  const platforms = socialPlatforms.map((platform) => {
    const connectedAccount = accountsByPlatform[platform.id];
    return {
      ...platform,
      connected: !!connectedAccount && connectedAccount.status === "connected",
      disconnected:
        !!connectedAccount && connectedAccount.status === "disconnected",
      username: connectedAccount?.username || undefined,
      accountId: connectedAccount?.id,
      tokenExpiresAt: connectedAccount?.access_token_expires_at || null,
    };
  });

  const handleConnect = (platformId: string) => {
    connectAccount.mutate({ platform: platformId });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-600"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="greeting-title">Connect</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Link your social accounts
          </p>
        </div>
      </div>

      <div className="divider-soft" />

      {/* Loading State */}
      {accountsLoading && (
        <div className="card-premium p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          <p className="text-slate-400 mt-3 text-sm">
            Loading connected accounts...
          </p>
        </div>
      )}

      {/* Error State */}
      {accountsError && (
        <div className="card-premium p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-medium">
                Failed to load accounts
              </h3>
              <p className="text-red-600 text-sm mt-1">
                {accountsError.message || "Please try again later"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Platforms - Premium Cards */}
      {!accountsLoading && (
        <section className="space-y-3">
          {platforms.map((platform) => {
            const Icon = platform.Icon;
            const isExpiringSoon =
              platform.tokenExpiresAt &&
              isTokenExpiringSoon(platform.tokenExpiresAt);
            const accountPaused = platform.accountId
              ? isPaused(platform.accountId)
              : false;
            const isActive = platform.connected && !accountPaused;

            return (
              <div
                key={platform.id}
                className={`card-premium p-5 ${platform.disconnected ? "border-amber-200" : ""} ${accountPaused ? "opacity-75" : ""}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${platform.color} flex items-center justify-center text-white shadow-sm ${accountPaused ? "grayscale" : ""}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-slate-800 font-semibold">
                          {platform.name}
                        </h3>
                        {isActive && (
                          <Badge className="badge-soft success text-[10px]">
                            Active
                          </Badge>
                        )}
                        {accountPaused && (
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                            Paused
                          </Badge>
                        )}
                        {platform.disconnected && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                            Disconnected
                          </Badge>
                        )}
                        {isExpiringSoon && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                            {formatExpiration(platform.tokenExpiresAt)}
                          </Badge>
                        )}
                      </div>
                      {platform.username ? (
                        <p className="text-slate-500 text-sm">
                          @{platform.username}
                        </p>
                      ) : (
                        <p className="text-slate-400 text-sm">
                          {platform.handle}
                        </p>
                      )}
                      {platform.connected &&
                        platform.tokenExpiresAt &&
                        !isExpiringSoon && (
                          <p className="text-slate-400 text-xs mt-0.5">
                            {formatExpiration(platform.tokenExpiresAt)}
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Pause/Resume Toggle for connected accounts */}
                    {platform.connected && isReady && platform.accountId && (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!accountPaused}
                          onCheckedChange={() =>
                            toggleAccount(platform.accountId!)
                          }
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          {accountPaused ? "Paused" : "Active"}
                        </span>
                      </div>
                    )}

                    <Button
                      variant={
                        platform.connected
                          ? "soft"
                          : platform.disconnected
                            ? "premium"
                            : "premium"
                      }
                      size="sm"
                      onClick={() => handleConnect(platform.id)}
                      disabled={connectAccount.isPending}
                    >
                      {connectAccount.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Connecting...
                        </>
                      ) : platform.connected ? (
                        <>
                          <RefreshCw className="mr-2 h-3.5 w-3.5" />
                          Reconnect
                        </>
                      ) : platform.disconnected ? (
                        <>
                          <AlertCircle className="mr-2 h-3.5 w-3.5" />
                          Reconnect
                        </>
                      ) : (
                        <>
                          <Link2 className="mr-2 h-3.5 w-3.5" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Info Card */}
      <div className="card-premium p-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Link2 className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h3 className="text-slate-800 font-semibold mb-1">
              Why connect accounts?
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connecting your social accounts allows you to publish posts
              directly from HypePostSocial. Your credentials are securely stored
              and never shared with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Info Card */}
      <div className="card-premium p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div>
            <h3 className="text-slate-800 font-semibold mb-1">
              Permissions Required
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-2">
              To enable analytics and feed viewing, accounts must be connected
              with the{" "}
              <code className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                feeds
              </code>{" "}
              permission.
            </p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>
                • <strong>posts</strong> — Required for publishing content
              </li>
              <li>
                • <strong>feeds</strong> — Required for analytics and viewing
                your posts
              </li>
            </ul>
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-[10px] text-amber-600">
                <strong>Note:</strong> Instagram has limited feed API access.
                Only your own posts are accessible, and a Professional/Creator
                account is required. Personal Instagram accounts cannot access
                feed data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Status Card */}
      <div className="card-premium p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="h-5 w-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-slate-800 font-semibold mb-1">
              Real-time Updates
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Webhooks are automatically registered to provide real-time post
              status updates. This enables tracking when posts are published,
              failed, or encounter errors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
