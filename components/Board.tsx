'use client';

import { useGame } from '@/hooks/useGame';
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import ArrowOverlay, {
  type Arrow,
  type PreviewArrow,
  parseSquare,
  squareCenter,
  buildArrowPoints,
} from './ArrowOverlay';

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
 * - Engine overlays: multi-PV square highlights and arrows
 * - Right-click arrow drawing with preview and toggle
 * - Responsive sizing matching legacy breakpoints
 * - Orientation: A1 always bottom-left for white (default view)
 * 
 * Performance Optimizations:
 * - Memoized callbacks and computations
 * - Optimized re-render triggers via useCallback/useMemo
 * - Note: Not using React.memo due to complex internal state from useGame hook
 */

// Constants
const DRAG_OPACITY = '0.4';
const NORMAL_OPACITY = '1';

// Arrow drawing constants (matching legacy)
const ARROW_DRAG_THRESHOLD = 6;
const ARROW_HIT_TOLERANCE = 0.22;
const ARROW_ORIGIN_PROTECT_RADIUS = 0.35;

// Engine highlight types (matching legacy)
export interface EngineHighlight {
  from?: string;
  to?: string;
  rank: number; // 1-3 for multi-PV ranking
}

export interface BoardProps {
  /** Engine analysis highlights (multi-PV moves) */
  engineHighlights?: EngineHighlight[];

  /** Engine overlay display mode */
  engineDisplayMode?: 'squares' | 'arrows' | 'both' | 'none';

  /** Whether to flip the board (black perspective) */
  flipped?: boolean;
}

export default function Board({
  engineHighlights = [],
  engineDisplayMode = 'arrows',
  flipped = false,
}: BoardProps) {
  const { position, movePiece, game, history } = useGame();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [captureMoves, setCaptureMoves] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragSourceRef = useRef<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Keyboard navigation state
  const [focusedSquare, setFocusedSquare] = useState<string | null>(null);
  const squareRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Arrow state
  const [userArrows, setUserArrows] = useState<Map<string, Arrow>>(new Map());
  const [previewArrow, setPreviewArrow] = useState<PreviewArrow | null>(null);
  const arrowDragRef = useRef<{
    fromSquare: string;
    startX: number;
    startY: number;
    dragDistance: number;
    currentSquare: string;
  } | null>(null);

  // File and rank labels for coordinates (matching legacy)
  // When flipped, reverse the arrays
  const files = useMemo(() => flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], [flipped]);
  const ranks = useMemo(() => flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1], [flipped]);

  // Get last move for highlighting
  const lastMove = history.length > 0 ? history[history.length - 1] : null;

  // Helper to get algebraic notation for square (file, rank indices)
  const algebraicAt = useCallback(
    (fileIndex: number, rankIndex: number): string => {
      const file = files[fileIndex];
      const rank = 8 - rankIndex;
      return `${file}${rank}`;
    },
    [files]
  );

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

  // Arrow utility functions (matching legacy)
  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  }, []);

  const boardCoordsFromClient = useCallback(
    (clientX: number, clientY: number) => {
      if (!boardRef.current) return null;
      const rect = boardRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      return { x, y };
    },
    []
  );

  const squareFromClient = useCallback(
    (clientX: number, clientY: number): string | null => {
      const coords = boardCoordsFromClient(clientX, clientY);
      if (!coords) return null;
      if (coords.x < 0 || coords.x >= 1 || coords.y < 0 || coords.y >= 1) {
        return null;
      }
      const fileIndex = clamp(Math.floor(coords.x * 8), 0, 7);
      const rankIndex = clamp(Math.floor(coords.y * 8), 0, 7);
      return algebraicAt(fileIndex, rankIndex);
    },
    [boardCoordsFromClient, clamp, algebraicAt]
  );

  const pointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const coords = boardCoordsFromClient(clientX, clientY);
      if (!coords) return null;
      const x = clamp(coords.x * 8, 0, 8);
      const y = clamp(coords.y * 8, 0, 8);
      return {
        x: clamp(x, 0.5, 7.5),
        y: clamp(y, 0.5, 7.5),
      };
    },
    [boardCoordsFromClient, clamp]
  );

  // Arrow hit detection (for left-click removal)
  const distancePointToSegment = useCallback(
    (
      px: number,
      py: number,
      ax: number,
      ay: number,
      bx: number,
      by: number
    ) => {
      const dx = bx - ax;
      const dy = by - ay;
      if (dx === 0 && dy === 0) {
        return Math.hypot(px - ax, py - ay);
      }
      const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
      const clampedT = clamp(t, 0, 1);
      const cx = ax + dx * clampedT;
      const cy = ay + dy * clampedT;
      return Math.hypot(px - cx, py - cy);
    },
    [clamp]
  );

  const findArrowHit = useCallback(
    (point: { x: number; y: number } | null): string | null => {
      if (!point) return null;

      for (const [key, arrow] of userArrows.entries()) {
        const points = buildArrowPoints(arrow.from, arrow.to);
        if (!points || points.length < 2) continue;

        const origin = points[0];
        // Check if there's a piece on the origin square (protection zone)
        const piece = position[arrow.from];
        const originHasPiece =
          piece &&
          typeof piece === 'object' &&
          'type' in piece &&
          'color' in piece;

        if (originHasPiece) {
          const originDistance = Math.hypot(
            point.x - origin.x,
            point.y - origin.y
          );
          if (originDistance <= ARROW_ORIGIN_PROTECT_RADIUS) {
            continue; // Skip this arrow if clicking near origin with a piece
          }
        }

        // Check all segments of the arrow path
        for (let index = 0; index < points.length - 1; index += 1) {
          const a = points[index];
          const b = points[index + 1];
          const distance = distancePointToSegment(
            point.x,
            point.y,
            a.x,
            a.y,
            b.x,
            b.y
          );
          if (distance <= ARROW_HIT_TOLERANCE) {
            return key;
          }
        }
      }
      return null;
    },
    [userArrows, position, distancePointToSegment]
  );

  // Arrow manipulation functions
  const toggleArrow = useCallback((from: string, to: string) => {
    if (from === to) return;
    const key = `${from}-${to}`;

    setUserArrows((prev) => {
      const newArrows = new Map(prev);
      if (newArrows.has(key)) {
        newArrows.delete(key);
      } else {
        newArrows.set(key, { from, to });
      }
      return newArrows;
    });
  }, []);

  const clearArrows = useCallback(() => {
    setUserArrows(new Map());
    setPreviewArrow(null);
  }, []);

  const removeArrow = useCallback((key: string) => {
    setUserArrows((prev) => {
      const newArrows = new Map(prev);
      newArrows.delete(key);
      return newArrows;
    });
  }, []);

  // Clear drag state
  const clearDragState = () => {
    setIsDragging(false);
    setSelectedSquare(null);
    setLegalMoves([]);
    setCaptureMoves([]);
    dragSourceRef.current = null;
  };

  // Arrow drag handlers (matching legacy)
  const startArrowDrag = useCallback(
    (square: string, event: React.MouseEvent) => {
      if (event.button !== 2) return; // Only right-click

      const fromPoint = squareCenter(square);
      if (!fromPoint) return;

      event.preventDefault();
      event.stopPropagation();

      arrowDragRef.current = {
        fromSquare: square,
        startX: event.clientX,
        startY: event.clientY,
        dragDistance: 0,
        currentSquare: square,
      };

      setPreviewArrow(null); // Will be shown on first move
    },
    []
  );

  const updateArrowPreview = useCallback(
    (event: MouseEvent) => {
      const drag = arrowDragRef.current;
      if (!drag) return;

      const fromPoint = squareCenter(drag.fromSquare);
      if (!fromPoint) {
        setPreviewArrow(null);
        return;
      }

      const targetPoint = pointFromClient(event.clientX, event.clientY);
      const targetSquare = squareFromClient(event.clientX, event.clientY);

      if (!targetPoint) {
        setPreviewArrow(null);
      } else {
        if (targetSquare) {
          drag.currentSquare = targetSquare;
          setPreviewArrow({ from: drag.fromSquare, to: targetSquare });
        } else {
          setPreviewArrow({ from: drag.fromSquare, toPoint: targetPoint });
        }
      }

      const distance = Math.hypot(
        event.clientX - drag.startX,
        event.clientY - drag.startY
      );
      drag.dragDistance = Math.max(drag.dragDistance, distance);
    },
    [pointFromClient, squareFromClient]
  );

  const finalizeArrowDrag = useCallback(
    (event: MouseEvent, options: { canceled?: boolean } = {}) => {
      const drag = arrowDragRef.current;
      arrowDragRef.current = null;
      setPreviewArrow(null);

      if (!drag || options.canceled) {
        return;
      }

      const targetSquare =
        drag.currentSquare ||
        squareFromClient(event.clientX, event.clientY) ||
        drag.fromSquare;

      const dragDistance = Math.max(
        drag.dragDistance,
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
      );

      // Small drags don't create arrows (matches legacy behavior)
      if (
        dragDistance < ARROW_DRAG_THRESHOLD ||
        targetSquare === drag.fromSquare
      ) {
        // Could trigger square context menu here if needed
        return;
      }

      toggleArrow(drag.fromSquare, targetSquare);
    },
    [toggleArrow, squareFromClient]
  );

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

  // Document-level event listeners for arrow dragging
  useEffect(() => {
    const handleDocumentMouseMove = (event: MouseEvent) => {
      if (!arrowDragRef.current) return;

      // Check if right mouse button is still pressed
      if (event.buttons !== undefined && (event.buttons & 2) === 0) {
        finalizeArrowDrag(event, { canceled: true });
        return;
      }

      updateArrowPreview(event);
    };

    const handleDocumentMouseUp = (event: MouseEvent) => {
      if (event.button !== 2) return; // Only right-click
      if (!arrowDragRef.current) return;

      event.preventDefault();
      finalizeArrowDrag(event);
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault(); // Prevent context menu
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [finalizeArrowDrag, updateArrowPreview]);

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

  // Initialize focused square on first render (default to e2 for keyboard navigation)
  useEffect(() => {
    if (focusedSquare === null) {
      setFocusedSquare('e2');
    }
  }, [focusedSquare]);

  // Clear board UI state when game resets or moves are made
  const previousHistoryLength = useRef<number>();
  useEffect(() => {
    // Initialize on first render
    if (previousHistoryLength.current === undefined) {
      previousHistoryLength.current = history.length;
      return;
    }

    const wasReset = previousHistoryLength.current > 0 && history.length === 0;
    const wasMove = history.length > previousHistoryLength.current;

    if (wasReset) {
      // Clear all board UI state on reset (matching legacy clearSelection + state reset)
      clearDragState();
      clearArrows();
    } else if (wasMove) {
      // Clear arrows when a new move is made (matching legacy behavior)
      clearArrows();
    }

    previousHistoryLength.current = history.length;
  }, [history.length, clearArrows]);

  const handleSquareClick = useCallback(
    (square: string, event: React.MouseEvent) => {
      // Left-click arrow removal (matching legacy)
      if (event.button === 0) {
        const pointer = pointFromClient(event.clientX, event.clientY);
        const hitKey = findArrowHit(pointer);
        if (hitKey) {
          removeArrow(hitKey);
          return; // Don't process piece selection
        }
      }

      const piece = position[square];
      const isPiece =
        piece &&
        typeof piece === 'object' &&
        'type' in piece &&
        'color' in piece;

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
    },
    [
      pointFromClient,
      findArrowHit,
      removeArrow,
      position,
      selectedSquare,
      movePiece,
      game,
    ]
  );

  // Keyboard navigation handler
  const handleBoardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!focusedSquare) return;

      const coords = parseSquare(focusedSquare);
      if (!coords) return;

      let newFileIndex = coords.file;
      let newRankIndex = coords.rank;

      // Arrow key navigation
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newFileIndex = Math.max(0, coords.file - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newFileIndex = Math.min(7, coords.file + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newRankIndex = Math.max(0, coords.rank - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newRankIndex = Math.min(7, coords.rank + 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleSquareClick(focusedSquare, e as any);
          return;
        case 'Escape':
          e.preventDefault();
          if (selectedSquare) {
            setSelectedSquare(null);
            setLegalMoves([]);
            setCaptureMoves([]);
          }
          return;
        default:
          return;
      }

      const newSquare = algebraicAt(newFileIndex, newRankIndex);
      setFocusedSquare(newSquare);

      // Focus the new square element
      const squareElement = squareRefs.current.get(newSquare);
      if (squareElement) {
        squareElement.focus();
      }
    },
    [focusedSquare, selectedSquare, handleSquareClick, algebraicAt]
  );

  const handleSquareMouseDown = useCallback(
    (square: string, event: React.MouseEvent) => {
      if (event.button === 2) {
        // Right-click: start arrow drag
        startArrowDrag(square, event);
      }
    },
    [startArrowDrag]
  );

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

    // Get source square from dataTransfer or fallback to ref
    // Note: Some browsers may clear dataTransfer.getData in certain scenarios,
    // so we maintain dragSourceRef as a reliable backup
    const fromSquare =
      e.dataTransfer.getData('text/plain') || dragSourceRef.current;

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
        <div 
          id="board" 
          ref={boardRef}
          role="application"
          aria-label="Chess board with 64 squares"
        >
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
                lastMove &&
                (lastMove.from === square || lastMove.to === square);

              // Check for engine highlights (multi-PV squares)
              // Only apply if engineDisplayMode includes squares
              const showEngineSquares =
                engineDisplayMode === 'both' || engineDisplayMode === 'squares';
              let engineHighlightRank: number | null = null;

              if (showEngineSquares && engineHighlights.length > 0) {
                // Find the highest-ranked (lowest number) engine highlight for this square
                for (const highlight of engineHighlights) {
                  if (highlight.from === square || highlight.to === square) {
                    if (
                      engineHighlightRank === null ||
                      highlight.rank < engineHighlightRank
                    ) {
                      engineHighlightRank = Math.min(
                        Math.max(highlight.rank, 1),
                        3
                      ); // Clamp to 1-3
                    }
                  }
                }
              }

              // Build className for square (matching legacy with drag-specific classes)
              let squareClasses = `square ${isLight ? 'light' : 'dark'}`;

              // Use drag-specific classes during drag operations (lighter shades)
              if (isSelected) {
                squareClasses += isDragging ? ' drag-selected' : ' selected';
              }
              if (isLastMoveSquare) squareClasses += ' last-move';
              if (isLegalMove) {
                squareClasses += isDragging
                  ? ' drag-move-hint'
                  : ' legal-move-hint';
              }
              if (isCaptureMove) {
                squareClasses += isDragging
                  ? ' drag-capture-hint'
                  : ' legal-capture-hint';
              }
              if (isPiece) {
                squareClasses +=
                  piece.color === 'w' ? ' white-piece' : ' black-piece';
              }

              // Add engine highlight class if applicable
              if (engineHighlightRank !== null) {
                squareClasses += ` engine-move-${engineHighlightRank}`;
              }

              // Build ARIA label for the square
              let ariaLabel: string;
              if (isPiece) {
                const colorName = piece.color === 'w' ? 'White' : 'Black';
                const pieceName = getPieceTypeName(piece.type);
                ariaLabel = `${square}, ${colorName} ${pieceName}`;
              } else {
                ariaLabel = `${square}, empty`;
              }

              if (isSelected) {
                ariaLabel += ', selected';
              }
              if (isLegalMove || isCaptureMove) {
                ariaLabel += ', legal move';
              }

              return (
                <div
                  key={square}
                  ref={(el) => {
                    if (el) {
                      squareRefs.current.set(square, el);
                    } else {
                      squareRefs.current.delete(square);
                    }
                  }}
                  className={squareClasses}
                  data-square={square}
                  role="button"
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                  tabIndex={focusedSquare === square ? 0 : -1}
                  onClick={(e) => handleSquareClick(square, e)}
                  onMouseDown={(e) => handleSquareMouseDown(square, e)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                  onFocus={() => setFocusedSquare(square)}
                  onKeyDown={handleBoardKeyDown}
                >
                  {isPiece && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getPieceImagePath(piece)}
                      alt=""
                      aria-hidden="true"
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

        {/* Arrow Overlay - Combines user arrows and engine arrows */}
        <ArrowOverlay
          userArrows={Array.from(userArrows.values())}
          engineArrows={
            engineDisplayMode === 'arrows' || engineDisplayMode === 'both'
              ? engineHighlights
                  .filter((h) => h.from && h.to)
                  .map((h) => ({
                    from: h.from!,
                    to: h.to!,
                    rank: h.rank,
                  }))
              : []
          }
          previewArrow={previewArrow}
        />
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
  const normalizedType = type.toLowerCase();
  if (!(normalizedType in pieceNames)) {
    console.warn(`Unknown piece type: ${type}`);
    return 'unknown piece';
  }
  return pieceNames[normalizedType];
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
