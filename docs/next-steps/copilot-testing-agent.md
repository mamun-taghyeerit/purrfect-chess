# Testing Guardian Agent - Learnings from MobX/MST Test Migration

## Overview

This document captures key learnings from updating tests after refactoring components to use MobX + MobX-State-Tree (MST) instead of custom React hooks. These insights will inform the creation of a "Testing Guardian Agent" that can automatically detect and fix test failures when components are refactored to use different state management patterns.

## Background Context

### The Refactoring

- **Before**: Components used a custom `useGame()` hook that returned game state and actions
- **After**: Components use MobX `observer()` HOC and access state via `useRootStore()` hook from `@/stores/store-setup`
- **Impact**: All tests that rendered these components failed with "usePersistentStore must be used within a PersistentStoreProvider" errors

### Components Affected

- `Board` - Main chess board component
- `EnginePanel` - Engine analysis panel
- `EvaluationBar` - Position evaluation bar
- `Clock` - Game timer
- `MoveHistory` - Move list
- `GameControls` - Game control buttons
- `TimeControlSelector` - Time control settings

## Key Learnings

### 1. Provider Wrapper Pattern

**Problem**: MobX-State-Tree stores require a provider context wrapper.

**Solution**: All test renders must wrap components with `RootStoreProvider`:

```typescript
// ❌ BEFORE (fails with context error)
import { render } from '@testing-library/react';
render(<MyComponent />);

// ✅ AFTER (works)
import { RootStoreProvider } from '@/stores/store-setup';
render(
  <RootStoreProvider>
    <MyComponent />
  </RootStoreProvider>
);
```

**Pattern for Reusability**:

```typescript
// Create a helper function in each test file
const renderWithStore = (component: React.ReactElement) => {
  return render(
    <RootStoreProvider>
      {component}
    </RootStoreProvider>
  );
};

// Use in tests
const { container } = renderWithStore(<Board />);
```

### 2. Hook Mocking Is No Longer Needed

**Problem**: Tests were mocking `useGame()` hook which no longer exists.

**Solution**: Remove all hook mocks when components use store directly:

```typescript
// ❌ BEFORE (tries to mock non-existent hook)
vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    movePiece: vi.fn(),
    resetGame: vi.fn(),
  }),
}));

// ✅ AFTER (no mocking needed - store provides state)
// Components access store directly via useRootStore()
```

**Keep mocks for hooks that still exist**:

```typescript
// ✅ Still mock useEngine - it hasn't been refactored
vi.mock('@/hooks/useEngine', () => ({
  useEngine: () => ({
    isEngineReady: true,
    isAnalyzing: false,
    analysis: [...],
  }),
}));
```

### 3. Props vs Store Access

**Problem**: Components no longer accept props that come from the store.

**Example - EnginePanel**:

```typescript
// ❌ BEFORE (component accepted props)
render(
  <EnginePanel
    engineDisplayMode="arrows"
    onEngineDisplayModeChange={mockFn}
  />
);

// ✅ AFTER (component gets these from store)
render(
  <RootStoreProvider>
    <EnginePanel />
  </RootStoreProvider>
);
// engineDisplayMode comes from store.ui.engineDisplayMode
// changes happen via store.ui.setEngineDisplayMode()
```

**Example - Board**:

```typescript
// ✅ STILL VALID - Board accepts optional props for engine overlays
render(
  <RootStoreProvider>
    <Board engineHighlights={[...]} />
  </RootStoreProvider>
);
// engineHighlights is optional and independent of store
```

### 4. Testing Store State Directly

**Problem**: Tests that used `renderHook()` to test the `useGame` hook now fail.

**Solution**: Test the store directly instead:

```typescript
// ❌ BEFORE (testing hook)
const { result } = renderHook(() => useGame());
act(() => {
  result.current.movePiece('e2', 'e4');
});
expect(result.current.history.length).toBe(1);

// ✅ AFTER (testing store directly)
import RootStoreModel, { createDefaultSnapshot } from '@/stores/root-store';

const store = RootStoreModel.create(createDefaultSnapshot());
store.game.movePiece('e2', 'e4');
expect(store.game.history.length).toBe(1);
```

**Benefits**:

- No need for React's `act()` wrapper
- Direct access to store actions and state
- Simpler and more focused tests

### 5. Understanding Store API Differences

**Problem**: Store APIs may differ from hook APIs.

**Example - Time Controls**:

```typescript
// ❌ Hook API (old)
result.current.setTimeControl({ minutes: 10, increment: 5 });

// ✅ Store API (new)
store.game.setTimeControl(10, 5); // Two separate parameters
```

**Lesson**: Always check the store implementation for correct API usage.

### 6. Component State vs Store State

**Problem**: Some UI state is local to components, not in the store.

**Example - Board Selection**:

```typescript
// ✅ Selection state is local to Board component
const { container } = renderWithStore(<Board />);
const e2Square = container.querySelector('[data-square="e2"]');
fireEvent.click(e2Square!);

// Selection is in local component state, NOT in store
expect(e2Square?.classList.contains('selected')).toBe(true);
```

**Lesson**: Understand which state lives where:

- **Store**: Game state, UI preferences, settings
- **Component**: Transient UI state (selection, drag, hover)

### 7. Import Path Changes

**Problem**: Import errors when trying to import removed modules.

```typescript
// ❌ FAILS - module doesn't exist
import { useGame } from '@/hooks/useGame';

// ✅ Import store instead
import { RootStoreProvider, useRootStore } from '@/stores/store-setup';
import RootStoreModel, { createDefaultSnapshot } from '@/stores/root-store';
```

**Detection**: Error message: "Failed to resolve import '@/hooks/useGame'"

### 8. Test Assertion Adjustments

**Problem**: Assertions need to match new component behavior.

**Example - Callback Props**:

```typescript
// ❌ BEFORE (testing prop callback)
const onClose = vi.fn();
render(<EnginePanel onClose={onClose} />);
fireEvent.click(closeButton);
expect(onClose).toHaveBeenCalledTimes(1);

// ✅ AFTER (no prop, action goes to store)
render(
  <RootStoreProvider>
    <EnginePanel />
  </RootStoreProvider>
);
fireEvent.click(closeButton);
// Action calls store.ui.hideEnginePanel() internally
// Test passes if no error is thrown
```

**Lesson**: Adjust assertions based on whether behavior is observable externally or happens internally.

## Migration Checklist

When refactoring components to use MobX/MST, update tests as follows:

### Step 1: Identify Affected Tests

- [ ] Find tests that render the refactored component
- [ ] Look for "usePersistentStore must be used within a PersistentStoreProvider" errors
- [ ] Look for "Failed to resolve import" errors for removed hooks

### Step 2: Add Provider Wrapper

- [ ] Import `RootStoreProvider` from `@/stores/store-setup`
- [ ] Wrap all `render()` calls with `<RootStoreProvider>`
- [ ] Create a helper function if many tests need it

### Step 3: Remove Obsolete Mocks

- [ ] Remove `vi.mock()` calls for hooks that no longer exist
- [ ] Remove mock state creation functions
- [ ] Keep mocks for hooks that still exist (e.g., `useEngine`)

### Step 4: Update Test Logic

- [ ] Replace `renderHook()` tests with direct store tests
- [ ] Remove props that now come from the store
- [ ] Update assertions for callback props that now update the store
- [ ] Verify store API usage (check for parameter differences)

### Step 5: Fix Imports

- [ ] Remove imports of deleted hooks
- [ ] Add imports for store modules if testing store directly
- [ ] Update any import paths that changed

### Step 6: Verify Tests

- [ ] Run tests to check for syntax errors
- [ ] Run tests to check for assertion failures
- [ ] Verify expected behavior still works

## Common Error Patterns

### Error 1: Context Provider Missing

```
Error: usePersistentStore must be used within a PersistentStoreProvider
```

**Fix**: Wrap component with `<RootStoreProvider>`

### Error 2: Import Not Found

```
Error: Failed to resolve import "@/hooks/useGame"
```

**Fix**: Remove import, use store instead

### Error 3: Type Mismatch

```
Error: [mobx-state-tree] Error while converting {...} to `TimeControl`
```

**Fix**: Check store API - likely passing object instead of individual parameters

### Error 4: Props Don't Exist

```
Warning: React does not recognize the `onEngineDisplayModeChange` prop
```

**Fix**: Remove props that are now handled by the store

## Testing Patterns by Component Type

### Pattern 1: Pure Presentational Component

```typescript
// Component accepts props, no store access
test('renders with props', () => {
  render(<ArrowOverlay engineArrows={[...]} />);
  // No provider needed
});
```

### Pattern 2: Store-Connected Component

```typescript
// Component uses observer() and useRootStore()
test('renders with store', () => {
  render(
    <RootStoreProvider>
      <EnginePanel />
    </RootStoreProvider>
  );
});
```

### Pattern 3: Hybrid Component

```typescript
// Component uses store but also accepts optional props
test('renders with store and props', () => {
  render(
    <RootStoreProvider>
      <Board engineHighlights={[...]} onError={mockFn} />
    </RootStoreProvider>
  );
});
```

### Pattern 4: Direct Store Testing

```typescript
// Test store actions and state without React
test('store action works', () => {
  const store = RootStoreModel.create(createDefaultSnapshot());
  store.game.movePiece('e2', 'e4');
  expect(store.game.history.length).toBe(1);
});
```

## Automation Opportunities

### Detection

A testing guardian agent could automatically detect:

1. Test files importing removed hooks (`useGame`, etc.)
2. Error messages about missing provider context
3. Components using `observer()` HOC that aren't wrapped in tests
4. Render calls without `RootStoreProvider` for store-connected components

### Auto-Fix Capabilities

The agent could automatically:

1. Add `RootStoreProvider` wrapper to renders
2. Remove imports of deleted hooks
3. Remove obsolete `vi.mock()` calls
4. Create helper render functions
5. Update common assertion patterns
6. Convert `renderHook()` tests to direct store tests

### Code Patterns to Detect

```typescript
// Pattern: Import of removed hook
/import.*from ['"]@\/hooks\/useGame['"]/

// Pattern: Render without provider for observer component
/render\(<(Board|EnginePanel|Clock|MoveHistory|GameControls|EvaluationBar|TimeControlSelector)[^>]*>\)/

// Pattern: renderHook usage for removed hook
/renderHook\(\(\) => useGame\(\)/

// Pattern: vi.mock for removed hook
/vi\.mock\(['"]@\/hooks\/useGame['"]/
```

## Future Considerations

### For Testing Agent Development

1. **Context Awareness**: Agent should understand which components use which state management pattern
2. **Import Graph**: Track dependencies to know when hooks are removed
3. **API Mapping**: Maintain a mapping of old hook APIs to new store APIs
4. **Template Generation**: Generate test helper functions automatically
5. **Validation**: Run tests after auto-fix to ensure they pass

### For Code Maintainability

1. **Documentation**: Keep store API documentation up to date
2. **Migration Guides**: Document state management changes
3. **Type Safety**: Use TypeScript to catch API mismatches early
4. **Consistent Patterns**: Use same testing patterns across codebase

## References

- MobX Documentation: https://mobx.js.org/
- MobX-State-Tree Documentation: https://mobx-state-tree.js.org/
- mobx-react-lite Documentation: https://mobx-react-lite.vercel.app/
- Reference Implementation: [bookcover-craft](https://github.com/purrfectsoft/bookcover-craft)

## Example Test Files

### Before and After: EnginePanel.test.tsx

**Before**:

```typescript
import { render } from '@testing-library/react';
import EnginePanel from '@/components/EnginePanel';

vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({ fen: '...', game: null }),
}));

it('renders header', () => {
  render(<EnginePanel />);
  expect(screen.getByText('Engine Analysis')).toBeInTheDocument();
});
```

**After**:

```typescript
import { render } from '@testing-library/react';
import EnginePanel from '@/components/EnginePanel';
import { RootStoreProvider } from '@/stores/store-setup';

// useGame mock removed - component uses store

it('renders header', () => {
  render(
    <RootStoreProvider>
      <EnginePanel />
    </RootStoreProvider>
  );
  expect(screen.getByText('Engine Analysis')).toBeInTheDocument();
});
```

### Before and After: Game Lifecycle Test

**Before**:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useGame } from '@/hooks/useGame';

it('resets game', () => {
  const { result } = renderHook(() => useGame());

  act(() => {
    result.current.movePiece('e2', 'e4');
  });
  expect(result.current.history.length).toBe(1);

  act(() => {
    result.current.resetGame();
  });
  expect(result.current.history.length).toBe(0);
});
```

**After**:

```typescript
import RootStoreModel, { createDefaultSnapshot } from '@/stores/root-store';

it('resets game', () => {
  const store = RootStoreModel.create(createDefaultSnapshot());

  store.game.movePiece('e2', 'e4');
  expect(store.game.history.length).toBe(1);

  store.game.resetGame();
  expect(store.game.history.length).toBe(0);
});
```

## Summary

The key insight for a testing guardian agent is to recognize the pattern:

**Component refactored to use MobX/MST** → **Tests need provider wrapper + API updates**

The agent should:

1. Detect components using `observer()` HOC
2. Detect tests rendering those components without provider
3. Auto-wrap with `RootStoreProvider`
4. Remove obsolete hook mocks
5. Update assertions based on new API
6. Convert hook tests to store tests

This pattern repeats for any state management refactoring, not just MobX/MST.
