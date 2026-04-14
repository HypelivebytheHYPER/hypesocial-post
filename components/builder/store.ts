"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
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

      setFormat: (format) => set({ format }),

      addLayer: (layer) => {
        const newLayer: Layer = {
          ...layer,
          id: generateId(),
        };
        set((state) => ({
          layers: [...state.layers, newLayer],
          selectedLayerId: newLayer.id,
        }));
      },

      updateLayer: (id, updates) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        }));
      },

      removeLayer: (id) => {
        set((state) => ({
          layers: state.layers.filter((l) => l.id !== id),
          selectedLayerId:
            state.selectedLayerId === id ? null : state.selectedLayerId,
        }));
      },

      selectLayer: (id) => set({ selectedLayerId: id }),

      moveLayer: (id, x, y) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === id ? { ...l, x, y } : l
          ),
        }));
      },

      resizeLayer: (id, width, height) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === id ? { ...l, width, height } : l
          ),
        }));
      },

      bringToFront: (id) => {
        set((state) => {
          const maxZ = Math.max(0, ...state.layers.map((l) => l.zIndex));
          return {
            layers: state.layers.map((l) =>
              l.id === id ? { ...l, zIndex: maxZ + 1 } : l
            ),
          };
        });
      },

      sendToBack: (id) => {
        set((state) => {
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
        set((state) => ({
          canvasBackground: { ...state.canvasBackground, ...bg },
        })),

      setSearchQuery: (q) => set({ searchQuery: q }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setTheme: (theme) =>
        set((state) => ({ theme: { ...state.theme, ...theme } })),
      resetTheme: () => set({ theme: { ...defaultTheme } }),

      loadTemplate: (template) => {
        set({
          format: template.format,
          layers: JSON.parse(JSON.stringify(template.layers)),
          theme: { ...defaultTheme, ...template.theme },
          selectedLayerId: null,
        });
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
