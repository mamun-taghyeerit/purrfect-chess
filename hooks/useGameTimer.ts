'use client';

import { useEffect, useRef } from 'react';
import { useRootStore } from '@/stores/store-setup';

/**
 * Hook to manage the chess game timer
 * 
 * This hook sets up an interval to tick the timer when it's running.
 * It should be used once at the app level to manage the global timer.
 * 
 * The timer automatically:
 * - Starts/stops based on store.isTimerRunning
 * - Ticks at 100ms intervals
 * - Tracks delta time to handle timer pauses
 */
export function useGameTimer() {
  const store = useRootStore();
  const game = store.game;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (game.isTimerRunning && !timerRef.current) {
      lastTickRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = lastTickRef.current ? now - lastTickRef.current : 0;
        lastTickRef.current = now;
        game.tickTimer(delta);
      }, 100);
    } else if (!game.isTimerRunning && timerRef.current) {
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
  }, [game.isTimerRunning, game]);
}
