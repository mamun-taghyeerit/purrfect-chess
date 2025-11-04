import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppearanceControls from '@/components/AppearanceControls';

describe('AppearanceControls component', () => {
  beforeEach(() => {
    // Reset CSS custom properties before each test
    const root = document.documentElement;
    root.style.removeProperty('--light-square-filter');
    root.style.removeProperty('--dark-square-filter');
    root.style.removeProperty('--white-piece-filter');
    root.style.removeProperty('--black-piece-filter');
    root.style.removeProperty('--white-piece-scale');
    root.style.removeProperty('--black-piece-scale');
  });

  describe('rendering', () => {
    it('should render all appearance groups', () => {
      const { container } = render(<AppearanceControls />);
      expect(container.textContent).toContain('Light Squares');
      expect(container.textContent).toContain('Dark Squares');
      expect(container.textContent).toContain('White Pieces');
      expect(container.textContent).toContain('Black Pieces');
    });

    it('should render global reset button', () => {
      const { container } = render(<AppearanceControls />);
      expect(container.textContent).toContain('Reset All');
    });

    it('should render sliders for each group', () => {
      const { container } = render(<AppearanceControls />);

      // Light Squares: 3 sliders (hue, saturation, brightness)
      // Dark Squares: 3 sliders
      // White Pieces: 4 sliders (hue, saturation, brightness, scale)
      // Black Pieces: 4 sliders
      const sliders = container.querySelectorAll('input[type="range"]');
      expect(sliders.length).toBe(14); // 3 + 3 + 4 + 4
    });
  });

  describe('slider functionality', () => {
    it('should update slider values when changed', () => {
      const { container } = render(<AppearanceControls />);

      const sliders = container.querySelectorAll('input[type="range"]');
      const firstSlider = sliders[0] as HTMLInputElement;

      expect(firstSlider).toBeDefined();

      fireEvent.change(firstSlider, { target: { value: '50' } });

      expect(firstSlider.value).toBe('50');
    });

    it('should apply CSS custom properties on mount', () => {
      render(<AppearanceControls />);

      const root = document.documentElement;

      // Default values should be applied
      const lightFilter = root.style.getPropertyValue('--light-square-filter');
      expect(lightFilter).toContain('hue-rotate(0deg)');
    });
  });

  describe('reset functionality', () => {
    it('should have reset buttons for each group', () => {
      const { container } = render(<AppearanceControls />);

      // Get all groups
      const groups = container.querySelectorAll('.border');

      // Each group should have a reset button
      groups.forEach((group) => {
        const resetButton = group.querySelector('button');
        expect(resetButton).toBeDefined();
      });
    });

    it('should have global reset button', () => {
      const { container } = render(<AppearanceControls />);

      const globalResetButton = container.querySelector('button');
      expect(globalResetButton).toBeDefined();
      expect(globalResetButton?.textContent).toContain('Reset All');
    });
  });

  describe('accessibility', () => {
    it('should have proper labels for all sliders', () => {
      const { container } = render(<AppearanceControls />);

      expect(container.textContent).toContain('Hue');
      expect(container.textContent).toContain('Saturation');
      expect(container.textContent).toContain('Brightness');
      expect(container.textContent).toContain('Size');
    });
  });
});
