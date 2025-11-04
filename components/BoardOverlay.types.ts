/**
 * BoardOverlay Type Definitions
 * 
 * Purpose: Define prop interfaces for board overlay features
 * (arrows, highlights, evaluation indicators, etc.)
 * 
 * Status: TYPE DEFINITIONS ONLY - No components implemented yet.
 * 
 * Phase X Task: Use these types when implementing arrow drawing
 * and other board overlay features.
 * 
 * Separation of Concerns:
 * - This file contains ONLY type definitions
 * - Component implementations go in separate files
 * - Enables parallel development without merge conflicts
 */

/**
 * Arrow overlay for showing moves/analysis
 */
export interface Arrow {
  /** Starting square (e.g., "e2") */
  from: string;
  
  /** Ending square (e.g., "e4") */
  to: string;
  
  /** Arrow color/style */
  color?: ArrowColor;
  
  /** Arrow opacity (0-1) */
  opacity?: number;
  
  /** Unique identifier for this arrow */
  id?: string;
}

export type ArrowColor = 
  | 'green'    // Default move arrow
  | 'red'      // Bad move indicator
  | 'yellow'   // Alternate move
  | 'blue'     // Best move from engine
  | 'orange';  // Second best move

/**
 * Square highlight (different from legal move indicators)
 */
export interface SquareHighlight {
  /** Square to highlight (e.g., "e4") */
  square: string;
  
  /** Highlight color */
  color: HighlightColor;
  
  /** Highlight opacity (0-1) */
  opacity?: number;
  
  /** Unique identifier */
  id?: string;
}

export type HighlightColor =
  | 'yellow'   // Last move
  | 'blue'     // Selected square
  | 'red'      // Check/threat
  | 'green'    // Safe move
  | 'orange';  // Engine suggestion

/**
 * Props for ArrowOverlay component (to be implemented)
 */
export interface ArrowOverlayProps {
  /** Array of arrows to display */
  arrows: Arrow[];
  
  /** Board size in pixels (for scaling) */
  boardSize: number;
  
  /** Callback when arrow is added (right-click drag) */
  onArrowAdd?: (arrow: Arrow) => void;
  
  /** Callback when arrow is removed */
  onArrowRemove?: (arrowId: string) => void;
  
  /** Callback when all arrows cleared */
  onArrowsClear?: () => void;
}

/**
 * Props for SquareOverlay component (to be implemented)
 */
export interface SquareOverlayProps {
  /** Array of square highlights to display */
  highlights: SquareHighlight[];
  
  /** Board size in pixels */
  boardSize: number;
}

/**
 * Props for LegalMoveOverlay component (already implemented in Board.tsx)
 * Extracted here for consistency
 */
export interface LegalMoveOverlayProps {
  /** Squares where legal moves can be made */
  legalMoveSquares: string[];
  
  /** Board size in pixels */
  boardSize: number;
  
  /** Whether to show capture indicators */
  showCaptureIndicators?: boolean;
}

/**
 * Combined overlay props for composite overlay component
 */
export interface BoardOverlaysProps {
  /** Arrow overlays */
  arrows?: Arrow[];
  
  /** Square highlights */
  highlights?: SquareHighlight[];
  
  /** Legal move indicators */
  legalMoves?: string[];
  
  /** Board size in pixels */
  boardSize: number;
  
  /** Enable/disable arrow creation via right-click drag */
  enableArrowDrawing?: boolean;
  
  /** Callbacks for arrow manipulation */
  onArrowAdd?: (arrow: Arrow) => void;
  onArrowRemove?: (arrowId: string) => void;
  onArrowsClear?: () => void;
}

/**
 * Utility type for square coordinates (0-7 for file/rank)
 */
export interface SquareCoordinates {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
}

/**
 * Utility functions for working with overlays
 * (implementations go in separate utils file)
 */
export interface OverlayUtils {
  /** Convert algebraic notation to pixel coordinates */
  squareToPixels: (square: string, boardSize: number) => { x: number; y: number };
  
  /** Convert pixel coordinates to algebraic notation */
  pixelsToSquare: (x: number, y: number, boardSize: number) => string | null;
  
  /** Calculate arrow path for SVG rendering */
  calculateArrowPath: (from: string, to: string, boardSize: number) => string;
  
  /** Check if two arrows are equivalent */
  arrowsEqual: (arrow1: Arrow, arrow2: Arrow) => boolean;
}

/**
 * TODO (Phase X Implementation):
 * 
 * 1. Create components/overlays/ArrowOverlay.tsx
 *    - Implement arrow rendering with SVG
 *    - Handle right-click drag to create arrows
 *    - Support multiple arrows
 *    - Match legacy app arrow style
 * 
 * 2. Create components/overlays/SquareOverlay.tsx
 *    - Render square highlights
 *    - Support different colors/opacities
 * 
 * 3. Create lib/overlay-utils.ts
 *    - Implement utility functions defined above
 *    - Pure functions for coordinate conversion
 *    - SVG path generation for arrows
 * 
 * 4. Update Board.tsx
 *    - Add overlay layers
 *    - Wire up arrow drawing interaction
 *    - Integrate with existing legal move highlights
 * 
 * 5. Add tests in tests/components/overlays/
 *    - Test arrow creation/deletion
 *    - Test coordinate conversion
 *    - Test parity with legacy app
 */
