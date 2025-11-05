'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '@/stores/store-setup';

/**
 * GameControls Component - Control panel for game operations
 *
 * Ported from src/ui.ts control panel functionality
 * Features:
 * - Reset game button
 * - Flip board button
 * - Toggle eval bar button
 * - Move review button
 * 
 * Performance Optimizations:
 * - Uses MobX observer for reactivity
 * - Direct store access for game operations
 */

interface GameControlsProps {
  /** Callback to show messages */
  onShowMessage?: (type: 'success' | 'error' | 'info', message: string) => void;
  /** Callback to review last move */
  onReviewLastMove?: (lastMove: any, callback: (classification: string) => void) => void;
  /** Whether move review is in progress */
  isReviewing?: boolean;
}

const GameControls = observer(function GameControls({ 
  onShowMessage, 
  onReviewLastMove,
  isReviewing = false 
}: GameControlsProps) {
  const store = useRootStore();
  const game = store.game;
  const ui = store.ui;

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      <button
        onClick={game.resetGame}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-all"
        style={{
          background: '#555',
          color: '#fff',
          border: 'none',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        <span>↻</span>
        <span>Reset Game</span>
      </button>
      <button
        onClick={ui.toggleBoardFlip}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-all"
        style={{
          background: '#555',
          color: '#fff',
          border: 'none',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        <span>🔄</span>
        <span>Flip Board</span>
      </button>
      <button
        onClick={ui.toggleEvalBar}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-all"
        style={{
          background: '#555',
          color: '#fff',
          border: 'none',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        <span>📊</span>
        <span>{ui.isEvalBarVisible ? 'Hide' : 'Show'} Eval Bar</span>
      </button>
      <button
        onClick={() => {
          if (game.history.length === 0) {
            onShowMessage?.('info', 'No move to review.');
            return;
          }
          const lastMove = game.history[game.history.length - 1];
          onShowMessage?.('info', 'Analyzing move...');
          onReviewLastMove?.(lastMove, (classification) => {
            onShowMessage?.('success', `Move classified as: ${classification}`);
          });
        }}
        disabled={isReviewing || game.history.length === 0}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-all"
        style={{
          background: isReviewing || game.history.length === 0 ? '#444' : '#555',
          color: '#fff',
          border: 'none',
          cursor: isReviewing || game.history.length === 0 ? 'not-allowed' : 'pointer',
          opacity: isReviewing || game.history.length === 0 ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isReviewing && game.history.length > 0) {
            e.currentTarget.style.filter = 'brightness(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)';
        }}
      >
        <span>⭐</span>
        <span>{isReviewing ? 'Reviewing...' : 'Move Review'}</span>
      </button>
    </div>
  );
});

export default GameControls;
