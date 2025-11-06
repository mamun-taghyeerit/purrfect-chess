'use client';

import React from 'react';
import { LAYOUT } from '@/lib/layout-constants';

/**
 * GameLayout - Three-column layout for the chess game
 *
 * Provides a responsive three-column layout with:
 * - Left Panel: White player controls (fixed width on xl screens)
 * - Center Panel: Chess board and game controls
 * - Right Panel: Black player controls (fixed width on xl screens)
 *
 * Key features:
 * - Fixed panel widths on xl screens prevent layout shift
 * - flex-shrink-0 prevents panels from shrinking
 * - Responsive: stacks vertically on smaller screens
 *
 * @param leftPanel - Content for the left control panel (white)
 * @param centerPanel - Content for the center (board and controls)
 * @param rightPanel - Content for the right control panel (black)
 */

interface GameLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export function GameLayout({
  leftPanel,
  centerPanel,
  rightPanel,
}: GameLayoutProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-5 items-start justify-center">
      {/* Left Panel: White Controls - Fixed width to prevent layout shift */}
      <div
        className="flex flex-col gap-5 w-full xl:flex-shrink-0"
        style={{
          width: '100%',
          maxWidth: `${LAYOUT.PANEL_WIDTH}px`,
        }}
      >
        {leftPanel}
      </div>

      {/* Center Panel: Board and Controls */}
      <div className="flex flex-col items-center gap-6 xl:flex-initial">
        {centerPanel}
      </div>

      {/* Right Panel: Black Controls - Fixed width to prevent layout shift */}
      <div
        className="flex flex-col gap-5 w-full xl:flex-shrink-0"
        style={{
          width: '100%',
          maxWidth: `${LAYOUT.PANEL_WIDTH}px`,
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
}
