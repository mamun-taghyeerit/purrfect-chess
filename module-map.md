# Module Map - Purrfect Chess Architecture (ARCHIVE)

> **⚠️ ARCHIVE NOTICE:**  
> This document described the modularization strategy for the **legacy vanilla TypeScript app**.  
> **Status:** Modularization COMPLETE. Next.js migration (Phases 1-3) COMPLETE.  
> **Current Phase:** Phase X - Functional + Visual Parity Development (see `docs/phase-x-parity.md`)  
> **Preserved for:** Historical reference and understanding legacy architecture.

## Overview

This document outlined the modularization strategy for refactoring Purrfect Chess from monolithic files into smaller, testable modules as preparation for TypeScript migration and eventual Next.js migration.

**Current Status:** ✅ Complete. Legacy app is fully modularized and serves as reference implementation.

## Current Architecture (Legacy - REFERENCE ONLY)

> **Note:** This represents the **legacy Vite app** architecture.  
> The **Next.js app** architecture is documented in `MIGRATION.md`.

```
src/
├── main.ts       - Application entry point (legacy)
├── engine.js     - Stockfish integration + UCI parsing (legacy)
├── board.js      - Board rendering and visual updates (legacy)
├── game.js       - Chess game state and logic (legacy)
├── ui.js         - UI controls and interactions (legacy)
└── styles.css    - Global styles (legacy)
```

## Target Architecture (Next.js - ACHIEVED ✅)

The modularized Next.js architecture has been **fully implemented**:

```
app/                      # Next.js App Router ✅
├── layout.tsx            # Root layout
├── page.tsx              # Homepage with all features
└── globals.css           # Tailwind styles

components/               # React components ✅
├── Board.tsx             # Chess board (complete)
├── GameControls.tsx      # Game controls (complete)
├── MoveHistory.tsx       # Move history (complete)
├── Clock.tsx             # Chess clock (complete)
├── TimeControlSelector.tsx # Time presets (complete)
├── EnginePanel.tsx       # Engine analysis (complete)
├── AppearanceControls.tsx # Appearance (complete)
├── EvaluationBar.tsx     # Eval bar (STUB - Phase X)
└── BoardOverlay.types.ts # Overlay types (Phase X)

hooks/                    # Custom React hooks ✅
├── useGame.ts            # Game state (complete)
├── useEngine.ts          # Engine integration (complete)
└── useEasterEgg.ts       # Easter egg (complete)

workers/                  # Web Workers ✅
└── stockfish.worker.ts   # Stockfish UCI (complete)

lib/                      # Utilities ✅
├── uci-parser.ts         # UCI parsing (complete)
└── types.ts              # Shared types

tests/                    # Test suites ✅
├── components/           # Component tests
├── hooks/                # Hook tests
├── engine/               # Engine tests
├── game/                 # Game logic tests
├── ui/                   # UI tests
└── parity/              # Phase X parity tests (new)

docs/                     # Phase X Documentation 🆕
├── phase-x-parity.md
├── contributing-phase-x.md
├── adr/
│   └── 0001-phase-x-parity-approach.md
├── runbooks/
│   └── side-by-side.md
└── fixtures/
    ├── fen/              # 25 FEN positions
    └── pgn/              # 10 PGN games

src/                      # Legacy (REFERENCE) ✅
└── (preserved for parity validation)
```

## Legacy Modularization (COMPLETE ✅)

The legacy `src/` directory was fully modularized during earlier phases:

- Extract rendering logic to `src/board/renderer.js`
- Extract coordinate utilities to `src/board/coordinates.js`
- Extract piece management to `src/board/piece-manager.js`
- Keep `board.js` as façade

### Phase 3: Game Module (Future)

- Extract state management to `src/game/state.js`
- Extract time controls to `src/game/time-control.js`
- Extract move validation to `src/game/move-validator.js`
- Keep `game.js` as façade

### Phase 4: UI Module (Future)

- Extract control handlers to `src/ui/controls.js`
- Extract appearance logic to `src/ui/appearance.js`
- Extract easter egg to `src/ui/easter-egg.js`
- Keep `ui.js` as façade

### Phase 5: TypeScript Migration (Future)

- Add TypeScript dev dependencies
- Create shared types in `src/shared/types.ts`
- Incrementally convert modules to TypeScript
- Maintain backward compatibility during migration

## Migration Policy

### Façade Pattern

- **Always** preserve existing module APIs during refactoring
- Keep original files (e.g., `engine.js`, `board.js`) as façades that re-export from submodules
- This ensures zero breaking changes for main.js and other consumers

### Tests-First Approach

- **Before** extracting a module, write comprehensive unit tests
- Tests should cover:
  - Normal operation (happy path)
  - Edge cases (empty inputs, malformed data)
  - Error conditions (invalid values, null/undefined)
- Use tests to verify behavioral equivalence before and after extraction

### Incremental Refactoring

- Extract **one module at a time**
- Each extraction should be a separate PR with:
  - Clear purpose (what is being extracted)
  - Comprehensive tests
  - No functional changes to runtime behavior
  - Documentation updates (like this file)

### TypeScript Readiness

- Write modules in JavaScript with TypeScript migration in mind:
  - Clear input/output contracts
  - Minimal use of dynamic types
  - Explicit error handling
  - JSDoc comments for complex functions
- Avoid TypeScript-incompatible patterns:
  - Avoid monkey-patching
  - Avoid `arguments` manipulation
  - Prefer named parameters over positional

## Recommended First Extractions

1. **UCI Parser** (This PR) - Clear input/output, pure functions, easily testable
2. **Board Coordinates** - Pure utility functions, no side effects
3. **Time Controls** - Isolated state, clear boundaries
4. **Analysis State** - Encapsulated data structure
5. **Worker Manager** - Single responsibility (lifecycle management)

## Testing Strategy

### Unit Tests

- Use Vitest (fast, ESM-native, Vite-compatible)
- Test files: `tests/<module>/<file>.test.js`
- Focus on pure functions and isolated logic
- Mock external dependencies (Workers, DOM)

### Integration Tests

- Test module interactions (e.g., engine + parser)
- Verify façade APIs work correctly
- Ensure no behavioral regressions

### Manual Testing

- Run `yarn dev` and verify UI functionality
- Test engine analysis panel ("gmmamun" feature)
- Test piece movement and game rules
- Test appearance customization
- Test time controls

## Running Tests

```bash
# Install test dependencies (if not already added)
yarn add -D vitest

# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

## Success Criteria

Each extraction phase is complete when:

- ✅ Module is extracted with clear API boundaries
- ✅ Comprehensive unit tests exist and pass
- ✅ Original module acts as façade with no API changes
- ✅ All existing functionality works identically
- ✅ Documentation is updated
- ✅ Code review approved

## Future Considerations

### Bundle Size

- Monitor bundle size as modules are extracted
- Use Vite's code-splitting features if needed
- Lazy-load heavy modules (e.g., Stockfish worker)

### Performance

- Profile before and after each extraction
- Ensure no performance regressions
- Optimize hot paths (e.g., board rendering, move validation)

### Maintainability

- Keep modules small and focused (single responsibility)
- Prefer composition over inheritance
- Document public APIs with JSDoc
- Use consistent naming conventions

---

**Last Updated**: 2025-11-03  
**Current Phase**: Stage B, Phase 1, Step 1 (UCI Parser Extraction)
