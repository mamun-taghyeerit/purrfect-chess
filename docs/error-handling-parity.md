# Error Handling Parity Documentation

**Created**: 2025-11-04  
**Status**: Implemented  
**Related Issue**: Error Handling + Edge Cases Parity

## Overview

This document describes the error handling patterns implemented in the Next.js app to achieve parity with the legacy Vite app. All error surfaces and recovery paths now behave identically, with matching notification patterns and no silent failures.

## Notification System

### Components

**`hooks/useNotification.ts`**
- Manages notification state
- Provides `showMessage(type, message, duration?)` API
- Auto-dismissal after configurable duration (default: 3000ms)
- Manual dismissal via `dismissNotification(id)`

**`components/NotificationContainer.tsx`**
- Toast-style notifications positioned at top-center
- Visual styling matches legacy message box
- Color-coded by type (error, success, info)
- Smooth slide-down animation

### Usage Pattern

```typescript
import { useNotification } from '@/hooks/useNotification';

const { showMessage, notifications, dismissNotification } = useNotification();

// Show error
showMessage('error', 'Invalid FEN string.');

// Show success
showMessage('success', 'FEN loaded successfully.');

// Show info
showMessage('info', 'Engine analysis started.');
```

## Error Handling Hooks

### useGame Hook

**Error Callback Pattern:**
```typescript
const { loadFen, loadPgn, movePiece, ... } = useGame({
  onError: (error: string) => {
    showMessage('error', error);
  }
});
```

**Error Messages:**
- `"Enter a FEN string to load."` - Empty FEN input
- `"Invalid FEN string."` - Malformed FEN
- `"Enter a PGN string to load."` - Empty PGN input
- `"Invalid PGN data."` - Malformed PGN
- `"Illegal move."` - Invalid move attempt

**Return Values:**
- `loadFen(fen): boolean` - Returns `true` on success, `false` on failure
- `loadPgn(pgn): boolean` - Returns `true` on success, `false` on failure
- `movePiece(from, to, promotion?): boolean` - Returns `true` on success, `false` on failure

### useEngine Hook

**Error Callback Pattern:**
```typescript
const { startAnalysis, stopAnalysis, isEngineReady, ... } = useEngine({
  onError: (error: string) => {
    showMessage('error', error);
  }
});
```

**Error Messages:**
- `"Unable to initialize Stockfish."` - Engine initialization failed
- `"Engine worker error occurred"` - Worker runtime error
- `"Engine is not ready yet."` - Analysis started before engine ready
- `"Engine worker not initialized."` - Worker not available
- `"Engine analysis failed."` - Generic analysis error

## Error Scenarios

### FEN Import Errors

**Scenario 1: Empty Input**
```typescript
loadFen(''); // Returns false
// onError called with: "Enter a FEN string to load."
```

**Scenario 2: Whitespace Only**
```typescript
loadFen('   '); // Returns false
// onError called with: "Enter a FEN string to load."
```

**Scenario 3: Invalid FEN**
```typescript
loadFen('invalid fen string'); // Returns false
// onError called with: "Invalid FEN string."
```

**Scenario 4: Valid FEN**
```typescript
loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); // Returns true
// No error, can show success: "FEN loaded successfully."
```

### PGN Import Errors

**Scenario 1: Empty Input**
```typescript
loadPgn(''); // Returns false
// onError called with: "Enter a PGN string to load."
```

**Scenario 2: Invalid PGN**
```typescript
loadPgn('not a valid pgn'); // Returns false
// onError called with: "Invalid PGN data."
```

**Scenario 3: Valid PGN**
```typescript
loadPgn('1. e4 e5 2. Nf3'); // Returns true
// No error, can show success: "PGN loaded successfully."
```

### Move Errors

**Scenario: Illegal Move**
```typescript
movePiece('e2', 'e5'); // Returns false (pawn can't move 3 squares)
// onError called with: "Illegal move."
```

**Scenario: Legal Move**
```typescript
movePiece('e2', 'e4'); // Returns true
// No error, game state updated
```

### Engine Errors

**Scenario 1: Analysis Before Ready**
```typescript
// Engine not ready yet
startAnalysis(fen);
// onError called with: "Engine is not ready yet."
```

**Scenario 2: Analysis When Ready**
```typescript
// Wait for isEngineReady === true
startAnalysis(fen);
// No error, analysis starts
```

**Scenario 3: Worker Error**
```typescript
// If worker fails during initialization
// onError called with: "Unable to initialize Stockfish."
```

## Clipboard Operations

### Success Pattern
```typescript
try {
  await navigator.clipboard.writeText(fen);
  showMessage('success', 'FEN copied to clipboard!');
} catch (error) {
  showMessage('error', 'Unable to copy FEN.');
}
```

### Error Pattern
- `"Unable to copy FEN."` - Clipboard write failed
- `"Unable to copy PGN."` - Clipboard write failed

## No Silent Failures

All error paths must surface to the user. Every operation that can fail:

1. **Returns a boolean** indicating success/failure
2. **Calls onError callback** with descriptive message
3. **Logs to console** for debugging

Example validation:
```typescript
// BAD - Silent failure
loadFen(fen); // Returns false but no user notification

// GOOD - Visible failure
const result = loadFen(fen);
if (!result) {
  // onError already called
  // User sees notification
}
```

## Mid-Analysis Recovery

**Scenario: Reset During Analysis**
```typescript
startAnalysis(fen);
// User clicks reset
resetGame();
// Analysis state cleared, no errors
```

**Scenario: New Analysis During Analysis**
```typescript
startAnalysis(fen1);
// Analysis in progress
startAnalysis(fen2);
// Previous analysis stopped, new analysis starts
// No error notifications
```

**Scenario: Stop Analysis**
```typescript
startAnalysis(fen);
stopAnalysis();
// Analysis cleanly stopped, no errors
```

## Testing

### Test Coverage

**Notification System:** 9 tests
- Display, dismissal, auto-dismiss
- Multiple notifications
- Empty message handling

**Error Handling Parity:** 19 tests
- FEN/PGN import errors
- Invalid moves
- Engine errors
- No silent failures
- Mid-analysis state management

**Integration Tests:** 2 tests
- Complete error workflow
- Recovery patterns

**Component Tests:** 7 tests
- NotificationContainer rendering
- Notification styling
- Dismissal interaction

**Total:** 37 tests covering error handling

### Running Tests

```bash
yarn test                          # Run all tests
yarn test useNotification          # Test notification hook
yarn test error-handling-parity    # Test error handling parity
yarn test NotificationContainer    # Test notification component
yarn test error-handling-workflow  # Test integration scenarios
```

## Parity Checklist

- [x] FEN import errors match legacy behavior
- [x] PGN import errors match legacy behavior
- [x] Engine errors match legacy behavior
- [x] Move validation errors match legacy behavior
- [x] Clipboard errors match legacy behavior
- [x] Notification styling matches legacy message box
- [x] Notification duration matches legacy (3000ms default)
- [x] No silent failures - all errors surface
- [x] Error messages are identical to legacy
- [x] Success messages are identical to legacy
- [x] Recovery patterns work identically

## Example Integration

```typescript
// app/page.tsx
import { useNotification } from '@/hooks/useNotification';
import NotificationContainer from '@/components/NotificationContainer';

export default function Home() {
  const { notifications, showMessage, dismissNotification } = useNotification();

  const handleError = useCallback((error: string) => {
    showMessage('error', error);
  }, [showMessage]);

  const game = useGame({ onError: handleError });
  const engine = useEngine({ onError: handleError });

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      {/* Rest of app */}
    </>
  );
}
```

## Future Enhancements

Potential improvements (not required for parity):

1. **Notification Queue**: Limit max visible notifications
2. **Persistent Notifications**: Option to disable auto-dismiss for errors
3. **Sound Effects**: Audio feedback on errors (like legacy)
4. **Notification History**: Log of past notifications
5. **Accessibility**: ARIA live regions for screen readers
6. **Animation Options**: Configurable slide direction/duration

## References

- Legacy implementation: `src/ui.ts` (lines 544-556, 860-877, 887-913)
- Legacy engine errors: `src/main.ts` (lines 398, 415, 424, 434, 451, 944)
- Issue: Error Handling + Edge Cases Parity
- ADR: `docs/adr/0001-phase-x-parity-approach.md`
- Parity doc: `docs/phase-x-parity.md` (Section 14)
