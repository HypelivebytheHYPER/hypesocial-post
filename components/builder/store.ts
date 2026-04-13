"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BuilderBlock, BlockType } from "./blocks/types";
import { blockRegistry, blockVariants } from "./blocks/registry";

interface ThemeState {
  primaryColor: string;
  borderRadius: number;
  fontFamily: string;
}

export interface BuilderTemplate {
  id: string;
  name: string;
  blocks: BuilderBlock[];
  theme: ThemeState;
  createdAt: number;
  updatedAt: number;
}

interface BuilderState {
  blocks: BuilderBlock[];
  selectedBlockId: string | null;
  searchQuery: string;
  viewMode: "grid" | "list";
  theme: ThemeState;
  addBlock: (type: BlockType, index?: number) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  updateBlock: (id: string, props: Record<string, unknown>) => void;
  removeBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  clearCanvas: () => void;
  shuffleBlock: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setTheme: (theme: Partial<ThemeState>) => void;
  resetTheme: () => void;
  loadTemplate: (template: BuilderTemplate) => void;
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const defaultTheme: ThemeState = {
  primaryColor: "#2563eb",
  borderRadius: 8,
  fontFamily: "Inter",
};

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
      blocks: [],
      selectedBlockId: null,
      searchQuery: "",
      viewMode: "grid",
      theme: { ...defaultTheme },

      addBlock: (type: BlockType, index?: number) => {
        const registryEntry = blockRegistry[type];
        if (!registryEntry) return;

        const newBlock: BuilderBlock = {
          id: generateId(),
          type,
          props: { ...registryEntry.defaultProps },
        };

        set((state) => {
          const blocks = [...state.blocks];
          const insertIndex = index !== undefined && index >= 0 ? index : blocks.length;
          blocks.splice(insertIndex, 0, newBlock);
          return { blocks, selectedBlockId: newBlock.id };
        });
      },

      moveBlock: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const blocks = [...state.blocks];
          const [moved] = blocks.splice(fromIndex, 1);
          if (!moved) return state;
          blocks.splice(toIndex, 0, moved);
          return { blocks };
        });
      },

      updateBlock: (id: string, props: Record<string, unknown>) => {
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? { ...block, props: { ...block.props, ...props } } : block
          ),
        }));
      },

      removeBlock: (id: string) => {
        set((state) => ({
          blocks: state.blocks.filter((block) => block.id !== id),
          selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
        }));
      },

      selectBlock: (id: string | null) => {
        set({ selectedBlockId: id });
      },

      clearCanvas: () => {
        set({ blocks: [], selectedBlockId: null });
      },

      shuffleBlock: (id: string) => {
        const state = useBuilderStore.getState();
        const block = state.blocks.find((b) => b.id === id);
        if (!block) return;
        const variants = blockVariants[block.type];
        if (!variants || variants.length <= 1) return;

        let attempts = 0;
        let nextVariant: { type: BlockType; props: Record<string, unknown> } | null = null;
        while (attempts < 10) {
          const candidate = variants[Math.floor(Math.random() * variants.length)];
          if (candidate && (candidate.type !== block.type || JSON.stringify(candidate.props) !== JSON.stringify(block.props))) {
            nextVariant = candidate;
            break;
          }
          attempts++;
        }
        if (!nextVariant) {
          const fallback = variants[Math.floor(Math.random() * variants.length)];
          nextVariant = fallback ?? null;
        }

        set((s) => ({
          blocks: s.blocks.map((b) =>
            b.id === id ? { ...b, type: nextVariant!.type, props: { ...nextVariant!.props } } : b
          ),
        }));
      },

      setSearchQuery: (q: string) => set({ searchQuery: q }),
      setViewMode: (mode: "grid" | "list") => set({ viewMode: mode }),
      setTheme: (theme) => set((state) => ({ theme: { ...state.theme, ...theme } })),
      resetTheme: () => set({ theme: { ...defaultTheme } }),

      loadTemplate: (template: BuilderTemplate) => {
        set({
          blocks: JSON.parse(JSON.stringify(template.blocks)),
          theme: { ...template.theme },
          selectedBlockId: null,
        });
      },
    }),
    {
      name: "hype-social-builder",
      partialize: (state) => ({
        blocks: state.blocks,
        theme: state.theme,
      }),
    }
  )
);
