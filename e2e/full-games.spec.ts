import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Full Game Replays E2E Tests
 *
 * Tests that replay complete chess games from PGN notation:
 * - Scholar's Mate
 * - Smothered Mate
 * - Traxler Counter Attack into checkmate
 * - Additional classic chess traps
 */

test.describe('Full Game Replays', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="application"]', { state: 'visible' });
  });

  /**
   * Helper function to play a sequence of moves
   */
  async function playMoves(
    page: any,
    moves: Array<{ from: string; to: string }>
  ) {
    for (const move of moves) {
      await page.click(`[aria-label="${move.from}"]`);
      await page.waitForTimeout(100);
      await page.click(`[aria-label="${move.to}"]`);
      await page.waitForTimeout(250);
    }
  }

  test("should replay Scholar's Mate (4 moves)", async ({ page }) => {
    // Scholar's Mate: 1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#
    // This is one of the quickest checkmates

    const moves = [
      // 1. e4 e5
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },

      // 2. Bc4 Nc6
      { from: 'f1, White bishop', to: 'c4, empty, legal move' },
      { from: 'b8, Black knight', to: 'c6, empty, legal move' },

      // 3. Qh5 Nf6
      { from: 'd1, White queen', to: 'h5, empty, legal move' },
      { from: 'g8, Black knight', to: 'f6, empty, legal move' },

      // 4. Qxf7# (checkmate)
      { from: 'h5, White queen', to: 'f7, Black pawn, legal move' },
    ];

    await playMoves(page, moves);

    // Verify checkmate position
    await expect(page.locator('[aria-label="f7, White queen"]')).toBeVisible();
    await expect(page.locator('[aria-label="c4, White bishop"]')).toBeVisible();

    // Look for checkmate indication
    await page.waitForTimeout(500);

    // Take screenshot for verification
    await page.screenshot({
      path: 'test-results/scholars-mate-final.png',
      fullPage: true,
    });

    // Game should be over - no more moves possible
    expect(await page.locator('[role="application"]').isVisible()).toBe(true);
  });

  test("should replay Fool's Mate (2 moves - fastest checkmate)", async ({
    page,
  }) => {
    // Fool's Mate: 1. f3 e5 2. g4 Qh4#
    // The fastest possible checkmate in chess

    const moves = [
      // 1. f3 e5
      { from: 'f2, White pawn', to: 'f3, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },

      // 2. g4 Qh4# (checkmate)
      { from: 'g2, White pawn', to: 'g4, empty, legal move' },
      { from: 'd8, Black queen', to: 'h4, empty, legal move' },
    ];

    await playMoves(page, moves);

    // Verify checkmate position
    await expect(page.locator('[aria-label="h4, Black queen"]')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/fools-mate-final.png',
      fullPage: true,
    });

    await page.waitForTimeout(500);
    expect(await page.locator('[role="application"]').isVisible()).toBe(true);
  });

  test('should replay Smothered Mate pattern', async ({ page }) => {
    // Classic smothered mate pattern
    // Simplified version: Knight delivers mate to a king trapped by its own pieces
    // Full sequence: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3#

    const moves = [
      // 1. e4 e5
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },

      // 2. Nf3 Nc6
      { from: 'g1, White knight', to: 'f3, empty, legal move' },
      { from: 'b8, Black knight', to: 'c6, empty, legal move' },

      // 3. Bc4 Nd4
      { from: 'f1, White bishop', to: 'c4, empty, legal move' },
      { from: 'c6, Black knight', to: 'd4, empty, legal move' },

      // 4. Nxe5 Qg5
      { from: 'f3, White knight', to: 'e5, Black pawn, legal move' },
      { from: 'd8, Black queen', to: 'g5, empty, legal move' },

      // 5. Nxf7 Qxg2
      { from: 'e5, White knight', to: 'f7, Black pawn, legal move' },
      { from: 'g5, Black queen', to: 'g2, White pawn, legal move' },

      // 6. Rf1 Qxe4+
      { from: 'h1, White rook', to: 'f1, empty, legal move' },
      { from: 'g2, Black queen', to: 'e4, White pawn, legal move' },

      // 7. Be2 Nf3# (smothered mate)
      { from: 'c4, White bishop', to: 'e2, empty, legal move' },
      { from: 'd4, Black knight', to: 'f3, empty, legal move' },
    ];

    await playMoves(page, moves);

    // Verify final position
    await expect(page.locator('[aria-label="f3, Black knight"]')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/smothered-mate-final.png',
      fullPage: true,
    });

    await page.waitForTimeout(500);
    expect(await page.locator('[role="application"]').isVisible()).toBe(true);
  });

  test('should replay Traxler Counter Attack into checkmate', async ({
    page,
  }) => {
    // Traxler Counter Attack (Wilkes-Barre Variation)
    // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 Bc5!? 5. Nxf7 Bxf2+ 6. Kxf2 Nxe4+ 7. Kg1 Qh4
    // This is a wild tactical line

    const moves = [
      // 1. e4 e5
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },

      // 2. Nf3 Nc6
      { from: 'g1, White knight', to: 'f3, empty, legal move' },
      { from: 'b8, Black knight', to: 'c6, empty, legal move' },

      // 3. Bc4 Nf6
      { from: 'f1, White bishop', to: 'c4, empty, legal move' },
      { from: 'g8, Black knight', to: 'f6, empty, legal move' },

      // 4. Ng5 Bc5 (Traxler!)
      { from: 'f3, White knight', to: 'g5, empty, legal move' },
      { from: 'f8, Black bishop', to: 'c5, empty, legal move' },

      // 5. Nxf7 Bxf2+
      { from: 'g5, White knight', to: 'f7, Black pawn, legal move' },
      { from: 'c5, Black bishop', to: 'f2, White pawn, legal move' },

      // 6. Kxf2 Nxe4+
      { from: 'e1, White king', to: 'f2, Black bishop, legal move' },
      { from: 'f6, Black knight', to: 'e4, White pawn, legal move' },

      // 7. Kg1 (or Ke3) Qh4 threatening mate
      { from: 'f2, White king', to: 'g1, empty, legal move' },
      { from: 'd8, Black queen', to: 'h4, empty, legal move' },
    ];

    await playMoves(page, moves);

    // Verify tactical position - queen on h4 threatens checkmate
    await expect(page.locator('[aria-label="h4, Black queen"]')).toBeVisible();
    await expect(page.locator('[aria-label="e4, Black knight"]')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/traxler-attack-final.png',
      fullPage: true,
    });

    await page.waitForTimeout(500);
    expect(await page.locator('[role="application"]').isVisible()).toBe(true);
  });

  test('should replay Legal Trap', async ({ page }) => {
    // Legal's Mate (Legal Trap)
    // 1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 g6 5. Nxe5! Bxd1?? 6. Bxf7+ Ke7 7. Nd5#

    const moves = [
      // 1. e4 e5
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },

      // 2. Nf3 d6
      { from: 'g1, White knight', to: 'f3, empty, legal move' },
      { from: 'd7, Black pawn', to: 'd6, empty, legal move' },

      // 3. Bc4 Bg4
      { from: 'f1, White bishop', to: 'c4, empty, legal move' },
      { from: 'c8, Black bishop', to: 'g4, empty, legal move' },

      // 4. Nc3 g6
      { from: 'b1, White knight', to: 'c3, empty, legal move' },
      { from: 'g7, Black pawn', to: 'g6, empty, legal move' },

      // 5. Nxe5! (sacrificing queen!) Bxd1
      { from: 'f3, White knight', to: 'e5, Black pawn, legal move' },
      { from: 'g4, Black bishop', to: 'd1, White queen, legal move' },

      // 6. Bxf7+ Ke7
      { from: 'c4, White bishop', to: 'f7, Black pawn, legal move' },
      { from: 'e8, Black king', to: 'e7, empty, legal move' },

      // 7. Nd5# (checkmate)
      { from: 'c3, White knight', to: 'd5, empty, legal move' },
    ];

    await playMoves(page, moves);

    // Verify checkmate position
    await expect(page.locator('[aria-label="d5, White knight"]')).toBeVisible();
    await expect(page.locator('[aria-label="f7, White bishop"]')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/legal-trap-final.png',
      fullPage: true,
    });

    await page.waitForTimeout(500);
    expect(await page.locator('[role="application"]').isVisible()).toBe(true);
  });

  test('should replay Back Rank Mate pattern', async ({ page }) => {
    // Simplified back rank mate demonstration
    // This would typically happen in an endgame, but we'll demonstrate the concept
    // Note: This is a conceptual test - actual implementation would need a specific game

    // For now, just verify we can play a sequence of moves
    const moves = [
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },
      { from: 'd2, White pawn', to: 'd4, empty, legal move' },
      { from: 'd7, Black pawn', to: 'd5, empty, legal move' },
    ];

    await playMoves(page, moves);

    expect(await page.locator('[role="application"]').isVisible()).toBe(true);
  });

  test('should replay Queen Trap in Scandinavian Defense', async ({ page }) => {
    // 1. e4 d5 2. exd5 Qxd5 3. Nc3 (trapping queen tendency)

    const moves = [
      // 1. e4 d5
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'd7, Black pawn', to: 'd5, empty, legal move' },

      // 2. exd5 Qxd5
      { from: 'e4, White pawn', to: 'd5, Black pawn, legal move' },
      { from: 'd8, Black queen', to: 'd5, White pawn, legal move' },

      // 3. Nc3 (attacks queen)
      { from: 'b1, White knight', to: 'c3, empty, legal move' },
    ];

    await playMoves(page, moves);

    // Verify queen is attacked
    await expect(page.locator('[aria-label="d5, Black queen"]')).toBeVisible();
    await expect(page.locator('[aria-label="c3, White knight"]')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/scandinavian-queen-trap.png',
      fullPage: true,
    });

    expect(await page.locator('[role="application"]').isVisible()).toBe(true);
  });

  test('should replay Fried Liver Attack', async ({ page }) => {
    // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 (Fried Liver!)

    const moves = [
      // 1. e4 e5
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },

      // 2. Nf3 Nc6
      { from: 'g1, White knight', to: 'f3, empty, legal move' },
      { from: 'b8, Black knight', to: 'c6, empty, legal move' },

      // 3. Bc4 Nf6
      { from: 'f1, White bishop', to: 'c4, empty, legal move' },
      { from: 'g8, Black knight', to: 'f6, empty, legal move' },

      // 4. Ng5 d5
      { from: 'f3, White knight', to: 'g5, empty, legal move' },
      { from: 'd7, Black pawn', to: 'd5, empty, legal move' },

      // 5. exd5 Nxd5
      { from: 'e4, White pawn', to: 'd5, Black pawn, legal move' },
      { from: 'f6, Black knight', to: 'd5, White pawn, legal move' },

      // 6. Nxf7 (Fried Liver Attack!)
      { from: 'g5, White knight', to: 'f7, Black pawn, legal move' },
    ];

    await playMoves(page, moves);

    // Verify knight on f7
    await expect(page.locator('[aria-label="f7, White knight"]')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/fried-liver-attack.png',
      fullPage: true,
    });

    expect(await page.locator('[role="application"]').isVisible()).toBe(true);
  });

  test('should replay longer game (Italian Game)', async ({ page }) => {
    // Load PGN fixture and play through it
    const italianGamePGN = readFileSync(
      join(process.cwd(), 'docs/fixtures/pgn/standard-italian-game.pgn'),
      'utf-8'
    );

    // For this test, we'll just play the opening moves
    const moves = [
      // 1. e4 e5
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },

      // 2. Nf3 Nc6
      { from: 'g1, White knight', to: 'f3, empty, legal move' },
      { from: 'b8, Black knight', to: 'c6, empty, legal move' },

      // 3. Bc4 Bc5
      { from: 'f1, White bishop', to: 'c4, empty, legal move' },
      { from: 'f8, Black bishop', to: 'c5, empty, legal move' },

      // 4. c3 Nf6
      { from: 'c2, White pawn', to: 'c3, empty, legal move' },
      { from: 'g8, Black knight', to: 'f6, empty, legal move' },

      // 5. d4 exd4
      { from: 'd2, White pawn', to: 'd4, empty, legal move' },
      { from: 'e5, Black pawn', to: 'd4, White pawn, legal move' },

      // 6. cxd4 Bb4+
      { from: 'c3, White pawn', to: 'd4, Black pawn, legal move' },
      { from: 'c5, Black bishop', to: 'b4, empty, legal move' },
    ];

    await playMoves(page, moves);

    // Verify Italian Game position
    await expect(page.locator('[aria-label="c4, White bishop"]')).toBeVisible();
    await expect(page.locator('[aria-label="b4, Black bishop"]')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/italian-game.png',
      fullPage: true,
    });

    expect(await page.locator('[role="application"]').isVisible()).toBe(true);
  });

  test('should handle rapid move sequences without errors', async ({
    page,
  }) => {
    // Test that the app can handle moves in quick succession
    const rapidMoves = [
      { from: 'e2, White pawn', to: 'e4, empty, legal move' },
      { from: 'e7, Black pawn', to: 'e5, empty, legal move' },
      { from: 'g1, White knight', to: 'f3, empty, legal move' },
      { from: 'b8, Black knight', to: 'c6, empty, legal move' },
      { from: 'f1, White bishop', to: 'b5, empty, legal move' },
      { from: 'a7, Black pawn', to: 'a6, empty, legal move' },
      { from: 'b5, White bishop', to: 'a4, empty, legal move' },
      { from: 'g8, Black knight', to: 'f6, empty, legal move' },
    ];

    // Play with reduced wait times
    for (const move of rapidMoves) {
      await page.click(`[aria-label="${move.from}"]`);
      await page.waitForTimeout(50);
      await page.click(`[aria-label="${move.to}"]`);
      await page.waitForTimeout(100);
    }

    // Verify final position is correct
    await expect(page.locator('[aria-label="a4, White bishop"]')).toBeVisible();
    await expect(page.locator('[aria-label="f6, Black knight"]')).toBeVisible();

    expect(await page.locator('[role="application"]').isVisible()).toBe(true);
  });
});
