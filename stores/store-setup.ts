'use client';

import createPersistentStore from 'mst-persistent-store';
import defaultStorage from 'mst-persistent-store/dist/storage';
import RootStoreModel, { createDefaultSnapshot } from './root-store';

/**
 * Create the persistent root store with Next.js SSR support
 * 
 * Configuration:
 * - Uses default browser localStorage for persistence
 * - Excludes transient UI state from persistence (via disallowList)
 * - Persists game state and settings
 * - Exposes store instance in development for debugging
 * 
 * Based on bookcover-craft example:
 * https://github.com/purrfectsoft/bookcover-craft/blob/main/src/stores/store-setup.ts
 */
export const [RootStoreProvider, useRootStore] = createPersistentStore(
  RootStoreModel,
  defaultStorage,
  createDefaultSnapshot(),
  // Exclude transient UI state from persistence
  // These values will replace what's in storage on hydration (always reset to defaults)
  {
    ui: {
      isEnginePanelVisible: false,
      isEvalBarVisible: false,
      isBoardFlipped: false,
      engineDisplayMode: 'both' as const,
    },
  },
  {
    storageKey: 'purrfect-chess-store',
    onHydrate(storeInstance) {
      // Call the store's hydration action
      storeInstance.hydrateStore();
      
      // Expose store in development for debugging
      if (process.env.NODE_ENV === 'development') {
        Object.assign(window, { __rootStoreInstance: storeInstance });
        console.log('[Store] Root store available at window.__rootStoreInstance');
      }
    },
  }
);
