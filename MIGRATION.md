# Next.js Migration Guide

This document explains the Next.js migration skeleton and how to work with it.

## Related Issue

This migration relates to [Issue #31](https://github.com/purrfectsoft/purrfect-chess/issues/31) - Modernization roadmap for Purrfect Chess.

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

**Phase 2: Core Migration (TODO)**

- [ ] Port board rendering logic from `src/board.ts`
- [ ] Implement drag-and-drop functionality
- [ ] Add square highlighting and legal move indicators
- [ ] Integrate piece/square theme customization
- [ ] Port time control logic from `src/game.ts`
- [ ] Implement Stockfish UCI communication
- [ ] Add engine analysis display panel
- [ ] Port UI controls (game reset, FEN/PGN import/export)

**Phase 3: Advanced Features (TODO)**

- [ ] Move review and annotations
- [ ] Arrow drawing on board
- [ ] Hidden "gmmamun" Easter egg panel
- [ ] Evaluation bar
- [ ] Move history display
- [ ] Complete feature parity with vanilla app

## Directory Structure

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

A placeholder React component for the chess board. This will eventually replace the logic from `src/board.ts`. Currently shows:

- 8x8 grid with alternating square colors
- Unicode chess pieces based on starting position
- Click handlers (not yet functional)

**Integration TODO:**

- Port square rendering from `src/board.ts`
- Add piece images from `/public/assets/`
- Implement drag-and-drop with `onDragStart`, `onDrop`
- Add legal move highlighting
- Support custom themes (piece opacity, square colors)
- Integrate arrow drawing layer

### `hooks/useGame.ts`

Custom React hook wrapping `chess.js` for game state management. Provides:

- Current position and FEN
- Move validation and execution
- Game status (check, checkmate, stalemate)
- FEN/PGN import/export
- Move history

**Integration TODO:**

- Port time control logic from `src/game.ts`
- Add clock management with increment
- Implement move annotations
- Add game over handlers
- Support position reset and takeback

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
| `src/main.ts`     | `app/page.tsx`         | ✅ Structure created      |
| `src/board.ts`    | `components/Board.tsx` | 🟡 Placeholder only       |
| `src/game.ts`     | `hooks/useGame.ts`     | 🟡 Partial implementation |
| `src/engine.ts`   | `hooks/useEngine.ts`   | 🟡 Stub only              |
| `src/ui.ts`       | Multiple components    | ⭕ Not started            |
| `src/types.ts`    | Type imports           | ✅ Reusable as-is         |

### Next Steps for Contributors

1. **Board Rendering**: Port the board rendering logic from `src/board.ts` to `components/Board.tsx`
   - Use piece images from `/public/assets/` instead of Unicode symbols
   - Implement square click and drag handlers
   - Add support for custom themes

2. **Engine Integration**: Complete the Stockfish worker and hook
   - Load and communicate with Stockfish binary
   - Parse UCI protocol messages
   - Update board with engine suggestions

3. **UI Components**: Create React components for controls
   - Time control selector
   - Game reset button
   - FEN/PGN import/export
   - Move history panel
   - Engine analysis panel (hidden "gmmamun" feature)

4. **Testing**: Add test coverage for new components
   - Unit tests for hooks
   - Integration tests for board interactions
   - E2E tests for complete game flow

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

## Known Limitations (Skeleton Phase)

- ✋ Board is a static placeholder with no piece movement
- ✋ Stockfish worker is a stub with no actual engine integration
- ✋ Time controls not yet implemented
- ✋ No UI controls (reset, FEN/PGN, etc.)
- ✋ No move history or annotations
- ✋ No "gmmamun" Easter egg panel
- ✋ No arrow drawing or analysis overlays

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
