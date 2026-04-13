/**
 * Visa Elevation System
 * 5 levels of shadow depth
 */

export const elevation = {
  /* ==================== SHADOWS ==================== */
  shadow: {
    none: "none",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  },

  /* ==================== BORDER RADIUS ==================== */
  radius: {
    none: "0",
    sm: "0.125rem", // 2px
    md: "0.25rem", // 4px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    "3xl": "1.5rem", // 24px
    full: "9999px",
  },
} as const;

/* ==================== CSS VARIABLES ==================== */
export const elevationCSSVariables = `
  /* Shadows */
  --v-shadow-none: ${elevation.shadow.none};
  --v-shadow-sm: ${elevation.shadow.sm};
  --v-shadow-md: ${elevation.shadow.md};
  --v-shadow-lg: ${elevation.shadow.lg};
  --v-shadow-xl: ${elevation.shadow.xl};
  --v-shadow-2xl: ${elevation.shadow["2xl"]};
  --v-shadow-inner: ${elevation.shadow.inner};

  /* Border radius */
  --v-radius-none: ${elevation.radius.none};
  --v-radius-sm: ${elevation.radius.sm};
  --v-radius-md: ${elevation.radius.md};
  --v-radius-lg: ${elevation.radius.lg};
  --v-radius-xl: ${elevation.radius.xl};
  --v-radius-2xl: ${elevation.radius["2xl"]};
  --v-radius-3xl: ${elevation.radius["3xl"]};
  --v-radius-full: ${elevation.radius.full};
`;
