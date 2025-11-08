# End-to-End (E2E) Testing with Playwright

This directory contains comprehensive End-to-End tests for Purrfect Chess using [Playwright](https://playwright.dev/).

## Overview

The E2E test suite validates critical chess gameplay flows, game conditions, and complete game scenarios to ensure reliability and prevent regressions.

## Test Files

### 1. `gameplay.spec.ts` - Core Gameplay Tests
Tests basic game functionality:
- Starting a new game
- Resetting the game
- Making moves (piece selection, legal moves)
- Time controls display and tracking
- Move history
- Turn management

**Coverage:** 9 tests

### 2. `game-conditions.spec.ts` - Chess Rules & Conditions
Tests specific chess game conditions:
- **En passant capture** - Special pawn capture rule
- **Pawn promotion** - Promoting to queen, knight, etc.
- **Check** - King under attack
- **Checkmate** - Game-ending positions (Scholar's Mate)
- **Stalemate** - No legal moves available
- **Draw conditions:**
  - Threefold repetition
  - Insufficient material (K vs K, K+B vs K, K+N vs K)
  - 50-move rule
  - Timeout vs insufficient material

**Coverage:** 15 tests (some marked as skipped pending FEN loading feature)

### 3. `full-games.spec.ts` - Complete Game Replays
Tests full chess games and famous tactical sequences:
- **Scholar's Mate** - 4-move checkmate
- **Fool's Mate** - Fastest checkmate (2 moves)
- **Smothered Mate** - Knight delivers mate to trapped king
- **Traxler Counter Attack** - Wild tactical line
- **Legal Trap** - Classic queen sacrifice mate
- **Fried Liver Attack** - Aggressive opening
- **Italian Game** - Standard opening development
- **Scandinavian Defense** - Queen trap scenario
- **Rapid move sequences** - Stress testing

**Coverage:** 10 tests

### 4. `layout-stability.spec.ts` - UI Stability Tests
Tests UI layout consistency (existing test):
- Board position stability during gameplay
- Control panel width consistency
- Responsive layout on mobile
- Eval bar toggle stability

**Coverage:** 5 tests

## Running Tests

### Prerequisites

```bash
# Install dependencies (includes Playwright)
yarn install

# Install Playwright browsers (first time only)
yarn playwright install
```

### Local Execution

```bash
# Run all E2E tests (headless)
yarn test:e2e

# Run in UI mode (interactive, recommended for debugging)
yarn test:e2e:ui

# Run in headed mode (see browser)
yarn test:e2e:headed

# Run specific test file
yarn test:e2e e2e/gameplay.spec.ts

# Run tests matching a pattern
yarn test:e2e --grep "checkmate"

# Run with debug mode
PWDEBUG=1 yarn test:e2e
```

### CI Execution

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

See `.github/workflows/test.yml` for the CI configuration.

## Test Configuration

Configuration is in `playwright.config.ts`:

```typescript
{
  testDir: './e2e',
  fullyParallel: true,          // Run tests in parallel
  retries: process.env.CI ? 2 : 0,  // Retry failed tests in CI
  workers: process.env.CI ? 1 : undefined,  // Sequential in CI
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',   // Collect traces on retry
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'yarn dev',        // Auto-start dev server
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
}
```

## Debugging Tests

### Interactive UI Mode (Recommended)

```bash
yarn test:e2e:ui
```

Features:
- Visual test execution
- Time travel debugging
- Watch mode
- Pick and run individual tests

### Debug Mode with Playwright Inspector

```bash
PWDEBUG=1 yarn test:e2e e2e/gameplay.spec.ts
```

Features:
- Step through test execution
- Inspect page state
- Record and generate tests

### View Test Reports

After running tests:

```bash
# Open HTML report
npx playwright show-report
```

### Screenshots and Traces

- **Screenshots**: Automatically captured on failure in `test-results/`
- **Traces**: Captured on retry, viewable with `npx playwright show-trace <trace-file>`

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and wait for board
    await page.goto('/');
    await page.waitForSelector('[role="application"]', { state: 'visible' });
  });

  test('should do something', async ({ page }) => {
    // Arrange: Set up test conditions
    
    // Act: Perform actions
    await page.click('[aria-label="e2, White pawn"]');
    await page.waitForTimeout(100);
    await page.click('[aria-label="e4, empty, legal move"]');
    
    // Assert: Verify results
    await expect(page.locator('[aria-label="e4, White pawn"]')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Accessible Selectors**
   - Prefer `aria-label`, `role`, and semantic selectors
   - Avoid CSS classes or IDs that may change

2. **Wait Appropriately**
   - Use `waitForSelector`, `waitForTimeout` when needed
   - Don't rely on fixed timeouts if possible

3. **Take Screenshots**
   - Capture key states for manual verification
   - Use `page.screenshot({ path: 'test-results/name.png' })`

4. **Test Isolation**
   - Each test should be independent
   - Use `test.beforeEach` for setup
   - Reset game state between tests

5. **Clear Test Names**
   - Use descriptive names: "should detect checkmate in Scholar's Mate"
   - Group related tests with `test.describe()`

### Helper Functions

Create reusable helpers for common actions:

```typescript
async function playMoves(page: any, moves: Array<{ from: string; to: string }>) {
  for (const move of moves) {
    await page.click(`[aria-label="${move.from}"]`);
    await page.waitForTimeout(100);
    await page.click(`[aria-label="${move.to}"]`);
    await page.waitForTimeout(250);
  }
}

async function resetGame(page: any) {
  await page.click('button:has-text("New Game")');
  await page.waitForTimeout(300);
}
```

## Test Fixtures

The project includes test fixtures in `docs/fixtures/`:

### FEN Fixtures (`docs/fixtures/fen/`)
Predefined board positions:
- `promotion-white-ready.fen` - Pawn on 7th rank
- `checkmate-scholars-mate.fen` - Scholar's mate position
- `stalemate-corner.fen` - Stalemate position
- `enpassant-white-can-capture.fen` - En passant setup
- `draw-insufficient-material-*.fen` - Various draw scenarios

### PGN Fixtures (`docs/fixtures/pgn/`)
Complete game records:
- `short-scholars-mate.pgn` - Quick checkmate
- `short-fools-mate.pgn` - Fastest checkmate
- `standard-italian-game.pgn` - Full game
- `standard-sicilian-defense.pgn` - Popular opening
- More standard openings and games

### Using Fixtures in Tests

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

test('should load FEN position', async ({ page }) => {
  const fen = readFileSync(
    join(process.cwd(), 'docs/fixtures/fen/promotion-white-ready.fen'),
    'utf-8'
  ).split('\n')[0];
  
  // Load FEN into app (if feature available)
  // ...
});
```

## Known Issues

### Playwright Browser Download

If you encounter download errors:

```bash
# Manual installation
npx playwright install chromium

# With system dependencies
npx playwright install --with-deps chromium
```

### Test Timing

Some tests use `waitForTimeout()` for UI updates. Adjust timings if tests are flaky:
- Click wait: 100ms
- Move completion: 200-300ms
- UI updates: 500ms

### Skipped Tests

Some tests are marked as `test.skip()` because they require features not yet in the UI:
- FEN position loading
- Extensive endgame scenarios (50-move rule, etc.)
- Promotion piece selection UI

These will be implemented as the app evolves.

## CI/CD Integration

### GitHub Actions Workflow

E2E tests run in the CI pipeline:

```yaml
- name: Install dependencies
  run: yarn install --frozen-lockfile

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: yarn test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

### Test Results

After CI runs:
- Test results available in workflow logs
- HTML report uploaded as artifact
- Screenshots of failures available
- Traces captured on retry

## Performance Considerations

- **Parallel Execution**: Tests run in parallel locally for speed
- **Sequential in CI**: Run sequentially in CI to avoid resource contention
- **Retries**: Failed tests automatically retry 2x in CI
- **Timeouts**: Default test timeout is 30 seconds

## Future Improvements

- [ ] Add visual regression testing (screenshot comparison)
- [ ] Test PGN import/export functionality
- [ ] Test FEN position loading
- [ ] Add mobile device testing
- [ ] Test keyboard navigation
- [ ] Add performance benchmarks
- [ ] Test engine analysis features
- [ ] Add accessibility testing with axe-playwright

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI Configuration](https://playwright.dev/docs/ci)
- [Project README](../README.md)
- [Testing Strategy](../docs/TESTING_STRATEGY.md)

## Support

For issues or questions:
1. Check [Playwright docs](https://playwright.dev/docs/intro)
2. Review existing test examples
3. Open an issue on GitHub
4. Ask in project discussions

---

**Last Updated:** 2025-11-08  
**Test Count:** 39 tests across 4 files  
**Coverage:** Gameplay, game conditions, full games, layout stability
