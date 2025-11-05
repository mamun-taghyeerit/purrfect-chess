# State Management Migration Audit & Refactoring Notes

**Date:** 2025-11-05  
**Issue:** #78 - Audit React components for state management migration  
**Related:** #76 (Refactor state management), #77 (Replace state management with MobX)

---

## Executive Summary

This document contains the findings from a comprehensive audit of all React components in the purrfect-chess repository to ensure compliance with the newly adopted MobX + MobX-State-Tree (MST) state management patterns. The audit identifies instances of store-derived prop drilling, locally invented global state, and provides recommendations for refactoring.

### Audit Methodology

1. **Component Inventory**: Systematically reviewed all React components in `components/`, `app/`, and custom hooks in `hooks/`
2. **Pattern Analysis**: Identified data flow patterns - store access, prop drilling, local state management
3. **Compliance Check**: Verified adherence to MobX + MST best practices from .github/copilot-instructions.md
4. **Impact Assessment**: Categorized findings by risk level (low/medium/high) for refactoring
5. **Documentation**: Recorded before/after code examples and migration patterns

---

## Findings Overview

### Summary Statistics

- **Total Components Audited**: 12
- **Components Using Store Correctly**: 2 (Board, app/page)
- **Components with Store-Derived Prop Drilling**: 5 (Clock, GameControls, MoveHistory, TimeControlSelector, EnginePanel)
- **Components with Local UI State (Appropriate)**: 3 (AppearanceControls, NotificationContainer, ArrowOverlay)
- **Hooks with Locally Invented Global State**: 1 (useGame - DEPRECATED)
- **Hooks with Appropriate Local Concerns**: 4 (useEngine, useNotification, useMoveReview, useEasterEgg)

---

## Detailed Component Audit

### 1. ✅ app/page.tsx (Home Component)

**Status:** COMPLIANT - Uses store correctly

**Current Pattern:**
```typescript
const Home = observer(() => {
  const store = useRootStore();
  
  return (
    <div>
      <Clock
        whiteTime={store.game.whiteTime}
        blackTime={store.game.blackTime}
        activeColor={store.game.turn}
        isRunning={store.game.isTimerRunning}
      />
      {/* ... */}
    </div>
  );
});
```

**Analysis:**
- ✅ Uses `observer()` wrapper correctly
- ✅ Accesses `useRootStore()` directly
- ✅ Accesses store properties in JSX for reactivity
- ❌ Passes store-derived props to child components (prop drilling)

**Recommendation:** Keep store access here, but eliminate prop passing to children where possible.

---

### 2. ⚠️ components/Clock.tsx

**Status:** PROP DRILLING - Receives store-derived props instead of using store

**Current Pattern:**
```typescript
interface ClockProps {
  whiteTime: number; // From store.game.whiteTime
  blackTime: number; // From store.game.blackTime
  activeColor: 'w' | 'b'; // From store.game.turn
  isRunning: boolean; // From store.game.isTimerRunning
}

const Clock = memo(function Clock({ whiteTime, blackTime, activeColor, isRunning }: ClockProps) {
  // Uses React.memo with custom comparison
  // ...
});
```

**Issue:**
- Receives all data as props from parent (app/page.tsx)
- Parent must pass down store-derived values
- Uses React.memo instead of observer pattern
- Custom comparison function for optimization (not needed with observer)

**Recommended Refactor:**
```typescript
const Clock = observer(function Clock() {
  const store = useRootStore();
  const game = store.game;
  
  const formatTime = (ms: number): string => {
    // ... formatting logic
  };
  
  return (
    <div className="w-full max-w-md space-y-2">
      <div className={/* ... */}>
        <div className="text-sm font-normal mb-1">Black</div>
        <div>{formatTime(game.blackTime)}</div>
      </div>
      
      <div className={/* ... */}>
        <div className="text-sm font-normal mb-1">White</div>
        <div>{formatTime(game.whiteTime)}</div>
      </div>
    </div>
  );
});
```

**Benefits:**
- Eliminates 4 prop parameters
- Removes need for custom React.memo comparison
- MobX observer provides superior reactivity tracking
- Single source of truth (no parent-to-child sync needed)

**Risk Level:** LOW - No external dependencies, straightforward refactor

---

### 3. ⚠️ components/GameControls.tsx

**Status:** PROP DRILLING - Receives callback props for game operations

**Current Pattern:**
```typescript
interface GameControlsProps {
  onReset: () => void;
  onLoadFen: (fen: string) => void;
  onLoadPgn?: (pgn: string) => void;
  onExportFen: () => string;
  onExportPgn: () => string;
}

export default function GameControls({ onReset, onLoadFen, onLoadPgn, onExportFen, onExportPgn }: GameControlsProps) {
  // Component uses callbacks passed from parent
}
```

**Issue:**
- All operations are game store actions that could be called directly
- Parent must create wrapper functions to call store methods
- Not using observer pattern (but has no observable state access currently)

**Recommended Refactor:**
```typescript
const GameControls = observer(function GameControls() {
  const store = useRootStore();
  const game = store.game;
  const [fenInput, setFenInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  // ... other local UI state
  
  const handleImportFen = () => {
    if (fenInput.trim()) {
      game.loadFen(fenInput.trim());
      setFenInput('');
      setShowFenInput(false);
    }
  };
  
  const handleExportFen = () => {
    const fen = game.fen;
    navigator.clipboard.writeText(fen)
      .then(() => console.log('FEN copied to clipboard'))
      .catch((err) => console.error('Failed to copy FEN:', err));
  };
  
  // ... similar for PGN, reset, etc.
});
```

**Benefits:**
- Eliminates 5 callback prop parameters
- Direct access to store actions
- Simpler component interface
- No wrapper functions needed in parent

**Risk Level:** LOW - Straightforward migration

**Note:** This component is not currently used in app/page.tsx (functionality is inline), but should be updated for consistency.

---

### 4. ⚠️ components/MoveHistory.tsx

**Status:** PROP DRILLING - Receives history array as prop

**Current Pattern:**
```typescript
interface MoveHistoryProps {
  history: Move[];
}

const MoveHistory = memo(function MoveHistory({ history }: MoveHistoryProps) {
  // Uses React.memo with custom comparison
  // ...
});
```

**Issue:**
- Receives `history` array from parent (store.game.history)
- Uses React.memo with custom comparison logic
- Parent must track and pass down history changes

**Recommended Refactor:**
```typescript
const MoveHistory = observer(function MoveHistory() {
  const store = useRootStore();
  const history = store.game.history;
  
  // Group moves by pairs (white and black)
  const movePairs: Array<{ white: Move | null; black: Move | null }> = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      white: history[i] || null,
      black: history[i + 1] || null,
    });
  }
  
  return (
    <div className="w-full max-w-md">
      {/* ... render move pairs */}
    </div>
  );
});
```

**Benefits:**
- Eliminates 1 prop parameter
- Removes custom memo comparison logic
- MobX observer automatically tracks history changes
- Direct access to source of truth

**Risk Level:** LOW - Simple refactor

**Current Usage:** Called from app/page.tsx with `<MoveHistory history={store.game.history} />`

---

### 5. ⚠️ components/TimeControlSelector.tsx

**Status:** PROP DRILLING - Receives time control data and callback

**Current Pattern:**
```typescript
interface TimeControlSelectorProps {
  currentTimeControl: TimeControl;
  onSelect: (timeControl: TimeControl) => void;
  disabled?: boolean;
}

export default function TimeControlSelector({ currentTimeControl, onSelect, disabled = false }: TimeControlSelectorProps) {
  // ...
}
```

**Issue:**
- Receives `currentTimeControl` from store.game.timeControl
- Receives `onSelect` callback that wraps store.game.setTimeControl
- Parent must manage prop passing

**Recommended Refactor:**
```typescript
interface TimeControlSelectorProps {
  disabled?: boolean; // Keep this as it's UI-specific logic from parent
}

const TimeControlSelector = observer(function TimeControlSelector({ disabled = false }: TimeControlSelectorProps) {
  const store = useRootStore();
  const currentTimeControl = store.game.timeControl;
  
  const handleSelect = (timeControl: TimeControl) => {
    store.game.setTimeControl(timeControl.minutes, timeControl.increment);
  };
  
  const isSelected = (preset: TimeControl) =>
    preset.minutes === currentTimeControl.minutes &&
    preset.increment === currentTimeControl.increment;
  
  // ... rest of component
});
```

**Benefits:**
- Eliminates 2 props (keeps `disabled` as it's UI logic from parent)
- Direct store access for time control
- Direct action calls for setTimeControl

**Risk Level:** LOW - Straightforward refactor

**Current Usage:** Called from app/page.tsx with:
```typescript
<TimeControlSelector
  currentTimeControl={store.game.timeControl}
  onSelect={(tc) => store.game.setTimeControl(tc.minutes, tc.increment)}
  disabled={store.game.history.length > 0}
/>
```

---

### 6. ⚠️ components/EnginePanel.tsx

**Status:** PROP DRILLING - Receives display mode and FEN getter

**Current Pattern:**
```typescript
interface EnginePanelProps {
  onClose?: () => void;
  engineDisplayMode?: 'squares' | 'arrows' | 'both' | 'none';
  onEngineDisplayModeChange?: (mode: 'squares' | 'arrows' | 'both') => void;
  getFen: () => string;
}
```

**Issue:**
- Receives `engineDisplayMode` from store.ui.engineDisplayModeValue
- Receives `onEngineDisplayModeChange` callback wrapping store.ui.setEngineDisplayMode
- Receives `getFen` callback to access store.game.fen
- Receives `onClose` callback wrapping store.ui.hideEnginePanel

**Recommended Refactor:**
```typescript
const EnginePanel = observer(function EnginePanel() {
  const store = useRootStore();
  const ui = store.ui;
  const game = store.game;
  
  // useEngine hook already manages engine state locally (appropriate)
  const { isAnalyzing, analysis, currentDepth, startAnalysis, stopAnalysis } = useEngine({
    onError: (error) => {
      // Handle error - could use notification system
    },
  });
  
  const handleClose = () => {
    stopAnalysis();
    ui.hideEnginePanel();
  };
  
  const handleModeChange = (mode: 'squares' | 'arrows' | 'both') => {
    ui.setEngineDisplayMode(mode);
  };
  
  // Access FEN directly: game.fen
  
  // ... rest of component
});
```

**Benefits:**
- Eliminates 4 callback/value props
- Direct access to store for all UI and game state
- Simpler component interface

**Risk Level:** LOW - Straightforward refactor

**Current Usage:** Conditionally rendered in app/page.tsx:
```typescript
{store.ui.isEnginePanelVisible && (
  <EnginePanel
    onClose={store.ui.hideEnginePanel}
    engineDisplayMode={store.ui.engineDisplayModeValue}
    onEngineDisplayModeChange={store.ui.setEngineDisplayMode}
    getFen={() => store.game.fen}
  />
)}
```

---

### 7. ✅ components/Board.tsx

**Status:** COMPLIANT - Uses store correctly

**Current Pattern:**
```typescript
const Board = observer(function Board({ engineHighlights, engineDisplayMode, flipped, moveBadge, onBadgeComplete, onError }: BoardProps) {
  const store = useRootStore();
  // ... uses store.game for position, history, move validation
});
```

**Analysis:**
- ✅ Uses `observer()` wrapper
- ✅ Accesses `useRootStore()` directly for game state
- ✅ Receives engine-related props (from useEngine hook in parent - appropriate)
- ✅ Receives UI props (flipped, moveBadge - from parent UI state - appropriate)

**Props Analysis:**
- `engineHighlights` - Derived from useEngine hook (local concern in parent)
- `engineDisplayMode` - From store.ui.engineDisplayModeValue (could access directly)
- `flipped` - From store.ui.isBoardFlipped (could access directly)
- `moveBadge` - From useMoveReview hook (local concern in parent)
- `onBadgeComplete` - Callback to parent hook
- `onError` - Error handler callback

**Potential Improvement:**
```typescript
const Board = observer(function Board({ engineHighlights, moveBadge, onBadgeComplete, onError }: BoardProps) {
  const store = useRootStore();
  const ui = store.ui;
  
  // Access flipped and engineDisplayMode directly from store
  const flipped = ui.isBoardFlipped;
  const engineDisplayMode = ui.engineDisplayModeValue;
  
  // ... rest of component
});
```

**Benefits:**
- Eliminates 2 props that are already in store
- Parent doesn't need to pass down UI state

**Risk Level:** LOW - Simple change

---

### 8. ⚠️ components/EvaluationBar.tsx

**Status:** PROP DRILLING - Receives engine analysis data

**Current Pattern:**
```typescript
export interface EvaluationBarProps {
  scoreCp?: number | null;
  mateIn?: number | null;
  isAnalyzing?: boolean;
  isVisible?: boolean;
  currentDepth?: number;
  maxDepth?: number;
  className?: string;
}

const EvaluationBar = memo(function EvaluationBar({ scoreCp, mateIn, isAnalyzing, isVisible, currentDepth, maxDepth, className }: EvaluationBarProps) {
  // Uses React.memo
});
```

**Issue:**
- Receives engine analysis data from parent (derived from useEngine hook)
- Receives `isVisible` from store.ui.isEvalBarVisible
- Uses React.memo instead of observer

**Analysis:**
The engine analysis data comes from useEngine hook, which is appropriate as a local concern. However, `isVisible` comes from the store.

**Recommended Refactor:**
```typescript
export interface EvaluationBarProps {
  scoreCp?: number | null;
  mateIn?: number | null;
  isAnalyzing?: boolean;
  currentDepth?: number;
  maxDepth?: number;
  className?: string;
}

const EvaluationBar = observer(function EvaluationBar({ scoreCp, mateIn, isAnalyzing, currentDepth, maxDepth, className = '' }: EvaluationBarProps) {
  const store = useRootStore();
  const isVisible = store.ui.isEvalBarVisible;
  
  // ... rest of component
});
```

**Benefits:**
- Eliminates 1 prop (isVisible)
- Direct access to store for visibility state
- MobX observer pattern

**Risk Level:** LOW - Minor change

**Note:** Keep engine analysis props as they come from useEngine hook (local concern).

---

### 9. ✅ components/AppearanceControls.tsx

**Status:** COMPLIANT - Appropriate local UI state

**Analysis:**
- Manages appearance sliders with local state (hue, saturation, brightness, scale)
- Uses CSS custom properties to apply filters
- Provides imperative handle for reset functionality
- State is truly local to this component (appearance preferences)

**Recommendation:** No changes needed. This is appropriate local state management.

**Future Consideration:** If appearance preferences need to be persisted, they could be moved to store.settings.

---

### 10. ✅ components/NotificationContainer.tsx

**Status:** COMPLIANT - Receives notification state appropriately

**Analysis:**
- Receives notifications array and dismiss callback from useNotification hook
- This is appropriate as notifications are managed by a dedicated hook
- No store-derived props

**Recommendation:** No changes needed.

**Future Consideration:** If notifications need to be global (accessible from multiple components), the notification state could move to the store. Currently it's scoped to app/page.tsx which is appropriate.

---

### 11. ✅ components/ArrowOverlay.tsx

**Status:** COMPLIANT - Pure rendering component

**Analysis:**
- Receives arrow and preview data as props from Board component
- Pure presentational component
- No state management concerns

**Recommendation:** No changes needed.

---

### 12. ✅ components/Provider.tsx

**Status:** COMPLIANT - Correctly wraps app with RootStoreProvider

**Analysis:**
- Simple wrapper around RootStoreProvider from store-setup
- Correct usage pattern

**Recommendation:** No changes needed.

---

## Hooks Audit

### 1. ❌ hooks/useGame.ts

**Status:** DEPRECATED - Duplicates store functionality

**Issue:**
- Creates separate Chess.js instance
- Manages game state locally with useState
- Duplicates timer management
- This hook is NOT used anywhere in the codebase
- All functionality is now in the MST store

**Evidence of Non-Use:**
```bash
$ grep -r "useGame" components/ app/ hooks/
components/Board.tsx:39: * - Note: Not using React.memo due to complex internal state from useGame hook
hooks/useGame.ts:41:export function useGame(options: UseGameOptions = {}) {
```

The only reference is an outdated comment in Board.tsx.

**Recommendation:** DELETE this file entirely.

**Benefits:**
- Removes duplicate state management
- Eliminates confusion about source of truth
- Prevents accidental usage

**Risk Level:** NONE - File is not imported or used anywhere

---

### 2. ✅ hooks/useEngine.ts

**Status:** COMPLIANT - Appropriate local concern

**Analysis:**
- Manages Stockfish Web Worker
- Handles UCI protocol parsing
- Manages engine analysis state
- This is appropriately a local concern (not global state)
- Used in app/page.tsx and components/EnginePanel.tsx

**Recommendation:** No changes needed. Engine worker management is a local concern.

---

### 3. ✅ hooks/useNotification.ts

**Status:** COMPLIANT - Appropriate local concern (currently)

**Analysis:**
- Manages notification queue and auto-dismiss timers
- Currently scoped to app/page.tsx
- Could potentially be moved to store if notifications need to be global

**Recommendation:** Keep as-is for now. If notifications need to be triggered from multiple components, consider moving to store.settings or a new store.notifications slice.

---

### 4. ✅ hooks/useMoveReview.ts

**Status:** COMPLIANT - Appropriate local concern

**Analysis:**
- Manages move classification logic (currently a stub)
- Manages badge display timing
- Appropriately scoped to parent component

**Recommendation:** No changes needed.

---

### 5. ✅ hooks/useEasterEgg.ts

**Status:** COMPLIANT - Appropriate local concern

**Analysis:**
- Manages easter egg detection ("gmmamun" cheatcode)
- Local event listeners and state
- Appropriately scoped

**Recommendation:** No changes needed.

---

## Patterns & Anti-Patterns

### ✅ DO: Access Store Directly in Observer Components

**Good Example (Board.tsx):**
```typescript
const Board = observer(function Board(props) {
  const store = useRootStore();
  const game = store.game;
  
  // Access properties in JSX for reactivity
  return <div>{game.fen}</div>;
});
```

### ❌ DON'T: Pass Store-Derived Props

**Anti-Pattern (current app/page.tsx → Clock):**
```typescript
// Parent
const Home = observer(() => {
  const store = useRootStore();
  
  return (
    <Clock
      whiteTime={store.game.whiteTime}
      blackTime={store.game.blackTime}
      activeColor={store.game.turn}
      isRunning={store.game.isTimerRunning}
    />
  );
});

// Child
const Clock = memo(function Clock({ whiteTime, blackTime, activeColor, isRunning }) {
  // ...
});
```

**Better Approach:**
```typescript
// Parent
const Home = observer(() => {
  return <Clock />;
});

// Child
const Clock = observer(function Clock() {
  const store = useRootStore();
  const game = store.game;
  
  return (
    <div>
      {formatTime(game.whiteTime)}
      {formatTime(game.blackTime)}
    </div>
  );
});
```

### ✅ DO: Use Observer Instead of React.memo

**Anti-Pattern:**
```typescript
const Clock = memo(function Clock({ whiteTime, blackTime }) {
  return <div>{whiteTime} - {blackTime}</div>;
}, (prev, next) => {
  // Custom comparison
  return prev.whiteTime === next.whiteTime && prev.blackTime === next.blackTime;
});
```

**Better Approach:**
```typescript
const Clock = observer(function Clock() {
  const store = useRootStore();
  const game = store.game;
  
  // MobX automatically tracks which properties are accessed
  // and only re-renders when those specific properties change
  return <div>{game.whiteTime} - {game.blackTime}</div>;
});
```

### ✅ DO: Access Properties in JSX for Reactivity

**Anti-Pattern (early destructuring):**
```typescript
const MyComponent = observer(() => {
  const store = useRootStore();
  const game = store.game;
  const { turn, fen } = game; // ❌ Destructured too early - not reactive!
  
  return <div>{turn}</div>; // Won't update on changes
});
```

**Better Approach:**
```typescript
const MyComponent = observer(() => {
  const store = useRootStore();
  const game = store.game;
  
  return <div>{game.turn}</div>; // ✅ Reactive - accesses in JSX
});
```

### ✅ DO: Keep Appropriate Local State

Not everything belongs in the store! Keep local UI state in components:

```typescript
const MyComponent = observer(() => {
  const store = useRootStore();
  
  // ✅ Local UI state for this component only
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  return (
    <div>
      <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
      <div>Global game state: {store.game.fen}</div>
    </div>
  );
});
```

---

## Migration Strategy

### Phase 1: Low-Risk Components (IMMEDIATE)

**Components to refactor first:**
1. Clock - Remove prop drilling, use observer
2. MoveHistory - Remove prop drilling, use observer
3. TimeControlSelector - Remove prop drilling, use observer

**Steps:**
1. Add `observer` wrapper to component
2. Add `useRootStore()` hook call
3. Access store slices directly
4. Remove props from interface
5. Update parent (app/page.tsx) to remove prop passing
6. Test reactivity

**Expected Impact:**
- Simplifies prop interfaces
- Reduces parent complexity
- Better performance with MobX reactivity

### Phase 2: Medium-Risk Components

**Components:**
1. GameControls - Remove callbacks, use store directly
2. EnginePanel - Remove callbacks and getFen, use store directly
3. EvaluationBar - Remove isVisible prop, use store directly
4. Board - Remove flipped and engineDisplayMode props, use store directly

**Steps:** Same as Phase 1

### Phase 3: Cleanup

**Tasks:**
1. Delete hooks/useGame.ts (not used)
2. Update Board.tsx comment that references useGame
3. Run full test suite
4. Update any tests that mock props (now use store mocks)

---

## Testing Strategy

### Unit Tests

**Before (prop-based):**
```typescript
test('Clock displays time correctly', () => {
  render(<Clock whiteTime={300000} blackTime={300000} activeColor="w" isRunning={true} />);
  // assertions
});
```

**After (store-based):**
```typescript
import { RootStoreProvider } from '@/stores/store-setup';

test('Clock displays time correctly', () => {
  render(
    <RootStoreProvider>
      <Clock />
    </RootStoreProvider>
  );
  // assertions using store state
});
```

### Integration Tests

Existing tests that wrap components with RootStoreProvider should continue to work. New tests should follow the same pattern.

---

## Open Questions & Future Work

### Questions

1. **Notification System**: Should useNotification be moved to the store for global access?
   - **Current**: Scoped to app/page.tsx
   - **Consideration**: If other components need to show notifications, move to store
   - **Recommendation**: Keep as-is unless requirement emerges

2. **Appearance State**: Should appearance settings be persisted in store.settings?
   - **Current**: Local state in AppearanceControls
   - **Consideration**: Users may want preferences to persist across sessions
   - **Recommendation**: Future enhancement - add appearance settings to store.settings with persistence

3. **Engine State**: Should engine analysis state move to the store?
   - **Current**: Local state in useEngine hook
   - **Consideration**: Currently only used in one place (app/page.tsx)
   - **Recommendation**: Keep as-is - engine worker is a local concern

### Future Enhancements

1. **Persistent Appearance Settings**
   - Add appearance preferences to store.settings
   - Persist across sessions with mst-persistent-store
   - Migrate AppearanceControls to use store

2. **Global Notification System**
   - If needed, create store.notifications slice
   - Allow any component to trigger notifications
   - Centralized notification queue management

3. **Undo/Redo for Game State**
   - MST supports time-travel debugging and patches
   - Could add undo/redo actions to game store
   - Track move history with patches for replay

4. **Performance Monitoring**
   - Add MST middleware for performance tracking
   - Monitor state changes and action durations
   - Log slow operations in development

---

## Implementation Checklist

### Phase 1: Low-Risk Components

- [ ] Clock component
  - [ ] Add observer wrapper
  - [ ] Add useRootStore hook
  - [ ] Remove props from interface
  - [ ] Access store directly in JSX
  - [ ] Update app/page.tsx to remove prop passing
  - [ ] Test reactivity

- [ ] MoveHistory component
  - [ ] Add observer wrapper
  - [ ] Add useRootStore hook
  - [ ] Remove history prop
  - [ ] Access store.game.history directly
  - [ ] Update app/page.tsx
  - [ ] Test reactivity

- [ ] TimeControlSelector component
  - [ ] Add observer wrapper
  - [ ] Add useRootStore hook
  - [ ] Remove currentTimeControl and onSelect props
  - [ ] Access store directly
  - [ ] Update app/page.tsx
  - [ ] Test reactivity

### Phase 2: Medium-Risk Components

- [ ] GameControls component
  - [ ] Add observer wrapper
  - [ ] Add useRootStore hook
  - [ ] Remove all callback props
  - [ ] Call store actions directly
  - [ ] Update usage in app/page.tsx (if any)
  - [ ] Test functionality

- [ ] EnginePanel component
  - [ ] Add observer wrapper
  - [ ] Add useRootStore hook
  - [ ] Remove onClose, engineDisplayMode, onEngineDisplayModeChange, getFen props
  - [ ] Access store.ui and store.game directly
  - [ ] Update app/page.tsx
  - [ ] Test functionality

- [ ] EvaluationBar component
  - [ ] Add observer wrapper
  - [ ] Add useRootStore hook
  - [ ] Remove isVisible prop
  - [ ] Access store.ui.isEvalBarVisible directly
  - [ ] Update app/page.tsx
  - [ ] Test reactivity

- [ ] Board component
  - [ ] Remove flipped and engineDisplayMode props
  - [ ] Access store.ui directly for these values
  - [ ] Update app/page.tsx
  - [ ] Test reactivity

### Phase 3: Cleanup

- [ ] Delete hooks/useGame.ts
- [ ] Update Board.tsx comment referencing useGame
- [ ] Run full test suite
- [ ] Update test mocks if needed
- [ ] Final verification

---

## Conclusion

This audit has identified systematic patterns of prop drilling throughout the component tree, primarily in components that display or interact with game state and UI state. The recommended refactoring follows a low-risk, incremental approach:

1. **Remove prop drilling** by having components access the store directly via `useRootStore()`
2. **Use observer pattern** instead of React.memo for reactive components
3. **Delete deprecated code** (useGame.ts) to prevent confusion
4. **Maintain appropriate local state** where it belongs (appearance, notifications, etc.)

The migration is straightforward with low risk due to:
- Well-defined store structure with clear slices (game, ui, settings)
- Comprehensive test coverage
- Incremental approach allows testing at each step
- No breaking changes to public APIs

All recommended changes align with MobX + MST best practices and will result in:
- Simpler component interfaces (fewer props)
- Better performance (MobX fine-grained reactivity)
- Single source of truth (store)
- More maintainable codebase

---

**End of Audit Report**
