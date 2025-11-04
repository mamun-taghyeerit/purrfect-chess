'use client';

import { useGame } from '@/hooks/useGame';
import React from 'react';

/**
 * Board Component - Placeholder for the chess board
 *
 * This component will eventually replace the vanilla JS board.ts module.
 * It should integrate with:
 * - src/board.ts: Board rendering and visual updates
 * - src/game.ts: Chess game state and logic
 * - src/types.ts: Shared TypeScript type definitions
 *
 * TODO for future PRs:
 * 1. Port the board rendering logic from src/board.ts
 * 2. Implement drag-and-drop piece movement
 * 3. Add square highlighting for legal moves
 * 4. Support custom piece and square themes
 * 5. Integrate arrow drawing for move annotations
 * 6. Add engine analysis overlays
 */
export default function Board() {
  const { position, fen, movePiece } = useGame();

  // Simple 8x8 grid representation
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="inline-block">
      <div className="border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl">
        {ranks.map((rank) => (
          <div key={rank} className="flex">
            {files.map((file) => {
              const square = `${file}${rank}`;
              const isLight = (files.indexOf(file) + rank) % 2 === 0;
              const piece = position[square];
              const isPiece =
                piece &&
                typeof piece === 'object' &&
                'type' in piece &&
                'color' in piece;

              return (
                <div
                  key={square}
                  className={`
                    w-16 h-16 flex items-center justify-center text-4xl
                    ${isLight ? 'bg-amber-100' : 'bg-amber-600'}
                    hover:opacity-80 transition-opacity cursor-pointer
                  `}
                  onClick={() => {
                    // Placeholder for piece selection/movement
                    console.log(`Clicked square: ${square}`);
                  }}
                >
                  {isPiece && <span>{getPieceSymbol(piece)}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Current position: {fen || 'Starting position'}</p>
        <p className="mt-2">
          Click squares to interact (not yet functional - placeholder only)
        </p>
      </div>
    </div>
  );
}

/**
 * Helper function to convert piece notation to Unicode symbols
 * TODO: Replace with actual piece images from /public/assets/
 */
function getPieceSymbol(piece: { type: string; color: string }): string {
  const symbols: { [key: string]: string } = {
    wK: '♔',
    wQ: '♕',
    wR: '♖',
    wB: '♗',
    wN: '♘',
    wP: '♙',
    bK: '♚',
    bQ: '♛',
    bR: '♜',
    bB: '♝',
    bN: '♞',
    bP: '♟',
  };

  const key = `${piece.color}${piece.type.toUpperCase()}`;
  return symbols[key] || '';
}
