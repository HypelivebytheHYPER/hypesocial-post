"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Layers, Palette, Type, ExternalLink, Zap, Grid3X3, LayoutTemplate, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "./store";

interface PenpotPage {
  id: string;
  name: string;
}

interface PenpotFileData {
  name?: string;
  data?: {
    pages?: Record<string, PenpotPage>;
    pagesIndex?: string[];
    colors?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function parsePenpotUrl(url: string) {
  try {
    const u = new URL(url);
    const hash = u.hash;
    const match = hash.match(/\/([0-9a-fA-F-]{36})\/?$/);
    if (match) {
      return { baseUrl: `${u.origin}`, fileId: match[1] };
    }
    const match2 = hash.match(/\/([0-9a-fA-F-]{36})\/[0-9a-fA-F-]{36}/);
    if (match2) {
      return { baseUrl: `${u.origin}`, fileId: match2[2] || match2[1] };
    }
    return null;
  } catch {
    return null;
  }
}

function extractColors(data: PenpotFileData["data"]): string[] {
  if (!data) return [];
  const colors = new Set<string>();

  function visit(obj: unknown) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(visit);
      return;
    }
    const o = obj as Record<string, unknown>;
    if (o.color && typeof o.color === "string" && o.color.startsWith("#")) {
      colors.add(o.color.toUpperCase());
    }
    if (o.fillColor && typeof o.fillColor === "string") {
      colors.add(o.fillColor.toUpperCase());
    }
    Object.values(o).forEach(visit);
  }

  visit(data);
  return Array.from(colors);
}

function extractFonts(data: PenpotFileData["data"]): string[] {
  if (!data) return [];
  const fonts = new Set<string>();

  function visit(obj: unknown) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(visit);
      return;
    }
    const o = obj as Record<string, unknown>;
    if (o.fontFamily && typeof o.fontFamily === "string") {
      fonts.add(o.fontFamily);
    }
    if (o.fontId && typeof o.fontId === "string") {
      fonts.add(o.fontId);
    }
    Object.values(o).forEach(visit);
  }

  visit(data);
  return Array.from(fonts);
}

export function PenpotPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setTheme } = useBuilderStore();
  const [url, setUrl] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://design.penpot.app");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<PenpotFileData | null>(null);

  async function handleFetch() {
    const parsed = parsePenpotUrl(url);
    const effectiveBaseUrl = parsed?.baseUrl || baseUrl.replace(/\/$/, "");
    const fileId = parsed?.fileId;

    if (!fileId) {
      setError("Could not parse Penpot file ID from URL");
      return;
    }

    setLoading(true);
    setError(null);
    setFileData(null);

    try {
      const res = await fetch("/api/penpot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: effectiveBaseUrl,
          token: token || undefined,
          fileId,
          command: "get-file",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch Penpot file");
      }
      setFileData(data as PenpotFileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const pages: PenpotPage[] = [];
  if (fileData?.data?.pages) {
    const idx = fileData.data.pagesIndex || Object.keys(fileData.data.pages);
    idx.forEach((id) => {
      const p = fileData.data!.pages![id];
      if (p) pages.push(p);
    });
  }

  const colors = extractColors(fileData?.data);
  const fonts = extractFonts(fileData?.data);

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Penpot</h2>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
          Close
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          <Input
            placeholder="Penpot file URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Base URL (e.g. https://design.penpot.app)"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            type="password"
            placeholder="Access token (optional)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            className="w-full text-xs"
            onClick={handleFetch}
            disabled={loading || !url.trim()}
          >
            {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="mr-1 h-3.5 w-3.5" />}
            Fetch File
          </Button>

          {error && <p className="text-[10px] text-destructive">{error}</p>}

          {!fileData && (
            <div className="space-y-2 pt-1">
              <Card className="p-2">
                <p className="mb-1 text-[10px] font-medium text-foreground">Penpot 2.0 Highlights</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Grid3X3 className="h-3 w-3 text-primary" />
                    CSS Grid Layout
                  </li>
                  <li className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <LayoutTemplate className="h-3 w-3 text-primary" />
                    New Components System
                  </li>
                  <li className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Zap className="h-3 w-3 text-primary" />
                    Redesigned UI & Accessibility
                  </li>
                  <li className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Code2 className="h-3 w-3 text-primary" />
                    HTML Markup Export
                  </li>
                </ul>
              </Card>
              <Card className="p-2">
                <p className="mb-1 text-[10px] font-medium text-foreground">MCP Server</p>
                <p className="text-[10px] text-muted-foreground">
                  Connect Claude/Cursor to Penpot for bidirectional design-to-code workflows.
                </p>
                <a
                  href="https://help.penpot.app/mcp/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-[10px] text-primary hover:underline"
                >
                  View MCP docs →
                </a>
              </Card>
            </div>
          )}

          {fileData && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-medium">{fileData.name || "Untitled file"}</p>

              {colors.length > 0 && (
                <Card className="p-2">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Palette className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium">Colors</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {colors.slice(0, 12).map((c) => (
                      <button
                        key={c}
                        onClick={() => setTheme({ primaryColor: c })}
                        className="h-5 w-5 rounded border border-border"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </Card>
              )}

              {fonts.length > 0 && (
                <Card className="p-2">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Type className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium">Fonts</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {fonts.slice(0, 6).map((f) => (
                      <Badge key={f} variant="secondary" className="text-[10px]">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {pages.length > 0 && (
                <Card className="p-2">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Layers className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium">Pages</span>
                  </div>
                  <ul className="space-y-1">
                    {pages.map((p) => (
                      <li key={p.id} className="truncate text-[10px] text-muted-foreground">
                        {p.name}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card className="p-2">
                <p className="text-[10px] text-muted-foreground">
                  Suggested blocks based on Penpot file structure:
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px]">Hero</Badge>
                  <Badge variant="outline" className="text-[10px]">Features Grid</Badge>
                  <Badge variant="outline" className="text-[10px]">CTA</Badge>
                  <Badge variant="outline" className="text-[10px]">Image</Badge>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
