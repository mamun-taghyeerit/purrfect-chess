# Phase X: Functional + Visual Parity Development

**Related Issues:**

- Master issue: [#31](https://github.com/purrfectsoft/purrfect-chess/issues/31) - Modernization roadmap
- Phase X issue: [#40](https://github.com/purrfectsoft/purrfect-chess/issues/40) - Functional + Visual Parity Development

## Goal

Achieve bulletproof 1:1 parity (behavior, visuals, UX) between the legacy app (`src/`) and the Next.js app before proceeding to Phase 4. This ensures:

- **Visual Parity**: Pixel-perfect rendering (tolerance ≤2px) across all breakpoints
- **Interaction Parity**: Identical click, drag, right-click, and keyboard behaviors
- **Functional Parity**: Exact game logic, move legality, clocks, and I/O
- **Performance Parity**: Equal or better rendering and interaction performance

## Context

Phase X acts as a **quality gate** between Phase 3 (Advanced Features) and Phase 4 (Testing & Cleanup). Without this phase, the Next.js migration risks introducing subtle regressions in UX, visuals, or functionality that could surface late in production.

The legacy Vite app in `src/` remains the **source of truth** for all behavior and UX decisions.

## Acceptance Criteria

### Visual Parity

- [ ] Pixel-perfect board rendering (≤2px tolerance)
- [ ] Identical piece and square appearance
- [ ] Consistent appearance slider effects
- [ ] Matching evaluation bar display
- [ ] Identical arrow drawing behavior
- [ ] Proper responsive layout at all breakpoints (320px, 768px, 1280px)
- [ ] Consistent rendering at 1x and 2x DPR

### Interaction Parity

- [ ] Click-to-select and click-to-move identical
- [ ] Drag-and-drop behavior matches exactly
- [ ] Right-click arrow drawing works identically
- [ ] Keyboard navigation (if implemented) matches
- [ ] Hover states consistent
- [ ] Focus states consistent

### Functional Parity

- [ ] Move legality identical (all edge cases)
- [ ] Game state transitions match (check, checkmate, stalemate, draw)
- [ ] Time controls behavior identical
- [ ] Clock increment logic matches
- [ ] Engine analysis produces same results
- [ ] UCI parsing identical
- [ ] FEN/PGN I/O produces identical output

### I/O Parity

- [ ] FEN import/export format identical
- [ ] PGN import/export format identical
- [ ] PGN headers match legacy format
- [ ] Move notation (SAN) identical

### Performance Parity

- [ ] Board rendering time ≤ legacy
- [ ] Interaction response time ≤ legacy
- [ ] Engine analysis startup ≤ legacy
- [ ] Memory usage comparable or better

## Workstreams

Based on [Issue #40](https://github.com/purrfectsoft/purrfect-chess/issues/40), Phase X consists of the following workstreams.

**Status Legend:**

- ✅ = Implemented in Next.js app
- 🔍 = Needs parity validation
- ⏳ = Not yet implemented
- 📝 = Partially implemented

### 1. Board Rendering + Coordinates ✅

- ✅ Square rendering (8x8 grid)
- ✅ File/rank coordinate labels
- ✅ Responsive sizing
- ✅ Theme application

**Status:** Complete. Needs parity validation with legacy.

### 2. Interaction Semantics (Click + DnD) ✅

- ✅ Click-to-select piece
- ✅ Click-to-move to legal square
- ✅ Drag-and-drop piece movement
- ✅ Legal move preview
- ✅ Invalid move feedback

**Status:** Complete. Needs parity validation with legacy.

### 3. Move Legality + Game State ✅

- ✅ All chess rules (castling, en passant, promotion)
- ✅ Check detection
- ✅ Checkmate detection
- ✅ Stalemate detection
- ✅ Draw conditions (50-move, threefold repetition, insufficient material)

**Status:** Complete (via chess.js). Needs edge case validation.

### 4. FEN/PGN I/O ✅

- ✅ FEN import from text input
- ✅ FEN export to clipboard
- ✅ PGN export to clipboard
- 🔍 Round-trip consistency validation needed

**Status:** Complete. Needs format parity validation.

### 5. Time Controls + Clocks ✅

- ✅ Preset time controls (1+0, 3+0, 3+2, etc.)
- ✅ Clock display (MM:SS format)
- ✅ Increment application
- ✅ Time expiration detection
- ✅ Flag fall handling

**Status:** Complete. Needs timing accuracy validation.

### 6. Game Lifecycle + UI State ✅

- ✅ New game initialization
- ✅ Reset game functionality
- ✅ Game over states
- ✅ UI state transitions

**Status:** Complete. Needs validation.

### 7. Engine Integration Parity ✅

- ✅ Stockfish worker initialization
- ✅ UCI protocol communication
- ✅ Engine readiness detection
- ✅ Analysis start/stop

**Status:** Complete. Needs UCI output format validation.

### 8. Engine Overlays + Evaluation Bar 📝

- ✅ Multi-PV display (top 3 moves)
- ✅ Score formatting (centipawns, mate)
- ✅ Depth display
- ✅ Principal variation display
- ⏳ Evaluation bar visual representation (component stub exists)

**Status:** Partially complete. EvaluationBar component needs implementation and wiring.

### 9. Arrow Drawing System ⏳

- ⏳ Right-click drag to create arrows
- ⏳ Multiple arrow support
- ⏳ Arrow color/style
- ⏳ Arrow persistence
- ⏳ Arrow clearing

**Status:** Not implemented. Legacy has this feature in `src/board.ts`.

### 10. Appearance Customization ✅

- ✅ Piece hue/saturation/brightness sliders
- ✅ Piece scale slider
- ✅ Square hue/saturation/brightness sliders
- ✅ Light/dark square customization
- ✅ Real-time preview

**Status:** Complete. Needs visual parity validation.

### 11. Hidden "gmmamun" Easter Egg ✅

- ✅ Text selection detection
- ✅ Keystroke capture
- ✅ Engine panel reveal
- ✅ Depth control slider

**Status:** Complete. Needs behavior validation.

### 12. Accessibility + Keyboard Nav ⏳

- ⏳ Keyboard piece selection
- ⏳ Keyboard move input
- ⏳ ARIA labels
- ⏳ Focus management
- ⏳ Screen reader support

**Status:** Not implemented. May not exist in legacy either.

### 13. Performance + Rendering 🔍

- ✅ Optimized re-renders
- ✅ Lazy loading
- ✅ Code splitting
- 🔍 Bundle size optimization

**Status:** Mostly complete. Needs performance benchmarking vs legacy.

### 14. Error Handling + Edge Cases 🔍

- ✅ Invalid FEN handling
- ✅ Invalid PGN handling
- ✅ Engine errors
- ✅ Worker failures
- ⏳ Network timeouts (if applicable)

**Status:** Mostly complete. Needs edge case validation.

## Validation Checklist

### Manual Testing

- [ ] Run legacy app (`yarn dev`) on port 5173
- [ ] Run Next.js app (`yarn next:dev`) on port 3000
- [ ] Open both apps side-by-side
- [ ] Test each scenario from fixtures
- [ ] Capture screenshots at breakpoints: 320px, 768px, 1280px
- [ ] Capture screenshots at DPR: 1x, 2x
- [ ] Compare screenshots pixel-by-pixel
- [ ] Document any deltas in parity validation report

### Automated Testing

- [ ] Run FEN/PGN round-trip tests
- [ ] Run board visual snapshot tests
- [ ] Run UCI parser parity tests
- [ ] Run game logic parity tests
- [ ] Run appearance parity tests

### Fixture Coverage

- [ ] Test all 25 FEN positions
- [ ] Test all 10 PGN games
- [ ] Verify identical output for both apps

## Fixtures

Phase X includes comprehensive test fixtures to validate parity:

### FEN Corpus (`docs/fixtures/fen/`)

25 curated positions covering:

- **Basic positions**: Starting position, empty board
- **Castling**: All 4 castling rights scenarios
- **En passant**: En passant available, after en passant capture
- **Promotions**: Pawn on 7th rank, various promotion scenarios
- **Checkmates**: Back rank mate, smothered mate, etc.
- **Stalemates**: King in corner, no legal moves
- **Draws**: Threefold repetition positions, 50-move rule scenarios
- **Edge cases**: Weird legality, tricky positions

See individual `.fen` files in `docs/fixtures/fen/` for details.

### PGN Corpus (`docs/fixtures/pgn/`)

10 curated games covering:

- **Short games**: Scholar's mate, fool's mate
- **Standard games**: Complete games with headers
- **Complex games**: Long games with variations (if supported)
- **Edge cases**: Games with special notation

See individual `.pgn` files in `docs/fixtures/pgn/` for details.

### Using Fixtures

Fixtures are used in:

1. **Manual testing**: Load each fixture in both apps, compare output
2. **Automated testing**: Round-trip tests (`tests/parity/fenpgn.roundtrip.test.ts`)
3. **Visual regression**: Snapshot tests (`tests/parity/board.visual.test.tsx`)

To expand fixtures:

1. Add new `.fen` or `.pgn` files to respective directories
2. Document the scenario being tested
3. Update parity tests to include new fixtures

## Side-by-Side Validation

See [`docs/runbooks/side-by-side.md`](./runbooks/side-by-side.md) for detailed instructions on running both apps simultaneously and performing manual validation.

Quick reference:

```bash
# Terminal 1: Legacy app
yarn dev
# → http://localhost:5173

# Terminal 2: Next.js app
yarn next:dev
# → http://localhost:3000

# Open both, test fixtures, capture screenshots, compare
```

## Engine Automation Notes

Stockfish binaries are **auto-vendored** from the `stockfish` npm package (devDependency):

- **Package**: `stockfish@17.1.0` (chess.com maintained)
- **Variant**: Lite Single-threaded WASM
- **Size**: ~7MB WASM + ~21KB JS wrapper
- **Script**: `scripts/vendor-stockfish.js` (ESM format)
- **Auto-runs on**: `yarn install` (postinstall hook) and `yarn next:build`
- **Manual trigger**: `yarn vendor:stockfish`

**Vendored files** (gitignored, auto-regenerated):

- `public/libs/stockfish-lite-single.js`
- `public/libs/stockfish-lite-single.wasm`

**Why this variant?**

- No CORS headers required
- Reasonable size (~7MB vs ~75MB for full)
- Single-threaded (simpler, no SharedArrayBuffer)
- WASM performance (faster than asm.js)

**How to upgrade:**

```bash
yarn upgrade stockfish
# Update VARIANT_HASH in scripts/vendor-stockfish.js if needed
yarn vendor:stockfish
```

**Other available variants** (change in `scripts/vendor-stockfish.js`):

- `lite`: Multi-threaded (~7MB, requires CORS)
- `single`: Full single-threaded (~75MB, no CORS)
- `full`: Full multi-threaded (~75MB, requires CORS)

## Contributing to Phase X

See [`docs/contributing-phase-x.md`](./contributing-phase-x.md) for detailed contributor guidance.

Key principles:

1. **Legacy is source of truth**: Always match legacy behavior exactly
2. **Test with fixtures**: Use provided FEN/PGN corpuses
3. **Side-by-side validation**: Run both apps, compare manually
4. **Automated tests**: Add parity tests for new features
5. **Document deltas**: If exact parity is impossible, document why

## Architecture Decision

See [`docs/adr/0001-phase-x-parity-approach.md`](./adr/0001-phase-x-parity-approach.md) for the rationale behind introducing a dedicated parity phase.

## Success Criteria

Phase X is complete when:

- ✅ All workstreams validated
- ✅ All acceptance criteria met
- ✅ All fixtures pass in both apps
- ✅ Side-by-side comparison shows no meaningful deltas
- ✅ Automated parity tests pass
- ✅ Performance is equal or better
- ✅ Documentation complete and accurate

## Next Steps After Phase X

Once Phase X is complete and parity is confirmed:

1. Phase 4: Testing & Cleanup can proceed safely
2. Legacy `src/` directory can be archived (not deleted immediately)
3. Next.js app becomes the primary codebase
4. Sub-issues can be filed for any remaining polish

---

**Last Updated**: 2025-11-04
**Status**: Foundation phase (documentation and scaffolding)
