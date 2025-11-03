# Diagnostic Findings - Engine Analysis Data Propagation

**Related Issue**: purrfectsoft/purrfect-chess#15

## Summary
Added comprehensive diagnostic logging to trace the engine analysis data flow from Stockfish worker to UI rendering. The diagnostics successfully identified the root cause of the missing/broken move data.

## Root Cause
**Location**: `src/engine.js`, line 70  
**Bug**: PV (Principal Variation) parsing regex incorrectly captures UCI metadata tokens

### Current Code (Broken)
```javascript
const pvMatch = line.match(/pv\s+(.+)$/);
```

This pattern greedily matches everything after "pv" until end of line, including UCI metadata tokens like "bmc" (best move change).

### Example
**Raw UCI from Stockfish**:
```
info depth 22 multipv 1 score cp 63 nodes 19520437 pv g1f3 d7d5 d2d4 e7e6 c2c4 bmc 2.15304
```

**Expected capture** (moves only): `g1f3 d7d5 d2d4 e7e6 c2c4`  
**Actual capture** (with metadata): `g1f3 d7d5 d2d4 e7e6 c2c4 bmc 2.15304`

**Result**: After `split(/\s+/)`, the first element becomes garbage, causing `buildResult()` to create broken move objects with `uci: "1"`, `from: "1"`, `to: ""`, `san: "1"`

## Data Flow Verification

### ✅ Engine Worker → Main Thread
- **Status**: Working correctly
- **Evidence**: `[ENGINE DIAGNOSTICS] Emitting results to UI: {totalPartials: 3, resultsWithData: 3}`
- Results are successfully emitted from the worker

### ❌ UCI Info Parsing (THE BUG)
- **Status**: BROKEN
- **Evidence**: `[ENGINE DIAGNOSTICS] Parsed PV for multipv 1 : {firstMove: 1, fullPv: 1 score cp...}`
- Should be: `{firstMove: g1f3, fullPv: g1f3 d7d5 d2d4...}`

### ❌ Result Building
- **Status**: Receives corrupted data from parsing
- **Evidence**: `[ENGINE DIAGNOSTICS] Built result: {multipv: 1, uci: 1, from: 1, to: , san: 1}`
- Should be: `{multipv: 1, uci: g1f3, from: g1, to: f3, san: Nf3}`

### ✅ Main Thread Reception
- **Status**: Working (but receives bad data)
- **Evidence**: `[MAIN DIAGNOSTICS] Received analysis results: {isArray: true, length: 3}`

### ✅ UI Rendering
- **Status**: Working (but renders bad data)
- **Evidence**: `[UI DIAGNOSTICS] Rendering line 1 : {label: #1, scoreText: 0.63, san: 1, uci: 1}`

## Conclusion
**No data is lost during transmission between worker and UI.** The bug is isolated to the UCI parsing regex in `engine.js`. The fix should update the PV regex to properly extract only move sequences, excluding UCI metadata tokens.

## Diagnostic Logs Added
The following console logs were added for debugging (prefixed for easy filtering):

1. **`[ENGINE DIAGNOSTICS]`** in `src/engine.js`:
   - Raw UCI info lines
   - Parsed PV moves and scores
   - Built result objects
   - Final results array before emission

2. **`[MAIN DIAGNOSTICS]`** in `src/main.js`:
   - Received analysis results from engine

3. **`[UI DIAGNOSTICS]`** in `src/ui.js`:
   - Received payload before rendering
   - Each line being rendered

## Next Steps
1. Fix the PV regex in `src/engine.js` (line 70)
2. Remove diagnostic logs after fix is verified
3. Test with multiple positions to ensure proper move parsing

## Screenshot
Engine panel showing broken data ("1", "2", "3" instead of chess moves):
![Broken Analysis](https://github.com/user-attachments/assets/d46c2ee9-0145-421b-9d2b-cac57fcea5cb)
