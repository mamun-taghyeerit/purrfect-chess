/**
 * Layout Constants for Purrfect Chess
 *
 * Centralized layout values to prevent "magic numbers" and ensure consistency
 * across components. These constants define the fixed dimensions that prevent
 * layout shift issues.
 *
 * See: docs/ARCHITECTURE_REFACTORING_PLAN.md for rationale
 */

export const LAYOUT = {
  /**
   * Fixed width for control panels (left and right)
   * This prevents layout shift when content changes (e.g., move history updates)
   */
  PANEL_WIDTH: 320,

  /**
   * Maximum width for the board
   * Board is responsive up to this size
   */
  BOARD_MAX_SIZE: 600,

  /**
   * Gap between major layout sections
   */
  GAP: 20,

  /**
   * Maximum container width for the entire app
   */
  MAX_CONTAINER_WIDTH: 1260,

  /**
   * Breakpoint for extra-large screens (matches Tailwind's xl)
   */
  BREAKPOINT_XL: 1280,
} as const;

/**
 * Color palette used throughout the app
 * Extracted from inline styles for consistency
 */
export const COLORS = {
  background: {
    main: '#333',
    panel: '#444',
    input: '#2b2b2b',
    card: '#3f3f3f',
  },
  border: {
    primary: '#555',
    secondary: '#5f5f5f',
  },
  text: {
    primary: '#f0f0f0',
    secondary: '#e0e0e0',
    muted: '#777',
    code: '#f3f4ff',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #e66465, #9198e5)',
    primaryReverse: 'linear-gradient(135deg, #9198e5, #e66465)',
  },
  shadow: {
    inset: 'inset 0 2px 6px rgba(0, 0, 0, 0.35)',
  },
} as const;

/**
 * Type helpers for layout constants
 */
export type LayoutConstants = typeof LAYOUT;
export type ColorConstants = typeof COLORS;
