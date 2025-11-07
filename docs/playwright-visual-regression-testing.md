# Playwright Visual Regression Testing Strategy for Purrfect Chess

## Executive Summary

This document outlines a recommended strategy for integrating Playwright-driven automated visual regression testing at both component and page levels in the Purrfect Chess project.

## Why Playwright for Visual Regression Testing?

Playwright is an excellent choice for visual regression testing because it:

- Provides cross-browser testing (Chromium, Firefox, WebKit)
- Has built-in screenshot capabilities with pixel-perfect comparison
- Supports headless mode for CI/CD integration
- Offers excellent debugging tools and trace viewing
- Has fast, reliable test execution
- Provides accessibility testing features

## Implementation Strategy

### 1. Project Structure

```
purrfect-chess/
├── tests/
│   ├── e2e/                    # End-to-end tests
│   │   ├── game-flow.spec.ts   # Full game flow tests
│   │   └── layout.spec.ts      # Layout stability tests
│   ├── visual/                 # Visual regression tests
│   │   ├── components/         # Component-level visual tests
│   │   │   ├── Board.visual.spec.ts
│   │   │   ├── MoveHistory.visual.spec.ts
│   │   │   └── Controls.visual.spec.ts
│   │   └── pages/              # Page-level visual tests
│   │       └── HomePage.visual.spec.ts
│   └── fixtures/               # Test fixtures and helpers
│       └── test-utils.ts
├── playwright.config.ts        # Playwright configuration
└── package.json
```

### 2. Installation

```bash
yarn add -D @playwright/test
npx playwright install
```

### 3. Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add more browsers as needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],

  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4. Component-Level Visual Tests

**Example: `tests/visual/components/MoveHistory.visual.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('MoveHistory Component Visual Regression', () => {
  test('should maintain layout stability on first move', async ({ page }) => {
    await page.goto('/');

    // Take screenshot before first move
    const moveHistoryBefore = await page.locator('[class*="bg-gray"]').first();
    await expect(moveHistoryBefore).toHaveScreenshot('move-history-empty.png');

    // Make first move
    await page.getByRole('button', { name: /e2.*White pawn/ }).click();
    await page.getByRole('button', { name: /e4.*empty.*legal move/ }).click();

    // Take screenshot after first move
    await expect(moveHistoryBefore).toHaveScreenshot(
      'move-history-with-move.png'
    );

    // Verify height consistency
    const heightBefore = await moveHistoryBefore.evaluate(
      (el) => el.getBoundingClientRect().height
    );
    const heightAfter = await moveHistoryBefore.evaluate(
      (el) => el.getBoundingClientRect().height
    );
    expect(heightBefore).toBe(heightAfter);
  });

  test('should display moves correctly', async ({ page }) => {
    await page.goto('/');

    // Play several moves
    const moves = [
      { from: 'e2', to: 'e4' },
      { from: 'e7', to: 'e5' },
      { from: 'g1', to: 'f3' },
    ];

    for (const move of moves) {
      await page.getByRole('button', { name: new RegExp(move.from) }).click();
      await page.getByRole('button', { name: new RegExp(move.to) }).click();
    }

    // Verify move history appearance
    const moveHistory = await page.locator('[class*="bg-gray"]').first();
    await expect(moveHistory).toHaveScreenshot(
      'move-history-multiple-moves.png'
    );
  });
});
```

### 5. Page-Level Visual Tests

**Example: `tests/visual/pages/HomePage.visual.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Home Page Visual Regression', () => {
  test('initial page load', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage-initial.png', {
      fullPage: true,
    });
  });

  test('board after first move', async ({ page }) => {
    await page.goto('/');

    // Make first move
    await page.getByRole('button', { name: /e2.*White pawn/ }).click();
    await page.getByRole('button', { name: /e4.*empty.*legal move/ }).click();

    // Full page screenshot
    await expect(page).toHaveScreenshot('homepage-after-first-move.png', {
      fullPage: true,
    });
  });

  test('appearance controls visibility', async ({ page }) => {
    await page.goto('/');

    // Screenshot with appearance controls visible
    const whiteControls = page.locator('text=White Controls').locator('..');
    await expect(whiteControls).toHaveScreenshot('white-controls.png');

    const blackControls = page.locator('text=Black Controls').locator('..');
    await expect(blackControls).toHaveScreenshot('black-controls.png');
  });
});
```

### 6. Layout Stability Tests

**Example: `tests/e2e/layout.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Layout Stability', () => {
  test('no layout shift on first move', async ({ page }) => {
    await page.goto('/');

    // Get initial board position
    const board = page.locator('[role="application"]').first();
    const initialPosition = await board.boundingBox();

    // Make first move
    await page.getByRole('button', { name: /e2.*White pawn/ }).click();
    await page.getByRole('button', { name: /e4.*empty.*legal move/ }).click();

    // Get board position after move
    const finalPosition = await board.boundingBox();

    // Verify no shift occurred
    expect(initialPosition?.x).toBe(finalPosition?.x);
    expect(initialPosition?.y).toBe(finalPosition?.y);
    expect(initialPosition?.width).toBe(finalPosition?.width);
    expect(initialPosition?.height).toBe(finalPosition?.height);
  });

  test('sidebar width consistency', async ({ page }) => {
    await page.goto('/');

    const rightSidebar = page.locator('text=Black Controls').locator('..');
    const initialWidth = await rightSidebar.evaluate(
      (el) => el.getBoundingClientRect().width
    );

    // Make several moves
    for (let i = 0; i < 5; i++) {
      const pawns = await page
        .locator('[role="button"]')
        .filter({ hasText: /pawn/ })
        .all();
      if (pawns.length > 0) {
        await pawns[0].click();
        await page.waitForTimeout(100);
      }
    }

    const finalWidth = await rightSidebar.evaluate(
      (el) => el.getBoundingClientRect().width
    );
    expect(initialWidth).toBe(finalWidth);
  });
});
```

### 7. CI/CD Integration

**GitHub Actions Example (`.github/workflows/visual-regression.yml`)**

```yaml
name: Visual Regression Tests

on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version-file: '.nvmrc'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: test-results/
          retention-days: 30
```

### 8. Best Practices

#### a. Screenshot Management

- Store baseline screenshots in version control: `tests/visual/__screenshots__/`
- Update baselines when intentional UI changes occur: `npx playwright test --update-snapshots`
- Review screenshot diffs carefully in CI failures

#### b. Test Stability

- Use `await page.waitForLoadState('networkidle')` before taking screenshots
- Add explicit waits for animations: `await page.waitForTimeout(300)`
- Use stable selectors (roles, labels, test IDs) instead of CSS classes

#### c. Performance

- Run visual tests separately from unit tests
- Use parallel execution in CI
- Only test critical user paths at page level

#### d. Maintenance

- Group related visual tests together
- Use descriptive screenshot names
- Document visual changes in PR descriptions
- Review all visual test failures—never blindly update baselines

### 9. Testing Strategy for Purrfect Chess

#### Component Level

- **Board Component**: Verify piece rendering, square colors, move highlights
- **MoveHistory Component**: Verify layout stability, move formatting
- **Controls Components**: Verify slider positions, button states
- **Timer Component**: Verify time display formatting

#### Page Level

- **Home Page**: Verify overall layout, responsive breakpoints
- **Game States**: Verify check, checkmate, stalemate displays
- **Theme Variations**: Verify custom piece/square colors

#### Interaction Flows

- **First Move Regression**: Verify no layout shift (this issue)
- **Game Reset**: Verify UI returns to initial state
- **Board Flip**: Verify coordinate labels update correctly
- **Time Controls**: Verify clock displays update smoothly

### 10. Implementation Timeline

**Phase 1: Foundation (Week 1)**

- Install Playwright and configure
- Set up basic test structure
- Write layout stability tests (including first move test)

**Phase 2: Component Coverage (Week 2-3)**

- Add visual tests for MoveHistory
- Add visual tests for Board
- Add visual tests for Controls

**Phase 3: Page Coverage (Week 4)**

- Add full-page visual tests
- Add responsive breakpoint tests
- Add theme variation tests

**Phase 4: CI/CD Integration (Week 5)**

- Set up GitHub Actions workflow
- Configure artifact storage
- Document review process

### 11. Example: Fixing the Layout Shift Issue

The fix for the layout shift issue demonstrates the value of Playwright testing:

**Before Fix:**

- MoveHistory container had no minimum height
- Height changed from ~20px (empty) to ~52px (with moves)
- This caused the entire sidebar to resize

**After Fix:**

- Added `minHeight: '52px'` to the container
- Container maintains consistent height
- No layout shift occurs

**Test to Prevent Regression:**

```typescript
test('MoveHistory maintains minimum height', async ({ page }) => {
  await page.goto('/');

  const container = page.locator('.bg-gray-100').first();
  const emptyHeight = await container.evaluate(
    (el) => window.getComputedStyle(el).minHeight
  );

  expect(emptyHeight).toBe('52px');

  // Make move
  await page.getByRole('button', { name: /e2.*White pawn/ }).click();
  await page.getByRole('button', { name: /e4/ }).click();

  const filledHeight = await container.evaluate(
    (el) => window.getComputedStyle(el).minHeight
  );

  expect(filledHeight).toBe('52px');
});
```

## Conclusion

Implementing Playwright visual regression testing will:

1. Catch layout shifts and visual bugs early
2. Provide confidence when refactoring UI components
3. Document visual behavior through screenshots
4. Enable safe continuous deployment
5. Improve code review process with visual diffs

The investment in setting up Playwright testing will pay dividends in preventing visual regressions like the layout shift issue addressed in this PR.

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Visual Comparison Guide](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Integration](https://playwright.dev/docs/ci)
