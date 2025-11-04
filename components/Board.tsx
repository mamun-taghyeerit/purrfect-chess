'use client';

import { useGame } from '@/hooks/useGame';
import React, { useState } from 'react';
import Image from 'next/image';

/**
 * Board Component - Interactive chess board with piece images
 *
 * Ported from src/board.ts with React integration
 * Features:
 * - Board rendering with piece images from /public/assets/
 * - Click-to-select and click-to-move interaction
 * - Drag-and-drop piece movement
 * - Square highlighting for legal moves
 * - Last move highlighting
 */
export default function Board() {
  const { position, fen, movePiece, game, history } = useGame();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);

  // Simple 8x8 grid representation
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  // Get last move for highlighting
  const lastMove = history.length > 0 ? history[history.length - 1] : null;

  const handleSquareClick = (square: string) => {
    const piece = position[square];
    const isPiece =
      piece && typeof piece === 'object' && 'type' in piece && 'color' in piece;

    if (selectedSquare) {
      // Try to move piece
      const success = movePiece(selectedSquare, square);
      setSelectedSquare(null);
      setLegalMoves([]);

      // If move failed and clicking on a different piece, select it instead
      if (!success && isPiece) {
        const moves = game
          .moves({ square: square as any, verbose: true })
          .map((m) => m.to);
        setSelectedSquare(square);
        setLegalMoves(moves);
      }
    } else if (isPiece) {
      // Select piece and show legal moves
      const moves = game
        .moves({ square: square as any, verbose: true })
        .map((m) => m.to);
      setSelectedSquare(square);
      setLegalMoves(moves);
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    square: string
  ) => {
    const piece = position[square];
    const isPiece =
      piece && typeof piece === 'object' && 'type' in piece && 'color' in piece;

    if (isPiece) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', square);

      const moves = game
        .moves({ square: square as any, verbose: true })
        .map((m) => m.to);
      setSelectedSquare(square);
      setLegalMoves(moves);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetSquare: string
  ) => {
    e.preventDefault();
    const fromSquare = e.dataTransfer.getData('text/plain');

    if (fromSquare) {
      movePiece(fromSquare, targetSquare);
    }

    setSelectedSquare(null);
    setLegalMoves([]);
  };

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

              const isSelected = selectedSquare === square;
              const isLegalMove = legalMoves.includes(square);
              const isLastMoveSquare =
                lastMove && (lastMove.from === square || lastMove.to === square);

              return (
                <div
                  key={square}
                  className={`
                    w-16 h-16 flex items-center justify-center relative
                    ${isLight ? 'bg-amber-100' : 'bg-amber-600'}
                    ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : ''}
                    ${isLastMoveSquare ? 'bg-yellow-300 bg-opacity-50' : ''}
                    hover:opacity-90 transition-opacity cursor-pointer
                  `}
                  onClick={() => handleSquareClick(square)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                >
                  {isPiece && (
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, square)}
                      className="w-full h-full flex items-center justify-center cursor-move"
                    >
                      <Image
                        src={getPieceImagePath(piece)}
                        alt={`${piece.color} ${piece.type}`}
                        width={56}
                        height={56}
                        className="pointer-events-none select-none"
                        draggable={false}
                      />
                    </div>
                  )}
                  {isLegalMove && (
                    <div
                      className={`absolute inset-0 flex items-center justify-center pointer-events-none`}
                    >
                      <div
                        className={`${
                          isPiece
                            ? 'w-14 h-14 border-4 border-green-500 rounded-full opacity-50'
                            : 'w-4 h-4 bg-green-500 rounded-full opacity-60'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Current position: {fen}</p>
        <p className="mt-2">Click or drag pieces to move</p>
      </div>
    </div>
  );
}

/**
 * Helper function to get piece image path
 * Images are from /public/assets/ (CC BY 4.0)
 */
function getPieceImagePath(piece: { type: string; color: string }): string {
  const colorPrefix = piece.color === 'w' ? 'w' : 'b';
  const pieceNames: { [key: string]: string } = {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king',
  };

  const pieceName = pieceNames[piece.type.toLowerCase()];
  
  // Fallback to pawn if piece type is unknown
  if (!pieceName) {
    console.warn(`Unknown piece type: ${piece.type}, defaulting to pawn`);
    return `/assets/${colorPrefix}_pawn.png`;
  }
  
  return `/assets/${colorPrefix}_${pieceName}.png`;
}
