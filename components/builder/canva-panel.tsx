"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, LayoutTemplate, ImageIcon, Wand2 } from "lucide-react";
interface CanvaDesign {
  id: string;
  title?: string;
  thumbnail?: { url: string; width?: number; height?: number };
  urls?: { edit_url?: string; view_url?: string };
}

function CanvaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.86 0 3.6-.51 5.1-1.39-1.02-1.01-1.65-2.4-1.65-3.94 0-3.04 2.46-5.5 5.5-5.5.63 0 1.23.11 1.79.3C21.39 6.37 17.05 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
    </svg>
  );
}

export function CanvaPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch("/api/canva/designs?limit=12&sort_by=modified_at")
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          setConnected(false);
          setDesigns([]);
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch Canva designs");
        }
        setConnected(true);
        setDesigns(data.items || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setConnected(false);
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <CanvaIcon className="h-4 w-4 text-[#00C4CC]" />
          <h2 className="text-sm font-semibold text-foreground">Canva</h2>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
          Close
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {connected === false && !loading && (
            <Card className="p-3">
              <p className="mb-2 text-[10px] text-muted-foreground">
                Connect your Canva account to browse designs and import assets into the builder.
              </p>
              <Button
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={() => window.open("/canva", "_blank")}
              >
                <CanvaIcon className="h-3.5 w-3.5" />
                Connect Canva
              </Button>
            </Card>
          )}

          {loading && (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>Loading designs...</p>
            </div>
          )}

          {error && <p className="text-[10px] text-destructive">{error}</p>}

          {connected && designs.length === 0 && !loading && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <p>No designs found</p>
            </div>
          )}

          {connected && designs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-muted-foreground">Recent Designs</p>
              <div className="grid grid-cols-2 gap-2">
                {designs.map((design) => (
                  <a
                    key={design.id}
                    href={design.urls?.edit_url || `https://www.canva.com/design/${design.id}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-md border border-border bg-muted"
                    title={design.title || "Untitled design"}
                  >
                    {design.thumbnail?.url ? (
                      <img
                        src={design.thumbnail.url}
                        alt={design.title || ""}
                        className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center">
                        <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="truncate p-1.5 text-[10px] font-medium">
                      {design.title || "Untitled"}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <Card className="p-3">
            <p className="mb-2 text-[10px] font-medium text-foreground">Canva Actions</p>
            <div className="space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-1.5 text-[10px]"
                onClick={() => window.open("/canva/editor", "_blank")}
              >
                <Wand2 className="h-3 w-3" />
                Open Canva Editor
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-1.5 text-[10px]"
                onClick={() => window.open("/canva", "_blank")}
              >
                <ImageIcon className="h-3 w-3" />
                Browse Templates
              </Button>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

export { CanvaIcon };
