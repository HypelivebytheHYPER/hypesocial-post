"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export interface CtaBlockProps {
  title?: string;
  description?: string;
  buttonText?: string;
  showGradient?: boolean;
}

export function CtaBlock({ props }: { props: CtaBlockProps }) {
  const {
    title = "Ready to get started?",
    description = "Join thousands of teams building better products today.",
    buttonText = "Start for free",
    showGradient = true,
  } = props;

  return (
    <section className="w-full bg-background py-12 lg:py-20">
      <div
        className={`mx-auto max-w-4xl rounded-2xl px-6 py-12 text-center lg:px-12 lg:py-16 ${
          showGradient
            ? "bg-gradient-to-br from-primary to-blue-700 text-primary-foreground"
            : "border border-border bg-card text-card-foreground"
        }`}
      >
        <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className={`mx-auto mb-8 max-w-xl ${showGradient ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
          {description}
        </p>
        <Button
          size="lg"
          variant={showGradient ? "secondary" : "default"}
          className="gap-2"
        >
          {buttonText}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
