"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useBuilderStore } from "./store";
import { FORMATS } from "./types";
import { SocialLayer } from "./social-layer";
import { cn } from "@/lib/utils";
import { throttle } from "@tanstack/pacer";

export function SocialCanvas() {
  const {
    format,
    layers,
    selectedLayerId,
    selectLayer,
    canvasBackground,
    theme,
    snapGuides,
    showSafeZones,
    viewport,
    setPan,
    setZoom,
  } = useBuilderStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const formatSpec = FORMATS.find((f) => f.id === format)!;
  const scale = baseScale * viewport.zoom;
  const artboardWidth = formatSpec.width * scale;
  const artboardHeight = formatSpec.height * scale;

  // Compute base scale via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function computeScale() {
      const el = containerRef.current;
      if (!el) return;
      const padding = 48;
      const availableWidth = el.clientWidth - padding * 2;
      const availableHeight = el.clientHeight - padding * 2;
      const newScale = Math.max(0.1, Math.min(availableWidth / formatSpec.width, availableHeight / formatSpec.height, 1));
      setBaseScale(newScale);
    }

    computeScale();
    const ro = new ResizeObserver(computeScale);
    ro.observe(container);
    return () => ro.disconnect();
  }, [formatSpec]);

  const throttledSetZoom = useMemo(
    () => throttle((zoom: number) => setZoom(zoom), { wait: 50, leading: true, trailing: false }),
    [setZoom]
  );

  // Wheel zoom (Ctrl/Meta + wheel) or scroll pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        throttledSetZoom(viewport.zoom + delta);
      } else if (e.shiftKey) {
        e.preventDefault();
        setPan({ x: viewport.panX - e.deltaY, y: viewport.panY });
      }
    },
    [setPan, throttledSetZoom, viewport]
  );

  // Space + drag to pan
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space" && !isPanning) {
        e.preventDefault();
        setIsPanning(true);
      }
    },
    [isPanning]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsPanning(false);
        panStart.current = null;
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        e.preventDefault();
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          px: viewport.panX,
          py: viewport.panY,
        };
      }
    },
    [isPanning, viewport.panX, viewport.panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && panStart.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
      }
    },
    [isPanning, setPan]
  );

  const handleMouseUp = useCallback(() => {
    panStart.current = null;
  }, []);

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        selectLayer(null);
      }
    },
    [selectLayer]
  );

  const safeZones = formatSpec.safeZones;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-1 items-center justify-center overflow-hidden bg-muted/30",
        isPanning && "cursor-grab"
      )}
      onClick={handleBackgroundClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Artboard wrapper with pan offset */}
      <div
        id="social-artboard"
        className="relative overflow-hidden shadow-2xl"
        style={{
          width: artboardWidth,
          height: artboardHeight,
          transform: `translate(${viewport.panX}px, ${viewport.panY}px)`,
          backgroundColor: canvasBackground.color || theme.backgroundColor || "#ffffff",
          borderRadius: theme.borderRadius / 16,
        }}
      >
        {canvasBackground.image && (
          <img src={canvasBackground.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
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

        {/* Safe zones */}
        {showSafeZones && safeZones && (
          <>
            {safeZones.top !== undefined && safeZones.top > 0 && (
              <div
                className="pointer-events-none absolute left-0 right-0 bg-red-500/10"
                style={{ top: 0, height: `${safeZones.top}%` }}
              />
            )}
            {safeZones.bottom !== undefined && safeZones.bottom > 0 && (
              <div
                className="pointer-events-none absolute left-0 right-0 bg-red-500/10"
                style={{ bottom: 0, height: `${safeZones.bottom}%` }}
              />
            )}
            {safeZones.left !== undefined && safeZones.left > 0 && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 bg-red-500/10"
                style={{ left: 0, width: `${safeZones.left}%` }}
              />
            )}
            {safeZones.right !== undefined && safeZones.right > 0 && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 bg-red-500/10"
                style={{ right: 0, width: `${safeZones.right}%` }}
              />
            )}
          </>
        )}

        {/* Snap guides */}
        {snapGuides.x !== null && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary/70"
            style={{ left: (snapGuides.x / 100) * artboardWidth }}
          />
        )}
        {snapGuides.y !== null && (
          <div
            className="pointer-events-none absolute left-0 right-0 h-px bg-primary/70"
            style={{ top: (snapGuides.y / 100) * artboardHeight }}
          />
        )}

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
        {formatSpec.name} · {formatSpec.width}×{formatSpec.height} · {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
}
