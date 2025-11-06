/**
 * Test helper for creating fresh store instances in tests
 */
import React from 'react';
import { types } from 'mobx-state-tree';
import { Chess } from 'chess.js';
import RootStoreModel, { createDefaultSnapshot } from '@/stores/root-store';

// Create a simple provider without persistence for tests
const TestStoreContext = React.createContext<any>(null);

export function TestStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = React.useState(() => {
    return RootStoreModel.create(createDefaultSnapshot());
  });

  return (
    <TestStoreContext.Provider value={store}>
      {children}
    </TestStoreContext.Provider>
  );
}

export function useTestStore() {
  const store = React.useContext(TestStoreContext);
  if (!store) {
    throw new Error('useTestStore must be used within TestStoreProvider');
  }
  return store;
}
