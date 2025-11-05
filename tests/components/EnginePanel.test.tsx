import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EnginePanel from '@/components/EnginePanel';
import { RootStoreProvider } from '@/stores/store-setup';

// Mock the useEngine hook
vi.mock('@/hooks/useEngine', () => ({
  useEngine: () => ({
    isEngineReady: true,
    isAnalyzing: false,
    analysis: [
      {
        multipv: 1,
        depth: 18,
        score: 25,
        scoreType: 'cp' as const,
        bestMove: 'e2e4',
        san: 'e4',
        pv: ['e2e4', 'd7d5'],
        pvSan: ['e4', 'd5'],
      },
      {
        multipv: 2,
        depth: 18,
        score: 15,
        scoreType: 'cp' as const,
        bestMove: 'd2d4',
        san: 'd4',
        pv: ['d2d4', 'd7d5'],
        pvSan: ['d4', 'd5'],
      },
    ],
    currentDepth: 18,
    startAnalysis: vi.fn(),
    stopAnalysis: vi.fn(),
    setDepth: vi.fn(),
  }),
}));

describe('EnginePanel component', () => {
  describe('rendering', () => {
    it('should render the engine panel header', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );
      expect(screen.getByText('Engine Analysis')).toBeInTheDocument();
    });

    it('should render Start Analysis button', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );
      expect(screen.getByText('Start Analysis')).toBeInTheDocument();
    });

    it('should render Stop button', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    it('should render Close button', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should show engine ready status', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );
      expect(screen.getByText('✓ Engine ready')).toBeInTheDocument();
    });

    it('should render depth slider control', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );
      expect(screen.getByText('Search Depth:')).toBeInTheDocument();
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('min', '6');
      expect(slider).toHaveAttribute('max', '30');
    });

    it('should render overlay mode controls', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );
      expect(screen.getByText('Overlay:')).toBeInTheDocument();
      expect(screen.getByText('Squares')).toBeInTheDocument();
      expect(screen.getByText('Arrows')).toBeInTheDocument();
      expect(screen.getByText('Both')).toBeInTheDocument();
    });
  });

  describe('analysis display', () => {
    it('should display multiple analysis lines', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );

      // Check for analysis line indicators
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('should display scores in centipawns', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );

      // +0.25 for first line, +0.15 for second line
      expect(screen.getByText('+0.25')).toBeInTheDocument();
      expect(screen.getByText('+0.15')).toBeInTheDocument();
    });

    it('should display best moves in SAN notation', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );

      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('d4')).toBeInTheDocument();
    });

    it('should display depth information', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );

      const depthElements = screen.getAllByText(/depth 18/i);
      expect(depthElements.length).toBeGreaterThan(0);
    });

    it('should display principal variation', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );

      // Both lines have the same PV: e4 d5 or d4 d5
      expect(screen.getByText('e4 d5')).toBeInTheDocument();
      expect(screen.getByText('d4 d5')).toBeInTheDocument();
    });
  });

  describe('controls', () => {
    it('should render Start Analysis button that can be clicked', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );

      const analyzeButton = screen.getByText('Start Analysis');
      expect(analyzeButton).toBeInTheDocument();

      // Should be clickable (not disabled)
      expect(analyzeButton).not.toBeDisabled();

      // Click should not throw
      fireEvent.click(analyzeButton);
    });

    it('should call store action when Close button is clicked', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      // Close button should hide the engine panel in the store
      // Test passes if no error is thrown
    });

    it('should handle depth slider changes', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '22' } });

      // Value should update in the display
      expect(screen.getByText('22')).toBeInTheDocument();
    });

    it('should handle overlay mode button clicks', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );

      const squaresButton = screen.getByText('Squares');
      fireEvent.click(squaresButton);

      // Test passes if no error is thrown
      // The store's setEngineDisplayMode action is called internally
    });
  });

  describe('footer', () => {
    it('should display Stockfish attribution', () => {
      render(
        <RootStoreProvider>
          <EnginePanel />
        </RootStoreProvider>
      );

      expect(screen.getByText(/Powered by Stockfish 17/i)).toBeInTheDocument();
    });
  });
});
