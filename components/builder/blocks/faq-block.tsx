"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FaqBlockProps {
  title?: string;
  subtitle?: string;
  items?: Array<{
    question: string;
    answer: string;
  }>;
}

export function FaqBlock({ props }: { props: FaqBlockProps }) {
  const {
    title = "Frequently asked questions",
    subtitle = "Have questions? We have answers.",
    items = [
      {
        question: "How does the free trial work?",
        answer:
          "Start with a 14-day free trial with full access to all Pro features. No credit card required.",
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer:
          "Yes, you can cancel at any time. Your access will continue until the end of your billing period.",
      },
      {
        question: "Do you offer team plans?",
        answer:
          "Absolutely. Our Pro and Enterprise plans support unlimited team members with role-based access.",
      },
      {
        question: "What kind of support do you provide?",
        answer:
          "We offer community support for Starter, priority email for Pro, and dedicated Slack channels for Enterprise.",
      },
    ],
  } = props;

  return (
    <section className="w-full bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-border/60">
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
