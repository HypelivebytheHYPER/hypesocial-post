"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

export interface TestimonialsBlockProps {
  title?: string;
  subtitle?: string;
  testimonials?: Array<{
    quote: string;
    author: string;
    role: string;
    avatar: string;
    rating: number;
  }>;
}

export function TestimonialsBlock({ props }: { props: TestimonialsBlockProps }) {
  const {
    title = "Loved by teams everywhere",
    subtitle = "See what our customers have to say about their experience.",
    testimonials = [
      {
        quote: "This platform completely transformed how we build landing pages. What used to take weeks now takes hours.",
        author: "Sarah Chen",
        role: "Head of Marketing",
        avatar: "SC",
        rating: 5,
      },
      {
        quote: "The code quality is incredible. We went from design to production in a single day.",
        author: "Marcus Johnson",
        role: "Engineering Lead",
        avatar: "MJ",
        rating: 5,
      },
      {
        quote: "Finally a tool that both designers and developers can agree on. Highly recommended!",
        author: "Emily Davis",
        role: "Product Designer",
        avatar: "ED",
        rating: 5,
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
          {testimonials.map((t, idx) => (
            <Card key={idx} className="flex h-full flex-col border-border/60 bg-card">
              <CardContent className="flex flex-1 flex-col gap-4 pt-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < t.rating ? "fill-amber-400 text-amber-400" : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-auto flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" alt={t.author} />
                    <AvatarFallback className="text-xs">{t.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
