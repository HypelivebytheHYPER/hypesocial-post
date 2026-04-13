"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Figma, RefreshCw, Layers, Palette, Type } from "lucide-react";
import { useBuilderStore } from "./store";

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  style?: {
    fontFamily?: string;
    fontPostScriptName?: string;
    fontWeight?: number;
    fontSize?: number;
    lineHeightPx?: number;
    letterSpacing?: number;
    fills?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function extractColors(node: FigmaNode, colors = new Set<string>()) {
  if (node.fills) {
    node.fills.forEach((fill) => {
      if (fill.type === "SOLID" && fill.color) {
        colors.add(rgbToHex(fill.color));
      }
    });
  }
  if (node.style?.fills) {
    node.style.fills.forEach((fill) => {
      if (fill.type === "SOLID" && fill.color) {
        colors.add(rgbToHex(fill.color));
      }
    });
  }
  node.children?.forEach((child) => extractColors(child, colors));
  return Array.from(colors);
}

function extractFonts(node: FigmaNode, fonts = new Set<string>()) {
  if (node.style?.fontFamily) {
    fonts.add(node.style.fontFamily);
  }
  if (node.style?.fontPostScriptName) {
    fonts.add(node.style.fontPostScriptName);
  }
  node.children?.forEach((child) => extractFonts(child, fonts));
  return Array.from(fonts);
}

function extractFrames(node: FigmaNode): Array<{ id: string; name: string }> {
  const frames: Array<{ id: string; name: string }> = [];
  if (["FRAME", "GROUP", "COMPONENT", "INSTANCE"].includes(node.type)) {
    frames.push({ id: node.id, name: node.name });
  }
  node.children?.forEach((child) => frames.push(...extractFrames(child)));
  return frames;
}

function parseFigmaUrl(url: string) {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/(file|design|proto)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    const fileKey = match[2];
    const nodeId = u.searchParams.get("node-id");
    return { fileKey, nodeId };
  } catch {
    return null;
  }
}

export function FigmaPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<any>(null);
  const { addBlock } = useBuilderStore();

  async function fetchFigma() {
    const parsed = parseFigmaUrl(url);
    if (!parsed) {
      setError("Invalid Figma URL");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ fileKey: parsed.fileKey! });
      if (parsed.nodeId) params.set("nodeId", parsed.nodeId);
      const res = await fetch(`/api/figma?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setFileData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const firstNodeKey = Object.keys(fileData?.nodes || {})[0];
  const rootNode = fileData?.document || (firstNodeKey ? fileData?.nodes?.[firstNodeKey]?.document : null);
  const colors = rootNode ? extractColors(rootNode) : [];
  const fonts = rootNode ? extractFonts(rootNode) : [];
  const frames = rootNode ? extractFrames(rootNode) : [];

  function suggestBlock(frameName: string) {
    const name = frameName.toLowerCase();
    if (name.includes("hero")) return "hero";
    if (name.includes("feature")) return "features-grid";
    if (name.includes("pricing")) return "pricing";
    if (name.includes("testimonial")) return "testimonials";
    if (name.includes("faq")) return "faq";
    if (name.includes("cta")) return "cta";
    if (name.includes("footer")) return "footer";
    return null;
  }

  if (!open) return null;

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Figma className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Figma</h2>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
          Close
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Paste Figma URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-8 text-xs"
            />
            <Button size="icon" className="h-8 w-8" onClick={fetchFigma} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {fileData && rootNode && (
            <div className="space-y-4">
              {/* Colors */}
              {colors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Palette className="h-3.5 w-3.5" />
                    Colors ({colors.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colors.slice(0, 16).map((c) => (
                      <div
                        key={c}
                        className="flex h-8 w-8 rounded-md border border-border shadow-sm"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Fonts */}
              {fonts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Type className="h-3.5 w-3.5" />
                    Fonts ({fonts.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {fonts.slice(0, 6).map((f) => (
                      <Badge key={f} variant="secondary" className="text-[10px]">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Frames / Suggested blocks */}
              {frames.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Layers className="h-3.5 w-3.5" />
                    Frames ({frames.length})
                  </div>
                  <div className="space-y-2">
                    {frames.slice(0, 10).map((frame) => {
                      const suggestion = suggestBlock(frame.name);
                      return (
                        <Card key={frame.id} className="p-2">
                          <p className="truncate text-xs font-medium text-foreground">{frame.name}</p>
                          {suggestion && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-1 h-6 text-[10px] text-primary"
                              onClick={() => addBlock(suggestion as any)}
                            >
                              + Add {suggestion.replace("-", " ")} block
                            </Button>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
