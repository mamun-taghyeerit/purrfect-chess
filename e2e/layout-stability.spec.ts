import { test, expect } from '@playwright/test';

/**
 * Layout Stability Tests for Purrfect Chess
 *
 * These tests verify that the board position and panel widths remain stable
 * during gameplay, addressing the critical layout shift bug described in
 * ARCHITECTURE_REFACTORING_PLAN.md
 *
 * Critical Issue:
 * - Before first move: Board X: 313px, Right Panel: 273px
 * - After first move: Board X: 305.5px (shifted LEFT by 7.5px), Right Panel: 288px (+15px)
 *
 * Expected behavior after refactoring:
 * - Board X position should remain constant
 * - Panel widths should remain 320px (fixed)
 */

test.describe('Layout Stability', () => {
  test('board position remains stable after first move', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the board to be visible
    await page.waitForSelector('[role="application"]', { state: 'visible' });

    // Measure board position before move
    const boardBefore = await page
      .locator('[role="application"]')
      .boundingBox();
    expect(boardBefore).toBeTruthy();

    // Take screenshot before move
    await page.screenshot({
      path: 'test-results/layout-before-move.png',
      fullPage: true,
    });

    // Make first move (e4)
    // Click on e2 square (white pawn)
    await page.click('[aria-label="e2, White pawn"]');

    // Wait a bit for the square to be selected
    await page.waitForTimeout(100);

    // Click on e4 square (destination)
    await page.click('[aria-label="e4, empty, legal move"]');

    // Wait for move to be processed
    await page.waitForTimeout(200);

    // Take screenshot after move
    await page.screenshot({
      path: 'test-results/layout-after-move.png',
      fullPage: true,
    });

    // Measure board position after move
    const boardAfter = await page.locator('[role="application"]').boundingBox();
    expect(boardAfter).toBeTruthy();

    // Assert no horizontal shift (the critical bug fix)
    expect(boardAfter!.x).toBe(boardBefore!.x);

    // Also verify no vertical shift
    expect(boardAfter!.y).toBe(boardBefore!.y);

    // Verify board dimensions remain the same
    expect(boardAfter!.width).toBe(boardBefore!.width);
    expect(boardAfter!.height).toBe(boardBefore!.height);
  });

  test('control panels maintain fixed width on xl screens', async ({
    page,
    viewport,
  }) => {
    // Set viewport to XL size (1280px+)
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to the app
    await page.goto('/');

    // Wait for the layout to render
    await page.waitForSelector('[role="application"]', { state: 'visible' });

    // Find the control panels by their titles
    const leftPanel = page.locator('text=White Controls').locator('..');
    const rightPanel = page.locator('text=Black Controls').locator('..');

    // Measure panel widths before move
    const leftPanelBefore = await leftPanel.boundingBox();
    const rightPanelBefore = await rightPanel.boundingBox();

    expect(leftPanelBefore).toBeTruthy();
    expect(rightPanelBefore).toBeTruthy();

    // Verify initial panel widths are 320px
    expect(leftPanelBefore!.width).toBeCloseTo(320, 1);
    expect(rightPanelBefore!.width).toBeCloseTo(320, 1);

    // Make several moves to populate move history
    const moves = [
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },
      { from: 'd2, White pawn', to: 'd4, empty, legal move' },
      { from: 'd7, Black pawn', to: 'd5, empty, legal move' },
    ];

    for (const move of moves) {
      await page.click(`[aria-label="${move.from}"]`);
      await page.waitForTimeout(100);
      await page.click(`[aria-label="${move.to}"]`);
      await page.waitForTimeout(200);
    }

    // Measure panel widths after moves
    const leftPanelAfter = await leftPanel.boundingBox();
    const rightPanelAfter = await rightPanel.boundingBox();

    expect(leftPanelAfter).toBeTruthy();
    expect(rightPanelAfter).toBeTruthy();

    // Assert panel widths remain 320px (the critical fix)
    expect(leftPanelAfter!.width).toBeCloseTo(320, 1);
    expect(rightPanelAfter!.width).toBeCloseTo(320, 1);

    // Verify no width change occurred
    expect(leftPanelAfter!.width).toBe(leftPanelBefore!.width);
    expect(rightPanelAfter!.width).toBe(rightPanelBefore!.width);
  });

  test('layout remains stable across multiple moves', async ({
    page,
    viewport,
  }) => {
    // Set viewport to XL size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to the app
    await page.goto('/');

    // Wait for the layout to render
    await page.waitForSelector('[role="application"]', { state: 'visible' });

    // Get initial board position
    const initialBoard = await page
      .locator('[role="application"]')
      .boundingBox();
    expect(initialBoard).toBeTruthy();

    // Make 10 moves
    const moves = [
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },
      { from: 'g1, White knight', to: 'f3, empty, legal move' },
      { from: 'b8, Black knight', to: 'c6, empty, legal move' },
      { from: 'f1, White bishop', to: 'c4, empty, legal move' },
      { from: 'f8, Black bishop', to: 'c5, empty, legal move' },
      { from: 'd2, White pawn', to: 'd3, empty, legal move' },
      { from: 'd7, Black pawn', to: 'd6, empty, legal move' },
      { from: 'b1, White knight', to: 'c3, empty, legal move' },
      { from: 'g8, Black knight', to: 'f6, empty, legal move' },
    ];

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      await page.click(`[aria-label="${move.from}"]`);
      await page.waitForTimeout(100);
      await page.click(`[aria-label="${move.to}"]`);
      await page.waitForTimeout(200);

      // Check board position after each move
      const currentBoard = await page
        .locator('[role="application"]')
        .boundingBox();
      expect(currentBoard).toBeTruthy();

      // Board should not shift on any move
      expect(currentBoard!.x).toBe(initialBoard!.x);
      expect(currentBoard!.y).toBe(initialBoard!.y);
    }

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/layout-after-10-moves.png',
      fullPage: true,
    });
  });

  test('panels maintain width when toggling eval bar', async ({
    page,
    viewport,
  }) => {
    // Set viewport to XL size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to the app
    await page.goto('/');

    // Wait for the layout to render
    await page.waitForSelector('[role="application"]', { state: 'visible' });

    // Find the control panels
    const leftPanel = page.locator('text=White Controls').locator('..');
    const rightPanel = page.locator('text=Black Controls').locator('..');

    // Measure initial panel widths
    const leftPanelBefore = await leftPanel.boundingBox();
    const rightPanelBefore = await rightPanel.boundingBox();

    expect(leftPanelBefore).toBeTruthy();
    expect(rightPanelBefore).toBeTruthy();

    // Toggle eval bar (find the eval bar button by text content)
    const evalBarButton = page.locator('button:has-text("Show Eval Bar")');
    await evalBarButton.click();
    await page.waitForTimeout(300);

    // Measure panel widths after toggle
    const leftPanelAfter = await leftPanel.boundingBox();
    const rightPanelAfter = await rightPanel.boundingBox();

    expect(leftPanelAfter).toBeTruthy();
    expect(rightPanelAfter).toBeTruthy();

    // Assert panel widths remain unchanged
    expect(leftPanelAfter!.width).toBe(leftPanelBefore!.width);
    expect(rightPanelAfter!.width).toBe(rightPanelBefore!.width);
  });

  test('responsive layout works on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to the app
    await page.goto('/');

    // Wait for the layout to render
    await page.waitForSelector('[role="application"]', { state: 'visible' });

    // On mobile, panels should stack vertically
    // Check that both panels are visible
    const whiteControls = page.locator('text=White Controls');
    const blackControls = page.locator('text=Black Controls');

    await expect(whiteControls).toBeVisible();
    await expect(blackControls).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/layout-mobile.png',
      fullPage: true,
    });
  });
});
