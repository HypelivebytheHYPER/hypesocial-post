"use client";

import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragMoveEvent } from "@dnd-kit/core";
import { useBuilderStore } from "./store";
import { useRef } from "react";

const SNAP_THRESHOLD_PX = 8;

function getSnapGuides(
  movingLayer: { x: number; y: number; width: number; height: number },
  deltaXPercent: number,
  deltaYPercent: number,
  otherLayers: Array<{ x: number; y: number; width: number; height: number }>,
  artboardWidth: number,
  artboardHeight: number
): { x: number | null; y: number | null; newX: number; newY: number } {
  const newX = movingLayer.x + deltaXPercent;
  const newY = movingLayer.y + deltaYPercent;

  const left = newX;
  const right = newX + movingLayer.width;
  const center = newX + movingLayer.width / 2;
  const top = newY;
  const bottom = newY + movingLayer.height;
  const middle = newY + movingLayer.height / 2;

  const thresholds = {
    x: SNAP_THRESHOLD_PX / artboardWidth * 100,
    y: SNAP_THRESHOLD_PX / artboardHeight * 100,
  };

  let snapX: number | null = null;
  let snapY: number | null = null;
  let finalX = newX;
  let finalY = newY;

  // Candidate lines
  const xCandidates: number[] = [0, 50, 100];
  const yCandidates: number[] = [0, 50, 100];

  for (const l of otherLayers) {
    xCandidates.push(l.x, l.x + l.width / 2, l.x + l.width);
    yCandidates.push(l.y, l.y + l.height / 2, l.y + l.height);
  }

  // Find best X snap
  for (const c of xCandidates) {
    if (Math.abs(left - c) <= thresholds.x) {
      snapX = c;
      finalX = c;
      break;
    }
    if (Math.abs(center - c) <= thresholds.x) {
      snapX = c;
      finalX = c - movingLayer.width / 2;
      break;
    }
    if (Math.abs(right - c) <= thresholds.x) {
      snapX = c;
      finalX = c - movingLayer.width;
      break;
    }
  }

  // Find best Y snap
  for (const c of yCandidates) {
    if (Math.abs(top - c) <= thresholds.y) {
      snapY = c;
      finalY = c;
      break;
    }
    if (Math.abs(middle - c) <= thresholds.y) {
      snapY = c;
      finalY = c - movingLayer.height / 2;
      break;
    }
    if (Math.abs(bottom - c) <= thresholds.y) {
      snapY = c;
      finalY = c - movingLayer.height;
      break;
    }
  }

  return {
    x: snapX,
    y: snapY,
    newX: Math.max(0, Math.min(100 - movingLayer.width, finalX)),
    newY: Math.max(0, Math.min(100 - movingLayer.height, finalY)),
  };
}

export function SocialDndProvider({ children }: { children: React.ReactNode }) {
  const { layers, moveLayer, setSnapGuides, clearSnapGuides } = useBuilderStore();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragMove(event: DragMoveEvent) {
    const { active, delta } = event;
    const layerId = active.id as string;
    const artboard = document.getElementById("social-artboard");
    if (!artboard) return;

    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.type === "background") return;

    const rect = artboard.getBoundingClientRect();
    const deltaXPercent = (delta.x / rect.width) * 100;
    const deltaYPercent = (delta.y / rect.height) * 100;

    const otherLayers = layers.filter((l) => l.id !== layerId);
    const { x, y } = getSnapGuides(
      layer,
      deltaXPercent,
      deltaYPercent,
      otherLayers,
      rect.width,
      rect.height
    );

    setSnapGuides({ x, y });
  }

  function handleDragEnd(event: DragEndEvent) {
    clearSnapGuides();
    const { active, delta } = event;
    const layerId = active.id as string;
    const artboard = document.getElementById("social-artboard");
    if (!artboard) return;

    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.type === "background") return;

    const rect = artboard.getBoundingClientRect();
    const deltaXPercent = (delta.x / rect.width) * 100;
    const deltaYPercent = (delta.y / rect.height) * 100;

    const otherLayers = layers.filter((l) => l.id !== layerId);
    const { newX, newY } = getSnapGuides(
      layer,
      deltaXPercent,
      deltaYPercent,
      otherLayers,
      rect.width,
      rect.height
    );

    moveLayer(layerId, newX, newY);
  }

  return (
    <DndContext sensors={sensors} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  );
}
