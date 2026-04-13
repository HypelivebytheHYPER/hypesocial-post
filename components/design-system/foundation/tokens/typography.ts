/**
 * Visa Typography System
 * Font: Inter (system fallback)
 * Scale: Major Third (1.25) with fine-tuned adjustments
 */

export const typography = {
  /* ==================== FONT FAMILIES ==================== */
  fontFamily: {
    base: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
  },

  /* ==================== FONT SIZES ==================== */
  fontSize: {
    "3xs": "0.625rem", // 10px
    "2xs": "0.6875rem", // 11px
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
    "6xl": "3.75rem", // 60px
  },

  /* ==================== FONT WEIGHTS ==================== */
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  /* ==================== LINE HEIGHTS ==================== */
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  /* ==================== LETTER SPACING ==================== */
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const;

/* ==================== CSS VARIABLES ==================== */
export const typographyCSSVariables = `
  /* Font families */
  --v-font-family-base: ${typography.fontFamily.base};
  --v-font-family-mono: ${typography.fontFamily.mono};

  /* Font sizes */
  --v-font-size-3xs: ${typography.fontSize["3xs"]};
  --v-font-size-2xs: ${typography.fontSize["2xs"]};
  --v-font-size-xs: ${typography.fontSize.xs};
  --v-font-size-sm: ${typography.fontSize.sm};
  --v-font-size-base: ${typography.fontSize.base};
  --v-font-size-lg: ${typography.fontSize.lg};
  --v-font-size-xl: ${typography.fontSize.xl};
  --v-font-size-2xl: ${typography.fontSize["2xl"]};
  --v-font-size-3xl: ${typography.fontSize["3xl"]};
  --v-font-size-4xl: ${typography.fontSize["4xl"]};
  --v-font-size-5xl: ${typography.fontSize["5xl"]};
  --v-font-size-6xl: ${typography.fontSize["6xl"]};

  /* Font weights */
  --v-font-weight-regular: ${typography.fontWeight.regular};
  --v-font-weight-medium: ${typography.fontWeight.medium};
  --v-font-weight-semibold: ${typography.fontWeight.semibold};
  --v-font-weight-bold: ${typography.fontWeight.bold};

  /* Line heights */
  --v-line-height-tight: ${typography.lineHeight.tight};
  --v-line-height-snug: ${typography.lineHeight.snug};
  --v-line-height-normal: ${typography.lineHeight.normal};
  --v-line-height-relaxed: ${typography.lineHeight.relaxed};
  --v-line-height-loose: ${typography.lineHeight.loose};

  /* Letter spacing */
  --v-letter-spacing-tighter: ${typography.letterSpacing.tighter};
  --v-letter-spacing-tight: ${typography.letterSpacing.tight};
  --v-letter-spacing-normal: ${typography.letterSpacing.normal};
  --v-letter-spacing-wide: ${typography.letterSpacing.wide};
  --v-letter-spacing-wider: ${typography.letterSpacing.wider};
  --v-letter-spacing-widest: ${typography.letterSpacing.widest};
`;
