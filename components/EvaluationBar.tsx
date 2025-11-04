import React from 'react';

/**
 * EvaluationBar Component
 *
 * Purpose: Display a visual evaluation bar showing position advantage.
 *
 * Status: STUB - Props defined, rendering not implemented.
 *
 * Phase X Task: Wire this component into the main page and implement rendering.
 *
 * Design:
 * - Vertical bar on left/right side of board
 * - White advantage: bar extends upward
 * - Black advantage: bar extends downward
 * - Even position: bar centered
 * - Mate scores: full bar with "M" indicator
 *
 * TODO (Phase X):
 * 1. Implement visual bar rendering (SVG or CSS)
 * 2. Convert centipawn score to bar height (-1000 to +1000 cp → 0% to 100%)
 * 3. Handle mate scores (show "M5" for mate in 5, etc.)
 * 4. Add smooth transitions when evaluation changes
 * 5. Match legacy app visual style
 * 6. Add to main page layout (likely next to Board component)
 */

export interface EvaluationBarProps {
  /**
   * Evaluation score in centipawns (100 cp = 1 pawn advantage)
   * Positive = white advantage, negative = black advantage
   * Range typically -1000 to +1000 (beyond is winning/lost)
   */
  scoreCp?: number;

  /**
   * Mate in N moves
   * Positive = white mates, negative = black mates
   * null = no mate detected
   */
  mateIn?: number | null;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Width of the evaluation bar in pixels
   * @default 24
   */
  width?: number;

  /**
   * Height of the evaluation bar in pixels
   * Should match board height
   * @default 512
   */
  height?: number;
}

export default function EvaluationBar(_props: EvaluationBarProps) {
  // TODO(Phase X): Implement evaluation bar rendering
  //
  // const {
  //   scoreCp = 0,
  //   mateIn = null,
  //   className = '',
  //   width = 24,
  //   height = 512,
  // } = _props;
  //
  // Calculate bar fill percentage:
  // - scoreCp = 0 → 50% (centered)
  // - scoreCp = +1000 → 100% (white winning)
  // - scoreCp = -1000 → 0% (black winning)
  // - mateIn > 0 → 100% with "M{n}" label
  // - mateIn < 0 → 0% with "M{n}" label
  //
  // Render SVG or styled div with:
  // - White section (top half)
  // - Black section (bottom half)
  // - Divider line at 50%
  // - Smooth transition on score change
  //
  // Example structure:
  // <div className={`evaluation-bar ${className}`} style={{ width, height }}>
  //   <div className="white-section" style={{ height: `${whitePercent}%` }}>
  //     {mateIn > 0 && <span>M{mateIn}</span>}
  //   </div>
  //   <div className="black-section" style={{ height: `${blackPercent}%` }}>
  //     {mateIn < 0 && <span>M{Math.abs(mateIn)}</span>}
  //   </div>
  // </div>

  return null;
}
