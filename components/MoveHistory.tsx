'use client';

import React, { memo } from 'react';
import type { Move } from '@/lib/types';

/**
 * MoveHistory Component - Display game move history
 *
 * Ported from src/game.ts move history functionality
 * Features:
 * - Display moves in algebraic notation
 * - Grouped by move number (White & Black)
 * 
 * Performance Optimizations:
 * - Memoized to prevent unnecessary re-renders
 * - Only re-renders when move history actually changes
 */

interface MoveHistoryProps {
  history: Move[];
}

const MoveHistory = memo(function MoveHistory({ history }: MoveHistoryProps) {
  // Group moves by pairs (white and black)
  const movePairs: Array<{ white: Move | null; black: Move | null }> = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      white: history[i] || null,
      black: history[i + 1] || null,
    });
  }

  return (
    <div className="w-full max-w-md">
      <h3 className="text-lg font-bold mb-2">Move History</h3>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
        {movePairs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No moves yet
          </p>
        ) : (
          <div className="space-y-1">
            {movePairs.map((pair, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-sm font-mono"
              >
                <span className="w-8 text-gray-600 dark:text-gray-400 font-bold">
                  {index + 1}.
                </span>
                <span className="w-20 font-semibold">
                  {pair.white?.san || ''}
                </span>
                <span className="w-20">{pair.black?.san || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if history length or last move changed
  if (prevProps.history.length !== nextProps.history.length) {
    return false;
  }
  if (prevProps.history.length > 0 && nextProps.history.length > 0) {
    const prevLastMove = prevProps.history[prevProps.history.length - 1];
    const nextLastMove = nextProps.history[nextProps.history.length - 1];
    if (prevLastMove.san !== nextLastMove.san) {
      return false;
    }
  }
  return true;
});

export default MoveHistory;
