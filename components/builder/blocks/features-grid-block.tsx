"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Shield, Sparkles, BarChart3 } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Shield,
  Sparkles,
  BarChart3,
};

export interface FeaturesGridBlockProps {
  title?: string;
  subtitle?: string;
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export function FeaturesGridBlock({ props }: { props: FeaturesGridBlockProps }) {
  const {
    title = "Everything you need",
    subtitle = "Powerful features to help you build, launch, and scale your product faster than ever.",
    features = [
      { icon: "Zap", title: "Lightning Fast", description: "Optimized for speed with edge caching and minimal bundle sizes." },
      { icon: "Shield", title: "Enterprise Security", description: "SOC 2 compliant with end-to-end encryption and SSO support." },
      { icon: "Sparkles", title: "AI Powered", description: "Leverage cutting-edge AI to automate repetitive tasks and boost creativity." },
      { icon: "BarChart3", title: "Advanced Analytics", description: "Real-time insights and custom dashboards to track every metric." },
    ],
  } = props;

  return (
    <section className="w-full bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => {
            const Icon = iconMap[feature.icon] || Sparkles;
            return (
              <Card key={idx} className="flex h-full flex-col border-border/60 bg-card">
                <CardHeader className="pb-3">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
