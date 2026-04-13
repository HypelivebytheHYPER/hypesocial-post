"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export interface PricingBlockProps {
  title?: string;
  subtitle?: string;
  tiers?: Array<{
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    cta: string;
  }>;
}

export function PricingBlock({ props }: { props: PricingBlockProps }) {
  const {
    title = "Simple, transparent pricing",
    subtitle = "Choose the plan that fits your needs. Upgrade or downgrade at any time.",
    tiers = [
      {
        name: "Starter",
        price: "$0",
        period: "/mo",
        description: "Perfect for individuals and side projects.",
        features: ["1 project", "Basic analytics", "Community support"],
        highlighted: false,
        cta: "Get started",
      },
      {
        name: "Pro",
        price: "$29",
        period: "/mo",
        description: "For growing teams that need more power.",
        features: ["Unlimited projects", "Advanced analytics", "Priority support", "Custom domains"],
        highlighted: true,
        cta: "Start free trial",
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Dedicated support and SLA for large organizations.",
        features: ["Everything in Pro", "SSO & SAML", "Dedicated manager", "Custom contracts"],
        highlighted: false,
        cta: "Contact sales",
      },
    ],
  } = props;

  return (
    <section className="w-full bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">{subtitle}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier, idx) => (
            <Card
              key={idx}
              className={`relative flex flex-col border-border/60 bg-card ${
                tier.highlighted ? "border-primary ring-1 ring-primary" : ""
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{tier.name}</CardTitle>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
                <CardDescription className="text-sm">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="mb-6 space-y-2">
                  {tier.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.highlighted ? "default" : "outline"}
                  className="w-full"
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
