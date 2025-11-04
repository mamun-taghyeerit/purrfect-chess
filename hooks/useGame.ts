'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Position, TimeControl } from '@/lib/types';

/**
 * Custom hook for managing chess game state
 *
 * Ported from src/game.ts with React integration
 * Features:
 * - Chess game state and move validation
 * - Time control management with increment
 * - Clock management for both players
 * - FEN/PGN import/export
 * - Move history tracking
 * - Game over detection (checkmate, stalemate, timeout)
 */

interface GameState {
  position: Position;
  fen: string;
  history: any[];
  isGameOver: boolean;
  turn: 'w' | 'b';
  check: boolean;
  checkmate: boolean;
  stalemate: boolean;
  threefoldRepetition: boolean;
  insufficientMaterial: boolean;
  draw: boolean;
  whiteTime: number;
  blackTime: number;
  timeControl: TimeControl;
}

export function useGame() {
  const [game] = useState(() => new Chess());
  const [gameState, setGameState] = useState<GameState>(() => {
    const pos = getPositionFromChess(game);
    const defaultTimeControl = { minutes: 5, increment: 0 };
    return {
      position: pos,
      fen: game.fen(),
      history: [],
      isGameOver: false,
      turn: 'w',
      check: false,
      checkmate: false,
      stalemate: false,
      threefoldRepetition: false,
      insufficientMaterial: false,
      draw: false,
      whiteTime: defaultTimeControl.minutes * 60 * 1000,
      blackTime: defaultTimeControl.minutes * 60 * 1000,
      timeControl: defaultTimeControl,
    };
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const updateGameState = useCallback(() => {
    const pos = getPositionFromChess(game);
    const checkmate = game.isCheckmate();
    const stalemate = game.isStalemate();
    const threefoldRepetition = game.isThreefoldRepetition();
    const insufficientMaterial = game.isInsufficientMaterial();
    const draw = game.isDraw();
    
    setGameState((prev) => ({
      ...prev,
      position: pos,
      fen: game.fen(),
      history: game.history({ verbose: true }),
      isGameOver: game.isGameOver() || prev.isGameOver,
      turn: game.turn(),
      check: game.isCheck(),
      checkmate,
      stalemate,
      threefoldRepetition,
      insufficientMaterial,
      draw,
    }));
  }, [game]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    lastTickRef.current = null;
    setIsTimerRunning(false);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    lastTickRef.current = Date.now();
    setIsTimerRunning(true);

    timerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.isGameOver) {
          return prev;
        }

        const now = Date.now();
        const delta = lastTickRef.current ? now - lastTickRef.current : 0;
        lastTickRef.current = now;

        const newState = { ...prev };

        if (prev.turn === 'w') {
          newState.whiteTime = Math.max(0, prev.whiteTime - delta);
          if (newState.whiteTime === 0) {
            newState.isGameOver = true;
          }
        } else {
          newState.blackTime = Math.max(0, prev.blackTime - delta);
          if (newState.blackTime === 0) {
            newState.isGameOver = true;
          }
        }

        return newState;
      });
    }, 100);
  }, [stopTimer]);

  // Stop timer when game is over
  useEffect(() => {
    if (gameState.isGameOver && isTimerRunning) {
      stopTimer();
    }
  }, [gameState.isGameOver, isTimerRunning, stopTimer]);

  const movePiece = useCallback(
    (from: string, to: string, promotion?: string) => {
      try {
        // Default to queen promotion if not specified (matches legacy behavior)
        const move = game.move({ from, to, promotion: promotion || 'q' });
        if (move) {
          // Add increment to the player who just moved
          setGameState((prev) => {
            const incrementMs = prev.timeControl.increment * 1000;
            const newState = {
              ...prev,
              whiteTime:
                prev.turn === 'w' ? prev.whiteTime + incrementMs : prev.whiteTime,
              blackTime:
                prev.turn === 'b' ? prev.blackTime + incrementMs : prev.blackTime,
            };
            return newState;
          });

          updateGameState();

          // Start timer on first move
          if (!isTimerRunning && game.history().length === 1) {
            startTimer();
          }

          return true;
        }
        return false;
      } catch (error) {
        console.error('Invalid move:', error);
        return false;
      }
    },
    [game, updateGameState, isTimerRunning, startTimer]
  );

  const resetGame = useCallback(() => {
    stopTimer();
    game.reset();
    setGameState((prev) => ({
      position: getPositionFromChess(game),
      fen: game.fen(),
      history: [],
      isGameOver: false,
      turn: 'w',
      check: false,
      checkmate: false,
      stalemate: false,
      threefoldRepetition: false,
      insufficientMaterial: false,
      draw: false,
      whiteTime: prev.timeControl.minutes * 60 * 1000,
      blackTime: prev.timeControl.minutes * 60 * 1000,
      timeControl: prev.timeControl,
    }));
  }, [game, stopTimer]);

  const setTimeControl = useCallback((timeControl: TimeControl) => {
    stopTimer();
    setGameState((prev) => ({
      ...prev,
      whiteTime: timeControl.minutes * 60 * 1000,
      blackTime: timeControl.minutes * 60 * 1000,
      timeControl,
    }));
  }, [stopTimer]);

  const loadFen = useCallback(
    (fen: string) => {
      try {
        stopTimer();
        game.load(fen);
        updateGameState();
        return true;
      } catch (error) {
        console.error('Invalid FEN:', error);
        return false;
      }
    },
    [game, updateGameState, stopTimer]
  );

  const getFen = useCallback(() => {
    return game.fen();
  }, [game]);

  const getPgn = useCallback(() => {
    return game.pgn();
  }, [game]);

  useEffect(() => {
    // Initialize game state on mount
    updateGameState();

    // Cleanup timer on unmount
    return () => {
      stopTimer();
    };
  }, [updateGameState, stopTimer]);

  return {
    ...gameState,
    movePiece,
    resetGame,
    loadFen,
    getFen,
    getPgn,
    setTimeControl,
    isTimerRunning,
    game, // Expose the underlying chess.js instance for advanced usage
  };
}

/**
 * Helper function to convert chess.js board to position object
 * @param game - Chess.js instance
 */
function getPositionFromChess(game: Chess): Position {
  const board = game.board();
  const position: Position = {};

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  board.forEach((row, rankIndex) => {
    const rank = 8 - rankIndex;
    row.forEach((piece, fileIndex) => {
      const square = `${files[fileIndex]}${rank}`;
      position[square] = piece;
    });
  });

  return position;
}
