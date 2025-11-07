# Testing Guide for Purrfect Chess

This document provides comprehensive guidelines for testing in the Purrfect Chess Next.js application.

> **📘 See Also**: [Testing Strategy](./docs/TESTING_STRATEGY.md) - Comprehensive overview of our testing approach, including automated and manual testing strategies, coverage targets, and CI/CD pipeline.

## Table of Contents

- [Testing Stack](#testing-stack)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast, modern test runner with Vite integration
- **Testing Library**: [@testing-library/react](https://testing-library.com/react) - React component testing utilities
- **E2E Testing**: [Playwright](https://playwright.dev/) - Browser automation and end-to-end testing
- **DOM Environment**: [happy-dom](https://github.com/capricorn86/happy-dom) - Lightweight DOM implementation
- **Assertions**: Vitest's built-in assertions + [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) matchers
- **Mocking**: Vitest's built-in mocking capabilities

## Test Structure

```
tests/
├── setup.ts                      # Global test setup (runs before all tests)
├── components/                   # Component tests
│   ├── AppearanceControls.test.tsx
│   └── EnginePanel.test.tsx
├── hooks/                        # React hooks tests
│   ├── useEasterEgg.test.ts
│   └── useEngine.test.ts
├── engine/                       # Engine-related tests (legacy)
│   └── uci-parser.test.js
├── game/                         # Game logic tests (legacy)
│   ├── move-validator.test.js
│   ├── position-utils.test.js
│   └── time-controls.test.js
└── ui/                           # UI utility tests (legacy)
    └── easter-egg.test.js

e2e/
└── layout-stability.spec.ts      # End-to-end browser tests
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode (re-runs on file changes)
yarn test:watch

# Run tests with coverage report
yarn test:coverage

# Run specific test file
yarn test tests/components/AppearanceControls.test.tsx

# Run tests matching a pattern
yarn test AppearanceControls
```

### End-to-End Tests

End-to-end tests use [Playwright](https://playwright.dev/) to test the application in real browsers.

**First-time setup:**

```bash
# Install Playwright browsers (one-time step)
yarn playwright install

# Or install with system dependencies
yarn playwright install --with-deps
```

**Running e2e tests:**

```bash
# Run all e2e tests (headless)
yarn test:e2e

# Run e2e tests in UI mode (interactive)
yarn test:e2e:ui

# Run e2e tests in headed mode (see the browser)
yarn test:e2e:headed

# Run specific test file
yarn playwright test e2e/layout-stability.spec.ts
```

**Note:** E2E tests require the Playwright browsers to be installed. If you encounter errors about missing browsers, run `yarn playwright install`.

## Writing Tests

### Component Tests

Component tests should focus on user interactions and rendered output, not implementation details.

**Example: Testing a button click**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyButton from '@/components/MyButton';

describe('MyButton', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<MyButton onClick={handleClick}>Click me</MyButton>);

    const button = screen.getByText('Click me');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Key Points:**

- No need to import React explicitly (handled by vitest config)
- Use `screen` queries to find elements
- Use `fireEvent` or `userEvent` to simulate interactions
- Test what users see and do, not internal state

### Hook Tests

Use `renderHook` from `@testing-library/react` to test custom hooks.

**Example: Testing a custom hook**

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

**Key Points:**

- Use `renderHook` to test hooks in isolation
- Wrap state updates in `act()` to ensure React updates are flushed
- Test the hook's public API, not implementation details

### Async Tests

Handle async operations with `waitFor`, `findBy` queries, or `async/await`.

**Example: Testing async data fetching**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DataComponent } from '@/components/DataComponent';

describe('DataComponent', () => {
  it('should display data after loading', async () => {
    render(<DataComponent />);

    // Use findBy for elements that appear asynchronously
    const data = await screen.findByText('Loaded data');
    expect(data).toBeInTheDocument();

    // Or use waitFor for more complex conditions
    await waitFor(() => {
      expect(screen.getByText('Loaded data')).toBeInTheDocument();
    });
  });
});
```

### Mocking

#### Mocking Modules

```tsx
import { vi } from 'vitest';

// Mock entire module
vi.mock('@/hooks/useEngine', () => ({
  useEngine: () => ({
    isEngineReady: true,
    startAnalysis: vi.fn(),
  }),
}));
```

#### Mocking Functions

```tsx
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
mockFn.mockResolvedValue('async value');
```

#### Mocking Web Workers

```tsx
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage(data: any) {
    // Simulate worker behavior
  }
  terminate() {}
}

vi.stubGlobal('Worker', MockWorker);
```

## Best Practices

### DO ✅

1. **Test user behavior, not implementation**

   ```tsx
   // Good: Test what the user sees
   expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();

   // Bad: Test internal state
   expect(component.state.isSubmitting).toBe(false);
   ```

2. **Use accessible queries**

   ```tsx
   // Preferred order:
   screen.getByRole('button', { name: /submit/i });
   screen.getByLabelText('Username');
   screen.getByPlaceholderText('Enter name');
   screen.getByText('Welcome');
   screen.getByTestId('custom-element'); // Last resort
   ```

3. **Clean up after tests**
   - Tests are automatically cleaned up via `afterEach(cleanup)` in `tests/setup.ts`
   - For manual cleanup needs, use `afterEach` or `beforeEach`

4. **Use descriptive test names**

   ```tsx
   // Good
   it('should display error message when form is invalid');

   // Bad
   it('test 1');
   ```

5. **Organize tests with describe blocks**

   ```tsx
   describe('MyComponent', () => {
     describe('when user is logged in', () => {
       it('should show dashboard');
     });

     describe('when user is logged out', () => {
       it('should show login form');
     });
   });
   ```

### DON'T ❌

1. **Don't test implementation details**
   - Avoid testing component state directly
   - Avoid testing private methods
   - Focus on public API and user-facing behavior

2. **Don't use `container.querySelector`** (unless absolutely necessary)
   - Use accessible queries from `screen` instead

3. **Don't forget to handle async operations**

   ```tsx
   // Bad - will likely fail
   render(<AsyncComponent />);
   expect(screen.getByText('Data')).toBeInTheDocument();

   // Good
   render(<AsyncComponent />);
   await screen.findByText('Data');
   ```

4. **Don't suppress errors without good reason**
   - If you suppress console errors/warnings, document why

## End-to-End Testing with Playwright

End-to-end tests verify the entire application flow in real browsers. Use these tests to ensure critical user journeys work as expected.

### Writing E2E Tests

**Example: Testing page navigation**

```tsx
import { test, expect } from '@playwright/test';

test('should load the home page', async ({ page }) => {
  await page.goto('/');

  // Check for key elements
  await expect(page.locator('h1')).toContainText('Purrfect Chess');

  // Take a screenshot for visual regression
  await page.screenshot({ path: 'screenshots/home.png' });
});
```

**Example: Testing user interactions**

```tsx
test('should make a chess move', async ({ page }) => {
  await page.goto('/');

  // Wait for board to be ready
  await page.waitForSelector('[data-testid="chess-board"]');

  // Click on a piece and then a destination square
  await page.click('[data-square="e2"]');
  await page.click('[data-square="e4"]');

  // Verify the move was made
  await expect(page.locator('[data-square="e4"]')).toContainText('♙');
});
```

### E2E Best Practices

**DO ✅**

1. **Test critical user journeys** - Focus on the most important user flows
2. **Use stable selectors** - Prefer `data-testid`, `role`, or semantic selectors over CSS classes
3. **Wait for elements** - Use `waitForSelector`, `waitForLoadState`, or auto-waiting features
4. **Keep tests independent** - Each test should be able to run in isolation
5. **Use page object pattern** - Abstract page interactions into reusable functions

**DON'T ❌**

1. **Don't test everything** - E2E tests are slower; focus on critical paths
2. **Don't use arbitrary waits** - Use smart waiting strategies instead of `page.waitForTimeout()`
3. **Don't couple tests** - Tests shouldn't depend on each other's execution order
4. **Don't test API details** - E2E tests should focus on user-facing behavior

### Playwright Configuration

The Playwright configuration is in `playwright.config.ts`. Key settings:

- **Test directory**: `./e2e`
- **Base URL**: `http://localhost:3000`
- **Browser**: Chromium (can add Firefox, WebKit as needed)
- **Dev server**: Automatically starts `yarn dev` before tests
- **Screenshots**: Captured on failure for debugging

### Debugging E2E Tests

```bash
# Run tests in UI mode (interactive debugging)
yarn test:e2e:ui

# Run tests in headed mode (see the browser)
yarn test:e2e:headed

# Run a single test file
yarn playwright test e2e/layout-stability.spec.ts

# Run with debugging enabled
yarn playwright test --debug
```

### Browser Installation

Playwright requires browser binaries to be installed separately from the npm package.

**Install all browsers:**

```bash
yarn playwright install
```

**Install with system dependencies (Linux):**

```bash
yarn playwright install --with-deps
```

**Install specific browser:**

```bash
yarn playwright install chromium
```

**Check installed browsers:**

```bash
yarn playwright install --list
```

The automated setup script (`scripts/setup-dev-env.sh`) handles this installation automatically.

## Common Patterns

### Testing Forms

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should submit form with valid data', async () => {
  const onSubmit = vi.fn();
  render(<LoginForm onSubmit={onSubmit} />);

  // Type in fields
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'password123');

  // Submit form
  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  });
});
```

### Testing CSS Custom Properties

```tsx
it('should apply CSS variables', () => {
  render(<AppearanceControls />);

  const root = document.documentElement;
  const filterValue = root.style.getPropertyValue('--light-square-filter');

  expect(filterValue).toContain('hue-rotate(0deg)');
});
```

### Testing Event Listeners

```tsx
it('should respond to keyboard events', () => {
  render(<KeyboardComponent />);

  fireEvent.keyDown(document, { key: 'Escape' });

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

### Testing Next.js Image Components

Images are automatically mocked in `tests/setup.ts`. Just test as normal:

```tsx
import { render, screen } from '@testing-library/react';
import Image from 'next/image';

it('should render image', () => {
  render(<Image src="/logo.png" alt="Logo" width={100} height={100} />);
  expect(screen.getByAlt('Logo')).toBeInTheDocument();
});
```

## Troubleshooting

### Issue: "React is not defined"

**Solution**: Already handled by vitest config with `esbuild.jsxInject`. No need to import React.

### Issue: "Cannot find module '@/...'"

**Solution**: Path alias is configured in `vitest.config.ts`. Ensure the file exists and path is correct.

### Issue: "Worker is not defined"

**Solution**: Mock the Worker class in your test:

```tsx
class MockWorker {
  postMessage() {}
  terminate() {}
}
vi.stubGlobal('Worker', MockWorker);
```

### Issue: "window.matchMedia is not a function"

**Solution**: Already mocked in `tests/setup.ts`. If you need custom behavior, override in your test.

### Issue: Tests are slow

**Possible causes:**

1. Too many components rendering in a single test
2. Not cleaning up timers/intervals
3. Waiting for unnecessary timeouts

**Solutions:**

- Use `vi.useFakeTimers()` for testing timeouts
- Ensure cleanup with `afterEach`
- Split large tests into smaller, focused tests

### Issue: Async tests timing out

**Solution**: Increase timeout or check for infinite loops:

```tsx
it('should load data', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

## Coverage

Generate coverage reports:

```bash
yarn test:coverage
```

Coverage reports are generated in:

- Text format (console output)
- HTML format (`coverage/index.html`)
- JSON format (`coverage/coverage-final.json`)

**Coverage targets:**

- Aim for >85% coverage on critical paths
- 100% coverage is not always necessary or practical
- Focus on high-value, user-facing code

## Continuous Integration

Tests run automatically on every push and pull request via GitHub Actions.

**Workflow**: `.github/workflows/test.yml`

**What runs**:

- Linting (`yarn lint`)
- All tests with coverage (`yarn test:coverage`)
- Build verification (`yarn build`)

**Coverage Reports**:

- Uploaded to Codecov
- Displayed in PR comments
- Archived as artifacts for 30 days

**Viewing CI Results**:

1. Go to the repository on GitHub
2. Navigate to the "Actions" tab
3. Select the workflow run to view results

**Local CI Simulation**:

```bash
# Run the same checks that CI runs
yarn lint && yarn test:coverage && yarn build
```

## Additional Resources

- [Testing Strategy](./docs/TESTING_STRATEGY.md) - Comprehensive testing approach
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Hooks](https://react-hooks-testing-library.com/)

---

**Happy Testing! 🐱♟️**
