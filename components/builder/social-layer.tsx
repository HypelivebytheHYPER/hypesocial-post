"use client";

import { useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";

import { useBuilderStore } from "./store";
import type { Layer } from "./types";
import { cn } from "@/lib/utils";

interface SocialLayerProps {
  layer: Layer;
  scale: number;
  artboardWidth: number;
  artboardHeight: number;
  isSelected: boolean;
}

export function SocialLayer({ layer, scale, artboardWidth, artboardHeight, isSelected }: SocialLayerProps) {
  const { selectLayer, updateLayer, theme } = useBuilderStore();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: layer.id,
    data: { layer },
    disabled: layer.type === "background",
  });

  const [isEditingText, setIsEditingText] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const xPx = (layer.x / 100) * artboardWidth;
  const yPx = (layer.y / 100) * artboardHeight;
  const wPx = (layer.width / 100) * artboardWidth;
  const hPx = (layer.height / 100) * artboardHeight;

  const dragTransform = transform
    ? {
        x: transform.x,
        y: transform.y,
      }
    : { x: 0, y: 0 };

  // Commit drag on drag end handled via DndContext event listeners in parent
  // But we can use a simple wrapper that handles drag end globally

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: xPx,
    top: yPx,
    width: wPx,
    height: hPx,
    transform: `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0) rotate(${layer.rotation}deg)`,
    zIndex: layer.zIndex + (isSelected ? 1000 : 0),
    cursor: layer.type === "background" ? "default" : "move",
  };

  function renderContent() {
    const { type, props } = layer;

    if (type === "background") {
      return (
        <div
          className="h-full w-full"
          style={{ backgroundColor: (props.color as string) || "transparent" }}
        />
      );
    }

    if (type === "text") {
      return (
        <div
          ref={textRef}
          className="h-full w-full overflow-hidden outline-none"
          style={{
            fontSize: (props.fontSize as number) * scale,
            fontWeight: props.fontWeight as number,
            color: props.color as string,
            textAlign: (props.align as React.CSSProperties["textAlign"]) || "left",
            fontFamily: theme.fontFamily,
            display: "flex",
            alignItems: "center",
            justifyContent: getAlignJustify(props.align as string),
            lineHeight: 1.2,
          }}
          onDoubleClick={() => setIsEditingText(true)}
        >
          {isEditingText ? (
            <textarea
              autoFocus
              className="h-full w-full resize-none bg-transparent text-inherit outline-none"
              style={{
                fontSize: "inherit",
                fontWeight: "inherit",
                color: "inherit",
                textAlign: "inherit",
                fontFamily: "inherit",
              }}
              value={(props.text as string) || ""}
              onChange={(e) => updateLayer(layer.id, { props: { ...props, text: e.target.value } })}
              onBlur={() => setIsEditingText(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  setIsEditingText(false);
                }
              }}
            />
          ) : (
            <span className="break-words">{(props.text as string) || ""}</span>
          )}
        </div>
      );
    }

    if (type === "image") {
      const src = (props.src as string) || "";
      return (
        <div
          className={cn(
            "relative h-full w-full overflow-hidden bg-muted/30",
            !!props.rounded && "rounded-lg"
          )}
          style={{ objectFit: (props.objectFit as React.CSSProperties["objectFit"]) || "cover" }}
        >
          {src ? (
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
              <svg className="mb-1 h-6 w-6 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 19.5 3.75H4.5A2.25 2.25 0 0 0 2.25 6v11.25A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
              <span className="text-[10px]">Image</span>
            </div>
          )}
        </div>
      );
    }

    if (type === "shape") {
      const shape = (props.shape as string) || "rectangle";
      return (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center overflow-hidden",
            shape === "pill" ? "rounded-full" : shape === "circle" ? "rounded-full" : "rounded-md"
          )}
          style={{ backgroundColor: (props.color as string) || "#ccc" }}
        >
          <span
            style={{
              color: (props.textColor as string) || "#000",
              fontSize: 12 * scale,
              fontWeight: 600,
            }}
          >
            {(props.text as string) || ""}
          </span>
        </div>
      );
    }

    if (type === "button") {
      return (
        <button
          className={cn(
            "flex h-full w-full items-center justify-center px-2 font-semibold",
            (props.rounded as boolean) !== false ? "rounded-md" : "rounded-none"
          )}
          style={{
            backgroundColor: theme.primaryColor,
            color: "#ffffff",
            fontSize: 12 * scale,
            borderRadius: (theme.borderRadius / 16) * scale * 16,
          }}
        >
          {(props.text as string) || "Button"}
        </button>
      );
    }

    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={baseStyle}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        selectLayer(layer.id);
      }}
      className={cn(
        "group",
        isSelected && "ring-2 ring-primary ring-offset-1"
      )}
    >
      {renderContent()}

      {/* Selection handles (visual only for now) */}
      {isSelected && layer.type !== "background" && (
        <>
          <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-primary" />
          <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
          <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-primary" />
          <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-primary" />
        </>
      )}
    </div>
  );
}

function getAlignJustify(align?: string): string {
  if (align === "center") return "center";
  if (align === "right") return "flex-end";
  return "flex-start";
}
