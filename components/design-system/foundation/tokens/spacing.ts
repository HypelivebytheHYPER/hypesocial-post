/**
 * Visa 4px Grid System
 * Base unit: 4px (0.25rem)
 */

export const spacing = {
  /* ==================== BASE SPACING ==================== */
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem", // 128px
  40: "10rem", // 160px
  48: "12rem", // 192px
  56: "14rem", // 224px
  64: "16rem", // 256px
} as const;

/* ==================== CONTAINER WIDTHS ==================== */
export const containers = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

/* ==================== BREAKPOINTS ==================== */
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

/* ==================== CSS VARIABLES ==================== */
export const spacingCSSVariables = `
  /* Spacing - 4px grid */
  --v-space-0: ${spacing[0]};
  --v-space-1: ${spacing[1]};
  --v-space-2: ${spacing[2]};
  --v-space-3: ${spacing[3]};
  --v-space-4: ${spacing[4]};
  --v-space-5: ${spacing[5]};
  --v-space-6: ${spacing[6]};
  --v-space-8: ${spacing[8]};
  --v-space-10: ${spacing[10]};
  --v-space-12: ${spacing[12]};
  --v-space-16: ${spacing[16]};
  --v-space-20: ${spacing[20]};
  --v-space-24: ${spacing[24]};
  --v-space-32: ${spacing[32]};

  /* Container widths */
  --v-container-sm: ${containers.sm};
  --v-container-md: ${containers.md};
  --v-container-lg: ${containers.lg};
  --v-container-xl: ${containers.xl};
  --v-container-2xl: ${containers["2xl"]};

  /* Breakpoints */
  --v-breakpoint-sm: ${breakpoints.sm};
  --v-breakpoint-md: ${breakpoints.md};
  --v-breakpoint-lg: ${breakpoints.lg};
  --v-breakpoint-xl: ${breakpoints.xl};
  --v-breakpoint-2xl: ${breakpoints["2xl"]};

  /* Grid gutters */
  --v-gutter: var(--v-space-4);
  --v-gutter-lg: var(--v-space-6);
`;
