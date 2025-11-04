# Phase X: Complete Next.js Migration Parity

> **⚠️ UPDATED:** This document has been superseded by Phase X documentation.  
> See [`docs/phase-x-parity.md`](./docs/phase-x-parity.md) for current status and tasks.

## Current Status Summary

**Phases 1-3: COMPLETE ✅**

The Next.js migration skeleton and core features are fully implemented:

- ✅ Next.js 14 + React 18 + TypeScript
- ✅ Board rendering with piece images
- ✅ Click-to-select and drag-and-drop
- ✅ Time controls and game clocks
- ✅ Stockfish engine integration
- ✅ Engine analysis panel (multi-PV)
- ✅ Appearance customization
- ✅ Hidden "gmmamun" Easter egg
- ✅ FEN/PGN import/export
- ✅ Move history display

**Phase X: CURRENT (Parity Validation) 🔄**

> **Purpose:** Ensure 1:1 parity between legacy and Next.js apps before Phase 4 cleanup.  
> **Issue:** [#40 - Functional + Visual Parity Development](https://github.com/purrfectsoft/purrfect-chess/issues/40)  
> **Documentation:** [`docs/phase-x-parity.md`](./docs/phase-x-parity.md)

**Remaining Tasks:**

1. ⏳ Implement arrow drawing system (legacy feature, not in Next.js yet)
2. ⏳ Wire EvaluationBar component (stub exists)
3. 🔍 Validate all 14 workstreams (see Phase X docs)
4. 🔍 Test with fixture corpuses (25 FENs, 10 PGNs)
5. 🔍 Side-by-side manual validation
6. 🔍 Visual parity (≤2px tolerance)
7. 🔍 Functional parity (exact behavior)
8. 🔍 Performance parity (Next.js ≥ legacy)

## Quick Links

- **Phase X Master Doc:** [`docs/phase-x-parity.md`](./docs/phase-x-parity.md)
- **Contributor Guide:** [`docs/contributing-phase-x.md`](./docs/contributing-phase-x.md)
- **Validation Runbook:** [`docs/runbooks/side-by-side.md`](./docs/runbooks/side-by-side.md)
- **ADR:** [`docs/adr/0001-phase-x-parity-approach.md`](./docs/adr/0001-phase-x-parity-approach.md)
- **FEN Fixtures:** [`docs/fixtures/fen/`](./docs/fixtures/fen/)
- **PGN Fixtures:** [`docs/fixtures/pgn/`](./docs/fixtures/pgn/)

---

## ORIGINAL CONTENT (ARCHIVE)

Below is the original next steps document, preserved for historical reference.

---

# Next Steps: Complete Next.js Migration (Phase 2 & 3) - ARCHIVE

## Overview

This issue tracks the remaining work to complete the Next.js migration for Purrfect Chess, following the initial skeleton setup in the migration PR.

The skeleton provides:
- ✅ Next.js 14 + React 18 + TypeScript setup
- ✅ Placeholder Board component with chess.js integration
- ✅ Stub implementations for engine hooks and workers
- ✅ Tailwind CSS, ESLint, and Prettier configuration

**Goal**: Achieve complete feature parity with the original vanilla TypeScript/Vite app while maintaining the incremental migration approach.

---

## Phase 2: Core Migration

These tasks port the essential chess functionality from vanilla TypeScript to React components and hooks.

### 2.1 Board Rendering & Interaction

**Priority: HIGH** - ✅ COMPLETE

✅ **Replace Unicode pieces with PNG images** from `/public/assets/`
  - Use `w_pawn.png`, `b_knight.png`, etc. instead of Unicode symbols
  - Implement proper piece rendering with Next.js Image component
  - Related file: `src/board.ts` (lines 6-23, piece image paths)

✅ **Implement drag-and-drop functionality**
  - Port drag handlers from `src/board.ts` (dragFrom, dragTo, interactive state)
  - Add HTML5 drag-and-drop events with `onDragStart`, `onDragOver`, `onDrop`
  - Handle piece selection and move execution via `useGame` hook
  - Related file: `src/board.ts` (lines 47-50, drag state)

✅ **Implement click-to-select and click-to-move interaction**
  - Click piece to select and show legal moves
  - Click destination square to move
  - Click different piece to change selection

✅ **Add square highlighting**
  - Legal move indicators (green circles for empty squares, rings for captures)
  - Last move highlighting (yellow background overlay)
  - Selected square highlighting (blue ring)
  - Related file: `src/board.ts` (BoardRenderOptions interface)

- [ ] **Implement custom themes**
  - Piece opacity slider (customization from UI)
  - Square color customization (light/dark squares)
  - Support for multiple piece/board themes
  - Create `components/AppearanceControls.tsx`
  - Related file: `src/ui.ts` (appearance sliders, lines 20-100)

### 2.2 Stockfish Engine Integration

**Priority: HIGH** - ✅ **COMPLETE**

Complete the engine worker and hook from stubs to fully functional UCI implementation:

- [x] **Auto-vendor Stockfish from npm package**
  - Added `stockfish@17.1.0` as devDependency (chess.com maintained)
  - Created `scripts/vendor-stockfish.js` (ESM format)
  - Integrated into build process (postinstall + next:build hooks)
  - Files auto-generated in `public/libs/` (gitignored)
  - Manual trigger: `yarn vendor:stockfish`

- [x] **Complete `workers/stockfish.worker.ts`**
  - Load Stockfish from `/libs/stockfish-lite-single.js`
  - Implement UCI protocol communication (uci, isready, position, go, stop commands)
  - Parse info lines using `lib/uci-parser.ts` (ported from `src/engine/uci-parser.ts`)
  - Handle bestmove responses
  - Support multi-PV analysis (top 3 lines)

- [x] **Complete `hooks/useEngine.ts`**
  - Initialize Stockfish worker on mount
  - Implement `startAnalysis(fen, depth, multipv)` with real UCI commands
  - Implement `stopAnalysis()` to halt engine
  - Parse multi-PV analysis (show top 3 moves)
  - Convert UCI moves to SAN notation
  - Calculate and format evaluation scores (centipawns, mate scores)
  - Normalize scores based on side to move

- [x] **Add engine analysis display**
  - Created `components/EnginePanel.tsx` for analysis results
  - Show depth, score, best move, PV line for each multi-PV option
  - Real-time updates as engine analyzes
  - Manual start/stop controls
  - Integrated into main page

**Stockfish Variant Details:**

**Selected Variant**: Lite Single-threaded WASM
- **Version**: 17.1.0 (commit hash: 03e3232)
- **Format**: WebAssembly (WASM)
- **Threading**: Single-threaded (no SharedArrayBuffer/CORS required)
- **Size**: ~7MB WASM + ~21KB JS wrapper
- **NNUE**: Lite neural network evaluation
- **Strength**: Weaker than full version, but sufficient for browser analysis
- **Compatibility**: Works in all deployment scenarios (no CORS headers needed)
- **Performance**: Native WASM speed (faster than asm.js)

**Why This Variant?**
1. **No CORS requirements**: Works on any hosting platform without special headers
2. **Reasonable size**: ~7MB vs ~75MB for full version (better for web delivery)
3. **Single-threaded**: Simpler threading model, no SharedArrayBuffer complexity
4. **WASM performance**: Much faster than asm.js fallback
5. **Sufficient strength**: Good enough for casual browser-based analysis

**Other Variants Available** (change in `scripts/vendor-stockfish.js`):
- **lite** (multi-threaded): ~7MB, requires CORS, faster on multi-core
- **single** (full): ~75MB, no CORS, strongest single-threaded
- **full** (multi-threaded): ~75MB, requires CORS, strongest overall
- **asm** (asm.js): ~10MB, no WASM, universal compatibility (slowest)

**Automation Approach**:
- Stockfish package is a **devDependency** (not committed to repo)
- Binaries are **auto-vendored** during build from `node_modules/stockfish/src/`
- Vendor script is **ESM format** (consistent with `"type": "module"` in package.json)
- Vendored files are **gitignored** (regenerated from package on each build)
- Upgrade path: `yarn upgrade stockfish` + update hash in vendor script

This approach provides:
- ✅ Reproducible builds (same version across environments)
- ✅ Easy upgrades (just update package version)
- ✅ No manual file management
- ✅ Version control of configuration, not binaries
- ✅ CI/CD friendly (auto-vendors during deployment)

### 2.3 Time Controls & Game Management

**Priority: MEDIUM** - ✅ COMPLETE

✅ **Implement time controls in `hooks/useGame.ts`**
  - Add clock state (white time, black time, active color)
  - Implement timer with increment support (100ms tick interval)
  - Handle time expiration (flag fall) and timeout game over
  - Port logic from `src/game.ts` (lines 6-20, time state; lines 32-60, timer logic)
  - Port logic from `src/game/time-controls.ts`

✅ **Create time control UI components**
  - `components/TimeControlSelector.tsx` for time selection (presets: 1+0, 3+0, 3+2, 5+0, 5+1, 10+0, 15+10, 30+0)
  - `components/Clock.tsx` to display remaining time for both players (MM:SS format)
  - Visual indication of active player's clock
  - Disable selector after game starts
  - Related file: `src/ui.ts` (time control DOM elements)

✅ **Port UI control components**
  - `components/GameControls.tsx` with Reset, FEN Import/Export, PGN Export buttons
  - `components/MoveHistory.tsx` to display move list in algebraic notation
  - Implement handlers using `useGame` hook methods
  - Related file: `src/ui.ts` (control panel initialization)

### 2.4 Move History & Validation

**Priority: MEDIUM** - ✅ COMPLETE

✅ **Create `components/MoveHistory.tsx`**
  - Display move list in algebraic notation (SAN)
  - Group by move pairs (White & Black)
  - Scrollable container with max height
  - Port logic from `src/game.ts` (move history tracking)

✅ **Port move validation utilities**
  - Integrate chess.js into `useGame` hook for move legality checks
  - Expose game state (check, checkmate, stalemate)
  - Add FEN/PGN import/export support

---

**Phase 2 Summary:** Core chess functionality is now complete! The Next.js app has:
- ✅ Fully functional chess board with piece images
- ✅ Drag-and-drop and click-to-move interaction
- ✅ Legal move highlighting
- ✅ Time controls with clock management
- ✅ Game controls (Reset, FEN/PGN)
- ✅ Move history display
- ✅ Game status detection (check, checkmate, stalemate, timeout)

**Remaining Phase 2 tasks:**
- Appearance customization (theme sliders)
- Stockfish engine integration
- Engine analysis panel

---

## Phase 3: Advanced Features

These tasks port the advanced features and polish the UI to match the original app.

### 3.1 Arrow Drawing System

**Priority: MEDIUM**

Port arrow drawing functionality from `src/board.ts`:

- [ ] **Implement arrow layer**
  - SVG overlay for drawing arrows on board
  - Right-click drag to create arrows
  - Support multiple arrows with different colors/styles
  - Port logic from `src/board.ts` (lines 25-36, arrow constants; arrow drawing functions)

- [ ] **Arrow management**
  - Store arrow state in `useGame` or local component state
  - Clear arrows on new move or manually
  - Persist arrows across board updates

### 3.2 Engine Analysis Overlays

**Priority: MEDIUM**

- [ ] **Add engine move highlighting**
  - Highlight engine's suggested moves on the board (arrows or square colors)
  - Support multi-PV highlighting (show top 3 suggestions)
  - Toggle between arrows, squares, or both
  - Port logic from `src/board.ts` (engineHighlights, engineDisplayMode)

- [ ] **Implement evaluation bar**
  - Visual bar showing position evaluation (-10 to +10, or mate scores)
  - Update in real-time as engine analyzes
  - Port from `src/ui.ts` (eval bar updates)

### 3.3 Hidden "gmmamun" Easter Egg

**Priority: LOW**

Port the Easter egg feature:

- [ ] **Implement "gmmamun" detection**
  - Port logic from `src/ui/easter-egg.ts`
  - Trigger on text selection + typing "gmmamun"
  - Reveal engine controls when activated

- [ ] **Create hidden engine panel**
  - Initially hidden UI that appears after Easter egg trigger
  - Contains depth slider and engine controls
  - Port from `src/ui.ts` (engine panel visibility logic)

### 3.4 Move Review & Annotations

**Priority: LOW**

- [ ] **Add move annotations**
  - Display move quality indicators (brilliant, good, inaccuracy, mistake, blunder)
  - Use icons from `/public/assets/` (brilliant.png, good.png, etc.)
  - Port logic from move review system if available

- [ ] **Implement move review mode**
  - Analyze game after completion
  - Show evaluation graph (if implemented)
  - Highlight critical moments

---

## Phase 4: Testing & Cleanup

**Priority: MEDIUM (ongoing)**

- [ ] **Add component tests**
  - Unit tests for `useGame` hook (move execution, FEN/PGN import/export)
  - Unit tests for `useEngine` hook (UCI communication)
  - Integration tests for Board component (piece movement, highlighting)
  - Use existing test structure from `tests/` directory (Vitest)

- [ ] **E2E tests for full game flow**
  - Test complete game from start to checkmate
  - Test time controls and clock functionality
  - Test engine analysis workflow

- [ ] **Code cleanup**
  - Remove original vanilla TypeScript files once full parity is achieved
  - Update all documentation
  - Final linting and formatting pass

- [ ] **Performance optimization**
  - Optimize board re-renders (React.memo, useMemo, useCallback)
  - Lazy load Stockfish worker
  - Code splitting for better initial load time

---

## Migration Strategy

### Incremental Approach

1. **One feature at a time**: Implement and test each feature before moving to the next
2. **Maintain coexistence**: Keep original Vite app functional until Next.js app has full parity
3. **Test thoroughly**: Run existing tests + add new tests for React components
4. **Document as you go**: Update `MIGRATION.md` with progress

### Module Mapping Reference

| Vanilla TS Module | Next.js Equivalent | Status |
|-------------------|-------------------|--------|
| `src/main.ts` | `app/page.tsx` | ✅ Complete |
| `src/board.ts` | `components/Board.tsx` | 🟡 Partial (placeholder) |
| `src/game.ts` | `hooks/useGame.ts` | 🟡 Partial (basic logic) |
| `src/engine.ts` | `hooks/useEngine.ts` + `workers/stockfish.worker.ts` | 🟡 Stub only |
| `src/ui.ts` | Multiple components (Controls, Clock, etc.) | ⭕ Not started |
| `src/types.ts` | Reusable as-is | ✅ Complete |
| `src/engine/uci-parser.ts` | `lib/uci-parser.ts` or inline in worker | ⭕ Not started |
| `src/game/move-validator.ts` | `lib/move-validator.ts` | ⭕ Not started |
| `src/game/position-utils.ts` | `lib/position-utils.ts` | ⭕ Not started |
| `src/game/time-controls.ts` | Integrated into `useGame` | ⭕ Not started |
| `src/ui/easter-egg.ts` | `lib/easter-egg.ts` + component | ⭕ Not started |

---

## Acceptance Criteria

The migration is complete when:

- ✅ All features from the original app are functional in Next.js version
- ✅ No runtime errors or console warnings in production build
- ✅ All existing tests pass + new tests for React components
- ✅ Performance is equal to or better than original app
- ✅ Code is properly documented and follows Next.js best practices
- ✅ Original vanilla TS files can be safely removed

---

## Resources

- **Migration guide**: See `MIGRATION.md` for detailed instructions
- **Original implementation**: Study `src/` directory for reference
- **Next.js docs**: https://nextjs.org/docs
- **chess.js docs**: https://github.com/jhlywa/chess.js
- **Stockfish UCI protocol**: https://www.chessprogramming.org/UCI

---

## Related Issues

- #31 - Modernization roadmap (parent issue)

---

## Getting Started

If you're tackling one of these tasks:

1. Check out the `migration/nextjs-skeleton` branch (or merged main if already merged)
2. Review the corresponding vanilla TS file to understand the current implementation
3. Read the TODO comments in the Next.js files (they link to the original modules)
4. Implement the feature incrementally, testing as you go
5. Submit a PR with your changes, referencing this issue

**Questions?** Comment on this issue or the related PR.
