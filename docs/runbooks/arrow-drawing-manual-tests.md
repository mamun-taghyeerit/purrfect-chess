# Arrow Drawing System - Manual Test Plan

## Setup
1. Start Next.js dev server: `yarn next:dev`
2. Open browser to `http://localhost:3000`

## Test Cases

### 1. Basic Arrow Creation
- [ ] Right-click and drag from e2 to e4
- [ ] Arrow should appear with blue color
- [ ] Arrow should have arrowhead at e4
- [ ] Arrow should persist after release

### 2. Distance Threshold
- [ ] Right-click on e2 and drag very slightly (<6px)
- [ ] Release - no arrow should appear

### 3. Arrow Toggle
- [ ] Create arrow from e2 to e4
- [ ] Create same arrow again (e2 to e4)
- [ ] Arrow should disappear (toggled off)

### 4. Multiple Arrows
- [ ] Create arrow from e2 to e4
- [ ] Create arrow from d2 to d4
- [ ] Both arrows should be visible

### 5. Left-Click Removal
- [ ] Create arrow from e2 to e4
- [ ] Left-click on the arrow path
- [ ] Arrow should disappear

### 6. Knight Move Arrows
- [ ] Create arrow from g1 to f3 (knight move)
- [ ] Arrow should have bent path (L-shape)

### 7. Arrow Preview
- [ ] Right-click on e2 and hold
- [ ] Drag to e4 (don't release)
- [ ] Preview arrow should show (lighter color)
- [ ] Release - preview becomes solid arrow

### 8. Clearing on Move
- [ ] Create arrow from e2 to e4
- [ ] Make a move (e.g., e2-e4)
- [ ] Arrow should disappear

### 9. Clearing on Reset
- [ ] Create arrow from e2 to e4
- [ ] Click "New Game" or reset
- [ ] Arrow should disappear

### 10. Engine Arrows vs User Arrows
- [ ] Type "gmmamun" to reveal engine panel
- [ ] Start engine analysis
- [ ] Engine arrows should appear (colored by rank)
- [ ] Create user arrow from e2 to e4
- [ ] Both engine and user arrows visible
- [ ] User arrows are blue, engine arrows are ranked colors

### 11. Context Menu Prevention
- [ ] Right-click on any square
- [ ] Browser context menu should NOT appear

### 12. Drag Cancellation
- [ ] Right-click and start dragging
- [ ] Press Escape or blur window
- [ ] Drag should cancel, no arrow created

## Expected Behavior Summary
- User arrows: Blue (#9198E5 with 0.85 opacity)
- Engine arrows: Blue (rank 1), Green (rank 2), Pink (rank 3)
- Preview arrows: Lighter blue (0.6 opacity)
- Arrows clear on: new move, game reset, FEN load
- Multiple arrows supported
- Knight moves have bent paths
- Origin protection zone when piece present
