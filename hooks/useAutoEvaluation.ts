'use client';

import { useEffect, useRef } from 'react';
import { useRootStore } from '@/stores/store-setup';

/**
 * Auto-evaluation hook
 * 
 * Automatically starts/stops engine analysis based on eval bar visibility and position changes.
 * This ensures the eval bar works independently of the engine panel.
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
  
  /** Whether analysis is currently running */
  isAnalyzing: boolean;
  
  /** Default depth for auto-evaluation (default: 15) */
  depth?: number;
}

export function useAutoEvaluation({
  startAnalysis,
  stopAnalysis,
  isEngineReady,
  isAnalyzing,
  depth = 15,
}: UseAutoEvaluationOptions) {
  const store = useRootStore();
  const ui = store.ui;
  const game = store.game;
  
  // Track the last FEN that was analyzed to avoid re-analyzing the same position
  const lastAnalyzedFenRef = useRef<string>('');
  
  useEffect(() => {
    // Only auto-evaluate if:
    // 1. Engine is ready
    // 2. Eval bar is visible OR engine panel is visible
    const shouldAutoEvaluate = 
      isEngineReady && (ui.isEvalBarVisible || ui.isEnginePanelVisible);
    
    if (!shouldAutoEvaluate) {
      // Stop analysis if eval bar and engine panel are both hidden
      if (isAnalyzing && !ui.isEvalBarVisible && !ui.isEnginePanelVisible) {
        stopAnalysis();
      }
      return;
    }
    
    // Get current FEN
    const currentFen = game.fen;
    
    // Skip if we're already analyzing this exact position
    if (currentFen === lastAnalyzedFenRef.current && isAnalyzing) {
      return;
    }
    
    // Start new analysis for this position
    lastAnalyzedFenRef.current = currentFen;
    
    // Stop previous analysis if running
    if (isAnalyzing) {
      stopAnalysis();
    }
    
    // Small delay to ensure previous analysis has stopped
    const timeoutId = setTimeout(() => {
      // Multi-PV = 1 for eval bar (only need best move)
      // Engine panel can request multi-PV = 3 separately if needed
      startAnalysis(currentFen, depth, 1);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [
    isEngineReady,
    ui.isEvalBarVisible,
    ui.isEnginePanelVisible,
    game.fen,
    isAnalyzing,
    startAnalysis,
    stopAnalysis,
    depth,
  ]);
  
  return {
    // No return values needed - this hook only manages side effects
  };
}
