import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Board from '@/components/Board';
import * as useGameModule from '@/hooks/useGame';

// Note: toHaveNoViolations matcher is added in tests/setup.ts

// Mock the useGame hook
const mockMovePiece = vi.fn();
const mockResetGame = vi.fn();
const mockLoadFen = vi.fn();
const mockGetFen = vi.fn();
const mockGetPgn = vi.fn();
const mockSetTimeControl = vi.fn();

const createMockGameState = (overrides = {}) => ({
  position: {
    e2: { type: 'p', color: 'w' },
    e7: { type: 'p', color: 'b' },
    d2: { type: 'p', color: 'w' },
    d7: { type: 'p', color: 'b' },
    e1: { type: 'k', color: 'w' },
    e8: { type: 'k', color: 'b' },
    ...overrides.position,
  },
  turn: 'w',
  history: [],
  isGameOver: false,
  check: false,
  checkmate: false,
  stalemate: false,
  draw: false,
  whiteTime: 300000,
  blackTime: 300000,
  timeControl: { minutes: 5, increment: 0 },
  ...overrides,
});

const createMockGame = () => ({
  moves: vi.fn(() => [
    { from: 'e2', to: 'e3', san: 'e3', flags: 'n' },
    { from: 'e2', to: 'e4', san: 'e4', flags: 'b' },
  ]),
  fen: vi.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
  pgn: vi.fn(() => ''),
  load: vi.fn(() => true),
  move: vi.fn(),
  reset: vi.fn(),
  turn: vi.fn(() => 'w'),
  isCheck: vi.fn(() => false),
  isCheckmate: vi.fn(() => false),
  isStalemate: vi.fn(() => false),
  isThreefoldRepetition: vi.fn(() => false),
  isInsufficientMaterial: vi.fn(() => false),
  isDraw: vi.fn(() => false),
  isGameOver: vi.fn(() => false),
  history: vi.fn(() => []),
});

describe('Board Axe Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useGame hook
    vi.spyOn(useGameModule, 'useGame').mockReturnValue({
      ...createMockGameState(),
      game: createMockGame() as any,
      movePiece: mockMovePiece.mockReturnValue(false),
      resetGame: mockResetGame,
      loadFen: mockLoadFen,
      getFen: mockGetFen,
      getPgn: mockGetPgn,
      loadPgn: vi.fn(),
      setTimeControl: mockSetTimeControl,
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      isTimerRunning: false,
      threefoldRepetition: false,
      insufficientMaterial: false,
    });
  });

  it('should have no accessibility violations in default state', async () => {
    const { container } = render(<Board />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with selected piece', async () => {
    const { container, getByLabelText } = render(<Board />);
    
    // Select a piece
    const e2Square = getByLabelText(/e2.*White.*pawn/);
    e2Square.click();
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with engine highlights', async () => {
    const { container } = render(
      <Board
        engineHighlights={[
          { from: 'e2', to: 'e4', rank: 1 },
          { from: 'd2', to: 'd4', rank: 2 },
        ]}
        engineDisplayMode="squares"
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with engine arrows', async () => {
    const { container } = render(
      <Board
        engineHighlights={[
          { from: 'e2', to: 'e4', rank: 1 },
          { from: 'd2', to: 'd4', rank: 2 },
        ]}
        engineDisplayMode="arrows"
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
