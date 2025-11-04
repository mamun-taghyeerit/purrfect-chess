'use client';

import React from 'react';

/**
 * Clock Component - Display chess clock for both players
 *
 * Ported from src/ui.ts clock display functionality
 * Features:
 * - Display remaining time for both players
 * - Highlight active player's clock
 * - Format time as MM:SS
 */

interface ClockProps {
  whiteTime: number; // milliseconds
  blackTime: number; // milliseconds
  activeColor: 'w' | 'b';
  isRunning: boolean;
}

export default function Clock({
  whiteTime,
  blackTime,
  activeColor,
  isRunning,
}: ClockProps) {
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
          activeColor === 'b' && isRunning
            ? 'bg-gray-800 text-white ring-4 ring-blue-500'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        <div className="text-sm font-normal mb-1">Black</div>
        <div>{formatTime(blackTime)}</div>
      </div>

      {/* White's Clock */}
      <div
        className={`p-4 rounded-lg text-center font-mono text-2xl font-bold transition-all ${
          activeColor === 'w' && isRunning
            ? 'bg-gray-100 text-gray-800 ring-4 ring-blue-500'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        <div className="text-sm font-normal mb-1">White</div>
        <div>{formatTime(whiteTime)}</div>
      </div>
    </div>
  );
}
