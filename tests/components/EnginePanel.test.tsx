import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EnginePanel from '@/components/EnginePanel';

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

// Mock the useGame hook
vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    getFen: () => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    game: null,
  }),
}));

describe('EnginePanel component', () => {
  describe('rendering', () => {
    it('should render the engine panel header', () => {
      render(<EnginePanel />);
      expect(screen.getByText('Engine Analysis')).toBeInTheDocument();
    });

    it('should render Start Analysis button', () => {
      render(<EnginePanel />);
      expect(screen.getByText('Start Analysis')).toBeInTheDocument();
    });

    it('should render Stop button', () => {
      render(<EnginePanel />);
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    it('should render Close button', () => {
      render(<EnginePanel />);
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should show engine ready status', () => {
      render(<EnginePanel />);
      expect(screen.getByText('✓ Engine ready')).toBeInTheDocument();
    });

    it('should render depth slider control', () => {
      render(<EnginePanel />);
      expect(screen.getByText('Search Depth:')).toBeInTheDocument();
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('min', '6');
      expect(slider).toHaveAttribute('max', '30');
    });

    it('should render overlay mode controls', () => {
      render(<EnginePanel />);
      expect(screen.getByText('Overlay:')).toBeInTheDocument();
      expect(screen.getByText('Squares')).toBeInTheDocument();
      expect(screen.getByText('Arrows')).toBeInTheDocument();
      expect(screen.getByText('Both')).toBeInTheDocument();
    });
  });

  describe('analysis display', () => {
    it('should display multiple analysis lines', () => {
      render(<EnginePanel />);

      // Check for analysis line indicators
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('should display scores in centipawns', () => {
      render(<EnginePanel />);

      // +0.25 for first line, +0.15 for second line
      expect(screen.getByText('+0.25')).toBeInTheDocument();
      expect(screen.getByText('+0.15')).toBeInTheDocument();
    });

    it('should display best moves in SAN notation', () => {
      render(<EnginePanel />);

      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('d4')).toBeInTheDocument();
    });

    it('should display depth information', () => {
      render(<EnginePanel />);

      const depthElements = screen.getAllByText(/depth 18/i);
      expect(depthElements.length).toBeGreaterThan(0);
    });

    it('should display principal variation', () => {
      render(<EnginePanel />);

      // Both lines have the same PV: e4 d5 or d4 d5
      expect(screen.getByText('e4 d5')).toBeInTheDocument();
      expect(screen.getByText('d4 d5')).toBeInTheDocument();
    });
  });

  describe('controls', () => {
    it('should render Start Analysis button that can be clicked', () => {
      render(<EnginePanel />);

      const analyzeButton = screen.getByText('Start Analysis');
      expect(analyzeButton).toBeInTheDocument();

      // Should be clickable (not disabled)
      expect(analyzeButton).not.toBeDisabled();

      // Click should not throw
      fireEvent.click(analyzeButton);
    });

    it('should call onClose when Close button is clicked', () => {
      const onClose = vi.fn();
      render(<EnginePanel onClose={onClose} />);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should handle depth slider changes', () => {
      render(<EnginePanel />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '22' } });

      // Value should update in the display
      expect(screen.getByText('22')).toBeInTheDocument();
    });

    it('should handle overlay mode button clicks', () => {
      const onEngineDisplayModeChange = vi.fn();
      render(
        <EnginePanel
          engineDisplayMode="arrows"
          onEngineDisplayModeChange={onEngineDisplayModeChange}
        />
      );

      const squaresButton = screen.getByText('Squares');
      fireEvent.click(squaresButton);

      expect(onEngineDisplayModeChange).toHaveBeenCalledWith('squares');
    });
  });

  describe('footer', () => {
    it('should display Stockfish attribution', () => {
      render(<EnginePanel />);

      expect(screen.getByText(/Powered by Stockfish 17/i)).toBeInTheDocument();
    });
  });
});
