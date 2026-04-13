/**
 * Virtualized Accounts List
 * @module components/virtual-accounts-list
 *
 * Uses TanStack Virtual for efficient rendering of large account lists (100+).
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VirtualList } from "@/components/ui/virtual-list";
import { platformIconsMap, getPlatformColor } from "@/lib/social-platforms";
import { cn } from "@/lib/utils";
import type { SocialAccount } from "@/types/post-for-me-types";
import { Users, Plus, Loader2 } from "lucide-react";
import { EmptyAccountsState } from "@/components/ui/empty-state";
import { CardSkeleton, StatsGridSkeleton } from "@/components/ui/skeleton";

interface VirtualAccountsListProps {
  accounts: SocialAccount[];
  isLoading?: boolean;
  onDisconnect?: (id: string) => void;
  isDisconnecting?: boolean;
}

const ITEM_HEIGHT = 80; // Height of each account row in pixels

export function VirtualAccountsList({
  accounts,
  isLoading,
  onDisconnect,
  isDisconnecting,
}: VirtualAccountsListProps) {
  const connectedAccounts = accounts.filter((a) => a.status === "connected");
  const disconnectedAccounts = accounts.filter((a) => a.status === "disconnected");

  const renderAccount = (account: SocialAccount) => {
    const Icon = platformIconsMap[account.platform.toLowerCase()];
    const platformColor = getPlatformColor(account.platform);

    return (
      <div className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${platformColor}20` }}
          >
            {Icon && <Icon className="h-6 w-6" style={{ color: platformColor }} />}
          </div>
          <div>
            <p className="font-medium">@{account.username || "Unknown"}</p>
            <div className="flex items-center gap-2">
              <Badge
                variant={account.status === "connected" ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  account.status === "connected" && "bg-green-500 hover:bg-green-600"
                )}
              >
                {account.status}
              </Badge>
              <span className="text-xs text-muted-foreground capitalize">
                {account.platform}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {account.status === "connected" && onDisconnect && (
            <Button
              variant="outline"
              size="sm"
              disabled={isDisconnecting}
              onClick={() => onDisconnect(account.id)}
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Disconnect"
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatsGridSkeleton count={3} />
        <div className="rounded-xl border p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} className="mb-4 last:mb-0" />
          ))}
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <EmptyAccountsState 
        onConnect={() => window.location.href = "/accounts/connect"} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{accounts.length}</p>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-500/10 p-3">
              <div className="h-6 w-6 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{connectedAccounts.length}</p>
              <p className="text-sm text-muted-foreground">Connected</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-gray-500/10 p-3">
              <div className="h-6 w-6 rounded-full bg-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{disconnectedAccounts.length}</p>
              <p className="text-sm text-muted-foreground">Disconnected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Virtualized List */}
      <div className="rounded-xl border">
        <VirtualList
          items={accounts}
          renderItem={renderAccount}
          itemHeight={ITEM_HEIGHT}
          height={500}
          overscan={5}
          className="p-4"
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Showing {accounts.length} accounts (virtualized for performance)
      </p>
    </div>
  );
}
