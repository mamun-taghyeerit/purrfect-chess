import React, { memo } from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '@/stores/store-setup';

/**
 * EvaluationBar Component
 *
 * Displays a visual evaluation bar showing position advantage.
 * Matches legacy implementation (src/ui.ts lines 959-995, styles.css lines 585-689)
 *
 * Features:
 * - Vertical bar with white (top) and black (bottom) sections
 * - Centipawn score mapped to bar height (-500 to +500 cp → 0% to 100%)
 * - Mate scores shown with full bar
 * - Smooth transitions on score changes
 * - Analyzing animation when engine is running
 * - Concealed mode (blurred backdrop when hidden)
 * 
 * Performance Optimizations:
 * - Uses MobX observer for fine-grained reactivity
 * - Only re-renders when score or state actually changes
 */

export interface EvaluationBarProps {
  /**
   * Evaluation score in centipawns (100 cp = 1 pawn advantage)
   * Positive = white advantage, negative = black advantage
   */
  scoreCp?: number | null;

  /**
   * Mate in N moves
   * Positive = white mates, negative = black mates
   */
  mateIn?: number | null;

  /**
   * Whether the engine is currently analyzing
   */
  isAnalyzing?: boolean;

  /**
   * Current search depth (for display)
   */
  currentDepth?: number;

  /**
   * Maximum search depth (for display)
   */
  maxDepth?: number;

  /**
   * Custom className for styling
   */
  className?: string;
}

const EvaluationBar = observer(function EvaluationBar({
  scoreCp = null,
  mateIn = null,
  isAnalyzing = false,
  currentDepth = 0,
  maxDepth = 22,
  className = '',
}: EvaluationBarProps) {
  const store = useRootStore();
  const isVisible = store.ui.isEvalBarVisible;

  // Calculate bar fill percentage based on score
  // Map -500 to +500 centipawns to 0% to 100%
  // Score is from white's perspective: positive = white advantage
  const calculateFillPercentage = (): number => {
    // Handle mate scores - full bar
    if (mateIn !== null) {
      return mateIn > 0 ? 100 : 0;
    }

    // Handle no score
    if (scoreCp === null || !Number.isFinite(scoreCp)) {
      return 50; // Centered
    }

    // Clamp score to -500 to +500 range
    const clamped = Math.max(-500, Math.min(500, scoreCp));

    // Map to 0-100 percentage (0 = black winning, 100 = white winning)
    return ((clamped + 500) / 1000) * 100;
  };

  // Format score for display
  const formatScore = (): string => {
    if (mateIn !== null) {
      const absMate = Math.abs(mateIn);
      return mateIn > 0 ? `M${absMate}` : `-M${absMate}`;
    }

    if (scoreCp === null || !Number.isFinite(scoreCp)) {
      return '–';
    }

    const pawns = (scoreCp / 100).toFixed(1);
    return scoreCp >= 0 ? `+${pawns}` : pawns;
  };

  // Determine advantage class for styling
  const getAdvantageClass = (): string => {
    if (mateIn !== null) {
      return mateIn > 0 ? 'white-advantage' : 'black-advantage';
    }

    if (scoreCp === null || !Number.isFinite(scoreCp)) {
      return '';
    }

    return scoreCp >= 0 ? 'white-advantage' : 'black-advantage';
  };

  const fillPercentage = calculateFillPercentage();
  const scoreDisplay = formatScore();
  const advantageClass = getAdvantageClass();

  // Determine analyzing class
  const analyzingClass = isAnalyzing && isVisible ? 'analyzing' : '';

  return (
    <div
      className={`eval-bar ${!isVisible ? 'eval-bar-concealed' : ''} ${className}`}
    >
      <div className={`eval-bar-track ${advantageClass} ${analyzingClass}`}>
        <div
          className="eval-bar-fill"
          style={{ height: `${fillPercentage}%` }}
        />
      </div>
      <div className={`eval-bar-score ${advantageClass}`}>{scoreDisplay}</div>

      {/* Depth info (optional, shown when analyzing) */}
      {isVisible && isAnalyzing && currentDepth > 0 && (
        <div className="eval-bar-depth-info">
          <span>d{currentDepth}</span>
          {maxDepth > 0 && <span>/{maxDepth}</span>}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders
  return (
    prevProps.scoreCp === nextProps.scoreCp &&
    prevProps.mateIn === nextProps.mateIn &&
    prevProps.isAnalyzing === nextProps.isAnalyzing &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.currentDepth === nextProps.currentDepth &&
    prevProps.maxDepth === nextProps.maxDepth &&
    prevProps.className === nextProps.className
  );
});

export default EvaluationBar;
