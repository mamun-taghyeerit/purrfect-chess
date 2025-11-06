'use client';

import React from 'react';
import { LAYOUT, COLORS } from '@/lib/layout-constants';

/**
 * ControlPanel - Reusable panel component for player controls
 *
 * Provides a consistent styled container for control panels with:
 * - Fixed width to prevent layout shift
 * - Consistent styling (background, shadows, borders)
 * - Title header with separator
 *
 * Used for both White and Black control panels.
 *
 * @param title - Panel title (e.g., "White Controls", "Black Controls")
 * @param children - Panel content (clocks, appearance controls, etc.)
 */

interface ControlPanelProps {
  title: string;
  children: React.ReactNode;
}

export function ControlPanel({ title, children }: ControlPanelProps) {
  return (
    <div
      className="rounded-xl p-5 w-full"
      style={{
        backgroundColor: COLORS.background.panel,
        boxShadow: COLORS.shadow.inset,
        minWidth: `${LAYOUT.PANEL_WIDTH}px`,
        maxWidth: `${LAYOUT.PANEL_WIDTH}px`,
      }}
    >
      <h2
        className="text-2xl font-semibold text-center mb-5 pb-2.5"
        style={{
          borderBottom: `2px solid ${COLORS.border.primary}`,
          color: COLORS.text.primary,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
