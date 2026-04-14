"use client";

import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { useStore } from "@tanstack/react-form";

import { useCreateSocialAccount } from "@/lib/hooks";
import { useAppForm } from "@/lib/hooks/use-app-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
] as const;

const platformValues = platforms.map((p) => p.value) as [
  (typeof platforms)[number]["value"],
  ...(typeof platforms)[number]["value"][],
];

const ManualAccountFormSchema = z.object({
  platform: z.enum(platformValues, {
    errorMap: () => ({ message: "Select a platform" }),
  }),
  user_id: z.string().min(1, "User ID is required"),
  access_token: z.string().min(1, "Access token is required"),
  access_token_expires_at: z.string().optional(),
  username: z.string().optional(),
  external_id: z.string().optional(),
});

type ManualAccountFormValues = z.infer<typeof ManualAccountFormSchema>;

const defaultValues: ManualAccountFormValues = {
  platform: "" as ManualAccountFormValues["platform"],
  user_id: "",
  access_token: "",
  access_token_expires_at: "",
  username: "",
  external_id: "",
};

export default function ManualAccountPage() {
  const createAccount = useCreateSocialAccount();

  const form = useAppForm({
    defaultValues,
    validators: {
      onBlur: ManualAccountFormSchema,
      onSubmit: ManualAccountFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const expiresAt =
        value.access_token_expires_at ||
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

      await new Promise<void>((resolve, reject) => {
        createAccount.mutate(
          {
            platform: value.platform,
            user_id: value.user_id,
            access_token: value.access_token,
            access_token_expires_at: expiresAt,
            external_id: value.external_id || undefined,
            username: value.username || undefined,
          },
          {
            onSuccess: () => {
              formApi.reset();
              resolve();
            },
            onError: (error) => reject(error),
          }
        );
      });
    },
  });

  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);

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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="card-premium p-6 space-y-5"
        noValidate
      >
        <form.AppField name="platform">
          {(field) => (
            <field.FormItem>
              <field.FormLabel>Platform *</field.FormLabel>
              <field.FormControl>
                <select
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value as ManualAccountFormValues["platform"]
                    )
                  }
                  onBlur={field.handleBlur}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select platform</option>
                  {platforms.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </field.FormControl>
              <field.FormMessage />
            </field.FormItem>
          )}
        </form.AppField>

        <form.AppField name="user_id">
          {(field) => (
            <field.FormItem>
              <field.FormLabel>User ID *</field.FormLabel>
              <field.FormControl>
                <Input
                  placeholder="Your internal user ID"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </field.FormControl>
              <field.FormDescription>
                Your system&apos;s user identifier
              </field.FormDescription>
              <field.FormMessage />
            </field.FormItem>
          )}
        </form.AppField>

        <form.AppField name="access_token">
          {(field) => (
            <field.FormItem>
              <field.FormLabel>Access Token *</field.FormLabel>
              <field.FormControl>
                <Input
                  type="password"
                  placeholder="Paste access token here"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </field.FormControl>
              <field.FormMessage />
            </field.FormItem>
          )}
        </form.AppField>

        <form.AppField name="access_token_expires_at">
          {(field) => (
            <field.FormItem>
              <field.FormLabel>Token Expires At</field.FormLabel>
              <field.FormControl>
                <Input
                  type="datetime-local"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </field.FormControl>
              <field.FormDescription>
                Defaults to 60 days from now if not set
              </field.FormDescription>
              <field.FormMessage />
            </field.FormItem>
          )}
        </form.AppField>

        <div className="grid grid-cols-2 gap-4">
          <form.AppField name="username">
            {(field) => (
              <field.FormItem>
                <field.FormLabel>Username</field.FormLabel>
                <field.FormControl>
                  <Input
                    placeholder="@handle"
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </field.FormControl>
                <field.FormMessage />
              </field.FormItem>
            )}
          </form.AppField>

          <form.AppField name="external_id">
            {(field) => (
              <field.FormItem>
                <field.FormLabel>External ID</field.FormLabel>
                <field.FormControl>
                  <Input
                    placeholder="Platform user ID"
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </field.FormControl>
                <field.FormMessage />
              </field.FormItem>
            )}
          </form.AppField>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="premium"
            className="w-full"
            disabled={isSubmitting || createAccount.isPending}
          >
            {isSubmitting || createAccount.isPending ? (
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
