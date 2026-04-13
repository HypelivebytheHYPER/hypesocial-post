import type { BlockRegistryEntry, BlockType, BlockConfig } from "./types";
import {
  LayoutTemplate,
  Grid3X3,
  Megaphone,
  CreditCard,
  MessageSquareQuote,
  HelpCircle,
  PanelBottom,
  Wand2,
  Table2,
  TicketPercent,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";

import { HeroBlock, type HeroBlockProps } from "./hero-block";
import { FeaturesGridBlock, type FeaturesGridBlockProps } from "./features-grid-block";
import { CtaBlock, type CtaBlockProps } from "./cta-block";
import { PricingBlock, type PricingBlockProps } from "./pricing-block";
import { TestimonialsBlock, type TestimonialsBlockProps } from "./testimonials-block";
import { FaqBlock, type FaqBlockProps } from "./faq-block";
import { FooterBlock, type FooterBlockProps } from "./footer-block";
import { EditorShowcaseBlock, type EditorShowcaseBlockProps } from "./editor-showcase-block";
import { TableBlock, type TableBlockProps } from "./table-block";
import { PromoCatalogBlock, type PromoCatalogBlockProps } from "./promo-catalog-block";
import { ImageBlock, type ImageBlockProps } from "./image-block";
import { AiDesignBlock, type AiDesignBlockProps } from "./ai-design-block";

const iconMap: Record<string, LucideIcon> = {
  LayoutTemplate,
  Grid3X3,
  Megaphone,
  CreditCard,
  MessageSquareQuote,
  HelpCircle,
  PanelBottom,
  Wand2,
  Table2,
  TicketPercent,
  Image: ImageIcon,
  Sparkles: Wand2,
};

export function getBlockIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || LayoutTemplate;
}

function heroCodeTemplate(props: HeroBlockProps) {
  const p = { ...props };
  const align = p.alignment || "center";
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  return `<section className="relative w-full overflow-hidden bg-background py-16 lg:py-24">
  <div className="mx-auto flex max-w-4xl flex-col px-4 ${alignClass}">
    ${p.showBadge ? `<Badge variant="secondary" className="mb-4 w-fit">\n      ${p.badge}\n    </Badge>` : ""}
    <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
      ${p.headline}
    </h1>
    <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
      ${p.subheadline}
    </p>
    <div className="flex flex-wrap gap-3">
      <Button size="lg" className="gap-2">
        ${p.ctaPrimary}
        <ArrowRight className="h-4 w-4" />
      </Button>
      ${p.showSecondaryCta ? `<Button size="lg" variant="outline" className="gap-2">\n        <Play className="h-4 w-4" />\n        ${p.ctaSecondary}\n      </Button>` : ""}
    </div>
  </div>
</section>`;
}

function featuresGridCodeTemplate(props: FeaturesGridBlockProps) {
  const p = { ...props };
  const features = p.features || [];
  const items = features
    .map(
      (f) => `    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-3">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <${f.icon} className="h-5 w-5" />
        </div>
        <CardTitle className="text-base">${f.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          ${f.description}
        </CardDescription>
      </CardContent>
    </Card>`
    )
    .join("\n");
  return `<section className="w-full bg-background py-16 lg:py-24">
  <div className="mx-auto max-w-6xl px-4">
    <div className="mb-12 text-center">
      <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        ${p.title}
      </h2>
      <p className="mx-auto max-w-2xl text-muted-foreground">
        ${p.subtitle}
      </p>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
${items}
    </div>
  </div>
</section>`;
}

function ctaCodeTemplate(props: CtaBlockProps) {
  const p = { ...props };
  const gradient = p.showGradient
    ? "bg-gradient-to-br from-primary to-blue-700 text-primary-foreground"
    : "border border-border bg-card text-card-foreground";
  const descColor = p.showGradient ? "text-primary-foreground/90" : "text-muted-foreground";
  const btnVariant = p.showGradient ? "secondary" : "default";
  return `<section className="w-full bg-background py-12 lg:py-20">
  <div className="mx-auto max-w-4xl rounded-2xl px-6 py-12 text-center lg:px-12 lg:py-16 ${gradient}">
    <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
      ${p.title}
    </h2>
    <p className="mx-auto mb-8 max-w-xl ${descColor}">
      ${p.description}
    </p>
    <Button size="lg" variant="${btnVariant}" className="gap-2">
      ${p.buttonText}
      <ArrowRight className="h-4 w-4" />
    </Button>
  </div>
</section>`;
}

function pricingCodeTemplate(props: PricingBlockProps) {
  const p = { ...props };
  const tiers = p.tiers || [];
  const items = tiers
    .map(
      (t) => `    <Card className="relative flex flex-col border-border/60 bg-card ${
        t.highlighted ? "border-primary ring-1 ring-primary" : ""
      }">
      ${t.highlighted ? `<div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">\n        Most Popular\n      </div>` : ""}
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">${t.name}</CardTitle>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">${t.price}</span>
          <span className="text-sm text-muted-foreground">${t.period}</span>
        </div>
        <CardDescription className="text-sm">${t.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="mb-6 space-y-2">
${t.features.map((f) => `          <li className="flex items-start gap-2 text-sm text-muted-foreground">\n            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />\n            <span>${f}</span>\n          </li>`).join("\n")}
        </ul>
        <Button variant="${t.highlighted ? "default" : "outline"}" className="w-full">
          ${t.cta}
        </Button>
      </CardContent>
    </Card>`
    )
    .join("\n");
  return `<section className="w-full bg-background py-16 lg:py-24">
  <div className="mx-auto max-w-6xl px-4">
    <div className="mb-12 text-center">
      <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        ${p.title}
      </h2>
      <p className="mx-auto max-w-2xl text-muted-foreground">${p.subtitle}</p>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
${items}
    </div>
  </div>
</section>`;
}

function testimonialsCodeTemplate(props: TestimonialsBlockProps) {
  const p = { ...props };
  const items = (p.testimonials || [])
    .map(
      (t) => `    <Card className="border-border/60 bg-card">
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex gap-0.5">
          ${Array.from({ length: 5 })
            .map(
              (_, i) => `<Star className="h-4 w-4 ${
                i < t.rating ? "fill-amber-400 text-amber-400" : "text-muted"
              }" />`
            )
            .join("\n          ")}
        </div>
        <p className="text-sm leading-relaxed text-foreground">&ldquo;${t.quote}&rdquo;</p>
        <div className="mt-auto flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src="" alt="${t.author}" />
            <AvatarFallback className="text-xs">${t.avatar}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">${t.author}</p>
            <p className="text-xs text-muted-foreground">${t.role}</p>
          </div>
        </div>
      </CardContent>
    </Card>`
    )
    .join("\n");
  return `<section className="w-full bg-background py-16 lg:py-24">
  <div className="mx-auto max-w-6xl px-4">
    <div className="mb-12 text-center">
      <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        ${p.title}
      </h2>
      <p className="mx-auto max-w-2xl text-muted-foreground">${p.subtitle}</p>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
${items}
    </div>
  </div>
</section>`;
}

function faqCodeTemplate(props: FaqBlockProps) {
  const p = { ...props };
  const items = (p.items || [])
    .map(
      (item, idx) => `    <AccordionItem value="item-${idx}" className="border-b border-border/60">
      <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
        ${item.question}
      </AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground">
        ${item.answer}
      </AccordionContent>
    </AccordionItem>`
    )
    .join("\n");
  return `<section className="w-full bg-background py-16 lg:py-24">
  <div className="mx-auto max-w-3xl px-4">
    <div className="mb-10 text-center">
      <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        ${p.title}
      </h2>
      <p className="text-muted-foreground">${p.subtitle}</p>
    </div>
    <Accordion type="single" collapsible className="w-full">
${items}
    </Accordion>
  </div>
</section>`;
}

function editorShowcaseCodeTemplate(props: EditorShowcaseBlockProps) {
  const p = { ...props };
  return `<section className="relative w-full overflow-hidden bg-background py-16 lg:py-24">
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
    <div className="absolute -right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-accent/10 blur-3xl" />
  </div>
  <div className="relative mx-auto max-w-6xl px-4">
    <div className="mb-12 text-center">
      ${p.showBadge ? `<Badge variant="secondary" className="mb-4 gap-1.5">\n        <Sparkles className="h-3 w-3" />\n        ${p.badge}\n      </Badge>` : ""}
      <h1 className="mx-auto mb-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        ${p.headline}
      </h1>
      <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
        ${p.subheadline}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" className="gap-2">
          ${p.ctaPrimary}
          <ArrowRight className="h-4 w-4" />
        </Button>
        ${p.showSecondaryCta ? `<Button size="lg" variant="outline" className="gap-2">\n          <Play className="h-4 w-4" />\n          ${p.ctaSecondary}\n        </Button>` : ""}
      </div>
    </div>
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
        </div>
        <Button size="sm" className="h-7 gap-1 text-xs">
          <Wand2 className="h-3 w-3" />
          Auto Layout
        </Button>
      </div>
      <div className="grid min-h-[320px] sm:min-h-[400px] sm:grid-cols-[1fr_1.4fr]">
        <div className="hidden flex-col border-r border-border/60 bg-muted/20 sm:flex">
          <div className="border-b border-border/60 px-3 py-2 text-[11px] font-medium text-muted-foreground">Layers</div>
          <div className="flex-1 space-y-1 p-3">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs bg-primary/10 text-primary">
              <Layout className="h-3 w-3" /> Hero Section
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
              <Layout className="h-3 w-3" /> Features Grid
            </div>
          </div>
        </div>
        <div className="relative flex flex-col items-center justify-center bg-background p-6 sm:p-10">
          <div className="w-full max-w-sm rounded-xl border border-border/60 bg-card p-4 shadow-lg">
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
          </div>
          <div className="mt-4 w-full max-w-sm rounded-xl border border-border/60 bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-lg">
            <div className="mb-2 text-sm font-semibold">Smart suggestion</div>
            <p className="text-xs opacity-90">This CTA converts 24% better with a gradient background.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function footerCodeTemplate(props: FooterBlockProps) {
  const p = { ...props };
  const links = (p.links || [])
    .map((l) => `      <a href="${l.href}" className="text-xs text-muted-foreground hover:text-foreground">${l.label}</a>`)
    .join("\n");
  return `<footer className="w-full border-t border-border bg-background py-12">
  <div className="mx-auto max-w-6xl px-4">
    <div className="flex flex-col items-start justify-between gap-8 lg:flex-row">
      <div className="max-w-sm">
        <h3 className="mb-2 text-lg font-bold text-foreground">${p.brand}</h3>
        <p className="mb-4 text-sm text-muted-foreground">${p.tagline}</p>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Twitter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Github className="h-4 w-4" />
          </Button>
        </div>
      </div>
      ${p.showNewsletter ? `<div className="w-full max-w-sm">\n        <p className="mb-2 text-sm font-medium text-foreground">Stay updated</p>\n        <div className="flex gap-2">\n          <Input placeholder="Enter your email" className="h-9" />\n          <Button size="sm">Subscribe</Button>\n        </div>\n      </div>` : ""}
    </div>
    <Separator className="my-8" />
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-xs text-muted-foreground">${p.copyright}</p>
      <div className="flex gap-6">
${links}
      </div>
    </div>
  </div>
</footer>`;
}

function imageCodeTemplate(props: ImageBlockProps) {
  const p = { ...props };
  const aspectClass =
    p.aspectRatio === "video"
      ? "aspect-video"
      : p.aspectRatio === "square"
      ? "aspect-square"
      : p.aspectRatio === "portrait"
      ? "aspect-[3/4]"
      : "";
  const shadowClass = p.shadow === "sm" ? "shadow-sm" : p.shadow === "lg" ? "shadow-lg" : "";
  return `<section className="w-full bg-background py-8 lg:py-12">
  <div className="mx-auto max-w-5xl px-4">
    <div className={\`overflow-hidden ${p.rounded ? "rounded-xl" : ""} ${shadowClass} bg-muted ${aspectClass}\`}>
      ${p.src ? `<img src="${p.src}" alt="${p.alt}" className={\`h-full w-full ${p.objectFit === "cover" ? "object-cover" : "object-contain"}\`} />` : `<div className="flex h-full min-h-[200px] w-full items-center justify-center text-muted-foreground"><span className="text-sm">No image selected</span></div>`}
    </div>
    ${p.caption ? `<p className="mt-3 text-center text-sm text-muted-foreground">${p.caption}</p>` : ""}
  </div>
</section>`;
}

function aiDesignCodeTemplate(props: AiDesignBlockProps) {
  const p = { ...props };
  const alignClass = p.alignment === "left" ? "items-start text-left" : "items-center text-center";
  return `<section className="relative w-full overflow-hidden bg-background">
  <div className="relative mx-auto flex min-h-[360px] max-w-5xl flex-col justify-center px-6 py-16 lg:py-24">
    ${p.src ? `<img src="${p.src}" alt="${p.headline}" className="absolute inset-0 h-full w-full object-cover" />` : `<div className="absolute inset-0 bg-muted" />`}
    ${p.overlay ? `<div className="absolute inset-0 bg-black/50" />` : ""}
    <div className="relative z-10 flex flex-col ${alignClass}">
      <h1 className="mb-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
        ${p.headline}
      </h1>
      <p className="mb-8 max-w-xl text-lg text-white/90">${p.subheadline}</p>
      <Button size="lg">${p.ctaText}</Button>
    </div>
  </div>
</section>`;
}

function promoCatalogCodeTemplate(props: PromoCatalogBlockProps) {
  const p = { ...props };
  const products = p.products || [];
  const columns = typeof p.columns === "string" ? parseInt(p.columns, 10) : p.columns;
  const gridClass = columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3";
  const items = products
    .map(
      (prod) => `    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      ${prod.badge ? `<div className="absolute left-2 top-2 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow" style={{ backgroundColor: "${prod.badgeColor || p.accentColor}" }}>${prod.badge}</div>` : ""}
      <div className="relative flex h-32 items-center justify-center bg-muted/40 sm:h-40">
        ${prod.image ? `<img src="${prod.image}" alt="${prod.name}" className="h-full w-full object-cover" />` : `<div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-muted-foreground"><svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 19.5 3.75H4.5A2.25 2.25 0 0 0 2.25 6v11.25A2.25 2.25 0 0 0 4.5 19.5Z" /></svg></div>`}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-medium text-foreground">${prod.name}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">${prod.price}</span>
          ${prod.originalPrice ? `<span className="text-xs text-muted-foreground line-through">${prod.originalPrice}</span>` : ""}
        </div>
      </div>
    </div>`
    )
    .join("\n");
  return `<section className="relative w-full overflow-hidden bg-background py-12 lg:py-20">
  ${p.backgroundGradient ? `<div className="pointer-events-none absolute inset-0"><div className="absolute -left-1/4 -top-1/4 h-[60%] w-[60%] rounded-full blur-3xl opacity-30" style={{ backgroundColor: "${p.accentColor}" }} /><div className="absolute -bottom-1/4 -right-1/4 h-[60%] w-[60%] rounded-full bg-yellow-300/20 blur-3xl" /></div>` : ""}
  <div className="relative mx-auto max-w-6xl px-4">
    <div className="mb-10 text-center">
      ${p.showBadge ? `<Badge className="mb-3 w-fit gap-1 border-0 px-3 py-1 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: "${p.accentColor}" }}>${p.badge}</Badge>` : ""}
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">${p.title}</h2>
      <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">${p.subtitle}</p>
    </div>
    <div className={\`grid gap-4 \${${JSON.stringify(gridClass)}}\`}>
${items}
    </div>
    <div className="mt-10 text-center">
      <Button size="lg" className="gap-2 px-8">${p.ctaText}<span className="text-base">→</span></Button>
    </div>
  </div>
</section>`;
}

function tableCodeTemplate(props: TableBlockProps) {
  const p = { ...props };
  const columns = p.columns || [];
  const rows = p.rows || [];
  const headerCells = columns.map((c) => `                <th className="px-4 py-3 font-medium">${c.label}</th>`).join("\n");
  const rowCells = (row: Record<string, string>) =>
    columns.map((c) => `                  <td className="px-4 py-3 text-foreground">${row[c.key] || ""}</td>`).join("\n");
  const bodyRows = rows
    .map(
      (row, idx) =>
        `              <tr className="${p.striped && idx % 2 === 1 ? "bg-muted/30" : ""}">\n${rowCells(row)}\n              </tr>`
    )
    .join("\n");
  const emptyState = `              <tr><td className="px-4 py-3 text-muted-foreground" colSpan="${columns.length}">No data available</td></tr>`;

  return `<section className="w-full bg-background py-16 lg:py-24">\n  <div className="mx-auto max-w-6xl px-4">\n    ${p.showHeader ? `<div className="mb-10 text-center">\n      <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">\n        ${p.title}\n      </h2>\n      <p className="mx-auto max-w-2xl text-muted-foreground">${p.subtitle}</p>\n    </div>` : ""}\n    <div className="overflow-hidden rounded-[var(--radius)] border border-border shadow-sm">\n      <div className="overflow-x-auto">\n        <table className="w-full text-left text-sm">\n          ${p.caption ? `<caption className="p-4 text-muted-foreground">${p.caption}</caption>` : ""}\n          <thead className="bg-muted/50 text-muted-foreground">\n            <tr>\n${headerCells}\n            </tr>\n          </thead>\n          <tbody className="divide-y divide-border bg-card">\n${bodyRows || emptyState}\n          </tbody>\n        </table>\n      </div>\n    </div>\n  </div>\n</section>`;
}

export const blockRegistry: Record<BlockType, BlockRegistryEntry> = {
  hero: {
    type: "hero",
    name: "Hero",
    description: "A bold headline section with CTAs",
    iconName: "LayoutTemplate",
    defaultProps: {
      badge: "New Release",
      headline: "Build faster with our platform",
      subheadline: "Create stunning pages in minutes with drag-and-drop simplicity and production-ready code output.",
      ctaPrimary: "Get Started",
      ctaSecondary: "Watch Demo",
      showBadge: true,
      showSecondaryCta: true,
      alignment: "center",
    } as unknown as Record<string, unknown>,
    component: HeroBlock,
    codeTemplate: heroCodeTemplate,
  },
  "features-grid": {
    type: "features-grid",
    name: "Features Grid",
    description: "A grid of feature cards with icons",
    iconName: "Grid3X3",
    defaultProps: {
      title: "Everything you need",
      subtitle: "Powerful features to help you build, launch, and scale your product faster than ever.",
      features: [
        { icon: "Zap", title: "Lightning Fast", description: "Optimized for speed with edge caching and minimal bundle sizes." },
        { icon: "Shield", title: "Enterprise Security", description: "SOC 2 compliant with end-to-end encryption and SSO support." },
        { icon: "Sparkles", title: "AI Powered", description: "Leverage cutting-edge AI to automate repetitive tasks and boost creativity." },
        { icon: "BarChart3", title: "Advanced Analytics", description: "Real-time insights and custom dashboards to track every metric." },
      ],
    } as unknown as Record<string, unknown>,
    component: FeaturesGridBlock,
    codeTemplate: featuresGridCodeTemplate,
  },
  cta: {
    type: "cta",
    name: "CTA",
    description: "A call-to-action banner",
    iconName: "Megaphone",
    defaultProps: {
      title: "Ready to get started?",
      description: "Join thousands of teams building better products today.",
      buttonText: "Start for free",
      showGradient: true,
    } as unknown as Record<string, unknown>,
    component: CtaBlock,
    codeTemplate: ctaCodeTemplate,
  },
  pricing: {
    type: "pricing",
    name: "Pricing",
    description: "Pricing tiers in cards",
    iconName: "CreditCard",
    defaultProps: {
      title: "Simple, transparent pricing",
      subtitle: "Choose the plan that fits your needs. Upgrade or downgrade at any time.",
      tiers: [
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
    } as unknown as Record<string, unknown>,
    component: PricingBlock,
    codeTemplate: pricingCodeTemplate,
  },
  testimonials: {
    type: "testimonials",
    name: "Testimonials",
    description: "Customer quote cards with ratings",
    iconName: "MessageSquareQuote",
    defaultProps: {
      title: "Loved by teams everywhere",
      subtitle: "See what our customers have to say about their experience.",
      testimonials: [
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
    } as unknown as Record<string, unknown>,
    component: TestimonialsBlock,
    codeTemplate: testimonialsCodeTemplate,
  },
  faq: {
    type: "faq",
    name: "FAQ",
    description: "Collapsible questions and answers",
    iconName: "HelpCircle",
    defaultProps: {
      title: "Frequently asked questions",
      subtitle: "Have questions? We have answers.",
      items: [
        {
          question: "How does the free trial work?",
          answer: "Start with a 14-day free trial with full access to all Pro features. No credit card required.",
        },
        {
          question: "Can I cancel my subscription anytime?",
          answer: "Yes, you can cancel at any time. Your access will continue until the end of your billing period.",
        },
        {
          question: "Do you offer team plans?",
          answer: "Absolutely. Our Pro and Enterprise plans support unlimited team members with role-based access.",
        },
        {
          question: "What kind of support do you provide?",
          answer: "We offer community support for Starter, priority email for Pro, and dedicated Slack channels for Enterprise.",
        },
      ],
    } as unknown as Record<string, unknown>,
    component: FaqBlock,
    codeTemplate: faqCodeTemplate,
  },
  footer: {
    type: "footer",
    name: "Footer",
    description: "Brand, newsletter, and links",
    iconName: "PanelBottom",
    defaultProps: {
      brand: "HypeSocial",
      tagline: "Build faster, launch smarter.",
      showNewsletter: true,
      copyright: "© 2026 HypeSocial. All rights reserved.",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Contact", href: "#" },
      ],
    } as unknown as Record<string, unknown>,
    component: FooterBlock,
    codeTemplate: footerCodeTemplate,
  },
  "editor-showcase": {
    type: "editor-showcase",
    name: "Editor Showcase",
    description: "A smart creative editor mockup hero",
    iconName: "Wand2",
    defaultProps: {
      badge: "AI-Powered",
      headline: "The creative editor that thinks with you",
      subheadline: "Build stunning pages with an intelligent canvas. Drag, drop, and let AI handle the details.",
      ctaPrimary: "Try Editor Free",
      ctaSecondary: "Watch Demo",
      showBadge: true,
      showSecondaryCta: true,
    } as unknown as Record<string, unknown>,
    component: EditorShowcaseBlock,
    codeTemplate: editorShowcaseCodeTemplate,
  },
  table: {
    type: "table",
    name: "Data Table",
    description: "A sortable data table powered by TanStack Table",
    iconName: "Table2",
    defaultProps: {
      title: "Team Overview",
      subtitle: "Current team members and their statuses.",
      columns: [
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "status", label: "Status" },
      ],
      rows: [
        { name: "Alice Johnson", role: "Engineer", status: "Active" },
        { name: "Bob Smith", role: "Designer", status: "Away" },
        { name: "Carol White", role: "Manager", status: "Active" },
      ],
      showHeader: true,
      caption: "",
      striped: false,
      sortable: true,
      virtualize: false,
      rowHeight: 48,
      maxHeight: 400,
    } as unknown as Record<string, unknown>,
    component: TableBlock,
    codeTemplate: tableCodeTemplate,
  },
  "promo-catalog": {
    type: "promo-catalog",
    name: "Promo Catalog",
    description: "A festive product grid with price badges and promo tags",
    iconName: "TicketPercent",
    defaultProps: {
      title: "สงกรานต์ ม่วนซื้อ",
      subtitle: "สินค้ากลุ่มแบรนด์เดียว มากกว่า 230 รายการ ซื้อ 2 แถม 1",
      badge: "Enjoy Summer",
      products: [
        { name: "เลย์ แชมป์เปี้ยน", image: "", price: "44.-", originalPrice: "55.-", badge: "2 แถม 1", badgeColor: "#facc15" },
        { name: "แฟร์แอนด์เลียล แชมพู", image: "", price: "89.-", originalPrice: "129.-", badge: "ลด 30%", badgeColor: "#f87171" },
        { name: "โค้ก 1.25L", image: "", price: "29.-", originalPrice: "39.-", badge: "2 ชิ้น 68.-", badgeColor: "#60a5fa" },
        { name: "ไอศกรีม วอลล์", image: "", price: "105.-", originalPrice: "149.-", badge: "1 แถม 1", badgeColor: "#a78bfa" },
        { name: "แอร์ Samsung", image: "", price: "5,990.-", badge: "ผ่อน 0%", badgeColor: "#34d399" },
        { name: "เสื้อลายดอก", image: "", price: "129.-", originalPrice: "199.-", badge: "ลด 35%", badgeColor: "#f472b6" },
      ],
      columns: 3,
      showBadge: true,
      ctaText: "ดูสินค้าทั้งหมด",
      backgroundGradient: true,
      accentColor: "#06b6d4",
    } as unknown as Record<string, unknown>,
    component: PromoCatalogBlock,
    codeTemplate: promoCatalogCodeTemplate,
  },
  image: {
    type: "image",
    name: "Image",
    description: "Uploadable image with caption",
    iconName: "Image",
    defaultProps: {
      src: "",
      alt: "",
      caption: "",
      aspectRatio: "auto",
      rounded: true,
      shadow: "sm",
      objectFit: "cover",
    } as unknown as Record<string, unknown>,
    component: ImageBlock,
    codeTemplate: imageCodeTemplate,
  },
  "ai-design": {
    type: "ai-design",
    name: "AI Design",
    description: "Hero with AI-generated background",
    iconName: "Sparkles",
    defaultProps: {
      prompt: "",
      src: "",
      headline: "Your Design Here",
      subheadline: "AI-generated backgrounds for stunning visuals.",
      ctaText: "Get Started",
      overlay: true,
      alignment: "center",
    } as unknown as Record<string, unknown>,
    component: AiDesignBlock,
    codeTemplate: aiDesignCodeTemplate,
  },
};

export const blockConfigs: Record<BlockType, BlockConfig> = {
  hero: {
    fields: [
      { key: "showBadge", label: "Show Badge", type: "boolean" },
      { key: "badge", label: "Badge Text", type: "text" },
      { key: "headline", label: "Headline", type: "text" },
      { key: "subheadline", label: "Subheadline", type: "textarea" },
      { key: "ctaPrimary", label: "Primary CTA", type: "text" },
      { key: "showSecondaryCta", label: "Show Secondary CTA", type: "boolean" },
      { key: "ctaSecondary", label: "Secondary CTA", type: "text" },
      { key: "alignment", label: "Alignment", type: "select", options: ["left", "center"] },
    ],
  },
  "features-grid": {
    fields: [
      { key: "title", label: "Section Title", type: "text" },
      { key: "subtitle", label: "Section Subtitle", type: "textarea" },
      { key: "features", label: "Features", type: "array" },
    ],
  },
  cta: {
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "buttonText", label: "Button Text", type: "text" },
      { key: "showGradient", label: "Show Gradient", type: "boolean" },
    ],
  },
  pricing: {
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "tiers", label: "Pricing Tiers", type: "array" },
    ],
  },
  testimonials: {
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "testimonials", label: "Testimonials", type: "array" },
    ],
  },
  faq: {
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "items", label: "FAQ Items", type: "array" },
    ],
  },
  "editor-showcase": {
    fields: [
      { key: "showBadge", label: "Show Badge", type: "boolean" },
      { key: "badge", label: "Badge Text", type: "text" },
      { key: "headline", label: "Headline", type: "text" },
      { key: "subheadline", label: "Subheadline", type: "textarea" },
      { key: "ctaPrimary", label: "Primary CTA", type: "text" },
      { key: "showSecondaryCta", label: "Show Secondary CTA", type: "boolean" },
      { key: "ctaSecondary", label: "Secondary CTA", type: "text" },
    ],
  },
  table: {
    fields: [
      { key: "showHeader", label: "Show Header", type: "boolean" },
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "columns", label: "Columns", type: "array" },
      { key: "rows", label: "Rows", type: "array" },
      { key: "caption", label: "Caption", type: "text" },
      { key: "striped", label: "Striped Rows", type: "boolean" },
      { key: "sortable", label: "Sortable", type: "boolean" },
      { key: "virtualize", label: "Virtualize Rows (>20)", type: "boolean" },
      { key: "rowHeight", label: "Row Height (px)", type: "number", min: 24, max: 120, step: 4 },
      { key: "maxHeight", label: "Max Height (px)", type: "number", min: 200, max: 800, step: 50 },
    ],
  },
  "promo-catalog": {
    fields: [
      { key: "showBadge", label: "Show Badge", type: "boolean" },
      { key: "badge", label: "Badge Text", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "products", label: "Products", type: "array" },
      { key: "columns", label: "Columns", type: "select", options: ["2", "3", "4"] },
      { key: "ctaText", label: "CTA Text", type: "text" },
      { key: "backgroundGradient", label: "Background Gradient", type: "boolean" },
      { key: "accentColor", label: "Accent Color", type: "text" },
    ],
  },
  footer: {
    fields: [
      { key: "brand", label: "Brand Name", type: "text" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "showNewsletter", label: "Show Newsletter", type: "boolean" },
      { key: "copyright", label: "Copyright", type: "text" },
      { key: "links", label: "Links", type: "array" },
    ],
  },
  image: {
    fields: [
      { key: "src", label: "Image", type: "image" },
      { key: "alt", label: "Alt Text", type: "text" },
      { key: "caption", label: "Caption", type: "text" },
      { key: "aspectRatio", label: "Aspect Ratio", type: "select", options: ["auto", "video", "square", "portrait"] },
      { key: "rounded", label: "Rounded", type: "boolean" },
      { key: "shadow", label: "Shadow", type: "select", options: ["none", "sm", "lg"] },
      { key: "objectFit", label: "Object Fit", type: "select", options: ["cover", "contain"] },
    ],
  },
  "ai-design": {
    fields: [
      { key: "prompt", label: "Generation Prompt", type: "textarea" },
      { key: "headline", label: "Headline", type: "text" },
      { key: "subheadline", label: "Subheadline", type: "textarea" },
      { key: "ctaText", label: "CTA Text", type: "text" },
      { key: "overlay", label: "Dark Overlay", type: "boolean" },
      { key: "alignment", label: "Alignment", type: "select", options: ["left", "center"] },
    ],
  },
};

export const allBlockTypes: BlockType[] = [
  "hero",
  "features-grid",
  "cta",
  "pricing",
  "testimonials",
  "faq",
  "footer",
  "editor-showcase",
  "table",
  "promo-catalog",
  "image",
  "ai-design",
];

// Variants for shuffle feature — each type has alternate prop sets
export const blockVariants: Record<BlockType, Array<{ type: BlockType; props: Record<string, unknown> }>> = {
  hero: [
    { type: "hero", props: blockRegistry.hero.defaultProps },
    {
      type: "hero",
      props: {
        badge: "Just Launched",
        headline: "Ship faster with AI",
        subheadline: "From idea to live page in minutes. No design skills needed.",
        ctaPrimary: "Try It Free",
        ctaSecondary: "See Demo",
        showBadge: true,
        showSecondaryCta: true,
        alignment: "left",
      },
    },
    {
      type: "hero",
      props: {
        badge: "Trending",
        headline: "The future of landing pages",
        subheadline: "Beautiful, responsive, and production-ready blocks for your next project.",
        ctaPrimary: "Get Started",
        ctaSecondary: "Learn More",
        showBadge: true,
        showSecondaryCta: false,
        alignment: "center",
      },
    },
  ],
  "features-grid": [
    { type: "features-grid", props: blockRegistry["features-grid"].defaultProps },
    {
      type: "features-grid",
      props: {
        title: "Why teams love us",
        subtitle: "We handle the hard stuff so you can focus on growing your business.",
        features: [
          { icon: "Zap", title: "Fast Setup", description: "Get started in under 5 minutes with our guided onboarding." },
          { icon: "Shield", title: "Secure by Default", description: "Enterprise-grade security without the enterprise hassle." },
          { icon: "Sparkles", title: "AI Assistant", description: "Generate copy, layouts, and ideas with built-in AI." },
          { icon: "BarChart3", title: "Insightful Analytics", description: "Understand your audience with clear, actionable metrics." },
        ],
      },
    },
  ],
  cta: [
    { type: "cta", props: blockRegistry.cta.defaultProps },
    {
      type: "cta",
      props: {
        title: "Start building today",
        description: "No credit card required. Cancel anytime.",
        buttonText: "Create account",
        showGradient: false,
      },
    },
    {
      type: "cta",
      props: {
        title: "Join 10,000+ builders",
        description: "See why teams switch to our platform every day.",
        buttonText: "Get early access",
        showGradient: true,
      },
    },
  ],
  pricing: [
    { type: "pricing", props: blockRegistry.pricing.defaultProps },
    {
      type: "pricing",
      props: {
        title: "Flexible plans",
        subtitle: "Start free and scale as you grow.",
        tiers: [
          {
            name: "Free",
            price: "$0",
            period: "/mo",
            description: "For hobbyists exploring the platform.",
            features: ["3 projects", "Basic support", "Community access"],
            highlighted: false,
            cta: "Sign up",
          },
          {
            name: "Team",
            price: "$49",
            period: "/mo",
            description: "For growing teams with collaborative needs.",
            features: ["Unlimited projects", "Priority support", "Team workspaces", "Analytics"],
            highlighted: true,
            cta: "Start trial",
          },
        ],
      },
    },
  ],
  testimonials: [
    { type: "testimonials", props: blockRegistry.testimonials.defaultProps },
    {
      type: "testimonials",
      props: {
        title: "Trusted by creators",
        subtitle: "Real feedback from real users.",
        testimonials: [
          {
            quote: "I built my entire landing page in an afternoon. Unreal.",
            author: "Alex Rivera",
            role: "Indie Hacker",
            avatar: "AR",
            rating: 5,
          },
          {
            quote: "The exported code is clean and easy to customize. Love it.",
            author: "Priya Patel",
            role: "Frontend Engineer",
            avatar: "PP",
            rating: 5,
          },
        ],
      },
    },
  ],
  faq: [
    { type: "faq", props: blockRegistry.faq.defaultProps },
    {
      type: "faq",
      props: {
        title: "Common questions",
        subtitle: "Quick answers to get you moving.",
        items: [
          { question: "Is there a free plan?", answer: "Yes. You can use the core features forever without paying." },
          { question: "Can I export the code?", answer: "Yes. Every page you build can be exported as a Next.js page." },
          { question: "Do I need to know React?", answer: "Nope. The builder is visual, but the code is there if you want it." },
        ],
      },
    },
  ],
  footer: [
    { type: "footer", props: blockRegistry.footer.defaultProps },
    {
      type: "footer",
      props: {
        brand: "HypePost",
        tagline: "Made for makers.",
        showNewsletter: false,
        copyright: "© 2026 HypePost. All rights reserved.",
        links: [
          { label: "About", href: "#" },
          { label: "Privacy", href: "#" },
          { label: "Terms", href: "#" },
        ],
      },
    },
  ],
  "editor-showcase": [
    { type: "editor-showcase", props: blockRegistry["editor-showcase"].defaultProps },
    {
      type: "editor-showcase",
      props: {
        badge: "New",
        headline: "Design without limits",
        subheadline: "From first sketch to final pixel. One canvas, infinite ideas.",
        ctaPrimary: "Start Creating",
        ctaSecondary: "See Examples",
        showBadge: true,
        showSecondaryCta: true,
      },
    },
  ],
  table: [
    { type: "table", props: blockRegistry.table.defaultProps },
    {
      type: "table",
      props: {
        title: "Recent Orders",
        subtitle: "A quick look at the latest transactions.",
        columns: [
          { key: "order", label: "Order ID" },
          { key: "customer", label: "Customer" },
          { key: "total", label: "Total" },
          { key: "state", label: "Status" },
        ],
        rows: [
          { order: "#1024", customer: "Jane Doe", total: "$120.00", state: "Shipped" },
          { order: "#1025", customer: "John Doe", total: "$85.00", state: "Processing" },
          { order: "#1026", customer: "Sam Smith", total: "$210.00", state: "Delivered" },
        ],
        showHeader: true,
        caption: "Updated 2 hours ago",
        striped: true,
        sortable: true,
      },
    },
    {
      type: "table",
      props: {
        title: "Large Dataset",
        subtitle: "Demonstrates TanStack Virtual for 10,000 rows.",
        columns: [
          { key: "id", label: "ID" },
          { key: "value", label: "Value" },
        ],
        rows: Array.from({ length: 10000 }, (_, i) => ({
          id: `#${i + 1}`,
          value: `Item ${i + 1}`,
        })),
        showHeader: true,
        caption: "10,000 rows virtualized",
        striped: true,
        sortable: true,
        virtualize: true,
        rowHeight: 48,
        maxHeight: 400,
      },
    },
  ],
  "promo-catalog": [
    { type: "promo-catalog", props: blockRegistry["promo-catalog"].defaultProps },
    {
      type: "promo-catalog",
      props: {
        title: "Summer Deals",
        subtitle: "Beat the heat with ice-cold savings on drinks, snacks, and home cooling.",
        badge: "Hot Deals",
        products: [
          { name: "Pepsi 1.5L", image: "", price: "25.-", originalPrice: "35.-", badge: "2 ชิ้น 48.-", badgeColor: "#3b82f6" },
          { name: "Lay's BBQ", image: "", price: "39.-", originalPrice: "49.-", badge: "ซื้อ 2 แถม 1", badgeColor: "#f59e0b" },
          { name: "Magnum Classic", image: "", price: "59.-", originalPrice: "79.-", badge: "ลด 25%", badgeColor: "#8b5cf6" },
          { name: "Mister Donut 6 pcs", image: "", price: "99.-", originalPrice: "149.-", badge: "1 แถม 1", badgeColor: "#ec4899" },
        ],
        columns: 4,
        showBadge: true,
        ctaText: "Shop Now",
        backgroundGradient: true,
        accentColor: "#f97316",
      },
    },
  ],
  image: [
    { type: "image", props: blockRegistry.image.defaultProps },
    {
      type: "image",
      props: {
        src: "",
        alt: "Hero banner",
        caption: "",
        aspectRatio: "video",
        rounded: true,
        shadow: "lg",
        objectFit: "cover",
      },
    },
  ],
  "ai-design": [
    { type: "ai-design", props: blockRegistry["ai-design"].defaultProps },
    {
      type: "ai-design",
      props: {
        prompt: "futuristic city skyline at sunset, neon lights, cyberpunk aesthetic",
        src: "",
        headline: "Future Ready",
        subheadline: "AI-crafted visuals that transport your audience.",
        ctaText: "Explore",
        overlay: true,
        alignment: "left",
      },
    },
  ],
};
