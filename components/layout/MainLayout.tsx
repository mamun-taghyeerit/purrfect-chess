'use client';

import React from 'react';
import { LAYOUT, COLORS } from '@/lib/layout-constants';

/**
 * MainLayout - Root layout component for the application
 *
 * Provides the main container with consistent spacing and max-width constraints.
 * This is the top-level layout wrapper for all pages.
 *
 * @param children - Content to render within the layout
 */

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main
      className="flex min-h-screen flex-col items-center p-5"
      style={{ backgroundColor: COLORS.background.main }}
    >
      <div
        className="z-10 w-full"
        style={{
          maxWidth: `${LAYOUT.MAX_CONTAINER_WIDTH}px`,
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </main>
  );
}
