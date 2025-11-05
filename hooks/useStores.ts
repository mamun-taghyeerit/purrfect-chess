'use client';

import { useEffect, useRef } from 'react';
import { useRootStore } from '@/stores/store-setup';

/**
 * Hook to access game state from the MobX store
 * 
 * This hook provides the same API as the old useGame hook for backward compatibility,
 * but now powered by MobX State Tree for better state management.
 * 
 * Usage: Use this hook in components wrapped with observer() from mobx-react-lite
 */
export function useGameStore(options: { onError?: (error: string) => void } = {}) {
  const store = useRootStore();
  const { onError } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number | null>(null);

  // Timer management
  useEffect(() => {
    if (store.game.isTimerRunning && !timerRef.current) {
      lastTickRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = lastTickRef.current ? now - lastTickRef.current : 0;
        lastTickRef.current = now;
        store.game.tickTimer(delta);
      }, 100);
    } else if (!store.game.isTimerRunning && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      lastTickRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [store.game.isTimerRunning, store.game]);

  // Enhanced move piece with error handling
  const movePiece = (from: string, to: string, promotion?: string) => {
    const success = store.game.movePiece(from, to, promotion);
    if (!success && onError) {
      onError('Illegal move.');
    }
    
    // Start timer on first move
    if (success && store.game.history.length === 1) {
      store.game.startTimer();
    } else if (success && store.game.isTimerRunning) {
      // Reset lastTick to prevent time jump
      lastTickRef.current = Date.now();
    }
    
    return success;
  };

  // Enhanced load FEN with error handling
  const loadFen = (fen: string) => {
    if (!fen || !fen.trim()) {
      if (onError) {
        onError('Enter a FEN string to load.');
      }
      return false;
    }
    const success = store.game.loadFen(fen);
    if (!success && onError) {
      onError('Invalid FEN string.');
    }
    return success;
  };

  // Enhanced load PGN with error handling
  const loadPgn = (pgn: string) => {
    if (!pgn || !pgn.trim()) {
      if (onError) {
        onError('Enter a PGN string to load.');
      }
      return false;
    }
    const success = store.game.loadPgn(pgn);
    if (!success && onError) {
      onError('Invalid PGN data.');
    }
    return success;
  };

  // Enhanced set time control
  const setTimeControl = (timeControl: { minutes: number; increment: number }) => {
    store.game.setTimeControl(timeControl.minutes, timeControl.increment);
  };

  return {
    // Game state
    position: store.game.position,
    fen: store.game.fen,
    history: store.game.history,
    isGameOver: store.game.isGameOver,
    turn: store.game.turn,
    check: store.game.check,
    checkmate: store.game.checkmate,
    stalemate: store.game.stalemate,
    threefoldRepetition: store.game.threefoldRepetition,
    insufficientMaterial: store.game.insufficientMaterial,
    draw: store.game.draw,
    whiteTime: store.game.whiteTime,
    blackTime: store.game.blackTime,
    timeControl: store.game.timeControl,
    isTimerRunning: store.game.isTimerRunning,
    
    // Game actions
    movePiece,
    resetGame: store.game.resetGame,
    loadFen,
    getFen: () => store.game.fen,
    getPgn: store.game.getPgn,
    loadPgn,
    setTimeControl,
    
    // Expose the chess instance for advanced usage
    game: store.game.chessInstance,
  };
}

/**
 * Hook to access UI state from the MobX store
 */
export function useUIStore() {
  const store = useRootStore();
  
  return {
    isEnginePanelVisible: store.ui.isEnginePanelVisible,
    isEvalBarVisible: store.ui.isEvalBarVisible,
    isBoardFlipped: store.ui.isBoardFlipped,
    engineDisplayMode: store.ui.engineDisplayModeValue,
    
    toggleEnginePanel: store.ui.toggleEnginePanel,
    showEnginePanel: store.ui.showEnginePanel,
    hideEnginePanel: store.ui.hideEnginePanel,
    toggleEvalBar: store.ui.toggleEvalBar,
    toggleBoardFlip: store.ui.toggleBoardFlip,
    setEngineDisplayMode: store.ui.setEngineDisplayMode,
  };
}

/**
 * Hook to access settings from the MobX store
 */
export function useSettingsStore() {
  const store = useRootStore();
  
  return {
    defaultTimeMinutes: store.settings.defaultTimeMinutes,
    defaultTimeIncrement: store.settings.defaultTimeIncrement,
    defaultEngineDepth: store.settings.defaultEngineDepth,
    
    setDefaultTime: store.settings.setDefaultTime,
    setDefaultEngineDepth: store.settings.setDefaultEngineDepth,
  };
}
