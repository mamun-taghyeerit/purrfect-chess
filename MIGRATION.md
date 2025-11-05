# Next.js Migration Guide

This document explains the Next.js migration skeleton and how to work with it.

## Related Issues

This migration relates to:

- [Issue #31](https://github.com/purrfectsoft/purrfect-chess/issues/31) - Modernization roadmap (master issue)
- [Issue #40](https://github.com/purrfectsoft/purrfect-chess/issues/40) - Phase X: Functional + Visual Parity Development

## Overview

This branch contains the initial Next.js 14 migration skeleton for Purrfect Chess. The goal is to incrementally migrate the vanilla TypeScript/Vite application to a modern Next.js + React architecture while preserving all existing functionality.

## Current Status

**Phase 1: Skeleton Setup (COMPLETE)**

✅ Next.js 14 with App Router  
✅ React 18+ integration  
✅ TypeScript configuration  
✅ Tailwind CSS + PostCSS setup  
✅ ESLint + Prettier with Next.js rules  
✅ Placeholder Board component  
✅ Game logic hook (useGame) with chess.js  
✅ Engine hook scaffold (useEngine) - stub implementation  
✅ Stockfish worker scaffold - stub implementation  
✅ Static assets copied to public/

**Phase 2: Core Migration (IN PROGRESS)**

✅ Port board rendering logic from `src/board.ts`
✅ Implement drag-and-drop functionality
✅ Implement click-to-select and click-to-move interaction
✅ Add square highlighting for legal moves and last move
✅ Replace Unicode pieces with PNG images from `/public/assets/`
✅ Create GameControls component (Reset, FEN/PGN import/export)
✅ Create MoveHistory component with algebraic notation
✅ Port time control logic from `src/game.ts`
✅ Create Clock component with time display for both players
✅ Create TimeControlSelector with preset options
✅ Implement timer logic with increment support
✅ Add timeout detection and game over handling

- [ ] Integrate piece/square theme customization (appearance sliders)
- [ ] Implement Stockfish UCI communication in worker
- [ ] Complete useEngine hook with real analysis
- [ ] Add engine analysis display panel
- [ ] Integrate arrow drawing for move annotations

**Phase 3: Advanced Features (COMPLETE ✅)**

- ✅ Move review and annotations
- ✅ Arrow drawing on board (right-click drag) - **NOT YET** in Next.js (Phase X task)
- ✅ Hidden "gmmamun" Easter egg panel
- ✅ Evaluation bar - **STUB ONLY** in Next.js (Phase X task)
- ✅ Engine move highlighting on board - via EnginePanel multi-PV display
- ✅ Complete feature parity with vanilla app - **MOSTLY COMPLETE**, Phase X validates exact parity

**Phase X: Functional + Visual Parity Development (COMPLETE ✅)**

> **Gates Phase 4:** This phase ensures 1:1 parity between legacy and Next.js apps before cleanup.
> See [`docs/phase-x-parity.md`](./docs/phase-x-parity.md) and [Issue #40](https://github.com/purrfectsoft/purrfect-chess/issues/40).

Phase X has been successfully completed! All 14 workstreams achieved functional and visual parity between the legacy Vite app and Next.js app.

**Achievements:**
- ✅ All 14 workstreams validated (see [Phase X Audit](./docs/phase-x/phase-x-audit.md))
- ✅ Tested with 27 FEN fixtures and 10 PGN fixtures
- ✅ Side-by-side manual validation completed
- ✅ Visual parity confirmed (≤2px tolerance across 3 breakpoints, 2 DPR levels)
- ✅ Functional parity confirmed (366 passing tests)
- ✅ Performance parity achieved (Next.js ≥ legacy baseline)
- ✅ Production build: zero errors, 2 non-blocking warnings

**Intentional Deviations from Legacy:**
- **Architectural differences:** Next.js uses React state management (MobX) vs legacy module-level state - both are correct for their respective contexts
- **Engine integration:** Next.js uses React state updates vs legacy Promise-based returns - functionally equivalent, architecturally different
- **Build tooling:** Next.js framework overhead results in slightly longer build times (~18s vs ~8s) and initial load (~800ms vs ~500ms), but runtime performance is identical

**All Features Complete:**
- ✅ Arrow drawing system implemented (issues #80, #81)
- ✅ EvaluationBar component fully integrated (issue #50)
- ✅ No outstanding parity gaps

**Audit Documentation:** See [`docs/phase-x/phase-x-audit.md`](./docs/phase-x/phase-x-audit.md) for comprehensive parity validation results, evidence index, and QA:Eng summary.

**Phase 4: Testing & Cleanup (TODO - BLOCKED BY PHASE X)**

```
.
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Homepage with Board component
│   └── globals.css          # Global Tailwind styles
│
├── components/              # React components
│   └── Board.tsx            # Chess board component (placeholder)
│
├── hooks/                   # Custom React hooks
│   ├── useGame.ts           # Game state management (chess.js)
│   └── useEngine.ts         # Stockfish engine integration (stub)
│
├── workers/                 # Web Workers
│   └── stockfish.worker.ts  # Stockfish UCI worker (stub)
│
├── lib/                     # Utility libraries
│   └── (future utility modules)
│
├── public/                  # Static assets
│   ├── assets/              # Piece and square images (CC BY 4.0)
│   └── libs/                # Stockfish binaries
│
├── src/                     # Original vanilla TS modules (preserved)
│   ├── board.ts             # ← To be migrated to components/Board.tsx
│   ├── game.ts              # ← Logic migrated to hooks/useGame.ts
│   ├── engine.ts            # ← To be migrated to hooks/useEngine.ts
│   ├── ui.ts                # ← To be split into React components
│   └── ...
│
├── next.config.mjs          # Next.js configuration
├── tsconfig.json            # TypeScript config (updated for Next.js)
├── tailwind.config.js       # Tailwind config (updated paths)
├── .eslintrc.json           # ESLint with Next.js rules
├── .prettierrc.json         # Prettier configuration
└── package.json             # Dependencies and scripts
```

## Running the Next.js App

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- Yarn package manager

### Installation

```bash
# Use the correct Node version
nvm use

# Install dependencies (if not already done)
yarn
```

### Development Server

```bash
# Run the Next.js development server
yarn next:dev

# The app will be available at http://localhost:3000
```

### Build and Production

```bash
# Create a production build
yarn next:build

# Start the production server
yarn next:start

# Preview the build
open http://localhost:3000
```

### Linting and Formatting

```bash
# Run ESLint
yarn next:lint

# Format code with Prettier
yarn format

# Check formatting without changes
yarn format:check
```

## Key Files and Their Purpose

### `app/page.tsx`

The main homepage that renders the chess board. This is the entry point for the Next.js application.

### `components/Board.tsx`

React component for the chess board with full piece movement functionality. Features:

- 8x8 grid with alternating square colors
- Piece images from `/public/assets/` (CC BY 4.0)
- Click-to-select and click-to-move interaction
- Drag-and-drop piece movement with HTML5 drag API
- Legal move highlighting with green circles
- Selected piece highlighting with blue ring
- Last move highlighting with yellow background overlay
- Integration with useGame hook for move validation

**Completed Integration:**

✅ Port square rendering from `src/board.ts`
✅ Add piece images from `/public/assets/`
✅ Implement drag-and-drop with `onDragStart`, `onDrop`
✅ Add legal move highlighting
✅ Add last move highlighting
✅ Integrate with useGame hook for chess logic

**TODO:**

- Support custom themes (piece opacity, square colors) via appearance sliders
- Integrate arrow drawing layer for move annotations
- Add engine move highlighting overlays

### `components/GameControls.tsx`

Control panel component for game operations. Features:

- Reset game button
- FEN import with input dialog
- FEN export (copies to clipboard)
- PGN export (copies to clipboard)

**Status:** ✅ Complete

### `components/MoveHistory.tsx`

Display component for game move history. Features:

- Shows moves in algebraic notation (SAN)
- Groups moves by pairs (White & Black)
- Scrollable container with fixed height
- Empty state when no moves have been made

**Status:** ✅ Complete

### `components/Clock.tsx`

Chess clock component for both players. Features:

- Display remaining time in MM:SS format
- Highlight active player's clock with blue ring
- Visual distinction between black and white clocks
- Real-time updates (100ms interval)

**Status:** ✅ Complete

### `components/TimeControlSelector.tsx`

Time control preset selector. Features:

- 8 preset options (1+0, 3+0, 3+2, 5+0, 5+1, 10+0, 15+10, 30+0)
- Visual indication of selected preset
- Grid layout for compact display
- Disabled state when game has started

**Status:** ✅ Complete

### `hooks/useGame.ts`

Custom React hook wrapping `chess.js` for game state management. Provides:

- Current position and FEN
- Move validation and execution with chess.js
- Game status (check, checkmate, stalemate)
- FEN/PGN import/export
- Move history with verbose details
- Time control management with configurable presets
- Clock management with increment support (100ms tick interval)
- Timeout detection and game over handling
- Timer starts on first move
- Timer cleanup on unmount

**Completed Integration:**

✅ Port time control logic from `src/game.ts`
✅ Add clock management with increment
✅ Implement timeout detection
✅ Support position reset and FEN/PGN operations
✅ Add move history tracking with verbose details

**TODO:**

- Add move annotations (brilliant, blunder, etc.)
- Implement takeback/undo functionality
- Add position evaluation integration

### `hooks/useEngine.ts`

Custom React hook for Stockfish integration. **Currently a STUB** that simulates engine readiness.

**Integration TODO:**

- Initialize Stockfish worker from `workers/stockfish.worker.ts`
- Implement UCI protocol communication
- Parse engine analysis (depth, score, PV lines)
- Support multi-PV analysis (show top 3 moves)
- Add evaluation bar updates
- Port logic from `src/engine.ts` and `src/engine/uci-parser.ts`

### `workers/stockfish.worker.ts`

Web Worker scaffold for running Stockfish. **Currently a STUB** with no functionality.

**Integration TODO:**

- Load Stockfish from `/public/libs/stockfish.js`
- Implement UCI command handling
- Parse `info` lines (depth, score, multipv, pv)
- Parse `bestmove` responses
- Handle errors and timeouts
- Port UCI parsing from `src/engine/uci-parser.ts`

## Migration Strategy

### Incremental Approach

The migration follows an incremental strategy to minimize risk:

1. **Coexistence**: The Next.js app lives alongside the original Vite app
2. **Selective Migration**: Migrate one module at a time
3. **Testing**: Each migrated component should be tested before proceeding
4. **Preservation**: Original vanilla TS files are preserved until full parity is achieved

### Module Mapping

| Vanilla TS Module | Next.js Equivalent     | Status                    |
| ----------------- | ---------------------- | ------------------------- |
| `src/main.ts`     | `app/page.tsx`         | ✅ Complete               |
| `src/board.ts`    | `components/Board.tsx` | ✅ Core features complete |
| `src/game.ts`     | `hooks/useGame.ts`     | ✅ Core features complete |
| `src/engine.ts`   | `hooks/useEngine.ts`   | 🟡 Stub only              |
| `src/ui.ts`       | Multiple components    | ✅ Mostly complete        |
| `src/types.ts`    | Type imports           | ✅ Reusable as-is         |

### Next Steps for Contributors

**Immediate priorities for completing Phase 2:**

1. **Engine Integration** (HIGH PRIORITY): ✅ **COMPLETE**
   - ✅ Auto-vendor Stockfish from `stockfish@17.1.0` npm package (devDependency)
   - ✅ Implement UCI protocol (uci, isready, position, go, stop commands)
   - ✅ Parse UCI info lines using `lib/uci-parser.ts` (ported from `src/engine/uci-parser.ts`)
   - ✅ Complete `hooks/useEngine.ts` with real Stockfish integration
   - ✅ Create `components/EnginePanel.tsx` to display multi-PV analysis
   - ✅ Integrate into main page with real-time updates

   **Stockfish Implementation Details:**
   - **Version**: 17.1.0 (hash: 03e3232)
   - **Variant**: Lite Single-threaded WASM
   - **Package**: `stockfish@17.1.0` (devDependency, chess.com maintained)
   - **Source**: https://github.com/nmrugg/stockfish.js
   - **License**: GPL v3

   **Files (auto-generated, gitignored):**
   - `public/libs/stockfish-lite-single.js` (~21KB wrapper)
   - `public/libs/stockfish-lite-single.wasm` (~7MB WASM binary)

   **Automation:**
   - Vendor script: `scripts/vendor-stockfish.js` (ESM format)
   - Auto-runs on: `yarn install` (postinstall) and `yarn next:build`
   - Manual run: `yarn vendor:stockfish`

   **Characteristics:**
   - Single-threaded (no SharedArrayBuffer required)
   - No CORS headers required (works in all deployment scenarios)
   - Full WASM support (faster than asm.js)
   - Smaller NNUE neural network (~7MB vs ~75MB for full version)
   - Sufficient strength for browser-based analysis

   **Why this variant?**
   - Maximum compatibility (no CORS requirements)
   - Reasonable file size for web delivery
   - Reliable single-threaded operation
   - Modern WASM performance

   **Alternative variants available:**
   - `lite`: Multi-threaded WASM (~7MB, requires CORS headers)
   - `single`: Single-threaded full WASM (~75MB, no CORS)
   - `full`: Multi-threaded full WASM (~75MB, requires CORS)
   - `asm`: ASM.js fallback (~10MB, universal compatibility)

   To change variants: Edit `VARIANT` in `scripts/vendor-stockfish.js`

2. **Appearance Customization** (MEDIUM PRIORITY): Port theme controls
   - Port appearance sliders from `src/ui.ts`
   - Create `components/AppearanceControls.tsx`
   - Add piece opacity, hue, saturation, brightness controls
   - Support light/dark square customization
   - Support white/black piece customization

3. **Arrow Drawing System** (MEDIUM PRIORITY): Port from `src/board.ts`
   - Add SVG overlay layer to Board component
   - Implement right-click drag to create arrows
   - Support multiple arrows with different colors
   - Port arrow drawing logic from `src/board.ts` (lines 25-36)

**Phase 3 priorities:**

4. **Easter Egg Feature** (LOW PRIORITY): "gmmamun" hidden panel
   - Port logic from `src/ui/easter-egg.ts`
   - Create hidden engine panel component
   - Trigger on text selection + "gmmamun" typing

5. **Move Annotations** (LOW PRIORITY): Quality indicators
   - Add move quality analysis (brilliant, good, inaccuracy, etc.)
   - Use icons from `/public/assets/`
   - Integrate with engine evaluation

6. **Testing & Polish** (ONGOING):
   - Add React component tests
   - Integration tests for board interactions
   - E2E tests for complete game flow
   - Performance optimization

## Original Vanilla App

The original Vite + vanilla TypeScript app is still fully functional and can be run with:

```bash
yarn dev    # Vite development server
yarn build  # Vite production build
```

This allows for side-by-side comparison during migration.

## Asset Licensing

All piece and square images in `/public/assets/` are licensed under **CC BY 4.0** (Creative Commons Attribution 4.0 International). See `LICENSE.md` for full details.

When using these assets in React components, maintain proper attribution as required by the license.

## TypeScript Configuration

The `tsconfig.json` has been updated to support both the original Vite app and the new Next.js app:

- **Module Resolution**: `bundler` (works for both)
- **JSX**: `preserve` (Next.js handles transformation)
- **Paths**: `@/*` alias for root imports
- **Include**: Both `src/` and Next.js directories
- **Plugins**: Next.js TypeScript plugin for enhanced IDE support

## Tailwind CSS

Tailwind is configured to scan both the original `src/` directory and the new Next.js directories:

```js
content: [
  './src/**/*.{js,ts,jsx,tsx}', // Original app
  './app/**/*.{js,ts,jsx,tsx}', // Next.js app
  './components/**/*.{js,ts,jsx,tsx}', // Components
];
```

This ensures styles work in both versions during the transition.

## Known Limitations (Current Phase)

- ✋ Stockfish worker is a stub with no actual engine integration
- ✋ No appearance customization sliders (piece/square themes)
- ✋ No arrow drawing or move annotations
- ✋ No "gmmamun" Easter egg panel
- ✋ No engine move highlighting or analysis overlays
- ✋ No evaluation bar

**Completed features:**

✅ Board rendering with piece images
✅ Click-to-select and click-to-move interaction
✅ Drag-and-drop piece movement
✅ Legal move highlighting (green circles)
✅ Last move highlighting (yellow overlay)
✅ Time controls with increment support
✅ Chess clock display
✅ Game controls (Reset, FEN/PGN import/export)
✅ Move history display
✅ Game status detection (check, checkmate, stalemate, timeout)

These will be addressed in subsequent PRs as part of the incremental migration.

## Contributing

When contributing to the Next.js migration:

1. Follow Next.js and React best practices
2. Use TypeScript for all new code
3. Maintain the cat-themed aesthetic 🐱
4. Preserve compatibility with existing types in `src/types.ts`
5. Add TODO comments linking to original vanilla modules
6. Test changes with both `yarn next:dev` and the original app
7. Update this README when completing major milestones

## Questions or Issues?

For questions about the migration or to report issues, please comment on [Issue #31](https://github.com/purrfectsoft/purrfect-chess/issues/31) or create a new issue with the `migration` label.

---

**Happy migrating! 🐱♟️**
