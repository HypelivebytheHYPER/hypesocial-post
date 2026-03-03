"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Webhook,
  ArrowLeft,
  RefreshCw,
  Server,
  Globe,
  Zap,
  Radio,
  Shield,
  Trash2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useWebhooks, useDeleteWebhook, pfmKeys } from "@/lib/hooks/usePostForMe";
import type { PostForMeEventType } from "@/lib/validations/webhooks";

const WEBHOOK_ENDPOINT =
  process.env.NEXT_PUBLIC_WEBHOOK_URL ||
  "https://api.hypelive.app/webhooks/post-for-me";

interface EventTypeMeta {
  label: string;
  icon: typeof Zap;
  color: string;
  bg: string;
  border: string;
}

const EVENT_TYPE_META: Record<PostForMeEventType, EventTypeMeta> = {
  "social.post.created": {
    label: "Post Created",
    icon: Zap,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  "social.post.updated": {
    label: "Post Updated",
    icon: RefreshCw,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  "social.post.deleted": {
    label: "Post Deleted",
    icon: Trash2,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  "social.post.result.created": {
    label: "Result Created",
    icon: Radio,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  "social.account.created": {
    label: "Account Created",
    icon: Globe,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  "social.account.updated": {
    label: "Account Updated",
    icon: Shield,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { y: 8 },
  visible: { y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0, 1] } },
};

function ConnectionLine({
  color,
  fillDelay,
  pulseDelay,
}: {
  color: "emerald" | "blue";
  fillDelay: number;
  pulseDelay: number;
}) {
  const colors = {
    emerald: { fill: "bg-emerald-400", dot: "bg-emerald-500" },
    blue: { fill: "bg-blue-400", dot: "bg-blue-500" },
  };
  const c = colors[color];

  return (
    <div className="flex-1 max-w-[80px] mx-2 relative h-[2px]">
      <div className="absolute inset-0 bg-slate-200 rounded-full" />
      <motion.div
        className={`absolute inset-y-0 left-0 ${c.fill} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: fillDelay, duration: 0.6, ease: "easeOut" }}
      />
      <motion.div
        className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${c.dot}`}
        initial={{ x: 0, opacity: 0 }}
        animate={{ x: 72, opacity: [0, 1, 1, 0] }}
        transition={{
          delay: pulseDelay,
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "linear",
        }}
      />
    </div>
  );
}

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const { data: webhooksResponse, isLoading, error } = useWebhooks(
    undefined,
    { refetchInterval: 30_000 },
  );
  const deleteWebhook = useDeleteWebhook();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webhook? Events will no longer be forwarded.")) return;
    setDeletingId(id);
    try {
      await deleteWebhook.mutateAsync(id);
      toast.success("Webhook deleted");
    } catch {
      toast.error("Failed to delete webhook");
    } finally {
      setDeletingId(null);
    }
  };

  // Zod validation now runs in useWebhooks queryFn (once per fetch, not per render)
  const webhooks = useMemo(() => webhooksResponse?.data ?? [], [webhooksResponse?.data]);
  const subscribedEvents = useMemo(
    () => new Set<string>(webhooks.flatMap((w) => w.event_types)),
    [webhooks],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-600"
          asChild
        >
          <Link href="/settings" aria-label="Back to settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="greeting-title">Webhooks</h1>
          <p className="text-slate-400 text-sm mt-0.5">
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

      {/* Architecture Flow */}
      <section className="card-premium p-6 overflow-hidden relative">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #334155 0.5px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Server className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-slate-800 font-semibold">
                Webhook Architecture
              </h2>
              <p className="text-slate-400 text-xs">
                Server-side infrastructure — no configuration needed
              </p>
            </div>
          </div>

          {/* Flow Diagram */}
          <div className="flex items-center gap-0 justify-center py-6">
            {/* Post For Me Node */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ x: -12 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Globe className="h-6 w-6 text-slate-500" />
              </div>
              <span className="text-xs font-medium text-slate-600">
                Post For Me
              </span>
              <span className="text-[10px] text-slate-400">Source</span>
            </motion.div>

            <ConnectionLine color="emerald" fillDelay={0.5} pulseDelay={1.2} />

            {/* Edge Worker Node — highlighted */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center shadow-lg shadow-slate-800/20 relative">
                <Server className="h-6 w-6 text-white" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-800">
                api.hypelive.app
              </span>
              <span className="text-[10px] text-slate-400">Edge Worker</span>
            </motion.div>

            <ConnectionLine color="blue" fillDelay={0.8} pulseDelay={1.8} />

            {/* Vercel Node */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ x: 12 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Webhook className="h-6 w-6 text-slate-500" />
              </div>
              <span className="text-xs font-medium text-slate-600 text-center leading-tight">
                hypesocial-post
              </span>
              <span className="text-[10px] text-slate-400">Vercel</span>
            </motion.div>
          </div>

          {/* Endpoint */}
          <div className="mt-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Endpoint
              </p>
              <Badge className="badge-soft success text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Live
              </Badge>
            </div>
            <code className="text-xs font-mono text-slate-500 break-all mt-1 block">
              {WEBHOOK_ENDPOINT}
            </code>
          </div>
        </div>
      </section>

      {/* Registered Webhooks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Registered Webhooks</h2>
          <span className="text-sm text-slate-400 font-medium tabular-nums">
            {isLoading ? "..." : `${webhooks.length} active`}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-[28px]" />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="card-premium p-6 border-red-200"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-red-600 text-sm">{error.message}</p>
            </motion.div>
          ) : webhooks.length === 0 ? (
            <motion.div
              key="empty"
              className="card-premium p-12 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Webhook className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-slate-700 font-medium">
                No webhooks registered
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Webhooks are managed server-side via api.hypelive.app
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="space-y-3"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {webhooks.map((webhook) => (
                <motion.div
                  key={webhook.id}
                  className="card-premium p-5"
                  variants={fadeUp}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="badge-soft success text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                          Active
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-400">
                          {webhook.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {webhook.created_at && (
                          <span className="text-[11px] text-slate-300">
                            {format(new Date(webhook.created_at), "MMM d, yyyy")}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(webhook.id)}
                          disabled={deletingId === webhook.id}
                        >
                          <Trash2 className={`h-3.5 w-3.5 ${deletingId === webhook.id ? "animate-spin" : ""}`} />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 break-all font-mono bg-slate-50 px-3 py-2 rounded-lg">
                      {webhook.url}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {webhook.event_types.map((event) => {
                        const meta = EVENT_TYPE_META[event];
                        const Icon = meta.icon;
                        return (
                          <span
                            key={event}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}
                          >
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Event Types */}
      <section>
        <h2 className="section-title mb-4">Event Types</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(EVENT_TYPE_META).map(([event, meta], index) => {
            const Icon = meta.icon;
            const isSubscribed = subscribedEvents.has(event);
            return (
              <motion.div
                key={event}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                  isSubscribed
                    ? `${meta.bg} ${meta.border}`
                    : "bg-white/80 border-slate-100"
                }`}
                initial={{ y: 6 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSubscribed ? meta.bg : "bg-slate-50"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isSubscribed ? meta.color : "text-slate-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium ${
                      isSubscribed ? meta.color : "text-slate-500"
                    }`}
                  >
                    {meta.label}
                  </p>
                  <code className="text-[10px] font-mono text-slate-400 truncate block">
                    {event}
                  </code>
                </div>
                {isSubscribed && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
