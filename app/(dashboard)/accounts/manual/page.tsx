"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { useCreateSocialAccount } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const platforms = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X (Twitter)" },
  { value: "tiktok", label: "TikTok" },
  { value: "tiktok_business", label: "TikTok Business" },
  { value: "youtube", label: "YouTube" },
  { value: "pinterest", label: "Pinterest" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "bluesky", label: "Bluesky" },
  { value: "threads", label: "Threads" },
];

export default function ManualAccountPage() {
  const createAccount = useCreateSocialAccount();
  const [formData, setFormData] = useState({
    platform: "",
    user_id: "",
    access_token: "",
    access_token_expires_at: "",
    external_id: "",
    username: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.platform || !formData.access_token || !formData.user_id) return;
    
    // Default expiration to 60 days from now if not provided
    const expiresAt = formData.access_token_expires_at || 
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    
    createAccount.mutate({
      platform: formData.platform,
      user_id: formData.user_id,
      access_token: formData.access_token,
      access_token_expires_at: expiresAt,
      external_id: formData.external_id || undefined,
      username: formData.username || undefined,
    }, {
      onSuccess: () => {
        // Reset form on success
        setFormData({
          platform: "",
          user_id: "",
          access_token: "",
          access_token_expires_at: "",
          external_id: "",
          username: "",
        });
      },
    });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-600"
          asChild
        >
          <Link href="/accounts/connect">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="greeting-title">Manual Account Setup</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Create account with existing access token
          </p>
        </div>
      </div>

      <div className="divider-soft" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-premium p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="platform">Platform *</Label>
          <select
            id="platform"
            value={formData.platform}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, platform: e.target.value }))
            }
            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select platform</option>
            {platforms.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user_id">User ID *</Label>
          <Input
            id="user_id"
            placeholder="Your internal user ID"
            value={formData.user_id}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, user_id: e.target.value }))
            }
            required
          />
          <p className="text-xs text-slate-400">
            Your system&apos;s user identifier
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="access_token">Access Token *</Label>
          <Input
            id="access_token"
            type="password"
            placeholder="Paste access token here"
            value={formData.access_token}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, access_token: e.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expires_at">Token Expires At</Label>
          <Input
            id="expires_at"
            type="datetime-local"
            value={formData.access_token_expires_at}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                access_token_expires_at: e.target.value,
              }))
            }
          />
          <p className="text-xs text-slate-400">
            Defaults to 60 days from now if not set
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="@handle"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="external_id">External ID</Label>
            <Input
              id="external_id"
              placeholder="Platform user ID"
              value={formData.external_id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, external_id: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="premium"
            className="w-full"
            disabled={createAccount.isPending}
          >
            {createAccount.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Account
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Info Card */}
      <div className="card-premium p-4 bg-amber-50/50 border-amber-200">
        <h3 className="text-sm font-medium text-amber-800 mb-2">
          Admin/Migration Use Only
        </h3>
        <ul className="text-xs text-amber-600 space-y-1">
          <li>&bull; For importing existing tokens from another system</li>
          <li>&bull; Regular users should use the OAuth flow at Connect</li>
          <li>&bull; Ensure tokens include &quot;feeds&quot; permission for analytics</li>
        </ul>
      </div>
    </div>
  );
}
