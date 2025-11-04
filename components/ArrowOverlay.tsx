/**
 * ArrowOverlay Component
 * 
 * Renders SVG arrows for engine analysis (multi-PV moves)
 * Matching legacy implementation (src/board.ts lines 248-381)
 * 
 * Features:
 * - SVG viewBox coordinate system (0-8 for 8×8 board)
 * - Arrow head markers with context-stroke color
 * - Knight move arrows with bent paths
 * - Multiple arrows with rank-based colors (1-3)
 * - Positioned absolutely over board
 */

import React from 'react';

// Arrow constants (matching legacy)
const SVG_NS = 'http://www.w3.org/2000/svg';
const ARROW_THICKNESS = 0.16;
const ARROW_HEAD_ID = 'board-arrow-head';
const ARROW_HEAD_SIZE = 0.35;
const ARROW_HEAD_LENGTH = 0.1;
const ARROW_TAIL_OFFSET = 0.32;

export interface Arrow {
  from: string;
  to: string;
  rank: number; // 1-3 for multi-PV ranking
}

export interface ArrowOverlayProps {
  arrows: Arrow[];
}

/**
 * Parse algebraic notation to file/rank indices
 */
function parseSquare(square: string): { file: number; rank: number } | null {
  if (typeof square !== 'string' || square.length < 2) return null;
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIndex = files.indexOf(square[0]);
  const rankValue = Number.parseInt(square[1], 10);
  if (fileIndex === -1 || Number.isNaN(rankValue)) return null;
  const rankIndex = 8 - rankValue;
  if (rankIndex < 0 || rankIndex > 7) return null;
  return { file: fileIndex, rank: rankIndex };
}

/**
 * Get center point of square in SVG coordinates (0-8 range)
 */
function squareCenter(square: string): { x: number; y: number } | null {
  const coords = parseSquare(square);
  if (!coords) return null;
  return {
    x: coords.file + 0.5,
    y: coords.rank + 0.5,
  };
}

/**
 * Check if move is a knight move (L-shape)
 */
function isKnightMove(from: string, to: string): boolean {
  const start = parseSquare(from);
  const end = parseSquare(to);
  if (!start || !end) return false;
  const dx = Math.abs(end.file - start.file);
  const dy = Math.abs(end.rank - start.rank);
  return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
}

/**
 * Shorten last segment of path by offset (for arrow head space)
 */
function shortenLastSegment(
  points: { x: number; y: number }[],
  offset: number
): { x: number; y: number }[] {
  if (!Array.isArray(points) || points.length < 2) return points;
  const result = points.map((pt) => ({ x: pt.x, y: pt.y }));
  const lastIndex = result.length - 1;
  const from = result[lastIndex - 1];
  const to = result[lastIndex];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < offset) {
    return result;
  }
  const scale = (length - offset) / length;
  result[lastIndex] = {
    x: from.x + dx * scale,
    y: from.y + dy * scale,
  };
  return result;
}

/**
 * Build SVG path data from points
 */
function buildPath(points: { x: number; y: number }[]): string | null {
  if (!Array.isArray(points) || points.length === 0) return null;
  const [first, ...rest] = points;
  const commands = [`M ${first.x} ${first.y}`];
  rest.forEach((pt) => {
    commands.push(`L ${pt.x} ${pt.y}`);
  });
  return commands.join(' ');
}

/**
 * Build arrow points (with knight move handling)
 */
function buildArrowPoints(
  from: string,
  to: string
): { x: number; y: number }[] | null {
  const start = squareCenter(from);
  const end = squareCenter(to);
  if (!start || !end) return null;

  // Straight arrow for non-knight moves
  if (!isKnightMove(from, to)) {
    return shortenLastSegment([start, end], ARROW_HEAD_LENGTH);
  }

  // Bent arrow for knight moves
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  let bend;

  if (absDx > absDy) {
    bend = { x: end.x, y: start.y };
  } else {
    bend = { x: start.x, y: end.y };
  }

  const tailDx = bend.x === start.x ? 0 : Math.sign(bend.x - start.x);
  const tailDy = bend.y === start.y ? 0 : Math.sign(bend.y - start.y);
  const tailPoint = {
    x: start.x + tailDx * ARROW_TAIL_OFFSET,
    y: start.y + tailDy * ARROW_TAIL_OFFSET,
  };

  return shortenLastSegment([start, tailPoint, bend, end], ARROW_HEAD_LENGTH);
}

/**
 * Build arrow path string
 */
function buildArrowPath(from: string, to: string): string | null {
  const points = buildArrowPoints(from, to);
  if (!points) return null;
  return buildPath(points);
}

export default function ArrowOverlay({ arrows }: ArrowOverlayProps) {
  if (!arrows || arrows.length === 0) {
    return null;
  }

  return (
    <svg
      className="board-arrow-layer"
      viewBox="0 0 8 8"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {/* Arrow head marker definition */}
      <defs>
        <marker
          id={ARROW_HEAD_ID}
          markerWidth={ARROW_HEAD_SIZE}
          markerHeight={ARROW_HEAD_SIZE}
          refX="1"
          refY="0.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
          viewBox="0 0 1 1"
        >
          <path d="M 0 0 L 1 0.5 L 0 1 Z" fill="context-stroke" stroke="none" />
        </marker>
      </defs>

      {/* Render arrows */}
      {arrows.map((arrow, index) => {
        const pathData = buildArrowPath(arrow.from, arrow.to);
        if (!pathData) return null;

        // Clamp rank to 1-3
        const rank = Math.min(Math.max(arrow.rank, 1), 3);

        return (
          <path
            key={`engine-arrow-${index}`}
            className={`board-arrow engine-arrow engine-arrow-${rank}`}
            d={pathData}
            fill="none"
            strokeWidth={ARROW_THICKNESS}
            strokeLinecap="butt"
            strokeLinejoin="round"
            markerEnd={`url(#${ARROW_HEAD_ID})`}
            style={{ pointerEvents: 'none' }}
          />
        );
      })}
    </svg>
  );
}
