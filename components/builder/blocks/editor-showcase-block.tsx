"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Play, Wand2, MousePointer2, Type, Image as ImageIcon, Layout } from "lucide-react";

export interface EditorShowcaseBlockProps {
  badge?: string;
  headline?: string;
  subheadline?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  showBadge?: boolean;
  showSecondaryCta?: boolean;
}

export function EditorShowcaseBlock({ props }: { props: EditorShowcaseBlockProps }) {
  const {
    badge = "AI-Powered",
    headline = "The creative editor that thinks with you",
    subheadline = "Build stunning pages with an intelligent canvas. Drag, drop, and let AI handle the details.",
    ctaPrimary = "Try Editor Free",
    ctaSecondary = "Watch Demo",
    showBadge = true,
    showSecondaryCta = true,
  } = props;

  return (
    <section className="relative w-full overflow-hidden bg-background py-16 lg:py-24">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Headline */}
        <div className="mb-12 text-center">
          {showBadge && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="h-3 w-3" />
                {badge}
              </Badge>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mb-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground"
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Button size="lg" className="gap-2">
              {ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {showSecondaryCta && (
              <Button size="lg" variant="outline" className="gap-2">
                <Play className="h-4 w-4" />
                {ctaSecondary}
              </Button>
            )}
          </motion.div>
        </div>

        {/* Editor Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl backdrop-blur"
        >
          {/* Top toolbar */}
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="ml-4 hidden h-6 w-px bg-border sm:block" />
              <div className="ml-4 hidden items-center gap-3 text-muted-foreground sm:flex">
                <MousePointer2 className="h-4 w-4" />
                <Type className="h-4 w-4" />
                <ImageIcon className="h-4 w-4" />
                <Layout className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-md bg-background px-2 py-1 text-[10px] text-muted-foreground sm:block">
                ⌘K Smart Search
              </div>
              <Button size="sm" className="h-7 gap-1 text-xs">
                <Wand2 className="h-3 w-3" />
                Auto Layout
              </Button>
            </div>
          </div>

          {/* Workspace */}
          <div className="grid min-h-[320px] sm:min-h-[400px] sm:grid-cols-[1fr_1.4fr]">
            {/* Left panel — Layers / Code */}
            <div className="hidden flex-col border-r border-border/60 bg-muted/20 sm:flex">
              <div className="border-b border-border/60 px-3 py-2 text-[11px] font-medium text-muted-foreground">
                Layers
              </div>
              <div className="flex-1 space-y-1 p-3">
                {["Hero Section", "Features Grid", "CTA Banner", "Pricing Cards", "Footer"].map((layer, i) => (
                  <motion.div
                    key={layer}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                      i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Layout className="h-3 w-3" />
                    {layer}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right panel — Canvas */}
            <div className="relative flex flex-col items-center justify-center bg-background p-6 sm:p-10">
              {/* Floating card 1 */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-full max-w-sm rounded-xl border border-border/60 bg-card p-4 shadow-lg"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-1/2 rounded bg-muted" />
                    <div className="h-2 w-1/3 rounded bg-muted/60" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded bg-muted/60" />
                  <div className="h-2 w-5/6 rounded bg-muted/60" />
                </div>
              </motion.div>

              {/* Floating card 2 */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="mt-4 w-full max-w-sm rounded-xl border border-border/60 bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-lg"
              >
                <div className="mb-2 text-sm font-semibold">Smart suggestion</div>
                <p className="text-xs opacity-90">This CTA converts 24% better with a gradient background.</p>
                <div className="mt-3 flex gap-2">
                  <div className="rounded bg-white/20 px-2 py-1 text-[10px]">Apply</div>
                  <div className="rounded bg-white/10 px-2 py-1 text-[10px]">Dismiss</div>
                </div>
              </motion.div>

              {/* AI orb */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>

              {/* Cursor */}
              <motion.div
                animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute left-1/3 top-1/2"
              >
                <MousePointer2 className="h-5 w-5 text-foreground drop-shadow" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
