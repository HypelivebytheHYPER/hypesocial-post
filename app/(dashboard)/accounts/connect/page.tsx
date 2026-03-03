"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Link2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
  Unplug,
  ChevronDown,
  Shield,
  Zap,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { socialPlatforms } from "@/lib/social-platforms";
import {
  useAccounts,
  useConnectAccount,
  useDisconnectAccount,
  usePausedAccounts,
  pfmKeys,
} from "@/lib/hooks/usePostForMe";
import type { SocialAccount } from "@/types/post-for-me";
import { proxyMediaUrl } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { toast } from "sonner";

/**
 * Check if token is expiring soon and needs user attention.
 * Only warn at 3+ days out. Tokens under 3 days (e.g. TikTok's 24h tokens)
 * are auto-refreshed by PFM — no user action needed.
 */
function isTokenExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysUntilExpiry <= 7 && daysUntilExpiry >= 3;
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
 * Group accounts by platform
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

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You denied access to the social account.",
  callback_not_configured: "OAuth callback is not configured. Contact support.",
};

function ConnectAccountsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Handle OAuth return: success
  useEffect(() => {
    if (searchParams.get("isSuccess") === "true") {
      const provider = searchParams.get("provider");
      toast.success(
        provider
          ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} connected successfully!`
          : "Account connected successfully!",
      );
      queryClient.invalidateQueries({ queryKey: pfmKeys.accounts() });
      router.replace("/accounts/connect");
    }
  }, [searchParams, queryClient, router]);

  // Handle OAuth return: error
  useEffect(() => {
    const error = searchParams.get("error");
    const isFailed = searchParams.get("isSuccess") === "false";
    if (error || isFailed) {
      toast.error(
        ERROR_MESSAGES[error || ""] || error || "Connection failed. Please try again.",
      );
      router.replace("/accounts/connect");
    }
  }, [searchParams, router]);

  // Fetch real accounts from API
  const {
    data: accountsData,
    isLoading: accountsLoading,
    error: accountsError,
  } = useAccounts();
  const connectAccount = useConnectAccount();
  const disconnectAccount = useDisconnectAccount();
  const { isReady, toggleAccount, isPaused } = usePausedAccounts();

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const connectedAccounts = accountsData?.data || [];
  const accountsByPlatform = groupAccountsByPlatform(connectedAccounts);
  const connectedPlatformCount = new Set(
    connectedAccounts.map((a) => a.platform),
  ).size;

  const handleConnect = (platformId: string) => {
    setConnectingPlatform(platformId);
    connectAccount.mutate(
      { platform: platformId },
      {
        onError: (error) => {
          setConnectingPlatform(null);
          toast.error(`Failed to connect: ${error.message}`);
        },
        onSettled: () => {
          setTimeout(() => setConnectingPlatform(null), 5000);
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
    <div className="mx-auto max-w-2xl space-y-6">
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
            {!accountsLoading && connectedAccounts.length > 0
              ? `${connectedAccounts.length} account${connectedAccounts.length !== 1 ? "s" : ""} across ${connectedPlatformCount} platform${connectedPlatformCount !== 1 ? "s" : ""}`
              : "Link your social accounts"}
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

      {/* ===== Platform Cards — one block per channel ===== */}
      {!accountsLoading && (
        <div className="space-y-3" data-testid="platform-list">
          {socialPlatforms.map((platform) => {
            const accounts = accountsByPlatform.get(platform.id) || [];
            const Icon = platform.Icon;
            const hasAccounts = accounts.length > 0;

            return (
              <section key={platform.id} className="card-premium p-4">
                {/* Platform header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${platform.color} flex items-center justify-center text-white shadow-sm`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-slate-800 font-semibold text-sm">
                          {platform.name}
                        </h3>
                        {hasAccounts && (
                          <Badge className="badge-soft success text-[10px]">
                            {accounts.length} connected
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {platform.handle}
                        {" · "}
                        {platform.supportsImage && platform.supportsVideo
                          ? "Image & Video"
                          : platform.supportsVideo
                            ? "Video only"
                            : "Image only"}
                      </p>
                    </div>
                  </div>

                  {/* Connect button — only for platforms with no accounts yet */}
                  {!hasAccounts && (
                    <Button
                      variant="premium"
                      size="sm"
                      onClick={() => handleConnect(platform.id)}
                      disabled={connectingPlatform !== null}
                    >
                      {connectingPlatform === platform.id ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="mr-1.5 h-3.5 w-3.5" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Connected account rows within this platform */}
                {hasAccounts && (
                  <div className="mt-3 space-y-2">
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
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 ${
                            account.status === "disconnected"
                              ? "border border-amber-200"
                              : ""
                          } ${accountPaused ? "opacity-75" : ""}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              className={`h-8 w-8 flex-shrink-0 ${accountPaused ? "grayscale" : ""}`}
                            >
                              {account.profile_photo_url && (
                                <AvatarImage
                                  src={proxyMediaUrl(
                                    account.profile_photo_url,
                                  )}
                                  alt={account.username || platform.name}
                                />
                              )}
                              <AvatarFallback
                                className={`${platform.color} text-white text-[10px] font-semibold`}
                              >
                                {getInitials(account.username, platform.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-medium text-slate-700 truncate">
                                  {account.username
                                    ? `@${account.username}`
                                    : platform.name}
                                </span>
                                {isActive && (
                                  <Badge className="badge-soft success text-[10px] py-0 px-1.5">
                                    Active
                                  </Badge>
                                )}
                                {accountPaused && (
                                  <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[10px] py-0 px-1.5">
                                    Paused
                                  </Badge>
                                )}
                                {account.status === "disconnected" && (
                                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] py-0 px-1.5">
                                    Disconnected
                                  </Badge>
                                )}
                                {isExpiringSoon && (
                                  <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] py-0 px-1.5">
                                    {formatExpiration(
                                      account.access_token_expires_at,
                                    )}
                                  </Badge>
                                )}
                              </div>
                              {isConnected &&
                                account.access_token_expires_at &&
                                !isExpiringSoon && (
                                  <p className="text-slate-400 text-[10px] mt-0.5">
                                    {formatExpiration(
                                      account.access_token_expires_at,
                                    )}
                                  </p>
                                )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Reconnect for disconnected */}
                            {account.status === "disconnected" && (
                              <Button
                                variant="premium"
                                size="sm"
                                className="h-7 text-xs px-2.5"
                                onClick={() => handleConnect(platform.id)}
                                disabled={connectingPlatform !== null}
                              >
                                {connectingPlatform === platform.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                              </Button>
                            )}

                            {/* Renew for expiring tokens */}
                            {isConnected && isExpiringSoon && (
                              <Button
                                variant="soft"
                                size="sm"
                                className="h-7 text-xs px-2.5"
                                onClick={() => handleConnect(platform.id)}
                                disabled={connectingPlatform !== null}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}

                            {/* Pause/Resume toggle */}
                            {isConnected && isReady && (
                              <Switch
                                checked={!accountPaused}
                                onCheckedChange={() =>
                                  toggleAccount(account.id)
                                }
                                className="data-[state=checked]:bg-emerald-500 scale-90"
                              />
                            )}

                            {/* Disconnect */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={disconnectAccount.isPending}
                                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                                >
                                  {disconnectAccount.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Unplug className="h-3 w-3" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Disconnect {platform.name}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will disconnect{" "}
                                    {account.username
                                      ? `@${account.username}`
                                      : platform.name}
                                    . You can reconnect later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDisconnect(account)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Disconnect
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add another account */}
                    <button
                      onClick={() => handleConnect(platform.id)}
                      disabled={connectingPlatform !== null}
                      className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors text-xs"
                    >
                      {connectingPlatform === platform.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Add another account
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Collapsible Tips & Permissions */}
      <section className="card-premium overflow-hidden">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center justify-between w-full p-4 text-left hover:bg-slate-50/50 transition-colors rounded-[28px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-700">
                Tips & Permissions
              </h3>
              <p className="text-xs text-slate-400">
                Security, requirements, and real-time updates
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${showInfo ? "rotate-180" : ""}`}
          />
        </button>
        {showInfo && (
          <div className="px-4 pb-4 space-y-4">
            <div className="divider-soft" />
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Link2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-500">
                  Your credentials are securely stored via OAuth and never
                  shared with third parties.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-slate-500">
                  <p className="font-medium text-slate-600 mb-1">
                    Permissions
                  </p>
                  <ul className="text-xs space-y-0.5">
                    <li>
                      <strong>posts</strong> — Required for publishing content
                    </li>
                    <li>
                      <strong>feeds</strong> — Required for analytics and
                      viewing posts
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-slate-500">
                  <p className="font-medium text-slate-600 mb-1">
                    Instagram Requirements
                  </p>
                  <ul className="text-xs space-y-0.5">
                    <li>
                      Professional or Creator account required — personal
                      accounts cannot publish via API
                    </li>
                    <li>
                      Switch in Instagram &gt; Settings &gt; Account &gt;
                      Professional account
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-slate-500">
                  Webhooks are auto-registered for real-time post status
                  updates including publish success, failures, and errors.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function ConnectAccountsPage() {
  return (
    <Suspense>
      <ConnectAccountsContent />
    </Suspense>
  );
}
