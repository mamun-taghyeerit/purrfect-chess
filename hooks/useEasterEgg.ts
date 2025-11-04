'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Easter Egg Hook - "gmmamun" cheatcode feature
 * 
 * Ported from src/ui/easter-egg.ts to React
 * 
 * Handles the hidden cheatcode that reveals a hidden feature.
 * The user must:
 * 1. Select the target text element
 * 2. Type the sequence "gmmamun"
 * 3. The onReveal callback will be triggered
 */

const CHEAT_SEQUENCE = 'gmmamun';

interface UseEasterEggOptions {
  targetText?: string;
  onReveal?: () => void;
}

export function useEasterEgg(options: UseEasterEggOptions = {}) {
  const {
    targetText = '(Reserved for future use)',
    onReveal,
  } = options;

  const [isPrimed, setIsPrimed] = useState(false);
  const progressRef = useRef(0);
  const targetElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const checkSelectedText = (): boolean => {
      const selection = window.getSelection();
      if (!selection) return false;

      const selected = selection.toString().trim();
      if (!selected) return false;

      try {
        const targetEl = targetElementRef.current;
        if (!targetEl) return false;

        if (
          typeof selection.containsNode === 'function' &&
          selection.containsNode(targetEl, true)
        ) {
          // Compare against the element's actual text content, trimmed
          if (selected === targetEl.textContent?.trim()) {
            return true;
          }
        }
      } catch (error) {
        // Ignore selection errors (can happen in some browsers)
      }

      return false;
    };

    const handleSelection = () => {
      if (checkSelectedText()) {
        setIsPrimed(true);
        progressRef.current = 0;
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      const key = event.key;

      // Escape key resets cheatcode state
      if (key === 'Escape') {
        setIsPrimed(false);
        progressRef.current = 0;
        return;
      }

      if (!isPrimed) return;

      const lowerKey = key.toLowerCase();

      if (lowerKey === CHEAT_SEQUENCE[progressRef.current]) {
        progressRef.current += 1;

        if (progressRef.current === CHEAT_SEQUENCE.length) {
          // Cheatcode complete!
          setIsPrimed(false);
          progressRef.current = 0;

          if (typeof onReveal === 'function') {
            onReveal();
          }
        }
      } else if (lowerKey.trim()) {
        // Non-empty key pressed that doesn't match sequence - reset
        setIsPrimed(false);
        progressRef.current = 0;
      }
      // Whitespace-only keys (space, tab, etc.) are ignored
    };

    // Listen for selection changes globally
    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isPrimed, onReveal]);

  // Return a ref callback to attach to the target element
  const setTargetElement = (element: HTMLElement | null) => {
    targetElementRef.current = element;
  };

  return {
    isPrimed,
    setTargetElement,
  };
}

// Export for testing
export const _testing = {
  CHEAT_SEQUENCE,
};
