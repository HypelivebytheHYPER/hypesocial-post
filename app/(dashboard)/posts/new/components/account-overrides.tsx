"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformOptions } from "./platform-options";
import { OverrideField } from "./override-field";
import type { AccountConfigurationDetailsDto } from "@/types/post-for-me-types";

// Override field configuration type
type OverrideFieldConfig = {
  key: keyof AccountConfigurationDetailsDto;
  label: string;
  type: "select" | "boolean";
  options?: { value: string; label: string }[];
};

// Platform-specific override fields
const PLATFORM_OVERRIDE_FIELDS: Record<string, OverrideFieldConfig[]> = {
  tiktok: [
    {
      key: "privacy_status",
      label: "Privacy",
      type: "select",
      options: [
        { value: "public", label: "Public" },
        { value: "private", label: "Private" },
      ],
    },
    { key: "allow_duet", label: "Allow Duet", type: "boolean" },
    { key: "allow_stitch", label: "Allow Stitch", type: "boolean" },
    { key: "allow_comment", label: "Comments", type: "boolean" },
    { key: "auto_add_music", label: "Auto Music", type: "boolean" },
    { key: "is_draft", label: "Save as Draft", type: "boolean" },
  ],
  facebook: [
    // Add Facebook-specific fields here
  ],
};

export function AccountOverrides({
  platform,
  accountIds,
  accounts,
  accountOverrides,
  onSetOverride,
  onClearOverride,
  onClearAll,
  platformValues,
}: {
  platform: string;
  accountIds: string[];
  accounts: { id: string; platform: string; username: string | null }[];
  accountOverrides: Record<string, Partial<AccountConfigurationDetailsDto>>;
  onSetOverride: (
    accountId: string,
    field: keyof AccountConfigurationDetailsDto,
    value: AccountConfigurationDetailsDto[keyof AccountConfigurationDetailsDto],
  ) => void;
  onClearOverride: (
    accountId: string,
    field: keyof AccountConfigurationDetailsDto,
  ) => void;
  onClearAll: (accountId: string) => void;
  platformValues: Record<string, unknown>;
}) {
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([]);
  const fields = PLATFORM_OVERRIDE_FIELDS[platform];
  const platformAccountIds = accountIds.filter((id) => {
    const account = accounts.find((a) => a.id === id);
    return (
      account?.platform === platform ||
      (platform === "x" && account?.platform === "twitter")
    );
  });

  if (!fields || platformAccountIds.length < 2) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-200">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Account Overrides
      </div>
      <div className="space-y-1">
        {platformAccountIds.map((accountId) => {
          const account = accounts.find((a) => a.id === accountId);
          const overrides = accountOverrides[accountId] || {};
          const overrideCount = Object.keys(overrides).length;
          const isExpanded = expandedAccounts.includes(accountId);

          return (
            <div
              key={accountId}
              className="rounded-lg bg-white border border-slate-100"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedAccounts((prev) =>
                    prev.includes(accountId)
                      ? prev.filter((id) => id !== accountId)
                      : [...prev, accountId],
                  )
                }
                className="w-full flex items-center justify-between p-2 text-xs hover:bg-slate-50 rounded-lg transition-colors"
              >
                <span className="text-slate-600 font-medium truncate">
                  @{account?.username || accountId.slice(0, 8)}
                </span>
                <div className="flex items-center gap-1.5">
                  {overrideCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-slate-700 text-white rounded-full text-[10px] font-medium">
                      {overrideCount}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </button>
              {isExpanded && (
                <div className="px-2 pb-2 space-y-0.5">
                  {fields.map((field) => {
                    const isEnabled = field.key in overrides;
                    return (
                      <OverrideField
                        key={field.key}
                        field={field}
                        isEnabled={isEnabled}
                        value={overrides[field.key]}
                        platformValue={platformValues[field.key]}
                        onToggle={(enabled) => {
                          if (enabled) {
                            onSetOverride(
                              accountId,
                              field.key,
                              platformValues[
                                field.key
                              ] as AccountConfigurationDetailsDto[keyof AccountConfigurationDetailsDto],
                            );
                          } else {
                            onClearOverride(accountId, field.key);
                          }
                        }}
                        onChange={(value) =>
                          onSetOverride(
                            accountId,
                            field.key,
                            value as AccountConfigurationDetailsDto[keyof AccountConfigurationDetailsDto],
                          )
                        }
                      />
                    );
                  })}
                  {overrideCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onClearAll(accountId)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 mt-1 transition-colors"
                    >
                      Reset all
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
