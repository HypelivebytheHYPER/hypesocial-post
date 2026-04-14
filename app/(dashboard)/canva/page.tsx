"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Link2,
  Unlink,
  Loader2,
  ImageIcon,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useCanvaToken,
  useConnectCanva,
  useDisconnectCanva,
  useCanvaDesigns,
} from "@/lib/hooks";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function ErrorToast() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam) {
      toast.error(`Canva connection failed: ${errorParam}`);
    }
  }, [errorParam]);

  return null;
}

function CanvaPageContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [showError, setShowError] = useState<string | null>(errorParam);

  const { data: tokenData, isLoading: isTokenLoading, refetch: refetchToken } = useCanvaToken();
  const connect = useConnectCanva();
  const disconnect = useDisconnectCanva();
  const { data: designsData, isLoading: isDesignsLoading } = useCanvaDesigns(
    { limit: 20 },
  );

  const handleConnect = () => {
    connect.mutate({ redirect_path: "/canva" });
  };

  const connected = tokenData?.connected ?? false;
  const designs = (designsData as { items?: unknown[] })?.items ?? [];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              Canva
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Connect your Canva account to import designs and brand templates
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isTokenLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : connected ? (
              <>
                <Badge
                  variant="secondary"
                  className="h-8 px-3 gap-1.5 text-sm font-medium"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Connected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => disconnect.mutate()}
                  disabled={disconnect.isPending}
                >
                  {disconnect.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="h-8 gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900"
                onClick={handleConnect}
                disabled={connect.isPending}
              >
                {connect.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Connect Canva
              </Button>
            )}
          </div>
        </motion.div>

        {/* Error Banner */}
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">
                Connection failed: {showError}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowError(null)}
              >
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}

        {/* Content */}
        {!connected && !isTokenLoading ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-12 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
              <Palette className="h-8 w-8 text-slate-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Connect your Canva account
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Import designs, browse brand templates, and autofill content directly from Canva.
            </p>
            <Button
              className="mt-6 gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900"
              onClick={handleConnect}
              disabled={connect.isPending}
            >
              {connect.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Connect Canva
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="space-y-6"
          >
            {/* Designs Section */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Your Designs
                  </h2>
                  <p className="text-sm text-slate-500">
                    Recent designs from your Canva account
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => refetchToken()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900"
                  asChild
                >
                  <a href="/canva/editor">
                    <Palette className="h-4 w-4" />
                    Open Editor
                  </a>
                </Button>
              </div>

              {isDesignsLoading ? (
                <div className="mt-6 flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : designs.length === 0 ? (
                <div className="mt-6 flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-500">No designs found</p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {designs.map((design: any, idx: number) => (
                    <div
                      key={design.id || idx}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    >
                      {design.thumbnail?.url ? (
                        <img
                          src={design.thumbnail.url}
                          alt={design.title || "Canva design"}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                          <Palette className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="truncate text-sm font-medium text-white">
                          {design.title || "Untitled design"}
                        </p>
                      </div>
                      <a
                        href={design.urls?.edit || design.urls?.view || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-900 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function CanvaPage() {
  return (
    <Suspense fallback={null}>
      <ErrorToast />
      <CanvaPageContent />
    </Suspense>
  );
}
