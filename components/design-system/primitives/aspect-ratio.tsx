/**
 * Aspect Ratio Component
 * Maintains consistent aspect ratios for media containers
 */

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const aspectRatioVariants = cva("relative w-full overflow-hidden", {
  variants: {
    ratio: {
      "1:1": "aspect-square", // 1:1 - Instagram Feed, X, Facebook
      "4:5": "aspect-[4/5]", // 4:5 - Instagram Portrait
      "9:16": "aspect-[9/16]", // 9:16 - Stories, Reels, TikTok
      "16:9": "aspect-video", // 16:9 - YouTube, LinkedIn
      "3:2": "aspect-[3/2]", // 3:2 - Photography
      "2:3": "aspect-[2/3]", // 2:3 - Pinterest
      "21:9": "aspect-[21/9]", // 21:9 - Cinematic
      "1.91:1": "aspect-[1.91/1]", // LinkedIn optimal
      "auto": "", // Auto - use dimensions from content
    },
    fit: {
      cover: "[&>*]:object-cover",
      contain: "[&>*]:object-contain",
      fill: "[&>*]:object-fill",
      none: "[&>*]:object-none",
    },
    rounded: {
      none: "",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    ratio: "1:1",
    fit: "cover",
    rounded: "xl",
  },
});

export interface AspectRatioProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof aspectRatioVariants> {
  /** Custom ratio as number (width / height) */
  customRatio?: number;
}

const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  (
    { className, ratio, customRatio, fit, rounded, children, style, ...props },
    ref
  ) => {
    const customStyle = customRatio
      ? { aspectRatio: `${customRatio}`, ...style }
      : style;

    return (
      <div
        ref={ref}
        className={cn(aspectRatioVariants({ ratio, fit, rounded }), className)}
        style={customStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AspectRatio.displayName = "AspectRatio";

/* ==================== PLATFORM-SPECIFIC PRESETS ==================== */

export interface PlatformRatioConfig {
  ratio: AspectRatioProps["ratio"];
  label: string;
  platforms: string[];
}

export const PLATFORM_RATIOS: Record<string, PlatformRatioConfig> = {
  // Instagram
  "instagram:feed": { ratio: "1:1", label: "Square", platforms: ["instagram"] },
  "instagram:portrait": { ratio: "4:5", label: "Portrait", platforms: ["instagram"] },
  "instagram:reels": { ratio: "9:16", label: "Reels", platforms: ["instagram"] },
  "instagram:stories": { ratio: "9:16", label: "Stories", platforms: ["instagram"] },
  
  // Facebook
  "facebook:feed": { ratio: "1:1", label: "Square", platforms: ["facebook"] },
  "facebook:video": { ratio: "16:9", label: "Video", platforms: ["facebook"] },
  
  // X / Twitter
  "x:feed": { ratio: "1:1", label: "Square", platforms: ["x", "twitter"] },
  "x:video": { ratio: "16:9", label: "Video", platforms: ["x", "twitter"] },
  
  // TikTok
  "tiktok:video": { ratio: "9:16", label: "Video", platforms: ["tiktok", "tiktok_business"] },
  
  // YouTube
  "youtube:video": { ratio: "16:9", label: "Video", platforms: ["youtube"] },
  "youtube:shorts": { ratio: "9:16", label: "Shorts", platforms: ["youtube"] },
  
  // Pinterest
  "pinterest:pin": { ratio: "2:3", label: "Standard Pin", platforms: ["pinterest"] },
  
  // LinkedIn
  "linkedin:feed": { ratio: "1.91:1", label: "Feed", platforms: ["linkedin"] },
  "linkedin:video": { ratio: "16:9", label: "Video", platforms: ["linkedin"] },
};

/* ==================== SMART ASPECT RATIO ==================== */

export interface SmartAspectRatioProps extends Omit<AspectRatioProps, "ratio"> {
  /** Detect ratio from media dimensions */
  src?: { width?: number; height?: number };
  /** Fallback ratio if dimensions not available */
  fallbackRatio?: AspectRatioProps["ratio"];
  /** Target platforms to optimize for */
  platforms?: string[];
}

/**
 * Check if media matches platform requirements
 * Returns warnings if dimensions don't match
 */
function checkPlatformCompatibility(
  width: number,
  height: number,
  platforms: string[]
): { valid: boolean; warnings: string[]; recommendedRatio: AspectRatioProps["ratio"] } {
  const aspect = width / height;
  const warnings: string[] = [];
  let recommendedRatio: AspectRatioProps["ratio"] = "1:1";

  // Platform requirements
  // Platform requirements - strict vs flexible
  const strictPlatforms: Record<string, { aspect: number; ratio: AspectRatioProps["ratio"]; name: string }> = {
    youtube: { aspect: 1.777, ratio: "16:9", name: "YouTube" },
    pinterest: { aspect: 0.666, ratio: "2:3", name: "Pinterest" },
    instagram_reels: { aspect: 0.5625, ratio: "9:16", name: "Instagram Reels" },
    instagram_stories: { aspect: 0.5625, ratio: "9:16", name: "Instagram Stories" },
  };

  // Flexible platforms support multiple ratios
  const flexiblePlatforms: Record<string, { 
    supported: Array<{ min: number; max: number; ratio: AspectRatioProps["ratio"]; label: string }>;
    recommended: AspectRatioProps["ratio"];
    name: string;
  }> = {
    tiktok: {
      supported: [
        { min: 0.5, max: 0.7, ratio: "9:16", label: "9:16 (recommended)" },
        { min: 0.9, max: 1.1, ratio: "1:1", label: "1:1" },
        { min: 1.6, max: 1.9, ratio: "16:9", label: "16:9" },
      ],
      recommended: "9:16",
      name: "TikTok",
    },
    tiktok_business: {
      supported: [
        { min: 0.5, max: 0.7, ratio: "9:16", label: "9:16 (recommended)" },
        { min: 0.9, max: 1.1, ratio: "1:1", label: "1:1" },
        { min: 1.6, max: 1.9, ratio: "16:9", label: "16:9" },
      ],
      recommended: "9:16",
      name: "TikTok Business",
    },
  };

  for (const platform of platforms) {
    // Check strict platforms
    const strict = strictPlatforms[platform];
    if (strict) {
      recommendedRatio = strict.ratio;
      const tolerance = 0.1;
      if (Math.abs(aspect - strict.aspect) > tolerance) {
        warnings.push(
          `${strict.name} works best with ${strict.ratio} aspect ratio. Your media is ${aspect.toFixed(2)}:1 and may be cropped.`
        );
      }
      continue;
    }

    // Check flexible platforms
    const flexible = flexiblePlatforms[platform];
    if (flexible) {
      const match = flexible.supported.find(r => aspect >= r.min && aspect <= r.max);
      if (match) {
        recommendedRatio = match.ratio;
      } else {
        // No match - use recommended and warn
        recommendedRatio = flexible.recommended;
        warnings.push(
          `${flexible.name} recommends ${flexible.supported.map(r => r.label).join(", ")}. Your media is ${aspect.toFixed(2)}:1 and will be adapted.`
        );
      }
    }
  }

  return { valid: warnings.length === 0, warnings, recommendedRatio };
}

/**
 * Smart aspect ratio that detects from image dimensions
 * AND considers platform requirements
 * 
 * Logic:
 * 1. If platforms with STRICT requirements: use platform-required ratio
 * 2. If platforms with FLEXIBLE support (like TikTok): auto-detect from image, warn if non-optimal
 * 3. If no platforms: auto-detect from image dimensions
 */
function SmartAspectRatio({
  src,
  fallbackRatio = "1:1",
  platforms,
  ...props
}: SmartAspectRatioProps) {
  let ratio: AspectRatioProps["ratio"] = fallbackRatio;

  // Helper to detect ratio from dimensions
  const detectRatio = (width: number, height: number): AspectRatioProps["ratio"] => {
    const aspect = width / height;
    if (aspect >= 0.95 && aspect <= 1.05) return "1:1";
    if (aspect >= 0.65 && aspect < 0.95) return "4:5";
    if (aspect < 0.65) return "9:16";
    if (aspect > 1.05 && aspect <= 1.3) return "1.91:1";
    if (aspect > 1.3 && aspect <= 1.9) return "16:9";
    if (aspect > 1.9) return "21:9";
    return fallbackRatio;
  };

  // STRICT platforms - force specific ratio
  const strictPlatforms = ["youtube", "pinterest", "instagram_reels", "instagram_stories"];
  const hasStrictPlatform = platforms?.some(p => strictPlatforms.includes(p));
  
  // FLEXIBLE platforms - support multiple ratios
  const flexiblePlatforms = ["tiktok", "tiktok_business"];
  const hasFlexiblePlatform = platforms?.some(p => flexiblePlatforms.includes(p));

  if (platforms && platforms.length > 0) {
    if (hasStrictPlatform) {
      // Strict platforms force their ratio
      if (platforms.includes("youtube")) ratio = "16:9";
      else if (platforms.includes("pinterest")) ratio = "2:3";
      else if (platforms.some(p => p.includes("reels") || p.includes("stories"))) ratio = "9:16";
    } else if (hasFlexiblePlatform && src?.width && src?.height) {
      // Flexible platforms - use image's natural ratio (TikTok handles conversion)
      ratio = detectRatio(src.width, src.height);
    } else if (src?.width && src?.height) {
      // Other platforms with image dimensions
      ratio = detectRatio(src.width, src.height);
    }
  } else if (src?.width && src?.height) {
    // No platforms - pure auto-detect
    ratio = detectRatio(src.width, src.height);
  }

  return <AspectRatio ratio={ratio} {...props} />;
}

export { AspectRatio, SmartAspectRatio, aspectRatioVariants, checkPlatformCompatibility };
