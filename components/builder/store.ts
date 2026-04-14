"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import { shallow } from "zustand/shallow";
import type { CanvasFormat, Layer, BuilderTemplateV2 } from "./types";

interface ThemeState {
  primaryColor: string;
  borderRadius: number;
  fontFamily: string;
  backgroundColor: string;
}

interface BuilderState {
  // Canvas
  format: CanvasFormat;
  layers: Layer[];
  selectedLayerId: string | null;
  canvasBackground: {
    color: string;
    image: string;
  };

  // UI
  searchQuery: string;
  viewMode: "grid" | "list";
  theme: ThemeState;

  // Snap guides (transient UI)
  snapGuides: { x: number | null; y: number | null };

  // Actions
  setFormat: (format: CanvasFormat) => void;
  addLayer: (layer: Omit<Layer, "id">) => void;
  updateLayer: (id: string, updates: Partial<Omit<Layer, "id">>) => void;
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  moveLayer: (id: string, x: number, y: number) => void;
  resizeLayer: (id: string, width: number, height: number) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  clearCanvas: () => void;
  setCanvasBackground: (bg: Partial<BuilderState["canvasBackground"]>) => void;

  setSearchQuery: (q: string) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setTheme: (theme: Partial<ThemeState>) => void;
  resetTheme: () => void;
  loadTemplate: (template: BuilderTemplateV2) => void;

  // Alignment
  alignLayer: (id: string, align: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  distributeLayers: (direction: "horizontal" | "vertical") => void;

  // Snap guides
  setSnapGuides: (guides: { x: number | null; y: number | null }) => void;
  clearSnapGuides: () => void;
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const defaultTheme: ThemeState = {
  primaryColor: "#2563eb",
  borderRadius: 8,
  fontFamily: "Inter",
  backgroundColor: "#ffffff",
};

// Core state factory for undoable + persisted store
const builderStore = (set: any, get: any): BuilderState => ({
  format: "ig-post",
  layers: [],
  selectedLayerId: null,
  canvasBackground: {
    color: "#ffffff",
    image: "",
  },
  searchQuery: "",
  viewMode: "grid",
  theme: { ...defaultTheme },
  snapGuides: { x: null, y: null },

  setFormat: (format) => set({ format }),

  addLayer: (layer) => {
    const newLayer: Layer = {
      ...layer,
      id: generateId(),
    };
    set((state: BuilderState) => ({
      layers: [...state.layers, newLayer],
      selectedLayerId: newLayer.id,
    }));
  },

  updateLayer: (id, updates) => {
    set((state: BuilderState) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  },

  removeLayer: (id) => {
    set((state: BuilderState) => ({
      layers: state.layers.filter((l) => l.id !== id),
      selectedLayerId:
        state.selectedLayerId === id ? null : state.selectedLayerId,
    }));
  },

  selectLayer: (id) => set({ selectedLayerId: id }),

  moveLayer: (id, x, y) => {
    set((state: BuilderState) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, x, y } : l
      ),
    }));
  },

  resizeLayer: (id, width, height) => {
    set((state: BuilderState) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, width, height } : l
      ),
    }));
  },

  bringToFront: (id) => {
    set((state: BuilderState) => {
      const maxZ = Math.max(0, ...state.layers.map((l) => l.zIndex));
      return {
        layers: state.layers.map((l) =>
          l.id === id ? { ...l, zIndex: maxZ + 1 } : l
        ),
      };
    });
  },

  sendToBack: (id) => {
    set((state: BuilderState) => {
      const minZ = Math.min(0, ...state.layers.map((l) => l.zIndex));
      return {
        layers: state.layers.map((l) =>
          l.id === id ? { ...l, zIndex: minZ - 1 } : l
        ),
      };
    });
  },

  clearCanvas: () =>
    set({ layers: [], selectedLayerId: null, canvasBackground: { color: "#ffffff", image: "" } }),

  setCanvasBackground: (bg) =>
    set((state: BuilderState) => ({
      canvasBackground: { ...state.canvasBackground, ...bg },
    })),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTheme: (theme) =>
    set((state: BuilderState) => ({ theme: { ...state.theme, ...theme } })),
  resetTheme: () => set({ theme: { ...defaultTheme } }),

  loadTemplate: (template) => {
    set({
      format: template.format,
      layers: JSON.parse(JSON.stringify(template.layers)),
      theme: { ...defaultTheme, ...template.theme },
      selectedLayerId: null,
    });
  },

  alignLayer: (id, align) => {
    const state = get() as BuilderState;
    const layer = state.layers.find((l) => l.id === id);
    if (!layer) return;

    let x = layer.x;
    let y = layer.y;

    if (align === "left") x = 0;
    if (align === "center") x = 50 - layer.width / 2;
    if (align === "right") x = 100 - layer.width;
    if (align === "top") y = 0;
    if (align === "middle") y = 50 - layer.height / 2;
    if (align === "bottom") y = 100 - layer.height;

    set((s: BuilderState) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, x, y } : l)),
    }));
  },

  distributeLayers: (_direction) => {
    const selected = get().selectedLayerId;
    if (!selected) return;
    // Simplistic: align all selected concept not yet multi-select; skip for now
  },

  setSnapGuides: (guides) => set({ snapGuides: guides }),
  clearSnapGuides: () => set({ snapGuides: { x: null, y: null } }),
});

export const useBuilderStore = create<BuilderState>()(
  persist(
    temporal(builderStore, {
      partialize: (state) => ({
        format: state.format,
        layers: state.layers,
        theme: state.theme,
        canvasBackground: state.canvasBackground,
      }),
      equality: shallow,
      limit: 50,
      onSave: () => {
        // Only save when meaningful canvas state changes
      },
    }),
    {
      name: "hype-social-builder-v2",
      partialize: (state) => ({
        format: state.format,
        layers: state.layers,
        theme: state.theme,
        canvasBackground: state.canvasBackground,
      }),
    }
  )
);

// Re-export temporal hooks for convenience
export function useTemporalStore() {
  return useBuilderStore.temporal.getState();
}
