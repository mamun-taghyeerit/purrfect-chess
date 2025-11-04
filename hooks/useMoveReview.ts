'use client';

import { useState, useCallback } from 'react';

/**
 * Move Review Hook - Simplified stub implementation
 * 
 * This is a stub implementation that randomly classifies moves.
 * The actual move quality detection logic will be refined later.
 * 
 * Features:
 * - Random classification from 11 available types
 * - Badge display with animation
 * - Status tracking
 */

export type MoveClassification =
  | 'forced'
  | 'great'
  | 'book'
  | 'best'
  | 'brilliant'
  | 'miss'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface MoveBadge {
  type: MoveClassification;
  square: string;
}

const MOVE_TYPES: MoveClassification[] = [
  'forced',
  'great',
  'book',
  'best',
  'brilliant',
  'miss',
  'excellent',
  'good',
  'inaccuracy',
  'mistake',
  'blunder',
];

const BADGE_DISPLAY_TIME = 4000; // 4 seconds

export function useMoveReview() {
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<MoveBadge | null>(null);

  /**
   * Review the last move and display a badge
   * Stub implementation: randomly selects a classification
   * Returns the classification type for displaying in a toast
   */
  const reviewLastMove = useCallback((lastMove: any, onComplete?: (classification: MoveClassification) => void) => {
    if (!lastMove) {
      return null;
    }

    setIsReviewing(true);

    // Simulate analysis delay
    setTimeout(() => {
      // Stub: Random classification
      const randomIndex = Math.floor(Math.random() * MOVE_TYPES.length);
      const classification = MOVE_TYPES[randomIndex];

      const badge: MoveBadge = {
        type: classification,
        square: lastMove.to,
      };

      setCurrentBadge(badge);
      setIsReviewing(false);

      // Call completion callback with classification
      if (onComplete) {
        onComplete(classification);
      }

      // Auto-clear badge after display time
      setTimeout(() => {
        setCurrentBadge(null);
      }, BADGE_DISPLAY_TIME);
    }, 500);
  }, []);

  const clearBadge = useCallback(() => {
    setCurrentBadge(null);
  }, []);

  return {
    isReviewing,
    currentBadge,
    reviewLastMove,
    clearBadge,
  };
}
