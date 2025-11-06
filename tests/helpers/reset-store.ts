/**
 * Helper to reset store state in tests
 * Gets the global store instance and resets it to initial state
 */

// Access the global store through the window object (only available in development)
export function resetStoreForTest() {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    window.localStorage.clear();
    
    // Try to access store if exposed (development mode)
    const store = (window as any).__rootStoreInstance;
    if (store && store.game && typeof store.game.resetGame === 'function') {
      store.game.resetGame();
    }
  }
}
