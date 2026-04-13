/**
 * Media Validation Hook
 * @module lib/hooks/use-media-validation
 * 
 * Validates media files against platform constraints before upload.
 * Warns users about potential issues (size, duration, format).
 */

import { useMemo } from "react";
import {
  validateVideoForPlatform,
  getMostRestrictiveVideoConstraints,
  getVideoConstraintsSummary,
  type MediaValidationResult,
} from "@/lib/platform-constraints";

interface UseMediaValidationOptions {
  platforms: string[];
  file?: File | null;
  durationSec?: number;
}

interface UseMediaValidationReturn {
  /** Overall validation result */
  isValid: boolean;
  /** True if there are any violations that will likely cause failure */
  hasViolations: boolean;
  /** True if there are warnings (may work but not optimal) */
  hasWarnings: boolean;
  /** All validation results per platform */
  results: MediaValidationResult[];
  /** Combined violations from all platforms */
  allViolations: string[];
  /** Combined warnings from all platforms */
  allWarnings: string[];
  /** Human-readable summary of constraints */
  constraintsSummary: string;
  /** Most restrictive limits across all selected platforms */
  restrictiveLimits: {
    maxSizeMB: number;
    maxDurationSec: number;
    formats: string[];
    platform: string;
  } | null;
}

/**
 * Validate media against all selected platforms
 * 
 * @example
 * ```tsx
 * const validation = useMediaValidation({
 *   platforms: ["instagram", "tiktok"],
 *   file: videoFile,
 *   durationSec: 65,
 * });
 * 
 * if (validation.hasViolations) {
 *   toast.error(validation.allViolations.join("\n"));
 * }
 * ```
 */
export function useMediaValidation({
  platforms,
  file,
  durationSec,
}: UseMediaValidationOptions): UseMediaValidationReturn {
  const results = useMemo(() => {
    if (!file || platforms.length === 0) {
      return [];
    }
    return platforms.map((platform) =>
      validateVideoForPlatform(file, platform, durationSec)
    );
  }, [file, platforms, durationSec]);

  const restrictiveLimits = useMemo(() => {
    return getMostRestrictiveVideoConstraints(platforms);
  }, [platforms]);

  const constraintsSummary = useMemo(() => {
    return getVideoConstraintsSummary(platforms);
  }, [platforms]);

  const allViolations = useMemo(() => {
    const violations = new Set<string>();
    results.forEach((r) => {
      r.violations.forEach((v) => violations.add(v));
    });
    return Array.from(violations);
  }, [results]);

  const allWarnings = useMemo(() => {
    const warnings = new Set<string>();
    results.forEach((r) => {
      r.warnings.forEach((w) => warnings.add(w));
    });
    return Array.from(warnings);
  }, [results]);

  const hasViolations = allViolations.length > 0;
  const hasWarnings = allWarnings.length > 0;
  const isValid = !hasViolations;

  return {
    isValid,
    hasViolations,
    hasWarnings,
    results,
    allViolations,
    allWarnings,
    constraintsSummary,
    restrictiveLimits,
  };
}

/**
 * Get recommended video settings for selected platforms
 * Returns optimal export settings that work for all selected platforms
 */
export function getRecommendedVideoSettings(platforms: string[]): {
  maxDurationSec: number;
  targetSizeMB: number;
  recommendedFormats: string[];
  aspectRatio: string;
} {
  const constraints = getMostRestrictiveVideoConstraints(platforms);
  
  if (!constraints) {
    return {
      maxDurationSec: 60,
      targetSizeMB: 100,
      recommendedFormats: ["mp4"],
      aspectRatio: "9:16",
    };
  }

  // Use 80% of max size as target for safety
  const targetSizeMB = Math.floor(constraints.maxSizeMB * 0.8);
  
  // Aspect ratio: prioritize 9:16 for Reels/Shorts platforms
  const hasReelsPlatform = platforms.some((p) =>
    ["instagram", "tiktok", "youtube", "facebook"].some((rp) =>
      p.toLowerCase().includes(rp)
    )
  );

  return {
    maxDurationSec: constraints.maxDurationSec,
    targetSizeMB,
    recommendedFormats: constraints.formats,
    aspectRatio: hasReelsPlatform ? "9:16" : "16:9",
  };
}
