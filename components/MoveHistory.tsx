'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '@/stores/store-setup';
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
 * - Uses MobX observer for fine-grained reactivity
 * - Only re-renders when store.game.history changes
 */

const MoveHistory = observer(function MoveHistory() {
  const store = useRootStore();
  const history = store.game.history;

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
      <div 
        className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto"
        style={{ minHeight: '52px' }}
      >
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
});

export default MoveHistory;
