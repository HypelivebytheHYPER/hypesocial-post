/**
 * Visa-inspired Color Tokens
 * Primary: Blue family (Visa brand)
 * Neutral: Slate gray scale
 * Semantic: Status colors
 */

export const colors = {
  /* ==================== PRIMARY - Visa Blue ==================== */
  primary: {
    50: "#f0f5ff",
    100: "#e0ebff",
    200: "#c2d6ff",
    300: "#94b8ff",
    400: "#5c8fff",
    500: "#3b6fd9", // Main brand
    600: "#2d5bb3",
    700: "#1f478a",
    800: "#153363",
    900: "#0c1f3d",
  },

  /* ==================== NEUTRAL - Slate Gray ==================== */
  neutral: {
    0: "#ffffff",
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },

  /* ==================== SEMANTIC - Status Colors ==================== */
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },

  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  info: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
  },
} as const;

/* ==================== CSS VARIABLES FOR GLOBALS.CSS ==================== */
export const colorCSSVariables = `
  /* Primary - Visa Blue */
  --v-color-primary-50: ${colors.primary[50]};
  --v-color-primary-100: ${colors.primary[100]};
  --v-color-primary-200: ${colors.primary[200]};
  --v-color-primary-300: ${colors.primary[300]};
  --v-color-primary-400: ${colors.primary[400]};
  --v-color-primary-500: ${colors.primary[500]};
  --v-color-primary-600: ${colors.primary[600]};
  --v-color-primary-700: ${colors.primary[700]};
  --v-color-primary-800: ${colors.primary[800]};
  --v-color-primary-900: ${colors.primary[900]};

  /* Neutral - Slate */
  --v-color-neutral-0: ${colors.neutral[0]};
  --v-color-neutral-50: ${colors.neutral[50]};
  --v-color-neutral-100: ${colors.neutral[100]};
  --v-color-neutral-200: ${colors.neutral[200]};
  --v-color-neutral-300: ${colors.neutral[300]};
  --v-color-neutral-400: ${colors.neutral[400]};
  --v-color-neutral-500: ${colors.neutral[500]};
  --v-color-neutral-600: ${colors.neutral[600]};
  --v-color-neutral-700: ${colors.neutral[700]};
  --v-color-neutral-800: ${colors.neutral[800]};
  --v-color-neutral-900: ${colors.neutral[900]};
  --v-color-neutral-950: ${colors.neutral[950]};

  /* Semantic - Success */
  --v-color-success-50: ${colors.success[50]};
  --v-color-success-500: ${colors.success[500]};
  --v-color-success-700: ${colors.success[700]};

  /* Semantic - Warning */
  --v-color-warning-50: ${colors.warning[50]};
  --v-color-warning-500: ${colors.warning[500]};
  --v-color-warning-700: ${colors.warning[700]};

  /* Semantic - Error */
  --v-color-error-50: ${colors.error[50]};
  --v-color-error-500: ${colors.error[500]};
  --v-color-error-700: ${colors.error[700]};

  /* Semantic - Info */
  --v-color-info-50: ${colors.info[50]};
  --v-color-info-500: ${colors.info[500]};
  --v-color-info-700: ${colors.info[700]};
`;
