'use client';

import { useEffect, useRef } from 'react';
import { useRootStore } from '@/stores/store-setup';

/**
 * Hook to access game state from the MobX store
 * 
 * This hook provides access to game state powered by MobX State Tree.
 * 
 * IMPORTANT: For MobX reactivity to work properly, destructure properties
 * as late as possible (preferably in JSX), not at the hook call site.
 * 
 * Good: const gameStore = useGameStore(); return <div>{gameStore.position}</div>
 * Bad:  const { position } = useGameStore(); return <div>{position}</div>
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

  // Return the store reference directly for MobX reactivity
  // Access properties in JSX for proper observation
  return {
    // Direct store reference for reactive access
    store: store.game,
    
    // Enhanced actions with error handling
    movePiece,
    loadFen,
    loadPgn,
    setTimeControl,
    
    // Convenience getters that don't break reactivity
    getFen: () => store.game.fen,
    getPgn: store.game.getPgn,
    resetGame: store.game.resetGame,
  };
}

/**
 * Hook to access UI state from the MobX store
 * 
 * Returns the UI store directly for proper MobX reactivity.
 * Access properties in JSX for observation.
 */
export function useUIStore() {
  const store = useRootStore();
  return store.ui;
}

/**
 * Hook to access settings from the MobX store
 * 
 * Returns the settings store directly for proper MobX reactivity.
 * Access properties in JSX for observation.
 */
export function useSettingsStore() {
  const store = useRootStore();
  return store.settings;
}
