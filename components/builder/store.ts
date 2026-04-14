"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import { shallow } from "zustand/shallow";
import type { CanvasFormat, Layer, Page, BuilderTemplateV2, BrandKit } from "./types";

interface ThemeState {
  primaryColor: string;
  borderRadius: number;
  fontFamily: string;
  backgroundColor: string;
}

interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

interface BuilderState {
  // Canvas
  format: CanvasFormat;
  pages: Page[];
  activePageIndex: number;
  selectedLayerId: string | null;
  layers: Layer[];
  canvasBackground: { color: string; image: string };

  // UI
  searchQuery: string;
  viewMode: "grid" | "list";
  theme: ThemeState;
  brandKit: BrandKit;
  showSafeZones: boolean;
  viewport: ViewportState;
  snapGuides: { x: number | null; y: number | null };

  // Page actions
  addPage: (afterIndex?: number) => void;
  removePage: (index: number) => void;
  duplicatePage: (index: number) => void;
  setActivePage: (index: number) => void;
  renamePage: (index: number, name: string) => void;
  setFormat: (format: CanvasFormat) => void;

  // Layer actions (on current page)
  addLayer: (layer: Omit<Layer, "id">) => void;
  updateLayer: (id: string, updates: Partial<Omit<Layer, "id">>) => void;
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  moveLayer: (id: string, x: number, y: number) => void;
  resizeLayer: (id: string, width: number, height: number) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // Canvas actions
  clearCanvas: () => void;
  setCanvasBackground: (bg: Partial<Page["canvasBackground"]>) => void;

  // UI actions
  setSearchQuery: (q: string) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setTheme: (theme: Partial<ThemeState>) => void;
  resetTheme: () => void;
  loadTemplate: (template: BuilderTemplateV2) => void;

  // Brand kit
  addBrandColor: (color: string) => void;
  removeBrandColor: (color: string) => void;
  addBrandFont: (font: string) => void;
  removeBrandFont: (font: string) => void;

  // Alignment
  alignLayer: (id: string, align: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;

  // Safe zones
  setShowSafeZones: (show: boolean) => void;

  // Snap guides
  setSnapGuides: (guides: { x: number | null; y: number | null }) => void;
  clearSnapGuides: () => void;

  // Viewport
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetViewport: () => void;
  setPan: (pan: { x: number; y: number }) => void;

  // Magic resize
  resizeToFormat: (format: CanvasFormat) => void;
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultPage(name = "Page 1"): Page {
  return {
    id: generateId(),
    name,
    layers: [],
    canvasBackground: { color: "#ffffff", image: "" },
  };
}

const defaultTheme: ThemeState = {
  primaryColor: "#2563eb",
  borderRadius: 8,
  fontFamily: "Inter",
  backgroundColor: "#ffffff",
};

const defaultBrandKit: BrandKit = {
  colors: ["#2563eb", "#dc2626", "#16a34a", "#f59e0b", "#0f172a"],
  fonts: ["Inter"],
};

// Core state factory for undoable + persisted store
const builderStore = (set: any, get: any): BuilderState => ({
  format: "ig-post",
  pages: [createDefaultPage()],
  activePageIndex: 0,
  selectedLayerId: null,
  get layers() {
    const page = get().pages[get().activePageIndex];
    return page ? page.layers : [];
  },
  get canvasBackground() {
    const page = get().pages[get().activePageIndex];
    return page ? page.canvasBackground : { color: "#ffffff", image: "" };
  },
  searchQuery: "",
  viewMode: "grid",
  theme: { ...defaultTheme },
  brandKit: { ...defaultBrandKit },
  showSafeZones: true,
  viewport: { zoom: 1, panX: 0, panY: 0 },
  snapGuides: { x: null, y: null },

  // Page actions
  addPage: (afterIndex) => {
    const idx = afterIndex !== undefined ? afterIndex + 1 : get().pages.length;
    const newPage = createDefaultPage(`Page ${get().pages.length + 1}`);
    set((state: BuilderState) => {
      const pages = [...state.pages];
      pages.splice(idx, 0, newPage);
      return { pages, activePageIndex: idx };
    });
  },

  removePage: (index) => {
    set((state: BuilderState) => {
      if (state.pages.length <= 1) return state;
      const pages = state.pages.filter((_, i) => i !== index);
      const activePageIndex = Math.min(state.activePageIndex, pages.length - 1);
      return { pages, activePageIndex, selectedLayerId: null };
    });
  },

  duplicatePage: (index) => {
    const page = get().pages[index];
    if (!page) return;
    const newPage: Page = {
      ...JSON.parse(JSON.stringify(page)),
      id: generateId(),
      name: `${page.name} Copy`,
    };
    set((state: BuilderState) => {
      const pages = [...state.pages];
      pages.splice(index + 1, 0, newPage);
      return { pages, activePageIndex: index + 1, selectedLayerId: null };
    });
  },

  setActivePage: (index) => {
    if (index >= 0 && index < get().pages.length) {
      set({ activePageIndex: index, selectedLayerId: null });
    }
  },

  renamePage: (index, name) => {
    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) => (i === index ? { ...p, name } : p)),
    }));
  },

  setFormat: (format) => set({ format }),

  // Layer actions
  addLayer: (layer) => {
    const newLayer: Layer = { ...layer, id: generateId() };
    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) =>
        i === state.activePageIndex ? { ...p, layers: [...p.layers, newLayer] } : p
      ),
      selectedLayerId: newLayer.id,
    }));
  },

  updateLayer: (id, updates) => {
    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) =>
        i === state.activePageIndex
          ? { ...p, layers: p.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)) }
          : p
      ),
    }));
  },

  removeLayer: (id) => {
    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) =>
        i === state.activePageIndex ? { ...p, layers: p.layers.filter((l) => l.id !== id) } : p
      ),
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    }));
  },

  selectLayer: (id) => set({ selectedLayerId: id }),

  moveLayer: (id, x, y) => {
    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) =>
        i === state.activePageIndex
          ? { ...p, layers: p.layers.map((l) => (l.id === id ? { ...l, x, y } : l)) }
          : p
      ),
    }));
  },

  resizeLayer: (id, width, height) => {
    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) =>
        i === state.activePageIndex
          ? { ...p, layers: p.layers.map((l) => (l.id === id ? { ...l, width, height } : l)) }
          : p
      ),
    }));
  },

  bringToFront: (id) => {
    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) =>
        i === state.activePageIndex
          ? {
              ...p,
              layers: p.layers.map((l) => {
                if (l.id !== id) return l;
                const maxZ = Math.max(0, ...p.layers.map((x) => x.zIndex));
                return { ...l, zIndex: maxZ + 1 };
              }),
            }
          : p
      ),
    }));
  },

  sendToBack: (id) => {
    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) =>
        i === state.activePageIndex
          ? {
              ...p,
              layers: p.layers.map((l) => {
                if (l.id !== id) return l;
                const minZ = Math.min(0, ...p.layers.map((x) => x.zIndex));
                return { ...l, zIndex: minZ - 1 };
              }),
            }
          : p
      ),
    }));
  },

  clearCanvas: () =>
    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) =>
        i === state.activePageIndex
          ? { ...p, layers: [], canvasBackground: { color: "#ffffff", image: "" } }
          : p
      ),
      selectedLayerId: null,
    })),

  setCanvasBackground: (bg) =>
    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) =>
        i === state.activePageIndex
          ? { ...p, canvasBackground: { ...p.canvasBackground, ...bg } }
          : p
      ),
    })),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTheme: (theme) => set((state: BuilderState) => ({ theme: { ...state.theme, ...theme } })),
  resetTheme: () => set({ theme: { ...defaultTheme } }),

  loadTemplate: (template) => {
    set({
      format: template.format,
      pages: JSON.parse(JSON.stringify(template.pages)),
      activePageIndex: 0,
      theme: { ...defaultTheme, ...template.theme },
      selectedLayerId: null,
    });
  },

  // Brand kit
  addBrandColor: (color) =>
    set((state: BuilderState) => ({
      brandKit: { ...state.brandKit, colors: [...state.brandKit.colors, color] },
    })),

  removeBrandColor: (color) =>
    set((state: BuilderState) => ({
      brandKit: {
        ...state.brandKit,
        colors: state.brandKit.colors.filter((c) => c !== color),
      },
    })),

  addBrandFont: (font) =>
    set((state: BuilderState) => ({
      brandKit: { ...state.brandKit, fonts: [...state.brandKit.fonts, font] },
    })),

  removeBrandFont: (font) =>
    set((state: BuilderState) => ({
      brandKit: {
        ...state.brandKit,
        fonts: state.brandKit.fonts.filter((f) => f !== font),
      },
    })),

  // Alignment
  alignLayer: (id, align) => {
    const page = get().pages[get().activePageIndex];
    if (!page) return;
    const layer = page.layers.find((l: Layer) => l.id === id);
    if (!layer) return;
    let x = layer.x;
    let y = layer.y;
    if (align === "left") x = 0;
    if (align === "center") x = 50 - layer.width / 2;
    if (align === "right") x = 100 - layer.width;
    if (align === "top") y = 0;
    if (align === "middle") y = 50 - layer.height / 2;
    if (align === "bottom") y = 100 - layer.height;

    set((state: BuilderState) => ({
      pages: state.pages.map((p, i) =>
        i === state.activePageIndex
          ? { ...p, layers: p.layers.map((l) => (l.id === id ? { ...l, x, y } : l)) }
          : p
      ),
    }));
  },

  setShowSafeZones: (show) => set({ showSafeZones: show }),

  setSnapGuides: (guides) => set({ snapGuides: guides }),
  clearSnapGuides: () => set({ snapGuides: { x: null, y: null } }),

  // Viewport
  setZoom: (zoom) =>
    set((state: BuilderState) => ({
      viewport: { ...state.viewport, zoom: Math.max(0.1, Math.min(3, zoom)) },
    })),
  zoomIn: () =>
    set((state: BuilderState) => ({
      viewport: { ...state.viewport, zoom: Math.min(3, state.viewport.zoom + 0.1) },
    })),
  zoomOut: () =>
    set((state: BuilderState) => ({
      viewport: { ...state.viewport, zoom: Math.max(0.1, state.viewport.zoom - 0.1) },
    })),
  resetViewport: () => set({ viewport: { zoom: 1, panX: 0, panY: 0 } }),
  setPan: (pan) => set((state: BuilderState) => ({ viewport: { ...state.viewport, ...pan } })),

  // Magic resize
  resizeToFormat: (newFormat) => {
    const currentFormat = get().format;
    if (currentFormat === newFormat) return;
    // Basic magic resize: just change format. Advanced reflow can be added later.
    set({ format: newFormat });
  },
});

export const useBuilderStore = create<BuilderState>()(
  persist(
    temporal(builderStore, {
      partialize: (state) => ({
        format: state.format,
        pages: state.pages,
        theme: state.theme,
        brandKit: state.brandKit,
        activePageIndex: state.activePageIndex,
      }),
      equality: shallow,
      limit: 50,
    }),
    {
      name: "hype-social-builder-v2",
      partialize: (state) => ({
        format: state.format,
        pages: state.pages,
        theme: state.theme,
        brandKit: state.brandKit,
        activePageIndex: state.activePageIndex,
      }),
    }
  )
);
