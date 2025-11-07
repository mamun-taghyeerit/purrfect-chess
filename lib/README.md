# Performance Monitoring Utilities

This directory contains utilities for monitoring and profiling performance in purrfect-chess.

## Purpose

These utilities help ensure the Next.js app maintains performance parity with the legacy Vite app:

- **Target**: ≥60 FPS (≤16ms frame time) during drag operations
- **Monitoring**: Frame budget tracking, drag performance analysis
- **Testing**: Performance assertions for automated tests

## Files

- **`performance.ts`**: Core performance monitoring classes
  - `FrameBudgetMonitor`: Tracks frame times and FPS
  - `DragPerformanceMonitor`: Specifically monitors drag operation performance
  - Helper functions for logging and assertions

- **`../hooks/usePerformance.ts`**: React hooks for performance monitoring
  - `usePerformanceMonitor`: General frame budget monitoring
  - `useDragPerformance`: Drag-specific performance tracking
  - `useRenderCount`: Component render counting (dev mode)

## Usage Examples

### Track Frame Budget

```tsx
import { usePerformanceMonitor } from '@/hooks/usePerformance';

function MyComponent() {
  const isDragging = /* ... */;
  const performance = usePerformanceMonitor(isDragging);

  useEffect(() => {
    if (!isDragging) {
      const stats = performance.getStats();
      console.log(`FPS: ${stats.fps}, Frame Time: ${stats.avgFrameTime}ms`);
    }
  }, [isDragging]);
}
```

### Monitor Drag Performance

```tsx
import { useDragPerformance } from '@/hooks/usePerformance';

function DraggableComponent() {
  const { startDrag, stopDrag } = useDragPerformance();

  const handleDragStart = () => {
    startDrag();
    // ... drag logic
  };

  const handleDragEnd = () => {
    const result = stopDrag();
    console.log(result.message); // e.g., "✓ Excellent performance: 61.2 FPS"
    // ... drag end logic
  };
}
```

### Track Component Renders

```tsx
import { useRenderCount } from '@/hooks/usePerformance';

function Board() {
  useRenderCount('Board'); // Logs render count in dev mode
  // ...
}
```

### Performance Assertions in Tests

```tsx
import { assertPerformance } from '@/lib/performance';

it('should complete operation within budget', async () => {
  await assertPerformance(
    async () => {
      // Expensive operation
      await heavyComputation();
    },
    100, // Max 100ms allowed
    'Heavy computation'
  );
});
```

## Manual Testing

To manually verify performance:

1. Open browser DevTools → Performance tab
2. Start recording
3. Perform drag operations on the chess board
4. Stop recording
5. Check:
   - Frame rate should be ≥60 FPS
   - Frame time should be ≤16ms
   - No dropped frames during drag

## Performance Targets

Based on [Issue #XX](https://github.com/purrfectsoft/purrfect-chess/issues/XX):

- **Drag Operations**: ≥60 FPS, ≤16ms frame time
- **Engine Updates**: Throttled to max 4 updates/sec (250ms)
- **Layout Stability**: Zero layout shift on state changes

## Implementation Details

### FrameBudgetMonitor

- Uses `requestAnimationFrame` for precise frame timing
- Maintains rolling window of last 120 frames (2 seconds at 60 FPS)
- Calculates min/max/avg frame times and FPS
- Detects dropped frames (>16.67ms)

### DragPerformanceMonitor

- Wraps `FrameBudgetMonitor` with drag-specific logic
- Provides human-readable performance messages
- Returns pass/fail status against targets

### React Hooks

- `usePerformanceMonitor`: Auto-starts/stops with isActive flag
- `useDragPerformance`: Provides start/stop methods for manual control
- `useRenderCount`: Dev-mode only, zero overhead in production

## Related Documentation

- [Phase X Parity Approach](../../docs/adr/0001-phase-x-parity-approach.md)
- [Phase X Parity Checklist](../../docs/phase-x-parity.md)
- [Performance Issue #XX](https://github.com/purrfectsoft/purrfect-chess/issues/XX)
