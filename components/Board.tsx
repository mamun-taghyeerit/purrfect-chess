'use client';

import { useGame } from '@/hooks/useGame';
import React, { useState } from 'react';

/**
 * Board Component - Interactive chess board matching legacy implementation
 *
 * Mirrors src/board.ts visual and functional behavior exactly:
 * - CSS Grid layout (8×8) with background images for squares
 * - Coordinate labels (files a-h, ranks 1-8)
 * - Piece images with CSS variable filters for appearance customization
 * - Square highlights using CSS classes (selected, last-move, legal-move-hint, etc.)
 * - Responsive sizing matching legacy breakpoints
 * - Orientation: A1 always bottom-left for white (default view)
 */
export default function Board() {
  const { position, movePiece, game, history } = useGame();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [captureMoves, setCaptureMoves] = useState<string[]>([]);

  // File and rank labels for coordinates (matching legacy)
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Get last move for highlighting
  const lastMove = history.length > 0 ? history[history.length - 1] : null;

  // Helper to get algebraic notation for square (file, rank indices)
  const algebraicAt = (fileIndex: number, rankIndex: number): string => {
    const file = files[fileIndex];
    const rank = 8 - rankIndex;
    return `${file}${rank}`;
  };

  const handleSquareClick = (square: string) => {
    const piece = position[square];
    const isPiece =
      piece && typeof piece === 'object' && 'type' in piece && 'color' in piece;

    if (selectedSquare) {
      // Try to move piece
      const success = movePiece(selectedSquare, square);
      setSelectedSquare(null);
      setLegalMoves([]);
      setCaptureMoves([]);

      // If move failed and clicking on a different piece, select it instead
      if (!success && isPiece) {
        const moves = game.moves({ square: square as any, verbose: true });
        const legal = moves.filter((m) => !m.captured).map((m) => m.to);
        const captures = moves.filter((m) => m.captured).map((m) => m.to);
        setSelectedSquare(square);
        setLegalMoves(legal);
        setCaptureMoves(captures);
      }
    } else if (isPiece) {
      // Select piece and show legal moves
      const moves = game.moves({ square: square as any, verbose: true });
      const legal = moves.filter((m) => !m.captured).map((m) => m.to);
      const captures = moves.filter((m) => m.captured).map((m) => m.to);
      setSelectedSquare(square);
      setLegalMoves(legal);
      setCaptureMoves(captures);
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLImageElement>,
    square: string
  ) => {
    const piece = position[square];
    const isPiece =
      piece && typeof piece === 'object' && 'type' in piece && 'color' in piece;

    if (isPiece) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', square);

      const moves = game.moves({ square: square as any, verbose: true });
      const legal = moves.filter((m) => !m.captured).map((m) => m.to);
      const captures = moves.filter((m) => m.captured).map((m) => m.to);
      setSelectedSquare(square);
      setLegalMoves(legal);
      setCaptureMoves(captures);

      // Add drag opacity
      const img = e.currentTarget;
      img.style.opacity = '0.4';
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.opacity = '1';
    setSelectedSquare(null);
    setLegalMoves([]);
    setCaptureMoves([]);
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
    setCaptureMoves([]);
  };

  return (
    <div className="board-wrapper">
      <div className="board-container">
        {/* Coordinate labels - files (top) */}
        <div className="board-files board-files-top">
          {files.map((file) => (
            <span key={file}>{file}</span>
          ))}
        </div>

        {/* Coordinate labels - files (bottom) */}
        <div className="board-files board-files-bottom">
          {files.map((file) => (
            <span key={file}>{file}</span>
          ))}
        </div>

        {/* Coordinate labels - ranks (left) */}
        <div className="board-ranks board-ranks-left">
          {ranks.map((rank) => (
            <span key={rank}>{rank}</span>
          ))}
        </div>

        {/* Coordinate labels - ranks (right) */}
        <div className="board-ranks board-ranks-right">
          {ranks.map((rank) => (
            <span key={rank}>{rank}</span>
          ))}
        </div>

        {/* 8×8 Board grid */}
        <div id="board">
          {Array.from({ length: 8 }, (_, rankIndex) =>
            Array.from({ length: 8 }, (_, fileIndex) => {
              const square = algebraicAt(fileIndex, rankIndex);
              const isLight = (rankIndex + fileIndex) % 2 === 0;
              const piece = position[square];
              const isPiece =
                piece &&
                typeof piece === 'object' &&
                'type' in piece &&
                'color' in piece;

              const isSelected = selectedSquare === square;
              const isLegalMove = legalMoves.includes(square);
              const isCaptureMove = captureMoves.includes(square);
              const isLastMoveSquare =
                lastMove && (lastMove.from === square || lastMove.to === square);

              // Build className for square (matching legacy)
              let squareClasses = `square ${isLight ? 'light' : 'dark'}`;
              if (isSelected) squareClasses += ' selected';
              if (isLastMoveSquare) squareClasses += ' last-move';
              if (isLegalMove) squareClasses += ' legal-move-hint';
              if (isCaptureMove) squareClasses += ' legal-capture-hint';
              if (isPiece) {
                squareClasses += piece.color === 'w' ? ' white-piece' : ' black-piece';
              }

              return (
                <div
                  key={square}
                  className={squareClasses}
                  data-square={square}
                  onClick={() => handleSquareClick(square)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                >
                  {isPiece && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getPieceImagePath(piece)}
                      alt=""
                      draggable
                      onDragStart={(e) => handleDragStart(e, square)}
                      onDragEnd={handleDragEnd}
                      style={{ display: 'block' }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
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
