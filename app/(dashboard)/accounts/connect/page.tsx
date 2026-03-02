"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Link2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
  Unplug,
} from "lucide-react";
import { socialPlatforms, getPlatformById } from "@/lib/social-platforms";
import { platformIconsMap } from "@/lib/social-platforms";
import {
  useAccounts,
  useConnectAccount,
  useDisconnectAccount,
  usePausedAccounts,
} from "@/lib/hooks/usePostForMe";
import type { SocialAccount } from "@/types/post-for-me";
import { proxyMediaUrl } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

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

/**
 * Get initials from username for avatar fallback
 */
function getInitials(username: string | null, platform: string): string {
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return platform.slice(0, 2).toUpperCase();
}

/**
 * Group accounts by platform, preserving order from socialPlatforms
 */
function groupAccountsByPlatform(
  accounts: SocialAccount[],
): Map<string, SocialAccount[]> {
  const grouped = new Map<string, SocialAccount[]>();
  for (const account of accounts) {
    const existing = grouped.get(account.platform) || [];
    existing.push(account);
    grouped.set(account.platform, existing);
  }
  return grouped;
}

export default function ConnectAccountsPage() {
  // Fetch real accounts from API
  const {
    data: accountsData,
    isLoading: accountsLoading,
    error: accountsError,
  } = useAccounts();
  const connectAccount = useConnectAccount();
  const disconnectAccount = useDisconnectAccount();
  const { isReady, toggleAccount, isPaused } = usePausedAccounts();

  const connectedAccounts = accountsData?.data || [];
  const accountsByPlatform = groupAccountsByPlatform(connectedAccounts);

  // Platforms that have no connected accounts at all
  const connectedPlatformIds = new Set(
    connectedAccounts.map((a) => a.platform),
  );
  const unconnectedPlatforms = socialPlatforms.filter(
    (p) => !connectedPlatformIds.has(p.id),
  );

  // Platforms that have at least one connected account (for "Add another")
  const connectedPlatformsList = socialPlatforms.filter((p) =>
    connectedPlatformIds.has(p.id),
  );

  const handleConnect = (platformId: string) => {
    connectAccount.mutate(
      { platform: platformId },
      {
        onError: (error) => {
          toast.error(`Failed to connect: ${error.message}`);
        },
      },
    );
  };

  const handleDisconnect = (account: SocialAccount) => {
    disconnectAccount.mutate(account.id, {
      onSuccess: () => {
        toast.success(
          `Disconnected ${account.username || account.platform}`,
        );
      },
      onError: (error) => {
        toast.error(`Failed to disconnect: ${error.message}`);
      },
    });
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

      {/* ===== Section A: Connected Accounts ===== */}
      {!accountsLoading && connectedAccounts.length > 0 && (
        <section className="space-y-5" data-testid="connected-accounts">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Connected Accounts
          </h2>

          {/* Iterate in socialPlatforms order */}
          {socialPlatforms.map((platform) => {
            const accounts = accountsByPlatform.get(platform.id);
            if (!accounts || accounts.length === 0) return null;

            const Icon = platform.Icon;

            return (
              <div key={platform.id} className="space-y-2">
                {/* Platform group header */}
                <div className="flex items-center gap-2 px-1">
                  <div
                    className={`w-6 h-6 rounded-lg ${platform.color} flex items-center justify-center text-white`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">
                    {platform.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {accounts.length} account{accounts.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Individual account cards */}
                {accounts.map((account) => {
                  const isExpiringSoon = isTokenExpiringSoon(
                    account.access_token_expires_at,
                  );
                  const accountPaused = isPaused(account.id);
                  const isConnected = account.status === "connected";
                  const isActive = isConnected && !accountPaused;

                  return (
                    <div
                      key={account.id}
                      className={`card-premium p-4 ${account.status === "disconnected" ? "border-amber-200" : ""} ${accountPaused ? "opacity-75" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Profile Photo */}
                          <Avatar className={`h-10 w-10 ${accountPaused ? "grayscale" : ""}`}>
                            {account.profile_photo_url && (
                              <AvatarImage
                                src={proxyMediaUrl(account.profile_photo_url)}
                                alt={account.username || platform.name}
                              />
                            )}
                            <AvatarFallback
                              className={`${platform.color} text-white text-xs font-semibold`}
                            >
                              {getInitials(account.username, platform.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-slate-800 font-semibold text-sm truncate">
                                {account.username
                                  ? `@${account.username}`
                                  : platform.name}
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
                              {account.status === "disconnected" && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                                  Disconnected
                                </Badge>
                              )}
                              {isExpiringSoon && (
                                <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                                  {formatExpiration(
                                    account.access_token_expires_at,
                                  )}
                                </Badge>
                              )}
                            </div>
                            {isConnected &&
                              account.access_token_expires_at &&
                              !isExpiringSoon && (
                                <p className="text-slate-400 text-xs mt-0.5">
                                  {formatExpiration(
                                    account.access_token_expires_at,
                                  )}
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Pause/Resume Toggle */}
                          {isConnected && isReady && (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!accountPaused}
                                onCheckedChange={() =>
                                  toggleAccount(account.id)
                                }
                                className="data-[state=checked]:bg-emerald-500"
                              />
                              <span className="text-xs text-slate-400 hidden sm:inline">
                                {accountPaused ? "Paused" : "Active"}
                              </span>
                            </div>
                          )}

                          {/* Reconnect button for disconnected accounts */}
                          {account.status === "disconnected" && (
                            <Button
                              variant="premium"
                              size="sm"
                              onClick={() => handleConnect(platform.id)}
                              disabled={connectAccount.isPending}
                            >
                              {connectAccount.isPending ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Reconnect
                            </Button>
                          )}

                          {/* Reconnect for token expiry */}
                          {isConnected && isExpiringSoon && (
                            <Button
                              variant="soft"
                              size="sm"
                              onClick={() => handleConnect(platform.id)}
                              disabled={connectAccount.isPending}
                            >
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              Renew
                            </Button>
                          )}

                          {/* Disconnect button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(account)}
                            disabled={disconnectAccount.isPending}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            {disconnectAccount.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Unplug className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      )}

      {/* ===== Section B: Connect New Platform ===== */}
      {!accountsLoading && (
        <section className="space-y-3" data-testid="connect-platforms">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            {connectedAccounts.length > 0
              ? "Connect More Accounts"
              : "Connect a Platform"}
          </h2>

          {/* Unconnected platforms - prominent cards */}
          {unconnectedPlatforms.map((platform) => {
            const Icon = platform.Icon;

            return (
              <div key={platform.id} className="card-premium p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${platform.color} flex items-center justify-center text-white shadow-sm`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-slate-800 font-semibold">
                        {platform.name}
                      </h3>
                      <p className="text-slate-400 text-sm">{platform.handle}</p>
                    </div>
                  </div>

                  <Button
                    variant="premium"
                    size="sm"
                    onClick={() => handleConnect(platform.id)}
                    disabled={connectAccount.isPending}
                  >
                    {connectAccount.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Connecting...
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
            );
          })}

          {/* Already-connected platforms - "Add another" option */}
          {connectedPlatformsList.map((platform) => {
            const Icon = platform.Icon;
            const accountCount =
              accountsByPlatform.get(platform.id)?.length || 0;

            return (
              <div
                key={`add-${platform.id}`}
                className="card-premium p-4 border-dashed"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${platform.color} flex items-center justify-center text-white opacity-75`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-slate-600 font-medium text-sm">
                        {platform.name}
                      </h3>
                      <p className="text-slate-400 text-xs">
                        {accountCount} connected &middot; Add another account
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => handleConnect(platform.id)}
                    disabled={connectAccount.isPending}
                  >
                    {connectAccount.isPending ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Add
                  </Button>
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
                &bull; <strong>posts</strong> — Required for publishing content
              </li>
              <li>
                &bull; <strong>feeds</strong> — Required for analytics and viewing
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
