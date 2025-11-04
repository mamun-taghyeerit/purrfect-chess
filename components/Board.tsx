'use client';

import { useGame } from '@/hooks/useGame';
import React, { useState, useEffect, useRef } from 'react';

/**
 * Board Component - Interactive chess board matching legacy implementation
 *
 * Mirrors src/board.ts visual and functional behavior exactly:
 * - CSS Grid layout (8×8) with background images for squares
 * - Coordinate labels (files a-h, ranks 1-8)
 * - Piece images with CSS variable filters for appearance customization
 * - Square highlights using CSS classes (selected, last-move, legal-move-hint, etc.)
 * - Drag-and-drop with proper cancellation (ESC, blur)
 * - Re-selection semantics (clicking different piece changes selection)
 * - Lighter visual feedback during drag operations
 * - Responsive sizing matching legacy breakpoints
 * - Orientation: A1 always bottom-left for white (default view)
 */

// Constants
const DRAG_OPACITY = '0.4';
const NORMAL_OPACITY = '1';

export default function Board() {
  const { position, movePiece, game, history } = useGame();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [captureMoves, setCaptureMoves] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragSourceRef = useRef<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // File and rank labels for coordinates (matching legacy)
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  // Get last move for highlighting
  const lastMove = history.length > 0 ? history[history.length - 1] : null;

  // Helper to get algebraic notation for square (file, rank indices)
  const algebraicAt = (fileIndex: number, rankIndex: number): string => {
    const file = files[fileIndex];
    const rank = 8 - rankIndex;
    return `${file}${rank}`;
  };

  // Helper to categorize moves into non-captures and captures (single pass optimization)
  const categorizeMoves = (moves: any[]) => {
    return moves.reduce(
      (acc, move) => {
        if (move.captured) {
          acc.captures.push(move.to);
        } else {
          acc.legal.push(move.to);
        }
        return acc;
      },
      { legal: [] as string[], captures: [] as string[] }
    );
  };

  // Clear drag state
  const clearDragState = () => {
    setIsDragging(false);
    setSelectedSquare(null);
    setLegalMoves([]);
    setCaptureMoves([]);
    dragSourceRef.current = null;
  };

  // Handle ESC key to cancel drag
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDragging) {
        clearDragState();
      }
    };

    const handleBlur = () => {
      if (isDragging) {
        clearDragState();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isDragging]);

  // Prevent text selection during drag (matching legacy)
  useEffect(() => {
    const preventSelection = (e: Event) => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    document.addEventListener('selectstart', preventSelection);

    return () => {
      document.removeEventListener('selectstart', preventSelection);
    };
  }, [isDragging]);

  const handleSquareClick = (square: string) => {
    const piece = position[square];
    const isPiece =
      piece && typeof piece === 'object' && 'type' in piece && 'color' in piece;

    if (selectedSquare) {
      // Try to move piece
      const success = movePiece(selectedSquare, square);
      
      // Clear selection state
      setSelectedSquare(null);
      setLegalMoves([]);
      setCaptureMoves([]);

      // If move failed and clicking on a different piece, select it instead (re-selection)
      if (!success && isPiece && square !== selectedSquare) {
        const moves = game.moves({ square: square as any, verbose: true });
        const { legal, captures } = categorizeMoves(moves);
        setSelectedSquare(square);
        setLegalMoves(legal);
        setCaptureMoves(captures);
      }
    } else if (isPiece) {
      // Select piece and show legal moves
      const moves = game.moves({ square: square as any, verbose: true });
      const { legal, captures } = categorizeMoves(moves);
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
      // Prevent text selection during drag
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', square);

      const moves = game.moves({ square: square as any, verbose: true });
      const { legal, captures } = categorizeMoves(moves);
      
      // Set drag state
      setIsDragging(true);
      setSelectedSquare(square);
      setLegalMoves(legal);
      setCaptureMoves(captures);
      dragSourceRef.current = square;

      // Add drag opacity
      const img = e.currentTarget;
      img.style.opacity = DRAG_OPACITY;
    } else {
      // Prevent dragging non-pieces
      e.preventDefault();
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.opacity = NORMAL_OPACITY;
    
    // Clear drag state
    clearDragState();
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
    const fromSquare = e.dataTransfer.getData('text/plain') || dragSourceRef.current;

    if (fromSquare) {
      // Attempt move - invalid moves are rejected by movePiece, no state mutation
      movePiece(fromSquare, targetSquare);
    }

    // Clear drag state
    clearDragState();
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
        <div id="board" ref={boardRef}>
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

              // Build className for square (matching legacy with drag-specific classes)
              let squareClasses = `square ${isLight ? 'light' : 'dark'}`;
              
              // Use drag-specific classes during drag operations (lighter shades)
              if (isSelected) {
                squareClasses += isDragging ? ' drag-selected' : ' selected';
              }
              if (isLastMoveSquare) squareClasses += ' last-move';
              if (isLegalMove) {
                squareClasses += isDragging ? ' drag-move-hint' : ' legal-move-hint';
              }
              if (isCaptureMove) {
                squareClasses += isDragging ? ' drag-capture-hint' : ' legal-capture-hint';
              }
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
                      alt={`${piece.color === 'w' ? 'White' : 'Black'} ${getPieceTypeName(piece.type)}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, square)}
                      onDragEnd={handleDragEnd}
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
 * Helper function to get piece type name for accessibility
 */
function getPieceTypeName(type: string): string {
  const pieceNames: { [key: string]: string } = {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king',
  };
  return pieceNames[type.toLowerCase()] || 'pawn'; // Default to 'pawn' for unknown types
}

/**
 * Helper function to get piece image path
 * Images are from /public/assets/ (CC BY 4.0)
 * 
 * Note: Using regular <img> instead of Next.js Image component
 * for compatibility with HTML5 drag-and-drop. The Image component
 * interferes with drag events due to its wrapper structure.
 * High-resolution source images (824×824) ensure crispness on retina displays.
 */
function getPieceImagePath(piece: { type: string; color: string }): string {
  const colorPrefix = piece.color === 'w' ? 'w' : 'b';
  const pieceName = getPieceTypeName(piece.type);

  return `/assets/${colorPrefix}_${pieceName}.png`;
}
