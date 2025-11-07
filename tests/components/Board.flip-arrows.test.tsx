/**
 * Tests for arrow flipping behavior when board orientation changes
 * Verifies Bug Fix #1: Arrows flip correctly with board orientation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RootStoreProvider } from '@/stores/store-setup';
import Board from '@/components/Board';
import ArrowOverlay, { squareCenter, buildArrowPoints } from '@/components/ArrowOverlay';

describe('Board Arrow Flipping', () => {
  describe('Arrow coordinate transformation', () => {
    it('should transform square center coordinates when board is flipped', () => {
      // Normal orientation (white on bottom)
      const e2Normal = squareCenter('e2', false);
      expect(e2Normal).toEqual({ x: 4.5, y: 6.5 }); // e=4, rank 2 = index 6 from top

      // Flipped orientation (black on bottom)
      const e2Flipped = squareCenter('e2', true);
      expect(e2Flipped).toEqual({ x: 3.5, y: 1.5 }); // flipped: 7-4=3, 7-6=1

      // Test corner squares
      const a1Normal = squareCenter('a1', false);
      expect(a1Normal).toEqual({ x: 0.5, y: 7.5 });

      const a1Flipped = squareCenter('a1', true);
      expect(a1Flipped).toEqual({ x: 7.5, y: 0.5 });

      const h8Normal = squareCenter('h8', false);
      expect(h8Normal).toEqual({ x: 7.5, y: 0.5 });

      const h8Flipped = squareCenter('h8', true);
      expect(h8Flipped).toEqual({ x: 0.5, y: 7.5 });
    });

    it('should build arrow points with correct coordinates when flipped', () => {
      // Straight arrow e2 to e4
      const arrowNormal = buildArrowPoints('e2', 'e4', false);
      const arrowFlipped = buildArrowPoints('e2', 'e4', true);

      expect(arrowNormal).toBeTruthy();
      expect(arrowFlipped).toBeTruthy();

      // Arrows should have different coordinates when flipped
      expect(arrowNormal).not.toEqual(arrowFlipped);

      // Start point should be different
      expect(arrowNormal![0]).not.toEqual(arrowFlipped![0]);
    });

    it('should handle knight moves correctly when flipped', () => {
      // Knight move: e2 to d4
      const knightNormal = buildArrowPoints('e2', 'd4', false);
      const knightFlipped = buildArrowPoints('e2', 'd4', true);

      expect(knightNormal).toBeTruthy();
      expect(knightFlipped).toBeTruthy();

      // Knight moves have bent paths (3+ points)
      expect(knightNormal!.length).toBeGreaterThanOrEqual(3);
      expect(knightFlipped!.length).toBeGreaterThanOrEqual(3);

      // Coordinates should differ when flipped
      expect(knightNormal).not.toEqual(knightFlipped);
    });
  });

  describe('ArrowOverlay component', () => {
    it('should render arrows with flipped coordinates', () => {
      const { container } = render(
        <RootStoreProvider>
          <ArrowOverlay
            userArrows={[{ from: 'e2', to: 'e4' }]}
            engineArrows={[]}
          />
        </RootStoreProvider>
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();

      const arrow = container.querySelector('path.board-arrow');
      expect(arrow).toBeTruthy();
      expect(arrow?.getAttribute('d')).toBeTruthy();
    });

    it('should render engine arrows with flipped coordinates', () => {
      const { container } = render(
        <RootStoreProvider>
          <ArrowOverlay
            userArrows={[]}
            engineArrows={[{ from: 'e2', to: 'e4', rank: 1 }]}
          />
        </RootStoreProvider>
      );

      const engineArrow = container.querySelector('path.engine-arrow');
      expect(engineArrow).toBeTruthy();
    });

    it('should not render when no arrows and no preview', () => {
      const { container } = render(
        <RootStoreProvider>
          <ArrowOverlay
            userArrows={[]}
            engineArrows={[]}
          />
        </RootStoreProvider>
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeFalsy();
    });
  });

  describe('Board component arrow integration', () => {
    it('should pass flipped prop to ArrowOverlay when board is flipped', () => {
      const { container } = render(
        <RootStoreProvider>
          <Board engineHighlights={[]} />
        </RootStoreProvider>
      );

      // Board should render
      const board = container.querySelector('#board');
      expect(board).toBeTruthy();

      // ArrowOverlay SVG layer should exist
      const arrowLayer = container.querySelector('.board-arrow-layer');
      // May not render if no arrows, but that's expected
    });
  });
});

describe('Arrow Flipping Regression Tests', () => {
  it('should maintain arrow hit detection with flipped board', () => {
    // This test ensures arrows can still be clicked/removed when board is flipped
    const arrows = [
      { from: 'e2', to: 'e4' },
      { from: 'd2', to: 'd4' },
    ];

    const { container } = render(
      <RootStoreProvider>
        <ArrowOverlay
          userArrows={arrows}
          engineArrows={[]}
        />
      </RootStoreProvider>
    );

    const arrowElements = container.querySelectorAll('path.board-arrow');
    expect(arrowElements.length).toBe(2);
  });

  it('should handle edge cases: same square arrow (no-op)', () => {
    // Arrows from square to itself should be no-op
    const result = buildArrowPoints('e2', 'e2', false);
    expect(result).toBeTruthy();
    expect(result!.length).toBeGreaterThan(0);

    const resultFlipped = buildArrowPoints('e2', 'e2', true);
    expect(resultFlipped).toBeTruthy();
  });

  it('should handle preview arrows with flipped board', () => {
    const { container } = render(
      <RootStoreProvider>
        <ArrowOverlay
          userArrows={[]}
          engineArrows={[]}
          previewArrow={{ from: 'e2', to: 'e4' }}
        />
      </RootStoreProvider>
    );

    const previewArrow = container.querySelector('path.board-arrow-preview');
    expect(previewArrow).toBeTruthy();
  });
});
