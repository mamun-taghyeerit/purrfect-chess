# E2E Skipped Tests - Requirements for Implementation

This document outlines the requirements needed to enable the currently skipped E2E tests in the Purrfect Chess test suite.

## Overview

Currently, **7 E2E tests are skipped** because they require features not yet implemented in the UI. These tests validate important chess game conditions and edge cases.

## Skipped Tests List

### 1. Stalemate Detection (Corner Position)

**Test File:** `e2e/game-conditions.spec.ts`  
**Test Name:** `should detect stalemate (corner position)`

**Required Feature:** FEN Position Loading UI

**Description:**

- Test needs to load a specific stalemate position: `7k/8/6Q1/8/8/8/8/K7 b - - 0 1`
- This position has the black king in the corner with no legal moves but not in check
- Currently requires manual setup which would take many moves

**Implementation Requirements:**

- [ ] Add FEN input field in UI (e.g., in GameControls or a dedicated import dialog)
- [ ] Parse FEN string and load position into game state
- [ ] Validate FEN format and show errors for invalid input
- [ ] Reset game state properly when loading FEN
- [ ] Update board display to reflect loaded position

**Alternative Approach:**

- Could implement as a URL parameter: `?fen=7k/8/6Q1/8/8/8/8/K7`
- Or as a "Load Position" button that opens a dialog

---

### 2. Draw by Insufficient Material (K vs K)

**Test File:** `e2e/game-conditions.spec.ts`  
**Test Name:** `should detect draw by insufficient material (K vs K)`

**Required Feature:** FEN Position Loading UI

**Description:**

- Test needs to load an endgame with only two kings: `4k3/8/8/8/8/8/8/4K3 w - - 0 1`
- Chess.js detects this as insufficient material for checkmate

**Implementation Requirements:**

- Same as Stalemate test - requires FEN loading capability

---

### 3. Draw by Insufficient Material (K+B vs K)

**Test File:** `e2e/game-conditions.spec.ts`  
**Test Name:** `should detect draw by insufficient material (K+B vs K)`

**Required Feature:** FEN Position Loading UI

**Description:**

- King and bishop vs king alone is insufficient material
- Example position: `4k3/8/8/8/8/8/8/4K2B w - - 0 1`

**Implementation Requirements:**

- Same as above - requires FEN loading capability

---

### 4. Draw by Insufficient Material (K+N vs K)

**Test File:** `e2e/game-conditions.spec.ts`  
**Test Name:** `should detect draw by insufficient material (K+N vs K)`

**Required Feature:** FEN Position Loading UI

**Description:**

- King and knight vs king alone is insufficient material
- Example position: `4k3/8/8/8/8/8/8/4K2N w - - 0 1`

**Implementation Requirements:**

- Same as above - requires FEN loading capability

---

### 5. Pawn Promotion to Other Pieces (Knight)

**Test File:** `e2e/game-conditions.spec.ts`  
**Test Name:** `should handle pawn promotion to other pieces (knight)`

**Required Feature:** Pawn Promotion Piece Selection Dialog

**Description:**

- When a pawn reaches the 8th rank, player should be able to choose promotion piece
- Currently the game may auto-promote to queen or not handle promotion in UI
- Need UI to select: Queen, Rook, Bishop, or Knight

**Implementation Requirements:**

- [ ] Add promotion dialog that appears when pawn reaches last rank
- [ ] Dialog should show 4 piece options with images
- [ ] Allow keyboard selection (Q, R, B, N keys)
- [ ] Handle cancellation (ESC key - defaults to queen)
- [ ] Update game state with selected piece
- [ ] Show animation or feedback for promotion

**UI Design Suggestions:**

- Modal dialog centered on board
- Show 4 large piece images in a row
- Click to select, or use keyboard shortcuts
- Could also show as overlay on the board itself

---

### 6. Draw by 50-Move Rule

**Test File:** `e2e/game-conditions.spec.ts`  
**Test Name:** `should detect draw by 50-move rule`

**Required Feature:** Long Game Simulation or FEN with Move Counters

**Description:**

- After 50 moves without pawn advance or capture, game is drawn
- Testing this in E2E would require 100 half-moves (50 full moves)
- Too slow for automated testing

**Implementation Requirements:**

**Option A: FEN Loading with Move Counters**

- [ ] FEN loading as described above
- [ ] Load position with halfmove clock at 99: `4k3/8/8/8/8/8/8/4K3 w - - 99 1`
- [ ] Make one non-capturing, non-pawn move to trigger 50-move rule

**Option B: Game Speed Controls**

- [ ] Add "fast forward" mode that skips animations
- [ ] Programmatic move execution for testing
- [ ] Still would be slow but feasible

**Recommended:** Option A (FEN loading) is simpler and faster

---

### 7. En Passant Conditional Skip

**Test File:** `e2e/game-conditions.spec.ts`  
**Test Name:** `should handle en passant capture (white captures black)`

**Issue:** Test includes a conditional skip if move sequence fails

**Description:**

- This is actually a test robustness issue
- The test tries to set up an en passant position
- If the sequence doesn't work, it skips rather than failing

**Required Fix:**

- [ ] Simplify en passant test setup sequence
- [ ] OR use FEN loading to directly load en passant position
- [ ] Example FEN: `rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3`

**Recommended:** Keep current test but also add FEN-based test once FEN loading is available

---

## Priority Recommendations

### High Priority

1. **FEN Position Loading** - Enables 4 skipped tests immediately
   - Stalemate detection
   - All insufficient material tests
   - 50-move rule test (with move counter)
   - Alternative for en passant setup

### Medium Priority

2. **Pawn Promotion Dialog** - Enables 1 test, improves UX
   - Allows testing promotion to pieces other than queen
   - Essential feature for proper chess gameplay

### Low Priority

3. **En Passant Test Improvement** - Current test works but could be more robust
   - Can use FEN loading once available
   - Current test with conditional skip is acceptable

---

## Implementation Estimate

### FEN Position Loading

**Estimated Effort:** 2-3 hours

- UI component (input field or dialog): 1 hour
- Parse and validate FEN: 30 minutes
- Integrate with game state: 1 hour
- Testing and edge cases: 30 minutes

**Files to Modify:**

- `components/GameControls.tsx` - Add FEN input UI
- `stores/root-store.ts` - Add `loadFEN(fen: string)` action
- Test FEN loading in unit tests first

### Pawn Promotion Dialog

**Estimated Effort:** 3-4 hours

- UI component (modal/dialog): 1.5 hours
- Piece selection logic: 1 hour
- Integration with move handling: 1 hour
- Keyboard shortcuts and accessibility: 30 minutes

**Files to Modify:**

- Create `components/PromotionDialog.tsx`
- Modify `components/Board.tsx` to detect promotion and show dialog
- Update `stores/root-store.ts` to handle promotion piece selection

---

## Testing Plan

Once features are implemented:

1. **Un-skip the tests** - Remove `test.skip()` calls
2. **Update test selectors** - Add selectors for new UI elements
3. **Run full E2E suite** - Verify all tests pass
4. **Update documentation** - Mark tests as enabled in README

---

## Follow-up Issue Template

```markdown
## Enable Skipped E2E Tests

### Background

7 E2E tests are currently skipped because they require UI features not yet implemented. See `docs/e2e-skipped-tests.md` for full details.

### Required Features

1. FEN Position Loading UI - enables 4 tests
2. Pawn Promotion Piece Selection Dialog - enables 1 test

### Acceptance Criteria

- [ ] FEN input field added to UI
- [ ] FEN positions can be loaded and displayed
- [ ] Pawn promotion dialog allows piece selection
- [ ] All 7 skipped tests are enabled and passing
- [ ] E2E documentation updated

### Estimated Effort

5-7 hours total

### Files Affected

- `components/GameControls.tsx`
- `components/PromotionDialog.tsx` (new)
- `components/Board.tsx`
- `stores/root-store.ts`
- `e2e/game-conditions.spec.ts`

See `docs/e2e-skipped-tests.md` for detailed implementation requirements.
```

---

**Last Updated:** 2025-11-08  
**Related Issue:** #93 (E2E Testing Implementation)
