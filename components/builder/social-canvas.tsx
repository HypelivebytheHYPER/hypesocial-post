"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useBuilderStore } from "./store";
import { FORMATS } from "./types";
import { SocialLayer } from "./social-layer";
import { cn } from "@/lib/utils";

export function SocialCanvas() {
  const { format, layers, selectedLayerId, selectLayer, canvasBackground, theme } = useBuilderStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const formatSpec = FORMATS.find((f) => f.id === format)!;

  // Compute scale to fit artboard inside container with padding
  useEffect(() => {
    function computeScale() {
      const container = containerRef.current;
      if (!container) return;
      const padding = 48;
      const availableWidth = container.clientWidth - padding * 2;
      const availableHeight = container.clientHeight - padding * 2;
      const artboardRatio = formatSpec.ratio;
      const containerRatio = availableWidth / availableHeight;
      const newScale =
        artboardRatio > containerRatio
          ? availableWidth / formatSpec.width
          : availableHeight / formatSpec.height;
      setScale(Math.min(newScale, 1));
    }
    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [formatSpec]);

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        selectLayer(null);
      }
    },
    [selectLayer]
  );

  const artboardWidth = formatSpec.width * scale;
  const artboardHeight = formatSpec.height * scale;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/30"
      onClick={handleBackgroundClick}
    >
      {/* Artboard */}
      <div
        id="social-artboard"
        className="relative overflow-hidden shadow-2xl"
        style={{
          width: artboardWidth,
          height: artboardHeight,
          backgroundColor: canvasBackground.color || theme.backgroundColor || "#ffffff",
          borderRadius: theme.borderRadius / 16,
        }}
      >
        {canvasBackground.image && (
          <img
            src={canvasBackground.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: `${20 * scale}px ${20 * scale}px`,
          }}
        />

        {/* Layers */}
        {layers
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((layer) => (
            <SocialLayer
              key={layer.id}
              layer={layer}
              scale={scale}
              artboardWidth={artboardWidth}
              artboardHeight={artboardHeight}
              isSelected={selectedLayerId === layer.id}
            />
          ))}
      </div>

      {/* Format label */}
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-background/80 px-2 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur">
        {formatSpec.name} · {formatSpec.width}×{formatSpec.height}
      </div>
    </div>
  );
}
