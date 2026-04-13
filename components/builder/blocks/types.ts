import type { ComponentType } from "react";

export type BlockType =
  | "hero"
  | "features-grid"
  | "cta"
  | "pricing"
  | "testimonials"
  | "faq"
  | "footer"
  | "editor-showcase"
  | "table"
  | "promo-catalog"
  | "image"
  | "ai-design";

export interface BuilderBlock {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
}

export interface BlockRegistryEntry {
  type: BlockType;
  name: string;
  description: string;
  iconName: string;
  defaultProps: Record<string, unknown>;
  component: ComponentType<{ props: Record<string, unknown> }>;
  codeTemplate: (props: Record<string, unknown>) => string;
}

export interface PropertyField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "boolean" | "color" | "array" | "number" | "image";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface BlockConfig {
  fields: PropertyField[];
}
