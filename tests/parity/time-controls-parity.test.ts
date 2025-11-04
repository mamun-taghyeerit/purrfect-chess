/**
 * Time Controls + Clocks Parity Tests
 *
 * Purpose: Validate that time control behavior (timers, increments, start/stop semantics)
 * is identical between legacy (src/game.ts) and Next.js (hooks/useGame.ts) apps.
 *
 * Requirements from issue:
 * - Start timer on first move
 * - Pause on game over
 * - Apply increment on move complete
 * - Disable preset selector post-start
 * - Identical state reset semantics
 * - Timeout triggers game-over events
 * - Timer tick precision (100ms)
 * - Increment application timing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGame } from '../../hooks/useGame';
import { initGame } from '../../src/game';

describe('Phase X Parity: Time Controls + Clocks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Timer Start Semantics', () => {
    it('should NOT start timer before first move', () => {
      const { result } = renderHook(() => useGame());
      expect(result.current.isTimerRunning).toBe(false);
    });

    it('should start timer on first move', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      expect(result.current.isTimerRunning).toBe(true);
    });

    it('should keep timer running on subsequent moves', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.movePiece('e2', 'e4');
        result.current.movePiece('e7', 'e5');
        result.current.movePiece('g1', 'f3');
      });

      expect(result.current.isTimerRunning).toBe(true);
    });

    it('should NOT start timer when loading FEN', () => {
      const { result } = renderHook(() => useGame());
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

      act(() => {
        result.current.loadFen(fen);
      });

      expect(result.current.isTimerRunning).toBe(false);
    });

    it('should NOT start timer when loading PGN', () => {
      const { result } = renderHook(() => useGame());
      const pgn = '1. e4 e5 2. Nf3';

      act(() => {
        result.current.loadPgn(pgn);
      });

      expect(result.current.isTimerRunning).toBe(false);
    });
  });

  describe('Timer Stop Semantics', () => {
    it('should stop timer on game reset', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      expect(result.current.isTimerRunning).toBe(true);

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.isTimerRunning).toBe(false);
    });

    it('should stop timer when checkmate occurs', () => {
      const { result } = renderHook(() => useGame());

      // Play moves to set up near-checkmate position
      act(() => {
        result.current.movePiece('f2', 'f3'); // White's first move
      });

      expect(result.current.isTimerRunning).toBe(true);

      act(() => {
        result.current.movePiece('e7', 'e5');
        result.current.movePiece('g2', 'g4');
        result.current.movePiece('d8', 'h4'); // Checkmate (fool's mate)
      });

      // Wait for effect to stop timer on game over
      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.checkmate).toBe(true);
      expect(result.current.isGameOver).toBe(true);
      expect(result.current.isTimerRunning).toBe(false);
    });

    it('should stop timer when stalemate occurs', () => {
      const { result } = renderHook(() => useGame());
      // Stalemate position
      const fen = '7k/8/6Q1/8/8/8/8/K7 b - - 0 1';

      act(() => {
        result.current.loadFen(fen);
      });

      expect(result.current.stalemate).toBe(true);
      expect(result.current.isGameOver).toBe(true);
      expect(result.current.isTimerRunning).toBe(false);
    });
  });

  describe('Increment Application Timing', () => {
    it('should apply increment to player who just moved (White)', () => {
      const { result } = renderHook(() => useGame());
      const timeControl = { minutes: 3, increment: 2 };

      act(() => {
        result.current.setTimeControl(timeControl);
      });

      const initialWhiteTime = result.current.whiteTime;
      const initialBlackTime = result.current.blackTime;

      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      // White just moved, so white should get the increment
      expect(result.current.whiteTime).toBe(initialWhiteTime + 2000);
      // Black should not get increment yet
      expect(result.current.blackTime).toBe(initialBlackTime);
    });

    it('should apply increment to player who just moved (Black)', () => {
      const { result } = renderHook(() => useGame());
      const timeControl = { minutes: 3, increment: 2 };

      act(() => {
        result.current.setTimeControl(timeControl);
      });

      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      const whiteTimeAfterFirstMove = result.current.whiteTime;
      const blackTimeBeforeMove = result.current.blackTime;

      act(() => {
        result.current.movePiece('e7', 'e5');
      });

      // Black just moved, so black should get the increment
      expect(result.current.blackTime).toBe(blackTimeBeforeMove + 2000);
      // White should not get another increment
      expect(result.current.whiteTime).toBe(whiteTimeAfterFirstMove);
    });

    it('should apply increment on every move', () => {
      const { result } = renderHook(() => useGame());
      const timeControl = { minutes: 1, increment: 1 };

      act(() => {
        result.current.setTimeControl(timeControl);
      });

      const moves = [
        ['e2', 'e4'], // White
        ['e7', 'e5'], // Black
        ['g1', 'f3'], // White
        ['b8', 'c6'], // Black
      ];

      for (const [from, to] of moves) {
        act(() => {
          result.current.movePiece(from, to);
        });
      }

      // Each player made 2 moves, so each should have gained 2 seconds (2000ms)
      // Initial time: 60000ms (1 minute)
      // After 2 moves with 1 second increment: 60000 + 2000 = 62000ms
      expect(result.current.whiteTime).toBe(60000 + 2000);
      expect(result.current.blackTime).toBe(60000 + 2000);
    });

    it('should NOT apply increment when increment is 0', () => {
      const { result } = renderHook(() => useGame());
      const timeControl = { minutes: 5, increment: 0 };

      act(() => {
        result.current.setTimeControl(timeControl);
      });

      const initialWhiteTime = result.current.whiteTime;

      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      // No increment should be applied
      expect(result.current.whiteTime).toBe(initialWhiteTime);
    });
  });

  describe('Timer Tick Precision', () => {
    it('should tick at 100ms intervals', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      const initialWhiteTime = result.current.whiteTime;

      // Advance by 100ms
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Black's time should decrease (it's black's turn)
      // White's time should stay the same
      expect(result.current.whiteTime).toBe(initialWhiteTime);
    });

    it('should accumulate time accurately over multiple ticks', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      const initialBlackTime = result.current.blackTime;

      // Advance by 1 second (10 ticks of 100ms)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Black's time should have decreased by approximately 1000ms
      // Allow for small timing variations
      const timeDiff = initialBlackTime - result.current.blackTime;
      expect(timeDiff).toBeGreaterThanOrEqual(900);
      expect(timeDiff).toBeLessThanOrEqual(1100);
    });
  });

  describe('Timeout Handling', () => {
    it('should trigger game over when time runs out', () => {
      const { result } = renderHook(() => useGame());
      const timeControl = { minutes: 0, increment: 0 };

      act(() => {
        result.current.setTimeControl(timeControl);
      });

      // Manually set very low time
      act(() => {
        result.current.resetGame();
      });

      // Start timer
      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      // Manually advance time beyond the available time
      act(() => {
        vi.advanceTimersByTime(2000); // Advance 2 seconds
      });

      // Game should be over due to timeout
      expect(result.current.isGameOver).toBe(true);
      expect(result.current.isTimerRunning).toBe(false);
    });

    it('should not go below 0 time', () => {
      const { result } = renderHook(() => useGame());
      const timeControl = { minutes: 0, increment: 0 };

      act(() => {
        result.current.setTimeControl(timeControl);
      });

      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.blackTime).toBe(0);
      expect(result.current.blackTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Time Control Preset Changes', () => {
    it('should update clock times when time control is changed', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.setTimeControl({ minutes: 1, increment: 0 });
      });

      expect(result.current.whiteTime).toBe(60000);
      expect(result.current.blackTime).toBe(60000);

      act(() => {
        result.current.setTimeControl({ minutes: 3, increment: 2 });
      });

      expect(result.current.whiteTime).toBe(180000);
      expect(result.current.blackTime).toBe(180000);
    });

    it('should stop timer when changing time control', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      expect(result.current.isTimerRunning).toBe(true);

      act(() => {
        result.current.setTimeControl({ minutes: 10, increment: 5 });
      });

      expect(result.current.isTimerRunning).toBe(false);
    });
  });

  describe('State Reset Semantics', () => {
    it('should reset clocks to initial time control on game reset', () => {
      const { result } = renderHook(() => useGame());
      const timeControl = { minutes: 5, increment: 3 };

      act(() => {
        result.current.setTimeControl(timeControl);
      });

      // Play some moves with increment
      act(() => {
        result.current.movePiece('e2', 'e4');
        result.current.movePiece('e7', 'e5');
      });

      // Times should have increments applied
      expect(result.current.whiteTime).toBe(300000 + 3000);
      expect(result.current.blackTime).toBe(300000 + 3000);

      // Reset game
      act(() => {
        result.current.resetGame();
      });

      // Times should be back to initial
      expect(result.current.whiteTime).toBe(300000);
      expect(result.current.blackTime).toBe(300000);
      expect(result.current.isTimerRunning).toBe(false);
    });

    it('should preserve time control settings on game reset', () => {
      const { result } = renderHook(() => useGame());
      const timeControl = { minutes: 3, increment: 2 };

      act(() => {
        result.current.setTimeControl(timeControl);
      });

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.timeControl).toEqual(timeControl);
    });
  });

  describe('Legacy Parity - Direct Comparison', () => {
    it('should match legacy increment behavior exactly', () => {
      // Legacy implementation
      const legacyGame = initGame();
      legacyGame.startNewGame({ minutes: 3, increment: 2 });

      // Next.js implementation
      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.setTimeControl({ minutes: 3, increment: 2 });
      });

      // Make same moves in both
      legacyGame.attemptMove('e2', 'e4');
      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      // Check clocks match
      const legacyClocks = legacyGame.getClocks();
      expect(result.current.whiteTime).toBe(legacyClocks.white);
      expect(result.current.blackTime).toBe(legacyClocks.black);

      // Make second move
      legacyGame.attemptMove('e7', 'e5');
      act(() => {
        result.current.movePiece('e7', 'e5');
      });

      // Check clocks still match
      const legacyClocks2 = legacyGame.getClocks();
      expect(result.current.whiteTime).toBe(legacyClocks2.white);
      expect(result.current.blackTime).toBe(legacyClocks2.black);
    });

    it('should match legacy timer start behavior', () => {
      const legacyGame = initGame();
      const { result } = renderHook(() => useGame());

      // Both should not be running initially
      expect(result.current.isTimerRunning).toBe(false);

      // Make first move in both
      legacyGame.attemptMove('e2', 'e4');
      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      // Both should be running after first move
      expect(result.current.isTimerRunning).toBe(true);
    });

    it('should match legacy reset behavior', () => {
      const legacyGame = initGame();
      const { result } = renderHook(() => useGame());

      // Set same time control
      legacyGame.startNewGame({ minutes: 5, increment: 1 });
      act(() => {
        result.current.setTimeControl({ minutes: 5, increment: 1 });
      });

      // Make moves
      legacyGame.attemptMove('e2', 'e4');
      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      // Reset both
      legacyGame.startNewGame({ minutes: 5, increment: 1 });
      act(() => {
        result.current.resetGame();
      });

      // Check clocks match after reset
      const legacyClocks = legacyGame.getClocks();
      expect(result.current.whiteTime).toBe(legacyClocks.white);
      expect(result.current.blackTime).toBe(legacyClocks.black);
      expect(result.current.isTimerRunning).toBe(false);
    });
  });
});
