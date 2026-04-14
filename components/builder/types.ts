export type CanvasFormat = "ig-post" | "ig-story" | "ig-carousel" | "fb-post" | "x-post";

export interface FormatSpec {
  id: CanvasFormat;
  name: string;
  width: number;
  height: number;
  ratio: number;
  safeZones?: {
    top: number;    // percentage
    bottom: number; // percentage
    left?: number;
    right?: number;
  };
}

export const FORMATS: FormatSpec[] = [
  {
    id: "ig-post",
    name: "Instagram Post",
    width: 1080,
    height: 1080,
    ratio: 1,
  },
  {
    id: "ig-story",
    name: "Instagram Story",
    width: 1080,
    height: 1920,
    ratio: 1080 / 1920,
    safeZones: { top: 15, bottom: 20, left: 5, right: 5 },
  },
  {
    id: "ig-carousel",
    name: "Instagram Carousel",
    width: 1080,
    height: 1350,
    ratio: 1080 / 1350,
  },
  {
    id: "fb-post",
    name: "Facebook Post",
    width: 1200,
    height: 630,
    ratio: 1200 / 630,
  },
  {
    id: "x-post",
    name: "X / Twitter Post",
    width: 1200,
    height: 675,
    ratio: 1200 / 675,
  },
];

export type LayerType = "background" | "text" | "image" | "shape" | "button" | "frame";

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  rotation: number;
  zIndex: number;
  props: Record<string, unknown>;
}

export interface Page {
  id: string;
  name: string;
  layers: Layer[];
  canvasBackground: {
    color: string;
    image: string;
  };
}

export interface SocialTemplate {
  id: string;
  name: string;
  thumbnail?: string;
  format: CanvasFormat;
  layers: Layer[];
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
  };
}

export interface BuilderTemplateV2 {
  id: string;
  name: string;
  format: CanvasFormat;
  pages: Page[];
  theme: {
    primaryColor: string;
    borderRadius: number;
    fontFamily: string;
    backgroundColor: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface BrandKit {
  colors: string[];
  fonts: string[];
}
