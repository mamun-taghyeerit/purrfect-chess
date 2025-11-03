/**
 * Easter Egg Module - "gmmamun" cheatcode feature
 * 
 * This module handles the hidden cheatcode that reveals the engine analysis panel.
 * The user must:
 * 1. Select the text "(Reserved for future use)"
 * 2. Type the sequence "gmmamun"
 * 3. The engine panel will be revealed
 */

// Module state
let cheatPrimed = false;
let cheatProgress = 0;
const CHEAT_SEQUENCE = 'gmmamun';
const TARGET_TEXT = '(Reserved for future use)';

/**
 * Checks if the user has selected the target text element
 * @param {HTMLElement} cheatTextEl - The text element to check selection against
 * @returns {boolean} True if target text is selected, false otherwise
 */
function checkSelectedText(cheatTextEl) {
  const selection = window.getSelection();
  if (!selection) return false;
  
  const selected = selection.toString().trim();
  if (!selected) return false;
  
  if (selected === TARGET_TEXT) {
    try {
      if (typeof selection.containsNode === 'function' && 
          selection.containsNode(cheatTextEl, true)) {
        return true;
      }
    } catch (error) {
      // Ignore selection errors (can happen in some browsers)
    }
  }
  
  return false;
}

/**
 * Handles text selection events
 * @param {HTMLElement} cheatTextEl - The target text element
 */
function handleSelection(cheatTextEl) {
  if (checkSelectedText(cheatTextEl)) {
    cheatPrimed = true;
    cheatProgress = 0;
  }
}

/**
 * Handles keydown events for the cheatcode sequence
 * @param {KeyboardEvent} event - The keyboard event
 * @param {HTMLElement} enginePanelEl - The engine panel to reveal
 * @param {Function} onReveal - Callback function to execute when cheatcode is complete
 */
function handleKeydown(event, enginePanelEl, onReveal) {
  if (!cheatPrimed) return;
  
  const key = event.key.toLowerCase();
  
  if (key === CHEAT_SEQUENCE[cheatProgress]) {
    cheatProgress += 1;
    
    if (cheatProgress === CHEAT_SEQUENCE.length) {
      // Cheatcode complete!
      cheatPrimed = false;
      cheatProgress = 0;
      enginePanelEl.classList.remove('hidden');
      
      if (typeof onReveal === 'function') {
        onReveal();
      }
    }
  } else if (key.trim()) {
    // Non-whitespace key pressed that doesn't match - reset
    cheatPrimed = false;
    cheatProgress = 0;
  }
  // Ignore whitespace keys (shift, ctrl, alt, meta, etc.)
}

/**
 * Sets up the easter egg cheatcode functionality
 * @param {HTMLElement} cheatTextEl - The text element that triggers the cheatcode when selected
 * @param {HTMLElement} enginePanelEl - The engine panel element to reveal
 * @param {Function} onReveal - Optional callback function to execute when cheatcode is revealed
 */
export function setupEasterEgg(cheatTextEl, enginePanelEl, onReveal) {
  if (!cheatTextEl || !enginePanelEl) {
    throw new Error('setupEasterEgg requires cheatTextEl and enginePanelEl');
  }
  
  // Listen for text selection on the target element
  cheatTextEl.addEventListener('mouseup', () => handleSelection(cheatTextEl));
  cheatTextEl.addEventListener('keyup', () => handleSelection(cheatTextEl));
  
  // Listen for selection changes globally
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection || !selection.toString()) {
      return;
    }
    
    try {
      if (typeof selection.containsNode === 'function' && 
          selection.containsNode(cheatTextEl, true)) {
        cheatPrimed = true;
        cheatProgress = 0;
      }
    } catch (error) {
      // Ignore selection errors
    }
  });
  
  // Listen for keydown events to check the cheatcode sequence
  document.addEventListener('keydown', (event) => {
    handleKeydown(event, enginePanelEl, onReveal);
  });
  
  // Listen for Escape key to reset the cheatcode state
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      cheatPrimed = false;
      cheatProgress = 0;
    }
  });
}

// Export for testing
export const _testing = {
  getCheatPrimed: () => cheatPrimed,
  getCheatProgress: () => cheatProgress,
  getCheatSequence: () => CHEAT_SEQUENCE,
  getTargetText: () => TARGET_TEXT,
  setCheatPrimed: (value) => { cheatPrimed = value; },
  setCheatProgress: (value) => { cheatProgress = value; },
  checkSelectedText,
  handleSelection,
  handleKeydown
};
