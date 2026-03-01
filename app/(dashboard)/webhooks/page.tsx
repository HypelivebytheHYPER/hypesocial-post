"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Webhook,
  Copy,
  Trash2,
  Check,
  RefreshCw,
  Plus,
  ChevronRight,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  pfmKeys,
} from "@/lib/hooks/usePostForMe";
import { PostForMeEventType } from "@/types/webhooks";

const DEFAULT_EVENT_TYPES: PostForMeEventType[] = [
  "social.post.created",
  "social.post.updated",
  "social.post.result.created",
  "social.account.created",
  "social.account.updated",
];

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: webhooksResponse, isLoading, error } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const webhooks = webhooksResponse?.data || [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${appUrl}/api/webhooks/post-for-me`;

  const handleRegister = async () => {
    try {
      const result = await createWebhook.mutateAsync({
        url: webhookUrl,
        eventTypes: DEFAULT_EVENT_TYPES,
      });
      toast.success("Webhook registered", {
        description: `Secret: ${result.secret.substring(0, 20)}...`,
        duration: 5000,
      });
    } catch (err) {
      toast.error("Failed to register", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webhook?")) return;
    try {
      await deleteWebhook.mutateAsync(id);
      toast.success("Webhook deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEventTypeColor = (
    event: string,
  ): "default" | "secondary" | "info" | "success" | "warning" => {
    if (event.includes("created")) return "success";
    if (event.includes("updated")) return "info";
    if (event.includes("deleted")) return "warning";
    return "secondary";
  };

  return (
    <div className="space-y-8">
      {/* Header - Premium Style */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="greeting-title">Webhooks</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time event streaming from Post For Me
          </p>
        </div>
        <Button
          variant="soft"
          size="sm"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: pfmKeys.webhooks() })
          }
          disabled={isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="divider-soft" />

      {/* Register Section - Premium Card */}
      <section className="card-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Webhook className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-slate-800 font-semibold">Register Webhook</h2>
            <p className="text-slate-400 text-xs">
              Connect your endpoint to receive events
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <code className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-mono text-xs text-slate-500">
            {webhookUrl}
          </code>
          <Button
            onClick={handleRegister}
            disabled={createWebhook.isPending || isLoading}
            variant="premium"
          >
            <Plus className="mr-2 h-4 w-4" />
            {createWebhook.isPending ? "Registering..." : "Register"}
          </Button>
        </div>
      </section>

      {/* Webhooks List - Premium Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Active Webhooks</h2>
          <span className="text-sm text-slate-400 font-medium">
            {isLoading ? "..." : `${webhooks.length} active`}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-3xl" />
            ))}
          </div>
        ) : error ? (
          <div className="card-premium p-6 border-red-200">
            <p className="text-red-600">{error.message}</p>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Webhook className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-medium">No webhooks</h3>
            <p className="text-slate-400 text-sm mt-1">
              Register a webhook to start receiving events
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="card-premium p-5 group">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono text-slate-500">
                        {webhook.id}
                      </span>
                      <Badge className="badge-soft success text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 break-all font-mono">
                      {webhook.url}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {webhook.event_types.map((event) => (
                        <Badge
                          key={event}
                          variant={getEventTypeColor(event)}
                          className="text-[10px]"
                        >
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:flex-col sm:items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(webhook.secret, webhook.id)
                      }
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {copiedId === webhook.id ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(webhook.id)}
                      disabled={deleteWebhook.isPending}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Event Types - Grid */}
      <section>
        <h2 className="section-title mb-4">Event Types</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DEFAULT_EVENT_TYPES.map((event) => (
            <code
              key={event}
              className="px-4 py-3 bg-white/80 rounded-xl text-xs font-mono text-slate-500 border border-slate-100"
            >
              {event}
            </code>
          ))}
        </div>
      </section>
    </div>
  );
}
