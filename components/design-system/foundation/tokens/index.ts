/**
 * Design Tokens - Visa-inspired Foundation
 * Export all tokens for use in components
 */

export { colors, colorCSSVariables } from "./colors";
export { spacing, containers, breakpoints, spacingCSSVariables } from "./spacing";
export { typography, typographyCSSVariables } from "./typography";
export { elevation, elevationCSSVariables } from "./elevation";
export { transitions, zIndex, transitionsCSSVariables } from "./transitions";

/* ==================== ALL CSS VARIABLES ==================== */
export const allCSSVariables = `
:root {
  /* Colors */
  ${require("./colors").colorCSSVariables}

  /* Spacing */
  ${require("./spacing").spacingCSSVariables}

  /* Typography */
  ${require("./typography").typographyCSSVariables}

  /* Elevation */
  ${require("./elevation").elevationCSSVariables}

  /* Transitions */
  ${require("./transitions").transitionsCSSVariables}
}
`;
