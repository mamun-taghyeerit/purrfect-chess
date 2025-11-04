import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEasterEgg } from '@/hooks/useEasterEgg';

describe('useEasterEgg hook', () => {
  let targetElement: HTMLElement;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Create test element
    targetElement = document.createElement('p');
    targetElement.textContent = '(Reserved for future use)';
    targetElement.id = 'cheat-text';
    document.body.appendChild(targetElement);
  });

  afterEach(() => {
    // Clean up all global stubs
    vi.unstubAllGlobals();
  });

  describe('basic functionality', () => {
    it('should initialize with isPrimed false', () => {
      const { result } = renderHook(() => useEasterEgg());
      expect(result.current.isPrimed).toBe(false);
    });

    it('should provide setTargetElement function', () => {
      const { result } = renderHook(() => useEasterEgg());
      expect(typeof result.current.setTargetElement).toBe('function');
    });
  });

  describe('text selection', () => {
    it('should prime cheat when correct text is selected', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      // Set target element
      act(() => {
        result.current.setTargetElement(targetElement);
      });

      // Mock text selection
      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el: any) => el === targetElement,
      }));

      // Trigger selection change
      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      expect(result.current.isPrimed).toBe(true);
    });

    it('should not prime when wrong text is selected', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      vi.stubGlobal('getSelection', () => ({
        toString: () => 'wrong text',
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      expect(result.current.isPrimed).toBe(false);
    });

    it('should not prime when no text is selected', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      vi.stubGlobal('getSelection', () => ({
        toString: () => '',
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      expect(result.current.isPrimed).toBe(false);
    });
  });

  describe('cheatcode sequence', () => {
    it('should trigger onReveal when complete sequence is typed', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      // Prime the cheat
      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      expect(result.current.isPrimed).toBe(true);

      // Type the sequence
      const sequence = 'gmmamun';
      for (const char of sequence) {
        act(() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        });
      }

      expect(onReveal).toHaveBeenCalledTimes(1);
      expect(result.current.isPrimed).toBe(false);
    });

    it('should handle uppercase keys correctly', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      // Type the sequence with uppercase
      const sequence = 'GMMAMUN';
      for (const char of sequence) {
        act(() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        });
      }

      expect(onReveal).toHaveBeenCalledTimes(1);
    });

    it('should reset on incorrect key', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      expect(result.current.isPrimed).toBe(true);

      // Type incorrect key
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      });

      expect(result.current.isPrimed).toBe(false);
      expect(onReveal).not.toHaveBeenCalled();
    });

    it('should reset on Escape key', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      expect(result.current.isPrimed).toBe(true);

      // Press Escape
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(result.current.isPrimed).toBe(false);
    });

    it('should ignore whitespace keys when primed', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      expect(result.current.isPrimed).toBe(true);

      // Press space
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      });

      // Should still be primed
      expect(result.current.isPrimed).toBe(true);
    });

    it('should not process keys when not primed', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      expect(result.current.isPrimed).toBe(false);

      // Type the sequence without priming
      const sequence = 'gmmamun';
      for (const char of sequence) {
        act(() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        });
      }

      expect(onReveal).not.toHaveBeenCalled();
    });
  });

  describe('custom target text', () => {
    it('should work with custom target text', () => {
      const customText = 'Custom trigger text';
      const customElement = document.createElement('p');
      customElement.textContent = customText;
      document.body.appendChild(customElement);

      const onReveal = vi.fn();
      const { result } = renderHook(() =>
        useEasterEgg({ targetText: customText, onReveal })
      );

      act(() => {
        result.current.setTargetElement(customElement);
      });

      vi.stubGlobal('getSelection', () => ({
        toString: () => customText,
        containsNode: (el: any) => el === customElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      expect(result.current.isPrimed).toBe(true);
    });
  });

  describe('edge cases and false positives', () => {
    it('should not trigger on partial text selection', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      // Select only part of the text
      vi.stubGlobal('getSelection', () => ({
        toString: () => 'Reserved for future', // Missing "()"
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      expect(result.current.isPrimed).toBe(false);
    });

    it('should handle text selection with extra whitespace', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      // Selection with extra whitespace - trim should handle this
      vi.stubGlobal('getSelection', () => ({
        toString: () => '  (Reserved for future use)  ',
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      // Should still prime because trim() is applied
      expect(result.current.isPrimed).toBe(true);
    });

    it('should handle sequence interruption correctly', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      // Type partial sequence
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
      });

      // Interrupt with wrong key
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      });

      expect(result.current.isPrimed).toBe(false);

      // Continue typing - should not trigger
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'u' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
      });

      expect(onReveal).not.toHaveBeenCalled();
    });

    it('should handle rapid sequence typing correctly', () => {
      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el: any) => el === targetElement,
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      // Type sequence rapidly (all in one act)
      act(() => {
        'gmmamun'.split('').forEach((char) => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        });
      });

      expect(onReveal).toHaveBeenCalledTimes(1);
    });

    it('should not trigger if text is selected but from wrong element', () => {
      const wrongElement = document.createElement('p');
      wrongElement.textContent = '(Reserved for future use)';
      document.body.appendChild(wrongElement);

      const onReveal = vi.fn();
      const { result } = renderHook(() => useEasterEgg({ onReveal }));

      act(() => {
        result.current.setTargetElement(targetElement);
      });

      // Select from wrong element
      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el: any) => el === wrongElement, // Wrong element!
      }));

      act(() => {
        document.dispatchEvent(new Event('selectionchange'));
      });

      expect(result.current.isPrimed).toBe(false);
    });
  });
});
