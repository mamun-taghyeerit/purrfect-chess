/**
 * Shared TypeScript types for the Next.js chess application
 */

export interface TimeControl {
  minutes: number;
  increment: number;
}

export interface Position {
  [square: string]: { type: string; color: string } | null | string;
}

export interface Move {
  san: string;
  from: string;
  to: string;
  color: string;
  piece: string;
}
