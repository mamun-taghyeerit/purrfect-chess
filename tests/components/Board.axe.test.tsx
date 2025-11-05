import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Board from '@/components/Board';
import { RootStoreProvider } from '@/stores/store-setup';

// Note: toHaveNoViolations matcher is added in tests/setup.ts

describe('Board Axe Accessibility Tests', () => {
  // Helper to render Board with store provider
  const renderBoard = (props = {}) => {
    return render(
      <RootStoreProvider>
        <Board {...props} />
      </RootStoreProvider>
    );
  };

  it('should have no accessibility violations in default state', async () => {
    const { container } = renderBoard();
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with selected piece', async () => {
    const { container, getByLabelText } = renderBoard();
    
    // Select a piece
    const e2Square = getByLabelText(/e2.*White.*pawn/);
    e2Square.click();
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with engine highlights', async () => {
    const { container } = renderBoard({
      engineHighlights: [
        { from: 'e2', to: 'e4', rank: 1 },
        { from: 'd2', to: 'd4', rank: 2 },
      ],
    });
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with engine arrows', async () => {
    const { container } = renderBoard({
      engineHighlights: [
        { from: 'e2', to: 'e4', rank: 1 },
        { from: 'd2', to: 'd4', rank: 2 },
      ],
    });
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
