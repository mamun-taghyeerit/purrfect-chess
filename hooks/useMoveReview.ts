'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Move Review Hook - Enhanced with status tracking
 * 
 * This is a stub implementation that randomly classifies moves.
 * The actual move quality detection logic will be refined later.
 * 
 * Features:
 * - Random classification from 11 available types
 * - Badge display with animation
 * - Status tracking with time and depth updates (matching legacy)
 * - Status update interval (100ms)
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

export interface LastMove {
  from: string;
  to: string;
  san: string;
  color: 'w' | 'b';
}

export interface ReviewStatus {
  remainingTime: number;
  totalTime: number;
  depth: number;
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
const MOVE_REVIEW_ANALYSIS_TIME = 5000; // 5 seconds per position (matching legacy)
const MOVE_REVIEW_UPDATE_INTERVAL = 100; // Update UI every 100ms (matching legacy)

export function useMoveReview() {
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<MoveBadge | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);
  
  const timeoutRefs = useRef<{
    analysis?: NodeJS.Timeout;
    badge?: NodeJS.Timeout;
    statusInterval?: NodeJS.Timeout;
  }>({});
  
  const statusDataRef = useRef<{
    startTime: number;
    currentDepth: number;
  }>({
    startTime: 0,
    currentDepth: 0,
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRefs.current.analysis) {
        clearTimeout(timeoutRefs.current.analysis);
      }
      if (timeoutRefs.current.badge) {
        clearTimeout(timeoutRefs.current.badge);
      }
      if (timeoutRefs.current.statusInterval) {
        clearInterval(timeoutRefs.current.statusInterval);
      }
    };
  }, []);

  /**
   * Update status display (matching legacy updateMoveReviewStatus)
   */
  const updateStatus = useCallback(() => {
    const elapsed = Date.now() - statusDataRef.current.startTime;
    const remaining = Math.max(0, MOVE_REVIEW_ANALYSIS_TIME - elapsed);
    
    setReviewStatus({
      remainingTime: remaining,
      totalTime: MOVE_REVIEW_ANALYSIS_TIME,
      depth: statusDataRef.current.currentDepth,
    });
  }, []);

  /**
   * Review the last move and display a badge
   * Stub implementation: randomly selects a classification
   * Returns the classification type for displaying in a toast
   */
  const reviewLastMove = useCallback((lastMove: LastMove, onComplete?: (classification: MoveClassification) => void) => {
    if (!lastMove) {
      return null;
    }

    setIsReviewing(true);

    // Clear any existing timeouts
    if (timeoutRefs.current.analysis) {
      clearTimeout(timeoutRefs.current.analysis);
    }
    if (timeoutRefs.current.badge) {
      clearTimeout(timeoutRefs.current.badge);
    }
    if (timeoutRefs.current.statusInterval) {
      clearInterval(timeoutRefs.current.statusInterval);
    }

    // Initialize status tracking
    statusDataRef.current.startTime = Date.now();
    statusDataRef.current.currentDepth = 0;

    // Start status update interval
    updateStatus(); // Update immediately
    timeoutRefs.current.statusInterval = setInterval(() => {
      // Simulate depth increasing over time
      statusDataRef.current.currentDepth = Math.min(
        22,
        Math.floor((Date.now() - statusDataRef.current.startTime) / 300)
      );
      updateStatus();
    }, MOVE_REVIEW_UPDATE_INTERVAL);

    // Simulate analysis delay (matching legacy)
    timeoutRefs.current.analysis = setTimeout(() => {
      // Clear status interval
      if (timeoutRefs.current.statusInterval) {
        clearInterval(timeoutRefs.current.statusInterval);
        timeoutRefs.current.statusInterval = undefined;
      }

      // Hide status
      setReviewStatus(null);

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
      timeoutRefs.current.badge = setTimeout(() => {
        setCurrentBadge(null);
      }, BADGE_DISPLAY_TIME);
    }, MOVE_REVIEW_ANALYSIS_TIME);
  }, [updateStatus]);

  const clearBadge = useCallback(() => {
    setCurrentBadge(null);
    if (timeoutRefs.current.badge) {
      clearTimeout(timeoutRefs.current.badge);
      timeoutRefs.current.badge = undefined;
    }
  }, []);

  return {
    isReviewing,
    currentBadge,
    reviewStatus,
    reviewLastMove,
    clearBadge,
  };
}
