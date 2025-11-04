'use client';

import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';

/**
 * Custom hook for managing chess game state
 *
 * This hook wraps the chess.js library and will eventually replace
 * the logic from src/game.ts
 *
 * Integration points from vanilla app:
 * - src/game.ts: Chess game state and logic
 * - src/game/move-validator.ts: Move validation logic
 * - src/game/position-utils.ts: Position utility functions
 * - src/game/time-controls.ts: Time control management
 * - src/types.ts: TimeControl, GameHandlers, MoveInfo, ClockState
 *
 * TODO for future PRs:
 * 1. Port time control logic from src/game.ts
 * 2. Add move validation and execution
 * 3. Implement game over detection
 * 4. Add clock management with increment support
 * 5. Support FEN/PGN import/export
 * 6. Add move history tracking with MoveInfo details
 * 7. Implement takebacks and position reset
 */

interface Position {
  [square: string]: { type: string; color: string } | null | string;
}

interface GameState {
  position: Position;
  fen: string;
  history: any[];
  isGameOver: boolean;
  turn: 'w' | 'b';
  check: boolean;
  checkmate: boolean;
  stalemate: boolean;
}

export function useGame() {
  const [game] = useState(() => new Chess());
  const [gameState, setGameState] = useState<GameState>(() => {
    const pos = getPositionFromChess(game);
    return {
      position: pos,
      fen: game.fen(),
      history: [],
      isGameOver: false,
      turn: 'w',
      check: false,
      checkmate: false,
      stalemate: false,
    };
  });

  const updateGameState = useCallback(() => {
    const pos = getPositionFromChess(game);
    setGameState({
      position: pos,
      fen: game.fen(),
      history: game.history({ verbose: true }),
      isGameOver: game.isGameOver(),
      turn: game.turn(),
      check: game.isCheck(),
      checkmate: game.isCheckmate(),
      stalemate: game.isStalemate(),
    });
  }, [game]);

  const movePiece = useCallback(
    (from: string, to: string, promotion?: string) => {
      try {
        const move = game.move({ from, to, promotion });
        if (move) {
          updateGameState();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Invalid move:', error);
        return false;
      }
    },
    [game, updateGameState]
  );

  const resetGame = useCallback(() => {
    game.reset();
    updateGameState();
  }, [game, updateGameState]);

  const loadFen = useCallback(
    (fen: string) => {
      try {
        game.load(fen);
        updateGameState();
        return true;
      } catch (error) {
        console.error('Invalid FEN:', error);
        return false;
      }
    },
    [game, updateGameState]
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
  }, [updateGameState]);

  return {
    ...gameState,
    movePiece,
    resetGame,
    loadFen,
    getFen,
    getPgn,
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
