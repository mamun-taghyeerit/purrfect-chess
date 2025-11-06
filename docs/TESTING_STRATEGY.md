# Testing Strategy for Purrfect Chess

## Overview

This document outlines the comprehensive testing strategy for the Purrfect Chess project, covering both automated and manual testing approaches.

## Goals

1. **Reliability**: Ensure all critical game logic works correctly
2. **Maintainability**: Make tests easy to understand and update
3. **Coverage**: Achieve >85% test coverage on critical paths
4. **Speed**: Keep test suite execution under 15 seconds
5. **Confidence**: Enable safe refactoring and feature additions

## Test Types

### 1. Unit Tests

**Purpose**: Test individual functions and components in isolation

**Location**: `tests/hooks/`, `tests/lib/`, `tests/stores/`

**Tools**: Vitest, Testing Library

**Examples**:
- Hook behavior (useEngine, useNotification, useEasterEgg)
- Utility functions (performance utilities)
- Store models (root-store logic)

**Coverage Target**: >90% for hooks and utilities

### 2. Component Tests

**Purpose**: Test React components with user interactions

**Location**: `tests/components/`

**Tools**: Vitest, Testing Library, happy-dom

**Examples**:
- Board rendering and interactions
- EnginePanel display and controls
- AppearanceControls slider changes
- NotificationContainer message display

**Coverage Target**: >85% for user-facing components

**Best Practices**:
- Test user behavior, not implementation details
- Use accessible queries (getByRole, getByLabelText)
- Mock external dependencies (Web Workers, stores when needed)
- Wrap components with RootStoreProvider when they use MobX stores

### 3. Integration Tests

**Purpose**: Test multiple components working together

**Location**: `tests/integration/`

**Tools**: Vitest, Testing Library

**Examples**:
- Error handling workflows across components
- Engine overlays integration with board
- Complete user flows (make move → update clock → check game over)

**Coverage Target**: >70% for critical workflows

### 4. Parity Tests

**Purpose**: Ensure Next.js implementation matches legacy Vite behavior

**Location**: `tests/parity/`

**Status**: Some tests are currently failing or marked as todo

**Examples**:
- Game state consistency between implementations
- Move legality and SAN generation
- Time controls behavior
- Engine analysis display

**Notes**:
- These tests validate migration correctness
- Can be deprecated once migration is fully validated
- Some tests may need updates to reflect intentional changes

### 5. Accessibility Tests

**Purpose**: Ensure UI is accessible to all users

**Location**: `tests/components/*axe.test.tsx`

**Tools**: vitest-axe

**Examples**:
- Board has no accessibility violations
- Proper ARIA labels and roles
- Keyboard navigation support

**Coverage Target**: All interactive components

### 6. Manual Tests

**Purpose**: Validate complex user scenarios and visual design

**Location**: `docs/runbooks/`

**When to Use**:
- Visual design changes
- Complex drag-and-drop interactions
- Performance testing
- Cross-browser compatibility
- Mobile responsiveness

**Examples**:
- Arrow drawing system (see `docs/runbooks/arrow-drawing-manual-tests.md`)
- Side-by-side legacy vs. Next.js comparison
- Easter egg activation ("gmmamun")

## Testing Infrastructure

### Current Setup

- **Test Runner**: Vitest 4.x
- **DOM Environment**: happy-dom (lightweight, fast)
- **Testing Library**: @testing-library/react 16.x
- **Assertions**: Vitest built-in + @testing-library/jest-dom
- **Accessibility**: vitest-axe
- **Mocking**: Vitest built-in mocking

### Configuration

- **Config File**: `vitest.config.ts`
- **Setup File**: `tests/setup.ts`
- **Coverage Provider**: v8
- **Coverage Reports**: text, JSON, HTML

### Running Tests

```bash
# Run all tests once
yarn test

# Run tests in watch mode (re-runs on file changes)
yarn test:watch

# Run tests with coverage report
yarn test:coverage

# Run specific test file
yarn test tests/components/Board.test.tsx

# Run tests matching a pattern
yarn test Board
```

## Test Organization

### File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Component tests: `ComponentName.test.tsx`
- Integration tests: `feature-name.integration.test.tsx`
- Parity tests: `feature-name-parity.test.ts`
- Accessibility tests: `ComponentName.axe.test.tsx`

### Test Structure

```typescript
describe('Feature/Component Name', () => {
  describe('specific behavior', () => {
    it('should do something when condition', () => {
      // Arrange: Set up test data and conditions
      // Act: Perform the action being tested
      // Assert: Verify the expected outcome
    });
  });
});
```

## Common Patterns

### Testing Components with MobX Store

Always wrap components that use `useRootStore()` with `RootStoreProvider`:

```typescript
import { RootStoreProvider } from '@/stores/store-setup';

it('should render component', () => {
  render(
    <RootStoreProvider>
      <MyComponent />
    </RootStoreProvider>
  );
  
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Testing Hooks with Store Access

Use a wrapper component to provide store context:

```typescript
import { renderHook } from '@testing-library/react';
import { RootStoreProvider } from '@/stores/store-setup';

it('should use hook correctly', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RootStoreProvider>{children}</RootStoreProvider>
  );
  
  const { result } = renderHook(() => useMyHook(), { wrapper });
  
  expect(result.current.someValue).toBe(expected);
});
```

### Testing Async Operations

Use `waitFor` for async state updates:

```typescript
import { waitFor } from '@testing-library/react';

it('should update async state', async () => {
  render(<AsyncComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  }, { timeout: 1000 });
});
```

### Mocking Web Workers

```typescript
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  
  postMessage(data: any) {
    // Simulate worker behavior
  }
  
  terminate() {}
}

vi.stubGlobal('Worker', MockWorker);
```

## Coverage Targets

| Code Type | Target | Current |
|-----------|--------|---------|
| Hooks | >90% | ~85% |
| Components | >85% | ~80% |
| Utilities | >90% | ~90% |
| Integration | >70% | ~60% |
| **Overall** | **>85%** | **~80%** |

## Continuous Integration

### CI Pipeline (Planned)

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: yarn
      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: yarn test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Test Requirements for PRs

- ✅ All existing tests must pass
- ✅ New features must include tests
- ✅ Bug fixes should include regression tests
- ✅ Code coverage should not decrease
- ✅ No accessibility violations in new components

## Known Issues and Todo

### Tests Marked as Todo

1. **useEngine.test.tsx**: 1 test
   - Timing-sensitive async initialization test
   - Engine initialization involves multiple async steps
   - Works in practice but flaky in test environment

2. **EnginePanel.test.tsx**: 5 tests
   - Tests require populating `store.engine.analysis` with data
   - Mock `useEngine` hook doesn't affect store state
   - Need custom RootStoreProvider with initial engine data

### Failing Parity Tests

Multiple parity test files are failing:
- `engine-analysis-parity.test.ts`
- `error-handling-parity.test.ts`
- `fenpgn.roundtrip.test.ts`
- `game-state-parity.test.ts`
- `move-legality-parity.test.ts`
- `san-generation-parity.test.ts`
- `time-controls-parity.test.ts`

**Status**: Under investigation
**Priority**: Medium (these validate migration correctness)
**Action**: Review each test to determine if failures are due to intentional changes or bugs

### Failing Interaction Tests

- `Board.interaction.test.tsx`: 8 failing tests
- Related to drag-and-drop behavior
- May need updates to match current implementation

### Failing Integration Tests

- `Board.arrow-drawing.test.tsx`: Tests for arrow drawing on board
- `EngineOverlays.integration.test.tsx`: 3 tests for engine overlay features
- `error-handling-workflow.test.ts`: Error handling integration

**Status**: Need investigation and fixes
**Priority**: High (core functionality)

## Test Maintenance

### When to Update Tests

- **Feature Changes**: Update tests to reflect new behavior
- **Refactoring**: Tests should pass without changes (if behavior unchanged)
- **Bug Fixes**: Add regression test for the bug
- **API Changes**: Update tests that use the changed API

### When to Add Tests

- **New Features**: Add tests for all new functionality
- **Bug Fixes**: Add test that would have caught the bug
- **Edge Cases**: Add tests when edge cases are discovered
- **Performance**: Add performance tests for critical paths

### When to Remove Tests

- **Deleted Features**: Remove tests for removed functionality
- **Duplicates**: Remove redundant tests
- **Obsolete**: Remove tests for deprecated code

## Best Practices

### DO ✅

1. Test user behavior, not implementation
2. Use accessible queries (getByRole, getByLabelText)
3. Keep tests focused and small
4. Use descriptive test names
5. Clean up after tests (automatic via afterEach)
6. Mock external dependencies
7. Use `observer()` wrapper for MobX components
8. Provide store context when needed

### DON'T ❌

1. Test implementation details
2. Use querySelector unless absolutely necessary
3. Suppress errors without documenting why
4. Forget to handle async operations
5. Write tests that depend on each other
6. Hardcode magic numbers without explanation
7. Skip accessibility tests for new components

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [MobX Testing Guide](https://mobx.js.org/configuration.html#testing)
- [vitest-axe Documentation](https://github.com/chaance/vitest-axe)
- [Project Testing Guide](./TESTING.md)

## Conclusion

This testing strategy provides a comprehensive approach to ensuring the quality and reliability of Purrfect Chess. By following these guidelines and maintaining high test coverage, we can confidently develop new features and refactor existing code while maintaining a stable, bug-free application.

**Current Test Status**: 164 passing, 11 failing, 18 todo (94.3% pass rate)
**Goal**: 100% passing tests, <5 todo tests for future improvement

---

*Last Updated: 2025-01-06*
*Next Review: After completing Phase 4 (Testing & Cleanup)*
