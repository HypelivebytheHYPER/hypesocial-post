"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export interface HeroBlockProps {
  badge?: string;
  headline?: string;
  subheadline?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  showBadge?: boolean;
  showSecondaryCta?: boolean;
  alignment?: "left" | "center";
  backgroundImage?: string;
  overlayOpacity?: number;
}

export function HeroBlock({ props }: { props: HeroBlockProps }) {
  const {
    badge = "New Release",
    headline = "Build faster with our platform",
    subheadline = "Create stunning pages in minutes with drag-and-drop simplicity and production-ready code output.",
    ctaPrimary = "Get Started",
    ctaSecondary = "Watch Demo",
    showBadge = true,
    showSecondaryCta = true,
    alignment = "center",
    backgroundImage = "",
    overlayOpacity = 0,
  } = props;

  const alignClass = alignment === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <section className="relative w-full overflow-hidden bg-background py-16 lg:py-24">
      {backgroundImage && (
        <>
          { }
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-background"
            style={{ opacity: overlayOpacity }}
          />
        </>
      )}
      <div className={`relative mx-auto flex max-w-4xl flex-col px-4 ${alignClass}`}>
        {showBadge && (
          <Badge variant="secondary" className="mb-4 w-fit">
            {badge}
          </Badge>
        )}
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {headline}
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
          {subheadline}
        </p>
        <div className="flex flex-wrap gap-3">
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
        </div>
      </div>
    </section>
  );
}
