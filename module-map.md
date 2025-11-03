# Module Map - Purrfect Chess Modularization Strategy

## Overview
This document outlines the modularization strategy for refactoring Purrfect Chess into smaller, testable modules as preparation for TypeScript migration.

## Current Architecture (Stage A)

```
src/
├── main.js       - Application entry point
├── engine.js     - Stockfish integration + UCI parsing
├── board.js      - Board rendering and visual updates
├── game.js       - Chess game state and logic
├── ui.js         - UI controls and interactions
└── styles.css    - Global styles
```

## Target Architecture (Stage C)

```
src/
├── main.js                    - Application entry point
├── engine/
│   ├── index.js              - Engine façade (public API)
│   ├── uci-parser.js         - UCI protocol parsing
│   ├── analysis.js           - Analysis state management
│   └── worker-manager.js     - Stockfish worker lifecycle
├── board/
│   ├── index.js              - Board façade (public API)
│   ├── renderer.js           - DOM rendering logic
│   ├── coordinates.js        - Square/coordinate utilities
│   └── piece-manager.js      - Piece positioning and movement
├── game/
│   ├── index.js              - Game façade (public API)
│   ├── state.js              - Game state management
│   ├── time-control.js       - Clock and time controls
│   └── move-validator.js     - Move validation (wraps chess.js)
├── ui/
│   ├── index.js              - UI façade (public API)
│   ├── controls.js           - Button/slider event handlers
│   ├── appearance.js         - Theme and customization
│   └── easter-egg.js         - "gmmamun" hidden feature
└── shared/
    ├── types.ts              - Shared TypeScript types
    └── utils.ts              - Shared utilities
```

## Stage B: Incremental Module Extraction

### Phase 1: Engine Module (Current)
**Goal**: Extract UCI parsing logic from engine.js into testable submodules.

**Step 1** (This PR):
- ✅ Extract `parseInfoLine()` and `parseBestMove()` to `src/engine/uci-parser.js`
- ✅ Add unit tests for UCI parser
- ✅ Keep `engine.js` as a façade to preserve API compatibility

**Step 2** (Future):
- Extract analysis state management to `src/engine/analysis.js`
- Extract worker lifecycle to `src/engine/worker-manager.js`
- Maintain `engine.js` façade exporting `initEngine()`, `analyze()`, `stop()`

### Phase 2: Board Module (Future)
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
