'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '@/stores/store-setup';

/**
 * Clock Component - Display chess clock for a single player
 *
 * Ported from src/ui.ts clock display functionality
 * Features:
 * - Display remaining time for a player
 * - Highlight active player's clock
 * - Format time as MM:SS
 * - Fixed-width layout to prevent layout shift on time changes
 * 
 * Performance Optimizations:
 * - Uses MobX observer for fine-grained reactivity
 * - Only re-renders when accessed store properties change
 * - Fixed-width monospace font for stable layout
 */

interface ClockProps {
  /** Which player's clock to display: 'w' for white, 'b' for black */
  player: 'w' | 'b';
}

const Clock = observer(function Clock({ player }: ClockProps) {
  const store = useRootStore();
  const game = store.game;

  // Helper function to format time in MM:SS format
  const formatClockTime = (timeMs: number): string => {
    const minutes = Math.floor(timeMs / 60000)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor((timeMs % 60000) / 1000)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const time = player === 'w' ? game.whiteTime : game.blackTime;
  const isActive = game.turn === player && game.isTimerRunning;

  return (
    <div
      className={`text-center font-mono font-bold mb-5 transition-all ${
        isActive ? '' : ''
      }`}
      style={{
        fontFamily: "'Orbitron', 'Fira Code', 'Menlo', monospace",
        fontSize: '2.6rem',
        padding: '12px 16px',
        borderRadius: '14px',
        background: '#1f1f1f',
        border: isActive ? '2px solid #9198e5' : '2px solid #555',
        boxShadow: isActive 
          ? '0 0 18px rgba(145, 152, 229, 0.7)' 
          : 'inset 0 0 12px rgba(0, 0, 0, 0.5)',
        transform: isActive ? 'translateY(-2px)' : 'none',
        color: '#f0f0f0',
        // Fixed width to prevent layout shift on time changes
        minWidth: '180px',
        width: '100%',
        // Prevent text wrapping
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      }}
    >
      {formatClockTime(time)}
    </div>
  );
});

export default Clock;
