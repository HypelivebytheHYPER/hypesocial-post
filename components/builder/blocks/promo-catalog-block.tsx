"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PromoProduct {
  name: string;
  image: string;
  price: string;
  originalPrice?: string;
  badge?: string;
  badgeColor?: string;
}

export interface PromoCatalogBlockProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  products?: PromoProduct[];
  columns?: number;
  showBadge?: boolean;
  ctaText?: string;
  backgroundGradient?: boolean;
  accentColor?: string;
}

export function PromoCatalogBlock({ props }: { props: PromoCatalogBlockProps }) {
  const {
    title = "สงกรานต์ ม่วนซื้อ",
    subtitle = "สินค้ากลุ่มแบรนด์เดียว มากกว่า 230 รายการ ซื้อ 2 แถม 1",
    badge = "Enjoy Summer",
    products = [
      { name: "เลย์ แชมป์เปี้ยน", image: "", price: "44.-", originalPrice: "55.-", badge: "2 แถม 1", badgeColor: "#facc15" },
      { name: "แฟร์แอนด์เลียล แชมพู", image: "", price: "89.-", originalPrice: "129.-", badge: "ลด 30%", badgeColor: "#f87171" },
      { name: "โค้ก 1.25L", image: "", price: "29.-", originalPrice: "39.-", badge: "2 ชิ้น 68.-", badgeColor: "#60a5fa" },
      { name: "ไอศกรีม วอลล์", image: "", price: "105.-", originalPrice: "149.-", badge: "1 แถม 1", badgeColor: "#a78bfa" },
      { name: "แอร์ Samsung", image: "", price: "5,990.-", badge: "ผ่อน 0%", badgeColor: "#34d399" },
      { name: "เสื้อลายดอก", image: "", price: "129.-", originalPrice: "199.-", badge: "ลด 35%", badgeColor: "#f472b6" },
    ],
    columns: columnsProp = 3,
    showBadge = true,
    ctaText = "ดูสินค้าทั้งหมด",
    backgroundGradient = true,
    accentColor = "#06b6d4",
  } = props;

  const columns = typeof columnsProp === "string" ? parseInt(columnsProp, 10) : columnsProp;

  const gridClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-3";

  return (
    <section className="relative w-full overflow-hidden bg-background py-12 lg:py-20">
      {/* Festive background */}
      {backgroundGradient && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -left-1/4 -top-1/4 h-[60%] w-[60%] rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: accentColor }}
          />
          <div className="absolute -bottom-1/4 -right-1/4 h-[60%] w-[60%] rounded-full bg-yellow-300/20 blur-3xl" />
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-10 text-center">
          {showBadge && (
            <Badge
              className="mb-3 w-fit gap-1 border-0 px-3 py-1 text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              {badge}
            </Badge>
          )}
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        </div>

        {/* Product grid */}
        <div className={`grid gap-4 ${gridClass}`}>
          {products.map((p, idx) => (
            <div
              key={idx}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Promo badge */}
              {p.badge && (
                <div
                  className="absolute left-2 top-2 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: p.badgeColor || accentColor }}
                >
                  {p.badge}
                </div>
              )}

              {/* Image area */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
                {p.image ? (
                   
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 19.5 3.75H4.5A2.25 2.25 0 0 0 2.25 6v11.25A2.25 2.25 0 0 0 4.5 19.5Z"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-3">
                <p className="line-clamp-2 text-sm font-medium text-foreground">{p.name}</p>
                <div className="mt-auto flex items-baseline gap-2 pt-2">
                  <span className="text-lg font-bold text-primary">{p.price}</span>
                  {p.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {p.originalPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Button size="lg" className="gap-2 px-8">
            {ctaText}
            <span className="text-base">→</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
