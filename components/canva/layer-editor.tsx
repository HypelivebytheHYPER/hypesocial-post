"use client";

import { useState, useRef, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Move,
  Trash2,
  Type,
  Image as ImageIcon,
  Sticker,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Lock,
  Unlock,
  Eraser,
  Maximize,
  PanelTop,
  PanelBottom,
  PanelLeft,
  PanelRight,
  ArrowUp,
  ArrowDown,
  Grid3X3,
  Sparkles,
  Crop,
  LayoutGrid,
  GalleryVertical,
  Scan,
  ImageDown,
  Copy,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OverlayLayer } from "@/lib/canva-layer";

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Oswald",
  "Raleway",
  "Nunito",
  "Playfair Display",
  "Merriweather",
  "Noto Sans Thai",
  "Prompt",
  "Kanit",
  "Sarabun",
  "Bebas Neue",
  "Fjalla One",
  "Abril Fatface",
  "Pacifico",
  "Dancing Script",
  "Caveat",
  "Permanent Marker",
  "Space Grotesk",
  "Work Sans",
  "Source Sans 3",
  "IBM Plex Sans",
  "DM Sans",
  "Manrope",
  "Outfit",
  "Plus Jakarta Sans",
];

function loadGoogleFont(fontFamily: string) {
  if (typeof document === "undefined") return;
  if (fontFamily === "Inter") return; // loaded by default in most Next.js apps
  const safeName = fontFamily.replace(/\s+/g, "+");
  const id = `gf-${fontFamily.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${safeName}:wght@400;700;900&display=swap`;
  document.head.appendChild(link);
}

const SHADOW_STYLES: Record<NonNullable<OverlayLayer["shadow"]>, string> = {
  none: "none",
  sm: "0 1px 3px rgba(0,0,0,0.35)",
  md: "0 4px 12px rgba(0,0,0,0.35)",
  lg: "0 12px 24px rgba(0,0,0,0.4)",
};

function LayerPreview({
  layer,
  isSelected,
  zIndex,
  onSelect,
  onUpdate,
  outlineMode,
}: {
  layer: OverlayLayer;
  isSelected: boolean;
  zIndex: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<OverlayLayer>) => void;
  outlineMode?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<ResizeHandle | null>(null);

  useEffect(() => {
    if (layer.type !== "image" && layer.fontFamily) {
      loadGoogleFont(layer.fontFamily);
    }
  }, [layer.fontFamily, layer.type]);
  const dragStart = useRef<{ x: number; y: number; layerX: number; layerY: number } | null>(null);
  const resizeStart = useRef<{ x: number; y: number; layerX: number; layerY: number; layerW: number; layerH: number } | null>(null);

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.parentElement!.getBoundingClientRect();
      if (dragging && dragStart.current) {
        const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
        const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
        onUpdate({
          x: Math.max(0, Math.min(100 - layer.width, dragStart.current.layerX + dx)),
          y: Math.max(0, Math.min(100 - layer.height, dragStart.current.layerY + dy)),
        });
      }
      if (resizing && resizeStart.current) {
        const dx = ((e.clientX - resizeStart.current.x) / rect.width) * 100;
        const dy = ((e.clientY - resizeStart.current.y) / rect.height) * 100;
        let nextX = resizeStart.current.layerX;
        let nextY = resizeStart.current.layerY;
        let nextW = resizeStart.current.layerW;
        let nextH = resizeStart.current.layerH;
        if (resizing.includes("e")) nextW = Math.max(2, resizeStart.current.layerW + dx);
        if (resizing.includes("w")) {
          nextW = Math.max(2, resizeStart.current.layerW - dx);
          nextX = Math.min(resizeStart.current.layerX + resizeStart.current.layerW - 2, resizeStart.current.layerX + dx);
        }
        if (resizing.includes("s")) nextH = Math.max(2, resizeStart.current.layerH + dy);
        if (resizing.includes("n")) {
          nextH = Math.max(2, resizeStart.current.layerH - dy);
          nextY = Math.min(resizeStart.current.layerY + resizeStart.current.layerH - 2, resizeStart.current.layerY + dy);
        }
        if (nextX < 0) { nextW += nextX; nextX = 0; }
        if (nextY < 0) { nextH += nextY; nextY = 0; }
        if (nextX + nextW > 100) nextW = 100 - nextX;
        if (nextY + nextH > 100) nextH = 100 - nextY;
        onUpdate({ x: nextX, y: nextY, width: Math.max(2, nextW), height: Math.max(2, nextH) });
      }
    };
    const handleUp = () => {
      setDragging(false);
      setResizing(null);
      dragStart.current = null;
      resizeStart.current = null;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, resizing, layer.width, layer.height, onUpdate]);

  const startDrag = (e: React.MouseEvent) => {
    if (layer.locked) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, layerX: layer.x, layerY: layer.y };
  };

  const startResize = (handle: ResizeHandle) => (e: React.MouseEvent) => {
    if (layer.locked) return;
    e.preventDefault();
    e.stopPropagation();
    setResizing(handle);
    resizeStart.current = { x: e.clientX, y: e.clientY, layerX: layer.x, layerY: layer.y, layerW: layer.width, layerH: layer.height };
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const isImage = layer.type === "image";
  const radiusPct = `${layer.radius || 0}%`;
  const textShadow = (layer.shadow ?? "none") !== "none" ? "0 1px 3px rgba(0,0,0,0.6)" : "none";

  return (
    <div
      ref={containerRef}
      onMouseDown={startDrag}
      onClick={handleSelect}
      className="absolute flex select-none items-center justify-center border-2 transition-all"
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: `${layer.width}%`,
        height: `${layer.height}%`,
        borderColor: isSelected ? "#3b82f6" : outlineMode ? "rgba(59,130,246,0.6)" : "transparent",
        backgroundColor: isImage ? (outlineMode ? "rgba(59,130,246,0.08)" : "transparent") : layer.backgroundColor || "#f59e0b",
        color: layer.color || "#ffffff",
        fontSize: `${(layer.fontSize || 14) * 0.75}vw`,
        opacity: (layer.opacity ?? 100) / 100,
        borderRadius: radiusPct,
        zIndex,
        cursor: dragging ? "grabbing" : resizing ? (resizing.length === 2 ? "nwse-resize" : resizing === "n" || resizing === "s" ? "ns-resize" : "ew-resize") : layer.locked ? "not-allowed" : "grab",
        overflow: layer.overflowVisible ? "visible" : "hidden",
        boxShadow: isImage ? "none" : SHADOW_STYLES[layer.shadow ?? "none"],
        transform: `rotate(${layer.rotation || 0}deg)`,
        backdropFilter: !isImage && layer.backdropBlur ? "blur(8px)" : "none",
        borderWidth: (layer.borderWidth ?? 0) > 0 ? layer.borderWidth : 2,
        borderStyle: (layer.borderWidth ?? 0) > 0 ? "solid" : "solid",
      }}
    >
      {isImage && layer.content ? (
        <img
          src={layer.content}
          alt=""
          className="pointer-events-none h-full w-full"
          style={{ objectFit: layer.objectFit || "cover" }}
        />
      ) : (
        <span
          className={`pointer-events-none truncate px-1 font-bold ${layer.textAlign === "left" ? "text-left" : layer.textAlign === "right" ? "text-right" : "text-center"}`}
          style={{
            textShadow,
            paddingLeft: `${layer.paddingX ?? 0}%`,
            paddingRight: `${layer.paddingX ?? 0}%`,
            paddingTop: `${layer.paddingY ?? 0}%`,
            paddingBottom: `${layer.paddingY ?? 0}%`,
            fontWeight: layer.fontWeight === "black" ? 900 : layer.fontWeight === "bold" ? 700 : 400,
            fontFamily: `"${layer.fontFamily || "Inter"}", sans-serif`,
          }}
        >
          {layer.content}
        </span>
      )}
      {outlineMode && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded bg-blue-600/80 px-1.5 py-0.5 text-[10px] text-white">{layer.name}</span>
        </div>
      )}
      {isSelected && !layer.locked && (
        <>
          {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map((h) => (
            <div
              key={h}
              onMouseDown={startResize(h)}
              className="absolute h-2.5 w-2.5 rounded-full border border-white bg-blue-500 shadow-sm"
              style={{
                top: h.includes("n") ? -5 : "auto",
                bottom: h.includes("s") ? -5 : "auto",
                left: h.includes("w") ? -5 : "auto",
                right: h.includes("e") ? -5 : "auto",
                cursor: `${h}-resize`,
              }}
            />
          ))}
          {(["n", "s", "e", "w"] as ResizeHandle[]).map((h) => (
            <div
              key={h}
              onMouseDown={startResize(h)}
              className="absolute bg-blue-500"
              style={{
                top: h === "n" || h === "s" ? "auto" : "calc(50% - 2px)",
                bottom: h === "s" ? -3 : "auto",
                left: h === "w" || h === "e" ? "auto" : "calc(50% - 2px)",
                right: h === "e" ? -3 : "auto",
                width: h === "n" || h === "s" ? "40%" : 4,
                height: h === "n" || h === "s" ? 4 : "40%",
                borderRadius: 2,
                cursor: h === "n" || h === "s" ? "ns-resize" : "ew-resize",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

export type DeviceType = "none" | "iphone-16-pro" | "iphone-16-pro-max" | "ipad-pro" | "desktop" | "youtube";

const DEVICE_RATIOS: Record<DeviceType, string> = {
  none: "4 / 3",
  "iphone-16-pro": "9 / 19.53",
  "iphone-16-pro-max": "9 / 19.53",
  "ipad-pro": "3 / 4",
  desktop: "16 / 9",
  youtube: "16 / 9",
};

function DeviceFrame({ device, children }: { device: DeviceType; children: React.ReactNode }) {
  if (device === "none") return <>{children}</>;

  const isPhone16Pro = device === "iphone-16-pro";
  const isPhone16ProMax = device === "iphone-16-pro-max";
  const isIpadPro = device === "ipad-pro";
  const isDesktop = device === "desktop";
  const isYouTube = device === "youtube";

  return (
    <div className="relative flex flex-col items-center">
      {(isPhone16Pro || isPhone16ProMax) && (
        <div
          className={`relative overflow-hidden bg-[#0a0a0a] shadow-2xl ${
            isPhone16ProMax ? "rounded-[2.75rem] border-[12px]" : "rounded-[2.5rem] border-[10px]"
          } border-[#141414]`}
        >
          <div className="pointer-events-none absolute left-1/2 top-3 z-10 h-2.5 w-20 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/5" />
          <div className={`relative overflow-hidden bg-slate-900 ${isPhone16ProMax ? "rounded-[2rem]" : "rounded-[1.75rem]"}`}>
            {children}
          </div>
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 h-1 w-24 -translate-x-1/2 rounded-full bg-white/15" />
        </div>
      )}

      {isIpadPro && (
        <div className="relative overflow-hidden rounded-[1.75rem] border-[10px] border-[#141414] bg-[#0a0a0a] shadow-2xl">
          <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-800" />
          <div className="relative overflow-hidden rounded-[1rem] bg-slate-900">{children}</div>
        </div>
      )}

      {isDesktop && (
        <>
          <div className="relative overflow-hidden rounded-lg border-[5px] border-[#1f1f1f] bg-black shadow-2xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-3 bg-gradient-to-b from-white/5 to-transparent" />
            <div className="relative overflow-hidden rounded bg-slate-900">{children}</div>
          </div>
          <div className="mt-1 flex flex-col items-center">
            <div className="h-2 w-5 rounded-b bg-slate-600" />
            <div className="h-1 w-14 rounded-full bg-slate-700" />
          </div>
        </>
      )}

      {isYouTube && (
        <div className="relative w-full">
          <div className="relative overflow-hidden rounded-none bg-black shadow-2xl">
            <div className="relative bg-slate-900">{children}</div>
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-red-600/90 sm:h-12 sm:w-20 sm:rounded-xl">
              <svg className="ml-1 h-4 w-4 text-white sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function LayerOverlayPreview({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  previewImage,
  aspectRatio,
  device = "none",
  outlineMode = false,
}: {
  layers: OverlayLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<OverlayLayer>) => void;
  previewImage?: string;
  aspectRatio?: string;
  device?: DeviceType;
  outlineMode?: boolean;
}) {
  const effectiveRatio = aspectRatio || DEVICE_RATIOS[device];

  const canvas = (
    <div
      className="relative w-full overflow-hidden bg-slate-900"
      style={{ aspectRatio: effectiveRatio }}
      onClick={() => onSelectLayer(null)}
    >
      {previewImage ? (
        <img src={previewImage} alt="Preview" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-500">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 0 002 2z" />
          </svg>
        </div>
      )}
      {layers
        .filter((l) => l.visible)
        .map((layer, idx) => (
          <LayerPreview
            key={layer.id}
            layer={layer}
            isSelected={selectedLayerId === layer.id}
            zIndex={idx}
            onSelect={() => onSelectLayer(layer.id)}
            onUpdate={(updates) => onUpdateLayer(layer.id, updates)}
            outlineMode={outlineMode}
          />
        ))}
    </div>
  );

  return (
    <div className="w-full max-w-5xl">
      <DeviceFrame device={device}>{canvas}</DeviceFrame>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function MiniInput({ value, onChange, placeholder, suffix }: { value: number | string; onChange: (v: string) => void; placeholder?: string; suffix?: string }) {
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-7 border-slate-700 bg-slate-800 pr-5 text-xs text-slate-100 placeholder:text-slate-500"
      />
      {suffix && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">{suffix}</span>}
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max = 100, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div className="flex h-7 overflow-hidden rounded-md border border-slate-700">
      <button onClick={() => onChange(Math.max(min, value - step))} className="w-7 bg-slate-800 text-slate-300 hover:bg-slate-700">−</button>
      <div className="flex flex-1 items-center justify-center bg-slate-900 text-xs text-slate-200">{value}</div>
      <button onClick={() => onChange(Math.min(max, value + step))} className="w-7 bg-slate-800 text-slate-300 hover:bg-slate-700">+</button>
    </div>
  );
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const presets = ["#ffffff", "#000000", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`h-5 w-5 rounded-full border ${value === c ? "border-white" : "border-transparent"}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-slate-600 bg-slate-800">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="sr-only" />
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: value }} />
        </label>
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label?: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs transition-colors ${
        active ? "border-blue-500/40 bg-blue-500/20 text-blue-400" : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function SegmentedButton<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex overflow-hidden rounded-md border border-slate-700">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 px-2 py-1 text-[10px] transition-colors ${
            value === o.value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const LAYOUT_PRESETS: { name: string; icon: React.ElementType; apply: (layers: OverlayLayer[]) => Partial<OverlayLayer>[] }[] = [
  {
    name: "Safe Center",
    icon: Scan,
    apply: (layers) =>
      layers.map((l) => ({
        id: l.id,
        x: 50 - l.width / 2,
        y: 50 - l.height / 2,
      })),
  },
  {
    name: "Catalog Grid 2×2",
    icon: LayoutGrid,
    apply: (layers) => {
      const images = layers.filter((l) => l.visible && l.type === "image").slice(0, 4);
      const gap = 4;
      const cellW = (100 - gap * 3) / 2;
      const cellH = (100 - gap * 3) / 2;
      const updates: Partial<OverlayLayer>[] = [];
      images.forEach((l, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        updates.push({
          id: l.id,
          x: gap + col * (cellW + gap),
          y: gap + row * (cellH + gap),
          width: cellW,
          height: cellH,
        });
      });
      return updates;
    },
  },
  {
    name: "Hero + 3 Thumb",
    icon: GalleryVertical,
    apply: (layers) => {
      const images = layers.filter((l) => l.visible && l.type === "image").slice(0, 4);
      const updates: Partial<OverlayLayer>[] = [];
      if (images[0]) {
        updates.push({ id: images[0].id, x: 5, y: 5, width: 90, height: 55 });
      }
      if (images[1] || images[2] || images[3]) {
        const thumbs = images.slice(1);
        const count = thumbs.length || 1;
        const gap = 4;
        const w = (100 - gap * (count + 1)) / count;
        thumbs.forEach((l, idx) => {
          updates.push({ id: l.id, x: gap + idx * (w + gap), y: 64, width: w, height: 30 });
        });
      }
      return updates;
    },
  },
  {
    name: "Story Stack",
    icon: ImageDown,
    apply: (layers) => {
      const images = layers.filter((l) => l.visible && l.type === "image");
      const texts = layers.filter((l) => l.visible && l.type === "text");
      const badges = layers.filter((l) => l.visible && l.type === "badge");
      const updates: Partial<OverlayLayer>[] = [];
      if (images[0]) updates.push({ id: images[0].id, x: 0, y: 0, width: 100, height: 100 });
      if (texts[0]) updates.push({ id: texts[0].id, x: 10, y: 8, width: 80, height: 12 });
      if (badges[0]) updates.push({ id: badges[0].id, x: 72, y: 84, width: 22, height: 10 });
      return updates;
    },
  },
  {
    name: "Price Tag Corner",
    icon: Sticker,
    apply: (layers) => {
      const images = layers.filter((l) => l.visible && l.type === "image");
      const badges = layers.filter((l) => l.visible && l.type === "badge");
      const updates: Partial<OverlayLayer>[] = [];
      if (images[0]) updates.push({ id: images[0].id, x: 15, y: 15, width: 70, height: 70 });
      if (badges[0]) updates.push({ id: badges[0].id, x: 72, y: 8, width: 22, height: 10 });
      return updates;
    },
  },
  {
    name: "Text Overlay",
    icon: Type,
    apply: (layers) => {
      const images = layers.filter((l) => l.visible && l.type === "image");
      const texts = layers.filter((l) => l.visible && l.type === "text");
      const updates: Partial<OverlayLayer>[] = [];
      if (images[0]) updates.push({ id: images[0].id, x: 0, y: 0, width: 100, height: 100 });
      if (texts[0]) updates.push({ id: texts[0].id, x: 30, y: 40, width: 40, height: 20 });
      return updates;
    },
  },
];

export function LayerListPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onMoveLayer,
  onAddLayer,
  onDuplicateLayer,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  layers: OverlayLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<OverlayLayer>) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, dir: -1 | 1) => void;
  onAddLayer: (type: OverlayLayer["type"]) => void;
  onDuplicateLayer?: (id: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}) {
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;
  const [removingBg, setRemovingBg] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [smartCropping, setSmartCropping] = useState(false);

  const handleRemoveBg = async () => {
    if (!selectedLayer || selectedLayer.type !== "image" || !selectedLayer.content) return;
    setRemovingBg(true);
    try {
      const res = await fetch(`/api/media/remove-bg?url=${encodeURIComponent(selectedLayer.content)}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.url) {
        onUpdateLayer(selectedLayer.id, { content: data.url });
      }
    } catch {
      // silently fail or could toast
    } finally {
      setRemovingBg(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!selectedLayer || selectedLayer.type !== "image" || !generatePrompt.trim()) return;
    setGeneratingImage(true);
    try {
      const res = await fetch("/api/media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatePrompt.trim(), size: "1024x1024" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.url) {
        onUpdateLayer(selectedLayer.id, { content: data.url });
        setGeneratePrompt("");
        setShowGenerateInput(false);
      }
    } catch {
      // silently fail
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSmartCrop = async (preset: "1:1" | "16:9" | "9:16" | "custom") => {
    if (!selectedLayer || selectedLayer.type !== "image" || !selectedLayer.content) return;
    setSmartCropping(true);
    try {
      const dims: Record<typeof preset, { w: number; h: number }> = {
        "1:1": { w: 1080, h: 1080 },
        "16:9": { w: 1200, h: 675 },
        "9:16": { w: 1080, h: 1920 },
        custom: { w: 1200, h: 1200 },
      };
      const { w, h } = dims[preset];
      const params = new URLSearchParams();
      params.set("url", selectedLayer.content);
      params.set("w", String(w));
      params.set("h", String(h));
      params.set("c", "fill");
      params.set("g", "auto");
      params.set("f", "auto");
      params.set("q", "auto");
      const res = await fetch(`/api/media/transform?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      await new Promise<void>((resolve, reject) => {
        reader.onloadend = () => resolve();
        reader.onerror = reject;
      });
      const dataUrl = reader.result as string;
      onUpdateLayer(selectedLayer.id, { content: dataUrl });
    } catch {
      // silently fail
    } finally {
      setSmartCropping(false);
    }
  };

  const quickAlign = (action: string) => {
    if (!selectedLayer) return;
    const l = selectedLayer;
    switch (action) {
      case "left":
        onUpdateLayer(l.id, { x: 0 });
        break;
      case "center-h":
        onUpdateLayer(l.id, { x: 50 - l.width / 2 });
        break;
      case "right":
        onUpdateLayer(l.id, { x: 100 - l.width });
        break;
      case "top":
        onUpdateLayer(l.id, { y: 0 });
        break;
      case "center-v":
        onUpdateLayer(l.id, { y: 50 - l.height / 2 });
        break;
      case "bottom":
        onUpdateLayer(l.id, { y: 100 - l.height });
        break;
      case "fill-w":
        onUpdateLayer(l.id, { x: 0, width: 100 });
        break;
      case "fill-h":
        onUpdateLayer(l.id, { y: 0, height: 100 });
        break;
    }
  };

  return (
    <div className="h-full space-y-3">
      <div className="flex items-center gap-1">
        <button onClick={() => onAddLayer("text")} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-slate-100">
          <Type className="h-3 w-3" /> Text
        </button>
        <button onClick={() => onAddLayer("image")} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-slate-100">
          <ImageIcon className="h-3 w-3" /> Image
        </button>
        <button onClick={() => onAddLayer("badge")} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-slate-100">
          <Sticker className="h-3 w-3" /> Badge
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700 disabled:opacity-40"
        >
          <Undo2 className="h-3 w-3" /> Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700 disabled:opacity-40"
        >
          <Redo2 className="h-3 w-3" /> Redo
        </button>
        <button
          onClick={() => selectedLayerId && onDuplicateLayer?.(selectedLayerId)}
          disabled={!selectedLayerId}
          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700 disabled:opacity-40"
        >
          <Copy className="h-3 w-3" /> Duplicate
        </button>
      </div>

      <Section title="Auto Layout">
        <div className="grid grid-cols-3 gap-1.5">
          {LAYOUT_PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.name}
                onClick={() => {
                  const updates = preset.apply(layers);
                  updates.forEach((u) => {
                    if (u.id) onUpdateLayer(u.id, u);
                  });
                }}
                className="flex flex-col items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-2 text-[10px] text-slate-300 hover:bg-slate-700 hover:text-slate-100"
              >
                <Icon className="h-4 w-4" />
                <span className="leading-none">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <div className="space-y-1.5">
        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className={`group flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 transition-colors ${
              selectedLayerId === layer.id ? "border-blue-500/40 bg-blue-500/10" : "border-slate-700 bg-slate-800 hover:border-slate-600"
            }`}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-slate-400 hover:text-slate-100"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateLayer(layer.id, { visible: !layer.visible });
              }}
            >
              {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-xs font-medium ${selectedLayerId === layer.id ? "text-slate-100" : "text-slate-200"}`}>{layer.name}</p>
              <p className="truncate text-[10px] text-slate-400">{layer.type}</p>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-300 hover:bg-slate-700 hover:text-slate-100" onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, -1); }} disabled={idx === 0}>
                <Move className="h-3 w-3 -rotate-90" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-300 hover:bg-slate-700 hover:text-slate-100" onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 1); }} disabled={idx === layers.length - 1}>
                <Move className="h-3 w-3 rotate-90" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-300 hover:bg-slate-700 hover:text-slate-100" onClick={(e) => { e.stopPropagation(); onDuplicateLayer?.(layer.id); }}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:bg-red-500/10 hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selectedLayer && (
        <div className="space-y-3 pt-2">
          <Section title="Content">
            <Input
              value={selectedLayer.name}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { name: e.target.value })}
              placeholder="Layer name"
              className="h-7 border-slate-700 bg-slate-800 text-xs text-slate-100 placeholder:text-slate-500"
            />
            <Input
              value={selectedLayer.content}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { content: e.target.value })}
              placeholder={selectedLayer.type === "image" ? "Image URL" : "Text content"}
              className="h-7 border-slate-700 bg-slate-800 text-xs text-slate-100 placeholder:text-slate-500"
            />
            {selectedLayer.type === "image" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRemoveBg}
                    disabled={removingBg}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-[11px] text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <Eraser className="h-3 w-3" />
                    {removingBg ? "Removing…" : "Remove BG"}
                  </button>
                  <button
                    onClick={() => setShowGenerateInput((v) => !v)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 py-1.5 text-[11px] text-purple-400 hover:bg-purple-500/20"
                  >
                    <Sparkles className="h-3 w-3" />
                    Generate AI
                  </button>
                </div>
                {showGenerateInput && (
                  <div className="flex items-center gap-1">
                    <Input
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      placeholder="Describe the image..."
                      className="h-7 flex-1 border-slate-700 bg-slate-800 text-xs text-slate-100 placeholder:text-slate-500"
                    />
                    <button
                      onClick={handleGenerateImage}
                      disabled={generatingImage || !generatePrompt.trim()}
                      className="flex h-7 items-center justify-center rounded-md bg-purple-600 px-2 text-[11px] text-white hover:bg-purple-500 disabled:opacity-50"
                    >
                      {generatingImage ? "…" : "Go"}
                    </button>
                    <button
                      onClick={() => setShowGenerateInput(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section title="Quick Align">
            <div className="grid grid-cols-4 gap-1.5">
              <ToggleButton icon={AlignLeft} label="Left" active={false} onClick={() => quickAlign("left")} />
              <ToggleButton icon={AlignCenter} label="Center H" active={false} onClick={() => quickAlign("center-h")} />
              <ToggleButton icon={AlignRight} label="Right" active={false} onClick={() => quickAlign("right")} />
              <ToggleButton icon={PanelTop} label="Top" active={false} onClick={() => quickAlign("top")} />
              <ToggleButton icon={ArrowDown} label="Center V" active={false} onClick={() => quickAlign("center-v")} />
              <ToggleButton icon={PanelBottom} label="Bottom" active={false} onClick={() => quickAlign("bottom")} />
              <ToggleButton icon={Maximize} label="Fill W" active={false} onClick={() => quickAlign("fill-w")} />
              <ToggleButton icon={Grid3X3} label="Fill H" active={false} onClick={() => quickAlign("fill-h")} />
            </div>
          </Section>

          <Section title="Position">
            <div className="grid grid-cols-2 gap-2">
              <MiniInput value={Math.round(selectedLayer.x)} onChange={(v) => onUpdateLayer(selectedLayer.id, { x: Number(v) })} placeholder="X" suffix="%" />
              <MiniInput value={Math.round(selectedLayer.y)} onChange={(v) => onUpdateLayer(selectedLayer.id, { y: Number(v) })} placeholder="Y" suffix="%" />
              <MiniInput value={Math.round(selectedLayer.width)} onChange={(v) => onUpdateLayer(selectedLayer.id, { width: Number(v) })} placeholder="W" suffix="%" />
              <MiniInput value={Math.round(selectedLayer.height)} onChange={(v) => onUpdateLayer(selectedLayer.id, { height: Number(v) })} placeholder="H" suffix="%" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Rotation</span>
              <Stepper value={selectedLayer.rotation || 0} onChange={(v) => onUpdateLayer(selectedLayer.id, { rotation: v })} min={-180} max={180} step={5} />
            </div>
          </Section>

          {selectedLayer.type === "image" && (
            <Section title="Image">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Object fit</span>
                  <SegmentedButton
                    options={[
                      { value: "cover", label: "Cover" },
                      { value: "contain", label: "Contain" },
                      { value: "fill", label: "Fill" },
                      { value: "none", label: "None" },
                    ]}
                    value={selectedLayer.objectFit || "cover"}
                    onChange={(v) => onUpdateLayer(selectedLayer.id, { objectFit: v })}
                  />
                </div>
                <div className="pt-1">
                  <span className="text-xs text-slate-300">Smart Crop</span>
                  <div className="mt-1.5 flex items-center gap-1">
                    <button
                      onClick={() => handleSmartCrop("1:1")}
                      disabled={smartCropping}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[10px] text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                    >
                      <Crop className="h-3 w-3" /> 1:1
                    </button>
                    <button
                      onClick={() => handleSmartCrop("16:9")}
                      disabled={smartCropping}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[10px] text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                    >
                      <Crop className="h-3 w-3" /> 16:9
                    </button>
                    <button
                      onClick={() => handleSmartCrop("9:16")}
                      disabled={smartCropping}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[10px] text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                    >
                      <Crop className="h-3 w-3" /> 9:16
                    </button>
                    <button
                      onClick={() => handleSmartCrop("custom")}
                      disabled={smartCropping}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[10px] text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                    >
                      <Crop className="h-3 w-3" /> Auto
                    </button>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {selectedLayer.type !== "image" && (
            <Section title="Appearance">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Background</span>
                  <ColorSwatch value={selectedLayer.backgroundColor || "#f59e0b"} onChange={(v) => onUpdateLayer(selectedLayer.id, { backgroundColor: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Text color</span>
                  <ColorSwatch value={selectedLayer.color || "#ffffff"} onChange={(v) => onUpdateLayer(selectedLayer.id, { color: v })} />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Font size</span>
                  <Stepper value={selectedLayer.fontSize || 14} onChange={(v) => onUpdateLayer(selectedLayer.id, { fontSize: v })} min={8} max={120} step={2} />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Font family</span>
                  <select
                    value={selectedLayer.fontFamily || "Inter"}
                    onChange={(e) => {
                      onUpdateLayer(selectedLayer.id, { fontFamily: e.target.value });
                    }}
                    className="h-7 max-w-[140px] rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-100 outline-none"
                  >
                    {GOOGLE_FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Font weight</span>
                  <SegmentedButton
                    options={[
                      { value: "normal", label: "Reg" },
                      { value: "bold", label: "Bold" },
                      { value: "black", label: "Blk" },
                    ]}
                    value={selectedLayer.fontWeight || "bold"}
                    onChange={(v) => onUpdateLayer(selectedLayer.id, { fontWeight: v })}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Align</span>
                  <div className="flex overflow-hidden rounded-md border border-slate-700">
                    {[
                      { value: "left", icon: AlignLeft },
                      { value: "center", icon: AlignCenter },
                      { value: "right", icon: AlignRight },
                    ].map((o) => (
                      <button
                        key={o.value}
                        onClick={() => onUpdateLayer(selectedLayer.id, { textAlign: o.value as OverlayLayer["textAlign"] })}
                        className={`flex h-7 w-7 items-center justify-center ${selectedLayer.textAlign === o.value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                      >
                        <o.icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400">Padding X</span>
                    <Stepper value={selectedLayer.paddingX ?? 2} onChange={(v) => onUpdateLayer(selectedLayer.id, { paddingX: v })} min={0} max={25} step={1} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Padding Y</span>
                    <Stepper value={selectedLayer.paddingY ?? 1} onChange={(v) => onUpdateLayer(selectedLayer.id, { paddingY: v })} min={0} max={25} step={1} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Opacity</span>
                  <Stepper value={selectedLayer.opacity ?? 100} onChange={(v) => onUpdateLayer(selectedLayer.id, { opacity: v })} min={0} max={100} step={5} />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Radius</span>
                  <Stepper value={selectedLayer.radius ?? 0} onChange={(v) => onUpdateLayer(selectedLayer.id, { radius: v })} min={0} max={50} step={2} />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Shadow</span>
                  <SegmentedButton
                    options={[
                      { value: "none", label: "None" },
                      { value: "sm", label: "Sm" },
                      { value: "md", label: "Md" },
                      { value: "lg", label: "Lg" },
                    ]}
                    value={selectedLayer.shadow ?? "none"}
                    onChange={(v) => onUpdateLayer(selectedLayer.id, { shadow: v })}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Border width</span>
                  <Stepper value={selectedLayer.borderWidth ?? 0} onChange={(v) => onUpdateLayer(selectedLayer.id, { borderWidth: v })} min={0} max={10} step={1} />
                </div>
                {(selectedLayer.borderWidth ?? 0) > 0 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-300">Border color</span>
                    <ColorSwatch value={selectedLayer.borderColor || "#ffffff"} onChange={(v) => onUpdateLayer(selectedLayer.id, { borderColor: v })} />
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Backdrop blur</span>
                  <button
                    onClick={() => onUpdateLayer(selectedLayer.id, { backdropBlur: !selectedLayer.backdropBlur })}
                    className={`h-7 rounded-md border px-3 text-[11px] transition-colors ${
                      selectedLayer.backdropBlur ? "border-blue-500/40 bg-blue-500/20 text-blue-400" : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {selectedLayer.backdropBlur ? "On" : "Off"}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Overflow visible</span>
                  <button
                    onClick={() => onUpdateLayer(selectedLayer.id, { overflowVisible: !selectedLayer.overflowVisible })}
                    className={`h-7 rounded-md border px-3 text-[11px] transition-colors ${
                      selectedLayer.overflowVisible ? "border-blue-500/40 bg-blue-500/20 text-blue-400" : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {selectedLayer.overflowVisible ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </Section>
          )}

          <Section title="Arrangement">
            <div className="flex items-center gap-2">
              <button onClick={() => onMoveLayer(selectedLayer.id, -1)} disabled={layers.findIndex((l) => l.id === selectedLayer.id) === 0} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700 disabled:opacity-40">
                <Move className="h-3 w-3 -rotate-90" /> Forward
              </button>
              <button onClick={() => onMoveLayer(selectedLayer.id, 1)} disabled={layers.findIndex((l) => l.id === selectedLayer.id) === layers.length - 1} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700 disabled:opacity-40">
                <Move className="h-3 w-3 rotate-90" /> Back
              </button>
            </div>
            <button
              onClick={() => onUpdateLayer(selectedLayer.id, { locked: !selectedLayer.locked })}
              className={`flex w-full items-center justify-center gap-1 rounded-md border py-1.5 text-[11px] transition-colors ${
                selectedLayer.locked ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {selectedLayer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              {selectedLayer.locked ? "Locked" : "Lock layer"}
            </button>
            <button onClick={() => onDeleteLayer(selectedLayer.id)} className="flex w-full items-center justify-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 py-1.5 text-[11px] text-red-400 hover:bg-red-500/20">
              <Trash2 className="h-3 w-3" /> Delete layer
            </button>
          </Section>
        </div>
      )}
    </div>
  );
}
