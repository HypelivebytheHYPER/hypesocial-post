"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Github, Twitter } from "lucide-react";

export interface FooterBlockProps {
  brand?: string;
  tagline?: string;
  showNewsletter?: boolean;
  copyright?: string;
  links?: Array<{
    label: string;
    href: string;
  }>;
}

export function FooterBlock({ props }: { props: FooterBlockProps }) {
  const {
    brand = "HypeSocial",
    tagline = "Build faster, launch smarter.",
    showNewsletter = true,
    copyright = "© 2026 HypeSocial. All rights reserved.",
    links = [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Contact", href: "#" },
    ],
  } = props;

  return (
    <footer className="w-full border-t border-border bg-background py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row">
          <div className="max-w-sm">
            <h3 className="mb-2 text-lg font-bold text-foreground">{brand}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{tagline}</p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showNewsletter && (
            <div className="w-full max-w-sm">
              <p className="mb-2 text-sm font-medium text-foreground">Stay updated</p>
              <div className="flex gap-2">
                <Input placeholder="Enter your email" className="h-9" />
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">{copyright}</p>
          <div className="flex gap-6">
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
