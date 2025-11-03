/**
 * Common type definitions for Purrfect Chess
 */

import type { Chess } from 'chess.js';

/**
 * Time control configuration
 */
export interface TimeControl {
  minutes: number;
  increment: number;
  label?: string; // Optional label for time control presets
}

/**
 * Clock state
 */
export interface ClockState {
  white: number;
  black: number;
  active: 'w' | 'b';
}

/**
 * Move information
 */
export interface MoveInfo {
  from: string;
  to: string;
  san: string;
  color: 'w' | 'b';
  preFen: string;
  postFen: string;
  promotion: string | null;
  moveNumber: number;
}

/**
 * Last move display info
 */
export interface LastMove {
  from: string;
  to: string;
}

/**
 * Engine analysis line result
 */
export interface EngineAnalysisLine {
  multipv: number;
  uci: string;
  from: string;
  to: string;
  san: string;
  score: number;
  scoreType: 'cp' | 'mate';
  rawScore: number;
  pvLine: string;
}

/**
 * Engine highlight for board rendering
 */
export interface EngineHighlight {
  from: string;
  to: string;
  rank: number;
}

/**
 * Board rendering options
 */
export interface BoardRenderOptions {
  selectedSquare?: string | null;
  legalMoves?: string[];
  captureMoves?: string[];
  lastMove?: LastMove | null;
  customHighlights?: string[];
  engineHighlights?: EngineHighlight[];
  engineDisplayMode?: 'both' | 'arrows' | 'squares';
  isDragging?: boolean;
}

/**
 * Board controller callbacks
 */
export interface BoardCallbacks {
  onSquareClick?: (square: string, context?: any) => void;
  onDrop?: (from: string, to: string) => void;
  onSquareContext?: (square: string) => void;
  onDragStart?: (square: string) => void;
  onDragEnd?: () => void;
}

/**
 * Game event handlers
 */
export interface GameHandlers {
  onMove?: (event: any) => void;
  onGameOver?: (payload: any) => void;
}

/**
 * UI event handlers
 */
export interface UIHandlers {
  onTimePreset?: (control: TimeControl) => void;
  onStartNewGame?: (control: TimeControl) => void;
  onResetGame?: () => void;
  onCopyFen?: () => string;
  onCopyPgn?: () => string;
  onSetFen?: (fen: string) => any;
  onSetPgn?: (pgn: string) => any;
  onStartAnalysis?: (options: { depth: number }) => void;
  onStopAnalysis?: () => void;
  onRevealEnginePanel?: () => void;
  onEngineOverlayModeChange?: (mode: string) => void;
  onEvalBarVisibilityChange?: (visible: boolean) => void;
  onEnginePanelVisibilityChange?: (visible: boolean) => void;
  onMoveReview?: () => void;
}

/**
 * Match/game metadata
 */
export interface MatchInfo {
  title?: string;
  event?: string;
  date?: string;
  timeControl?: string;
  site?: string;
}
