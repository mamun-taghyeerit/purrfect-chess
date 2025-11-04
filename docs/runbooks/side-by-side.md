# Runbook: Side-by-Side Validation (Legacy vs Next.js)

**Purpose:** Validate functional and visual parity between the legacy Vite app and the Next.js app.

**Prerequisites:**
- Node.js installed (see `.nvmrc`)
- Dependencies installed (`yarn`)
- Stockfish binaries vendored (`yarn vendor:stockfish`)

## Quick Start

### Step 1: Start Both Apps

```bash
# Terminal 1: Legacy Vite app
cd /path/to/purrfect-chess
yarn dev
# → http://localhost:5173

# Terminal 2: Next.js app
cd /path/to/purrfect-chess
yarn next:dev
# → http://localhost:3000
```

### Step 2: Open Both in Browser

- Legacy: http://localhost:5173
- Next.js: http://localhost:3000

**Tip:** Use browser profiles or different browsers for easy side-by-side comparison.

## Validation Scenarios

### Scenario 1: Initial Board Rendering

**Test:**
1. Load both apps
2. Compare initial board position
3. Check coordinate labels (a-h, 1-8)
4. Verify piece positions

**Expected:** Identical visual appearance within ≤2px tolerance.

**Checklist:**
- [ ] Board squares render identically
- [ ] Pieces positioned identically
- [ ] Coordinate labels match
- [ ] Colors match default theme

---

### Scenario 2: Piece Movement (Click)

**Test:**
1. Click e2 pawn in both apps
2. Verify legal move indicators (green circles)
3. Click e4 to move
4. Verify last move highlighting (yellow overlay)

**Expected:** Identical interaction and visual feedback.

**Checklist:**
- [ ] Legal moves highlighted identically
- [ ] Move executes on click
- [ ] Last move highlighting matches
- [ ] Move appears in history identically

---

### Scenario 3: Piece Movement (Drag-and-Drop)

**Test:**
1. Drag e2 pawn to e4 in both apps
2. Verify drag feedback
3. Verify drop acceptance
4. Verify last move highlighting

**Expected:** Identical drag-and-drop behavior.

**Checklist:**
- [ ] Drag cursor feedback matches
- [ ] Legal drop zones highlighted identically
- [ ] Move executes on drop
- [ ] Visual state matches after move

---

### Scenario 4: FEN Import/Export

**Test:**
1. Load test FEN: `rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2`
2. Compare board positions
3. Export FEN from both apps
4. Compare exported strings

**Expected:** Identical FEN import/export format.

**Checklist:**
- [ ] Board renders identically from FEN
- [ ] Exported FEN strings match exactly
- [ ] Round-trip FEN (import → export) preserves data

**Fixtures:** Use `docs/fixtures/fen/*.fen` for comprehensive testing.

---

### Scenario 5: PGN Export

**Test:**
1. Play moves: e4 e5 Nf3 Nc6
2. Export PGN from both apps
3. Compare PGN format and headers

**Expected:** Identical PGN format.

**Checklist:**
- [ ] PGN headers match (Event, Site, Date, etc.)
- [ ] Move notation matches (SAN format)
- [ ] Result field matches
- [ ] Round-trip PGN preserves data

**Fixtures:** Use `docs/fixtures/pgn/*.pgn` for comprehensive testing.

---

### Scenario 6: Time Controls

**Test:**
1. Select "3+2" time control in both apps
2. Make moves and observe clocks
3. Verify increment application
4. Test timeout scenario

**Expected:** Identical timing behavior (within system clock precision).

**Checklist:**
- [ ] Initial times match (3:00)
- [ ] Clocks countdown identically
- [ ] Increment applies identically (+2 seconds)
- [ ] Timeout detection matches

---

### Scenario 7: Engine Analysis

**Test:**
1. Trigger "gmmamun" Easter egg in both apps
2. Start analysis with depth 15
3. Compare multi-PV output
4. Compare score formatting

**Expected:** Identical engine analysis display.

**Checklist:**
- [ ] Easter egg triggers identically
- [ ] Engine panel appears identically
- [ ] Multi-PV lines match
- [ ] Score format matches (cp/mate)
- [ ] Depth progression matches

**Note:** Engine output may vary slightly due to non-determinism, but format should match.

---

### Scenario 8: Appearance Customization

**Test:**
1. Adjust "Light Squares" hue slider to +90°
2. Compare visual effect
3. Adjust "White Pieces" scale to 110%
4. Compare piece size
5. Reset and verify defaults

**Expected:** Identical visual effects from appearance controls.

**Checklist:**
- [ ] Slider ranges match
- [ ] Visual effects match (hue, saturation, brightness)
- [ ] Piece scale matches
- [ ] Reset restores defaults identically

---

### Scenario 9: Game States

**Test:**
1. Load checkmate FEN: `r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4`
2. Verify "Checkmate" message
3. Load stalemate FEN (see `docs/fixtures/fen/stalemate-*.fen`)
4. Verify "Stalemate" message

**Expected:** Identical game state detection and UI messaging.

**Checklist:**
- [ ] Checkmate detected identically
- [ ] Stalemate detected identically
- [ ] Check detected identically
- [ ] UI messages match

**Fixtures:** Use `docs/fixtures/fen/checkmate-*.fen` and `docs/fixtures/fen/stalemate-*.fen`.

---

### Scenario 10: Arrow Drawing (Legacy Feature)

**Test:**
1. **Legacy only:** Right-click drag from e2 to e4
2. Verify arrow appears
3. **Next.js:** Feature not yet implemented

**Expected:** Arrow drawing needs implementation in Next.js.

**Status:** ⏳ Not implemented in Next.js (Phase X task).

**Checklist:**
- [ ] Arrow drawing UI implemented
- [ ] Right-click drag creates arrow
- [ ] Multiple arrows supported
- [ ] Arrow clearing works

---

## Visual Comparison Guidelines

### Breakpoints to Test

Test at the following viewport widths:

- **320px** (mobile)
- **768px** (tablet)
- **1280px** (desktop)

### DPR (Device Pixel Ratio)

Test at:

- **1x** (standard displays)
- **2x** (retina displays)

### Screenshot Procedure

1. Set viewport width (browser dev tools)
2. Take screenshot of legacy app
3. Take screenshot of Next.js app
4. Overlay screenshots in image editor
5. Measure pixel differences
6. Document deltas >2px

### Tools

- **Browser DevTools:** Responsive mode, rulers
- **Screenshot Tools:** OS screenshot (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)
- **Image Comparison:** ImageMagick `compare`, Photoshop, GIMP, online diff tools

---

## Performance Benchmarking

### Metrics to Measure

1. **Initial Load Time:** Time to first interactive board
2. **Move Response Time:** Click to move completion
3. **Engine Startup Time:** Worker initialization to ready state
4. **Re-render Time:** Appearance slider change to visual update

### Tools

- **Browser DevTools:** Performance tab, Lighthouse
- **React DevTools:** Profiler
- **Manual Timing:** `console.time()` / `console.timeEnd()`

### Benchmark Procedure

```javascript
// In browser console:
console.time('moveExecution');
// Make a move
console.timeEnd('moveExecution');
```

**Expected:** Next.js ≥ legacy performance (equal or better).

---

## Reporting Deltas

### When to Report

Report if you find:

- Visual difference >2px
- Behavioral difference (clicks, drags, interactions)
- Functional difference (wrong move, wrong state, wrong output)
- Performance regression >10%

### How to Report

Create a parity validation issue with:

1. **Scenario:** Which test scenario (e.g., "Scenario 4: FEN Import/Export")
2. **Expected:** What legacy app does
3. **Actual:** What Next.js app does
4. **Evidence:** Screenshots, console logs, exported data
5. **Severity:** Critical (breaks feature), Major (UX issue), Minor (cosmetic)

**Template:**

```markdown
## Parity Delta: [Feature Name]

**Scenario:** Scenario X: [Name]
**Severity:** [Critical/Major/Minor]

**Expected (Legacy):**
[Description or screenshot]

**Actual (Next.js):**
[Description or screenshot]

**Evidence:**
[Screenshots, logs, data samples]

**Impact:**
[How this affects users]
```

---

## Automated Validation

For automated parity testing, see:

- `tests/parity/fenpgn.roundtrip.test.ts` - FEN/PGN round-trip tests
- `tests/parity/board.visual.test.tsx` - Visual snapshot tests

Run with:

```bash
yarn test tests/parity
```

---

## Checklist: Complete Validation

- [ ] All 10 scenarios tested
- [ ] Screenshots captured at all breakpoints (320, 768, 1280)
- [ ] Screenshots captured at all DPRs (1x, 2x)
- [ ] Performance benchmarks recorded
- [ ] All fixtures tested (FEN and PGN corpuses)
- [ ] Deltas documented (if any)
- [ ] Parity report created

---

**Last Updated:** 2025-11-04  
**Maintainer:** Purrfect Chess Team
