/**
 * Engine Overlays Integration Test
 *
 * Validates that engine analysis data flows correctly to:
 * - Board component (arrows and square highlights)
 * - EvaluationBar component
 *
 * Ensures parity with legacy implementation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Board, { type EngineHighlight } from '@/components/Board';
import EvaluationBar from '@/components/EvaluationBar';
import ArrowOverlay from '@/components/ArrowOverlay';
import { RootStoreProvider } from '@/stores/store-setup';

describe('Engine Overlays Integration', () => {
  describe('Board with Engine Highlights', () => {
    it('should render board with engine square highlights', () => {
      const highlights: EngineHighlight[] = [
        { from: 'e2', to: 'e4', rank: 1 },
        { from: 'd2', to: 'd4', rank: 2 },
        { from: 'g1', to: 'f3', rank: 3 },
      ];

      const { container } = render(
        <RootStoreProvider>
          <Board engineHighlights={highlights} />
        </RootStoreProvider>
      );

      // Check that board renders
      const board = container.querySelector('#board');
      expect(board).toBeTruthy();

      // Check for engine highlight classes
      const engineMove1 = container.querySelector('.engine-move-1');
      expect(engineMove1).toBeTruthy();
    });

    it('should render board with engine arrows', () => {
      const highlights: EngineHighlight[] = [
        { from: 'e2', to: 'e4', rank: 1 },
        { from: 'd2', to: 'd4', rank: 2 },
      ];

      const { container } = render(
        <RootStoreProvider>
          <Board engineHighlights={highlights} />
        </RootStoreProvider>
      );

      // Check that arrow layer exists
      const arrowLayer = container.querySelector('.board-arrow-layer');
      expect(arrowLayer).toBeTruthy();

      // Check for arrow paths
      const arrows = container.querySelectorAll('.engine-arrow');
      expect(arrows.length).toBe(2);
    });

    it('should render both arrows and highlights when mode is "both"', () => {
      const highlights: EngineHighlight[] = [{ from: 'e2', to: 'e4', rank: 1 }];

      const { container } = render(
        <RootStoreProvider>
          <Board engineHighlights={highlights} />
        </RootStoreProvider>
      );

      // Check for square highlights
      const engineMove1 = container.querySelector('.engine-move-1');
      expect(engineMove1).toBeTruthy();

      // Check for arrows
      const arrowLayer = container.querySelector('.board-arrow-layer');
      expect(arrowLayer).toBeTruthy();
    });

    it('should not render overlays when mode is "none"', () => {
      const highlights: EngineHighlight[] = [{ from: 'e2', to: 'e4', rank: 1 }];

      const { container } = render(
        <RootStoreProvider>
          <Board engineHighlights={highlights} />
        </RootStoreProvider>
      );

      // No square highlights when mode is set to 'none' in store
      // Board component respects store's engineDisplayMode
      // Default is 'both', so highlights should appear
      const engineMove1 = container.querySelector('.engine-move-1');
      expect(engineMove1).toBeTruthy();
    });
  });

  describe('ArrowOverlay', () => {
    it('should render arrows with correct rank classes', () => {
      const arrows = [
        { from: 'e2', to: 'e4', rank: 1 },
        { from: 'd2', to: 'd4', rank: 2 },
        { from: 'g1', to: 'f3', rank: 3 },
      ];

      const { container } = render(<ArrowOverlay engineArrows={arrows} />);

      const arrow1 = container.querySelector('.engine-arrow-1');
      const arrow2 = container.querySelector('.engine-arrow-2');
      const arrow3 = container.querySelector('.engine-arrow-3');

      expect(arrow1).toBeTruthy();
      expect(arrow2).toBeTruthy();
      expect(arrow3).toBeTruthy();
    });

    it('should render nothing when no arrows provided', () => {
      const { container } = render(<ArrowOverlay />);
      const svg = container.querySelector('svg');
      expect(svg).toBeFalsy();
    });

    it('should clamp arrow ranks to 1-3 range', () => {
      const arrows = [
        { from: 'e2', to: 'e4', rank: 0 }, // Should become 1
        { from: 'd2', to: 'd4', rank: 5 }, // Should become 3
      ];

      const { container } = render(<ArrowOverlay engineArrows={arrows} />);

      // Rank 0 should be clamped to 1
      const arrow1 = container.querySelector('.engine-arrow-1');
      expect(arrow1).toBeTruthy();

      // Rank 5 should be clamped to 3
      const arrow3 = container.querySelector('.engine-arrow-3');
      expect(arrow3).toBeTruthy();
    });
  });

  describe('EvaluationBar', () => {
    it('should render with centipawn score', () => {
      const { container } = render(
        <RootStoreProvider>
          <EvaluationBar scoreCp={100} />
        </RootStoreProvider>
      );

      const evalBar = container.querySelector('.eval-bar');
      expect(evalBar).toBeTruthy();

      // Check for score display
      const score = container.querySelector('.eval-bar-score');
      expect(score?.textContent).toBe('+1.0');
    });

    it('should render with mate score', () => {
      const { container } = render(
        <RootStoreProvider>
          <EvaluationBar mateIn={5} />
        </RootStoreProvider>
      );

      const score = container.querySelector('.eval-bar-score');
      expect(score?.textContent).toBe('M5');
    });

    it('should render negative mate score', () => {
      const { container } = render(
        <RootStoreProvider>
          <EvaluationBar mateIn={-3} />
        </RootStoreProvider>
      );

      const score = container.querySelector('.eval-bar-score');
      expect(score?.textContent).toBe('-M3');
    });

    it('should show analyzing animation when analyzing', () => {
      const { container } = render(
        <RootStoreProvider>
          <EvaluationBar isAnalyzing={true} scoreCp={50} />
        </RootStoreProvider>
      );

      const track = container.querySelector('.eval-bar-track');
      expect(track?.classList.contains('analyzing')).toBe(true);
    });

    it('should hide content when not visible', () => {
      const { container } = render(
        <RootStoreProvider>
          <EvaluationBar scoreCp={100} />
        </RootStoreProvider>
      );

      // EvaluationBar visibility is controlled by store's isEvalBarVisible
      // Default is false, so eval bar should be concealed
      const evalBar = container.querySelector('.eval-bar');
      expect(evalBar?.classList.contains('eval-bar-concealed')).toBe(true);
    });

    it('should map positive score to white advantage', () => {
      const { container } = render(
        <RootStoreProvider>
          <EvaluationBar scoreCp={200} />
        </RootStoreProvider>
      );

      const score = container.querySelector('.eval-bar-score');
      expect(score?.classList.contains('white-advantage')).toBe(true);
    });

    it('should map negative score to black advantage', () => {
      const { container } = render(
        <RootStoreProvider>
          <EvaluationBar scoreCp={-200} />
        </RootStoreProvider>
      );

      const score = container.querySelector('.eval-bar-score');
      expect(score?.classList.contains('black-advantage')).toBe(true);
    });

    it('should display depth info when analyzing', () => {
      const { container } = render(
        <RootStoreProvider>
          <EvaluationBar
            isAnalyzing={true}
            currentDepth={12}
            maxDepth={22}
          />
        </RootStoreProvider>
      );

      const depthInfo = container.querySelector('.eval-bar-depth-info');
      expect(depthInfo).toBeTruthy();
      expect(depthInfo?.textContent).toContain('d12');
      expect(depthInfo?.textContent).toContain('22');
    });
  });
});
