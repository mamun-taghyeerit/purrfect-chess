import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupEasterEgg, _testing } from '../../src/ui/easter-egg.js';

describe('Easter Egg Module', () => {
  let cheatTextEl;
  let enginePanelEl;
  let onRevealCallback;
  let originalGetSelection;

  beforeEach(() => {
    // Save original getSelection
    originalGetSelection = window.getSelection;
    
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create test elements
    cheatTextEl = document.createElement('p');
    cheatTextEl.textContent = '(Reserved for future use)';
    cheatTextEl.id = 'cheat-text';
    document.body.appendChild(cheatTextEl);
    
    enginePanelEl = document.createElement('div');
    enginePanelEl.id = 'engine-panel';
    enginePanelEl.classList.add('hidden');
    document.body.appendChild(enginePanelEl);
    
    // Create mock callback
    onRevealCallback = vi.fn();
    
    // Reset module state
    _testing.setCheatPrimed(false);
    _testing.setCheatProgress(0);
  });

  afterEach(() => {
    // Clean up all global stubs
    vi.unstubAllGlobals();
  });

  describe('setupEasterEgg', () => {
    it('should throw error if cheatTextEl is not provided', () => {
      expect(() => setupEasterEgg(null, enginePanelEl, onRevealCallback)).toThrow(
        'setupEasterEgg requires cheatTextEl and enginePanelEl'
      );
    });

    it('should throw error if enginePanelEl is not provided', () => {
      expect(() => setupEasterEgg(cheatTextEl, null, onRevealCallback)).toThrow(
        'setupEasterEgg requires cheatTextEl and enginePanelEl'
      );
    });

    it('should set up event listeners without errors', () => {
      expect(() => setupEasterEgg(cheatTextEl, enginePanelEl, onRevealCallback)).not.toThrow();
    });
  });

  describe('cheatcode constants', () => {
    it('should have correct cheat sequence', () => {
      expect(_testing.getCheatSequence()).toBe('gmmamun');
    });

    it('should have correct target text', () => {
      expect(_testing.getTargetText()).toBe('(Reserved for future use)');
    });
  });

  describe('checkSelectedText', () => {
    it('should return false when no selection exists', () => {
      vi.stubGlobal('getSelection', () => null);
      const result = _testing.checkSelectedText(cheatTextEl);
      expect(result).toBe(false);
    });

    it('should return false when selection is empty', () => {
      vi.stubGlobal('getSelection', () => ({
        toString: () => '',
        containsNode: () => true
      }));
      const result = _testing.checkSelectedText(cheatTextEl);
      expect(result).toBe(false);
    });

    it('should return false when selection does not match target text', () => {
      vi.stubGlobal('getSelection', () => ({
        toString: () => 'wrong text',
        containsNode: () => true
      }));
      const result = _testing.checkSelectedText(cheatTextEl);
      expect(result).toBe(false);
    });

    it('should return true when correct text is selected', () => {
      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el) => el === cheatTextEl
      }));
      const result = _testing.checkSelectedText(cheatTextEl);
      expect(result).toBe(true);
    });

    it('should handle selection.containsNode errors gracefully', () => {
      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: () => { throw new Error('Browser error'); }
      }));
      const result = _testing.checkSelectedText(cheatTextEl);
      expect(result).toBe(false);
    });
  });

  describe('handleSelection', () => {
    it('should prime cheat when correct text is selected', () => {
      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el) => el === cheatTextEl
      }));
      
      _testing.handleSelection(cheatTextEl);
      
      expect(_testing.getCheatPrimed()).toBe(true);
      expect(_testing.getCheatProgress()).toBe(0);
    });

    it('should not prime cheat when wrong text is selected', () => {
      vi.stubGlobal('getSelection', () => ({
        toString: () => 'wrong text',
        containsNode: (el) => el === cheatTextEl
      }));
      
      _testing.handleSelection(cheatTextEl);
      
      expect(_testing.getCheatPrimed()).toBe(false);
    });
  });

  describe('handleKeydown', () => {
    beforeEach(() => {
      _testing.setCheatPrimed(true);
      _testing.setCheatProgress(0);
    });

    it('should not process keys when cheat is not primed', () => {
      _testing.setCheatPrimed(false);
      
      const event = new KeyboardEvent('keydown', { key: 'g' });
      _testing.handleKeydown(event, enginePanelEl, onRevealCallback);
      
      expect(_testing.getCheatProgress()).toBe(0);
    });

    it('should increment progress on correct key', () => {
      const event = new KeyboardEvent('keydown', { key: 'g' });
      _testing.handleKeydown(event, enginePanelEl, onRevealCallback);
      
      expect(_testing.getCheatProgress()).toBe(1);
    });

    it('should reset on incorrect key', () => {
      const event = new KeyboardEvent('keydown', { key: 'x' });
      _testing.handleKeydown(event, enginePanelEl, onRevealCallback);
      
      expect(_testing.getCheatPrimed()).toBe(false);
      expect(_testing.getCheatProgress()).toBe(0);
    });

    it('should ignore whitespace keys', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      _testing.handleKeydown(event, enginePanelEl, onRevealCallback);
      
      // Should still be primed (whitespace ignored)
      expect(_testing.getCheatPrimed()).toBe(true);
      expect(_testing.getCheatProgress()).toBe(0);
    });

    it('should complete cheatcode sequence and reveal panel', () => {
      const sequence = 'gmmamun';
      
      for (let i = 0; i < sequence.length; i++) {
        const event = new KeyboardEvent('keydown', { key: sequence[i] });
        _testing.handleKeydown(event, enginePanelEl, onRevealCallback);
      }
      
      expect(enginePanelEl.classList.contains('hidden')).toBe(false);
      expect(onRevealCallback).toHaveBeenCalledTimes(1);
      expect(_testing.getCheatPrimed()).toBe(false);
      expect(_testing.getCheatProgress()).toBe(0);
    });

    it('should handle uppercase keys correctly', () => {
      const event = new KeyboardEvent('keydown', { key: 'G' });
      _testing.handleKeydown(event, enginePanelEl, onRevealCallback);
      
      expect(_testing.getCheatProgress()).toBe(1);
    });
  });

  describe('integration', () => {
    it('should complete full cheatcode workflow', () => {
      // Setup
      setupEasterEgg(cheatTextEl, enginePanelEl, onRevealCallback);
      
      // Simulate text selection
      vi.stubGlobal('getSelection', () => ({
        toString: () => '(Reserved for future use)',
        containsNode: (el) => el === cheatTextEl
      }));
      
      _testing.handleSelection(cheatTextEl);
      expect(_testing.getCheatPrimed()).toBe(true);
      
      // Type the sequence
      const sequence = 'gmmamun';
      for (const char of sequence) {
        const event = new KeyboardEvent('keydown', { key: char });
        _testing.handleKeydown(event, enginePanelEl, onRevealCallback);
      }
      
      // Verify panel is revealed
      expect(enginePanelEl.classList.contains('hidden')).toBe(false);
      expect(onRevealCallback).toHaveBeenCalledTimes(1);
    });
  });
});
