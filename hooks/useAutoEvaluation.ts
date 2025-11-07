'use client';

import { useEffect, useRef } from 'react';
import { reaction } from 'mobx';
import { useRootStore } from '@/stores/store-setup';

/**
 * Auto-evaluation hook
 *
 * Automatically starts/stops engine analysis based on eval bar visibility and position changes.
 * This ensures the eval bar works independently of the engine panel.
 *
 * Uses MobX reaction to avoid re-render loops with reactive dependencies.
 *
 * Behavior:
 * - Starts analysis when eval bar becomes visible
 * - Restarts analysis when position changes (FEN changes) if eval bar is visible
 * - Stops analysis when eval bar is hidden (optional, to save resources)
 */

interface UseAutoEvaluationOptions {
  /** Function to start engine analysis */
  startAnalysis: (fen: string, depth?: number, multipv?: number) => void;

  /** Function to stop engine analysis */
  stopAnalysis: () => void;

  /** Whether the engine is ready */
  isEngineReady: boolean;

  /** Default depth for auto-evaluation (default: 15) */
  depth?: number;
}

export function useAutoEvaluation({
  startAnalysis,
  stopAnalysis,
  isEngineReady,
  depth = 15,
}: UseAutoEvaluationOptions) {
  const store = useRootStore();

  // Track the last FEN that was analyzed to avoid re-analyzing the same position
  const lastAnalyzedFenRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Use MobX reaction to watch for changes without causing re-render loops
    const dispose = reaction(
      // Track: what to observe (DO NOT track isAnalyzing here to avoid loops)
      () => ({
        shouldAutoEvaluate:
          isEngineReady &&
          (store.ui.isEvalBarVisible || store.ui.isEnginePanelVisible),
        currentFen: store.game.fen,
        isEvalBarVisible: store.ui.isEvalBarVisible,
        isEnginePanelVisible: store.ui.isEnginePanelVisible,
      }),
      // Effect: what to do when values change
      ({
        shouldAutoEvaluate,
        currentFen,
        isEvalBarVisible,
        isEnginePanelVisible,
      }) => {
        // Clear any pending analysis
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Stop analysis if eval bar and engine panel are both hidden
        if (!isEvalBarVisible && !isEnginePanelVisible) {
          // Only stop if we were auto-analyzing (check if last FEN matches)
          if (lastAnalyzedFenRef.current && store.engine.isAnalyzing) {
            stopAnalysis();
          }
          lastAnalyzedFenRef.current = '';
          return;
        }

        // Only auto-evaluate if conditions are met
        if (!shouldAutoEvaluate) {
          return;
        }

        // Skip if we're already analyzing this exact position
        if (currentFen === lastAnalyzedFenRef.current) {
          return;
        }

        // Update last analyzed FEN
        lastAnalyzedFenRef.current = currentFen;

        // Stop previous analysis if running
        if (store.engine.isAnalyzing) {
          stopAnalysis();
        }

        // Small delay to ensure previous analysis has stopped
        timeoutRef.current = setTimeout(() => {
          // Multi-PV = 1 for eval bar (only need best move)
          // Engine panel can request multi-PV = 3 separately if needed
          startAnalysis(currentFen, depth, 1);
          timeoutRef.current = null;
        }, 150);
      },
      {
        // Fire immediately on mount
        fireImmediately: true,
        // Delay to debounce rapid changes
        delay: 100,
      }
    );

    // Cleanup on unmount
    return () => {
      dispose();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [startAnalysis, stopAnalysis, isEngineReady, depth, store]);

  return {
    // No return values needed - this hook only manages side effects
  };
}
