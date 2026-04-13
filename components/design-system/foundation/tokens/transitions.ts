/**
 * Visa Transitions & Animation Tokens
 */

export const transitions = {
  /* ==================== DURATIONS ==================== */
  duration: {
    instant: "0ms",
    fast: "150ms",
    normal: "250ms",
    slow: "350ms",
    slower: "500ms",
  },

  /* ==================== EASINGS ==================== */
  easing: {
    linear: "linear",
    ease: "ease",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
} as const;

/* ==================== Z-INDEX SCALE ==================== */
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
} as const;

/* ==================== CSS VARIABLES ==================== */
export const transitionsCSSVariables = `
  /* Durations */
  --v-duration-instant: ${transitions.duration.instant};
  --v-duration-fast: ${transitions.duration.fast};
  --v-duration-normal: ${transitions.duration.normal};
  --v-duration-slow: ${transitions.duration.slow};
  --v-duration-slower: ${transitions.duration.slower};

  /* Easings */
  --v-easing-linear: ${transitions.easing.linear};
  --v-easing-ease: ${transitions.easing.ease};
  --v-easing-ease-in: ${transitions.easing.easeIn};
  --v-easing-ease-out: ${transitions.easing.easeOut};
  --v-easing-ease-in-out: ${transitions.easing.easeInOut};
  --v-easing-spring: ${transitions.easing.spring};

  /* Z-index */
  --v-z-base: ${zIndex.base};
  --v-z-dropdown: ${zIndex.dropdown};
  --v-z-sticky: ${zIndex.sticky};
  --v-z-fixed: ${zIndex.fixed};
  --v-z-modal-backdrop: ${zIndex.modalBackdrop};
  --v-z-modal: ${zIndex.modal};
  --v-z-popover: ${zIndex.popover};
  --v-z-tooltip: ${zIndex.tooltip};
`;
