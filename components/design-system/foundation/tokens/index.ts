/**
 * Design Tokens - Visa-inspired Foundation
 * Export all tokens for use in components
 */

export { colors, colorCSSVariables } from "./colors";
export { spacing, containers, breakpoints, spacingCSSVariables } from "./spacing";
export { typography, typographyCSSVariables } from "./typography";
export { elevation, elevationCSSVariables } from "./elevation";
export { transitions, zIndex, transitionsCSSVariables } from "./transitions";

import { colorCSSVariables } from "./colors";
import { spacingCSSVariables } from "./spacing";
import { typographyCSSVariables } from "./typography";
import { elevationCSSVariables } from "./elevation";
import { transitionsCSSVariables } from "./transitions";

/* ==================== ALL CSS VARIABLES ==================== */
export const allCSSVariables = `
:root {
  /* Colors */
  ${colorCSSVariables}

  /* Spacing */
  ${spacingCSSVariables}

  /* Typography */
  ${typographyCSSVariables}

  /* Elevation */
  ${elevationCSSVariables}

  /* Transitions */
  ${transitionsCSSVariables}
}
`;
