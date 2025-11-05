'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '@/stores/store-setup';

/**
 * Clock Component - Display chess clock for both players
 *
 * Ported from src/ui.ts clock display functionality
 * Features:
 * - Display remaining time for both players
 * - Highlight active player's clock
 * - Format time as MM:SS
 * - Fixed-width layout to prevent layout shift on time changes
 * 
 * Performance Optimizations:
 * - Uses MobX observer for fine-grained reactivity
 * - Only re-renders when accessed store properties change
 * - Fixed-width monospace font for stable layout
 */

const Clock = observer(function Clock() {
  const store = useRootStore();
  const game = store.game;

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md space-y-2">
      {/* Black's Clock */}
      <div
        className={`p-4 rounded-lg text-center font-mono text-2xl font-bold transition-all ${
          game.turn === 'b' && game.isTimerRunning
            ? 'bg-gray-800 text-white ring-4 ring-blue-500'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        <div className="text-sm font-normal mb-1">Black</div>
        <div>{formatTime(game.blackTime)}</div>
      </div>

      {/* White's Clock */}
      <div
        className={`p-4 rounded-lg text-center font-mono text-2xl font-bold transition-all ${
          game.turn === 'w' && game.isTimerRunning
            ? 'bg-gray-100 text-gray-800 ring-4 ring-blue-500'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        <div className="text-sm font-normal mb-1">White</div>
        <div>{formatTime(game.whiteTime)}</div>
      </div>
    </div>
  );
});

export default Clock;
