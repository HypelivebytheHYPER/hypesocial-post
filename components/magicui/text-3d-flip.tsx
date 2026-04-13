"use client";

import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface Text3DFlipProps {
  children: string;
  className?: string;
  textClassName?: string;
  flipTextClassName?: string;
  rotateDirection?: "top" | "bottom" | "left" | "right";
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random";
  transition?: Transition;
}

export function Text3DFlip({
  children,
  className,
  textClassName,
  flipTextClassName,
  rotateDirection = "top",
  staggerDuration = 0.03,
  staggerFrom = "first",
  transition = { type: "spring", damping: 25, stiffness: 160 },
}: Text3DFlipProps) {
  const characters = children.split("");

  const getInitialRotate = () => {
    switch (rotateDirection) {
      case "top":
        return { rotateX: 90 };
      case "bottom":
        return { rotateX: -90 };
      case "left":
        return { rotateY: -90 };
      case "right":
        return { rotateY: 90 };
      default:
        return { rotateX: 90 };
    }
  };

  const getStaggerDelay = (index: number) => {
    const totalChars = characters.length;
    switch (staggerFrom) {
      case "first":
        return index * staggerDuration;
      case "last":
        return (totalChars - 1 - index) * staggerDuration;
      case "center": {
        const centerIndex = Math.floor(totalChars / 2);
        return Math.abs(index - centerIndex) * staggerDuration;
      }
      case "random":
        return Math.random() * totalChars * staggerDuration;
      default:
        return index * staggerDuration;
    }
  };

  return (
    <motion.span
      className={cn(
        "relative inline-flex flex-wrap justify-center",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      {characters.map((char, index) => (
        <span
          key={index}
          className="relative inline-block"
          style={{ 
            width: char === " " ? "0.3em" : undefined,
            height: "1.2em",
          }}
        >
          {/* Front text (visible initially) */}
          <motion.span
            className={cn("inline-block", textClassName)}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{
              ...transition,
              delay: getStaggerDelay(index),
            }}
            style={{
              transformOrigin: rotateDirection === "top" ? "bottom" : 
                              rotateDirection === "bottom" ? "top" :
                              rotateDirection === "left" ? "right" : "left",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
          
          {/* Back text (flipped, appears after) */}
          <motion.span
            className={cn("absolute inset-0 inline-block", flipTextClassName)}
            initial={{ 
              opacity: 0,
              ...getInitialRotate(),
            }}
            animate={{ 
              opacity: 1,
              rotateX: 0,
              rotateY: 0,
            }}
            transition={{
              ...transition,
              delay: getStaggerDelay(index),
            }}
            style={{
              backfaceVisibility: "hidden",
              transformOrigin: rotateDirection === "top" ? "bottom" : 
                              rotateDirection === "bottom" ? "top" :
                              rotateDirection === "left" ? "right" : "left",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
