/**
 * TweakCN Theme System
 * Visual Theme Editor for shadcn/ui - Manual Implementation
 * Inspired by https://tweakcn.com
 */

export interface TweakCNTheme {
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    // Chart colors for data visualization
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
    // Sidebar colors
    sidebar: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Theme Presets
export const tweakcnThemes: Record<string, TweakCNTheme> = {
  // Default/Arco - Clean blue professional
  arco: {
    name: "Arco",
    description: "ByteDance's clean professional design system",
    colors: {
      background: "0 0% 100%",
      foreground: "220 15% 12%",
      card: "0 0% 100%",
      cardForeground: "220 15% 12%",
      popover: "0 0% 100%",
      popoverForeground: "220 15% 12%",
      primary: "220 100% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "220 14% 96%",
      secondaryForeground: "220 15% 12%",
      muted: "220 14% 96%",
      mutedForeground: "220 9% 46%",
      accent: "220 14% 96%",
      accentForeground: "220 15% 12%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "220 13% 91%",
      input: "220 13% 91%",
      ring: "220 100% 55%",
      chart1: "220 100% 55%",
      chart2: "160 84% 39%",
      chart3: "38 92% 50%",
      chart4: "280 65% 60%",
      chart5: "340 75% 55%",
      sidebar: "0 0% 98%",
      sidebarForeground: "220 15% 12%",
      sidebarPrimary: "220 100% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "220 14% 96%",
      sidebarAccentForeground: "220 15% 12%",
      sidebarBorder: "220 13% 91%",
      sidebarRing: "220 100% 55%",
    },
    radius: {
      sm: "0.125rem",
      md: "0.25rem",
      lg: "0.5rem",
      xl: "0.75rem",
    },
  },

  // Ocean - Deep blue aquatic
  ocean: {
    name: "Ocean",
    description: "Deep blue aquatic theme with calming gradients",
    colors: {
      background: "210 50% 98%",
      foreground: "222 47% 11%",
      card: "210 50% 98%",
      cardForeground: "222 47% 11%",
      popover: "210 50% 98%",
      popoverForeground: "222 47% 11%",
      primary: "199 89% 48%",
      primaryForeground: "210 50% 98%",
      secondary: "210 40% 96%",
      secondaryForeground: "222 47% 11%",
      muted: "210 40% 96%",
      mutedForeground: "215 16% 47%",
      accent: "188 94% 43%",
      accentForeground: "210 50% 98%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "214 32% 91%",
      input: "214 32% 91%",
      ring: "199 89% 48%",
      chart1: "199 89% 48%",
      chart2: "188 94% 43%",
      chart3: "170 80% 40%",
      chart4: "230 70% 55%",
      chart5: "280 65% 60%",
      sidebar: "210 50% 96%",
      sidebarForeground: "222 47% 11%",
      sidebarPrimary: "199 89% 48%",
      sidebarPrimaryForeground: "210 50% 98%",
      sidebarAccent: "210 40% 92%",
      sidebarAccentForeground: "222 47% 11%",
      sidebarBorder: "214 32% 88%",
      sidebarRing: "199 89% 48%",
    },
    radius: {
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
    },
  },

  // Midnight - Dark elegant purple
  midnight: {
    name: "Midnight",
    description: "Deep dark theme with purple accents",
    colors: {
      background: "240 10% 98%",
      foreground: "240 10% 10%",
      card: "0 0% 100%",
      cardForeground: "240 10% 10%",
      popover: "0 0% 100%",
      popoverForeground: "240 10% 10%",
      primary: "263 70% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "240 5% 96%",
      secondaryForeground: "240 10% 10%",
      muted: "240 5% 96%",
      mutedForeground: "240 5% 45%",
      accent: "270 60% 55%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "240 6% 90%",
      input: "240 6% 90%",
      ring: "263 70% 50%",
      chart1: "263 70% 50%",
      chart2: "280 65% 60%",
      chart3: "220 70% 55%",
      chart4: "340 75% 55%",
      chart5: "30 90% 55%",
      sidebar: "240 10% 96%",
      sidebarForeground: "240 10% 10%",
      sidebarPrimary: "263 70% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "240 5% 92%",
      sidebarAccentForeground: "240 10% 10%",
      sidebarBorder: "240 6% 88%",
      sidebarRing: "263 70% 50%",
    },
    radius: {
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
    },
  },

  // Nature - Fresh green
  nature: {
    name: "Nature",
    description: "Fresh green organic theme",
    colors: {
      background: "120 20% 98%",
      foreground: "142 30% 12%",
      card: "120 20% 98%",
      cardForeground: "142 30% 12%",
      popover: "120 20% 98%",
      popoverForeground: "142 30% 12%",
      primary: "142 76% 36%",
      primaryForeground: "0 0% 100%",
      secondary: "120 15% 95%",
      secondaryForeground: "142 30% 12%",
      muted: "120 15% 95%",
      mutedForeground: "142 20% 45%",
      accent: "150 60% 40%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "130 20% 90%",
      input: "130 20% 90%",
      ring: "142 76% 36%",
      chart1: "142 76% 36%",
      chart2: "150 60% 40%",
      chart3: "100 70% 45%",
      chart4: "180 60% 40%",
      chart5: "80 80% 50%",
      sidebar: "120 20% 96%",
      sidebarForeground: "142 30% 12%",
      sidebarPrimary: "142 76% 36%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "120 15% 92%",
      sidebarAccentForeground: "142 30% 12%",
      sidebarBorder: "130 20% 88%",
      sidebarRing: "142 76% 36%",
    },
    radius: {
      sm: "0.5rem",
      md: "0.75rem",
      lg: "1rem",
      xl: "1.25rem",
    },
  },

  // Sunset - Warm orange/pink
  sunset: {
    name: "Sunset",
    description: "Warm sunset gradient theme",
    colors: {
      background: "30 30% 98%",
      foreground: "20 30% 12%",
      card: "30 30% 98%",
      cardForeground: "20 30% 12%",
      popover: "30 30% 98%",
      popoverForeground: "20 30% 12%",
      primary: "25 95% 53%",
      primaryForeground: "0 0% 100%",
      secondary: "30 20% 95%",
      secondaryForeground: "20 30% 12%",
      muted: "30 20% 95%",
      mutedForeground: "20 20% 45%",
      accent: "340 75% 55%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "30 20% 90%",
      input: "30 20% 90%",
      ring: "25 95% 53%",
      chart1: "25 95% 53%",
      chart2: "340 75% 55%",
      chart3: "35 90% 55%",
      chart4: "280 65% 60%",
      chart5: "160 84% 39%",
      sidebar: "30 30% 96%",
      sidebarForeground: "20 30% 12%",
      sidebarPrimary: "25 95% 53%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "30 20% 92%",
      sidebarAccentForeground: "20 30% 12%",
      sidebarBorder: "30 20% 88%",
      sidebarRing: "25 95% 53%",
    },
    radius: {
      sm: "0.5rem",
      md: "0.75rem",
      lg: "1rem",
      xl: "1.25rem",
    },
  },

  // Mono - Clean monochrome
  mono: {
    name: "Mono",
    description: "Clean monochrome minimal theme",
    colors: {
      background: "0 0% 100%",
      foreground: "0 0% 9%",
      card: "0 0% 100%",
      cardForeground: "0 0% 9%",
      popover: "0 0% 100%",
      popoverForeground: "0 0% 9%",
      primary: "0 0% 9%",
      primaryForeground: "0 0% 98%",
      secondary: "0 0% 96%",
      secondaryForeground: "0 0% 9%",
      muted: "0 0% 96%",
      mutedForeground: "0 0% 45%",
      accent: "0 0% 96%",
      accentForeground: "0 0% 9%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 98%",
      border: "0 0% 90%",
      input: "0 0% 90%",
      ring: "0 0% 9%",
      chart1: "0 0% 25%",
      chart2: "0 0% 40%",
      chart3: "0 0% 55%",
      chart4: "0 0% 70%",
      chart5: "0 0% 85%",
      sidebar: "0 0% 98%",
      sidebarForeground: "0 0% 9%",
      sidebarPrimary: "0 0% 9%",
      sidebarPrimaryForeground: "0 0% 98%",
      sidebarAccent: "0 0% 94%",
      sidebarAccentForeground: "0 0% 9%",
      sidebarBorder: "0 0% 88%",
      sidebarRing: "0 0% 9%",
    },
    radius: {
      sm: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
    },
  },
};

export type TweakCNThemeName = keyof typeof tweakcnThemes;

/**
 * Get a theme by name
 */
export function getTweakCNTheme(themeName: TweakCNThemeName): TweakCNTheme | undefined {
  return tweakcnThemes[themeName];
}

/**
 * Generate CSS variables for a theme
 */
export function generateTweakCNCSS(themeName: TweakCNThemeName): string {
  const theme = tweakcnThemes[themeName];
  if (!theme) return "";

  const vars = Object.entries(theme.colors)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      return `    --${cssKey}: ${value};`;
    })
    .join("\n");

  const radiusVars = Object.entries(theme.radius)
    .map(([key, value]) => `    --radius-${key}: ${value};`)
    .join("\n");

  return `
@layer base {
  :root {
${vars}
${radiusVars}
  }
}
  `.trim();
}

/**
 * Apply theme CSS directly to document
 */
export function applyTweakCNThemeToDocument(themeName: TweakCNThemeName): void {
  if (typeof document === "undefined") return;

  const theme = tweakcnThemes[themeName];
  if (!theme) return;

  // Remove existing tweakcn styles
  const existing = document.getElementById("tweakcn-theme");
  if (existing) existing.remove();

  // Create new style element
  const style = document.createElement("style");
  style.id = "tweakcn-theme";

  const vars = Object.entries(theme.colors)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      return `      --${cssKey}: ${value};`;
    })
    .join("\n");

  const radiusVars = Object.entries(theme.radius)
    .map(([key, value]) => `      --radius-${key}: ${value};`)
    .join("\n");

  style.textContent = `
@layer base {
  :root {
${vars}
${radiusVars}
  }
}
  `;

  document.head.appendChild(style);
}

/**
 * Clear applied theme
 */
export function clearTweakCNTheme(): void {
  if (typeof document === "undefined") return;
  const existing = document.getElementById("tweakcn-theme");
  if (existing) existing.remove();
}

/**
 * Get all available themes
 */
export function getAvailableThemes(): { name: TweakCNThemeName; label: string; description: string }[] {
  return Object.entries(tweakcnThemes).map(([key, theme]) => ({
    name: key as TweakCNThemeName,
    label: theme.name,
    description: theme.description,
  }));
}

/**
 * Get theme preview colors (for UI swatches)
 */
export function getThemePreviewColors(themeName: TweakCNThemeName): {
  primary: string;
  secondary: string;
  accent: string;
} {
  const theme = tweakcnThemes[themeName];
  if (!theme) return { primary: "#000", secondary: "#666", accent: "#999" };

  // Convert HSL to hex for preview
  const hslToHex = (hsl: string): string => {
    const [h = 0, s = 0, l = 0] = hsl.split(" ").map((v) => parseFloat(v));
    const sPercent = s / 100;
    const lPercent = l / 100;
    const c = (1 - Math.abs(2 * lPercent - 1)) * sPercent;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lPercent - c / 2;

    let r: number, g: number, b: number;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  return {
    primary: hslToHex(theme.colors.primary),
    secondary: hslToHex(theme.colors.secondary),
    accent: hslToHex(theme.colors.accent),
  };
}
