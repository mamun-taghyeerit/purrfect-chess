'use client';

import { useEffect, useRef } from 'react';
import { FrameBudgetMonitor, DragPerformanceMonitor, type DragPerformanceResult } from '@/lib/performance';

/**
 * Hook to monitor frame budget performance
 * Usage:
 * ```tsx
 * const performance = usePerformanceMonitor(isDragging);
 * ```
 */
export function usePerformanceMonitor(isActive: boolean = true) {
  const monitorRef = useRef<FrameBudgetMonitor>();

  useEffect(() => {
    if (!monitorRef.current) {
      monitorRef.current = new FrameBudgetMonitor();
    }

    if (isActive) {
      monitorRef.current.start();
    } else {
      monitorRef.current.stop();
    }

    return () => {
      monitorRef.current?.stop();
    };
  }, [isActive]);

  return {
    getStats: () => monitorRef.current?.getStats() || null,
    meetsTargets: () => monitorRef.current?.meetsTargets() || false,
  };
}

/**
 * Hook to monitor drag performance
 * Automatically tracks performance during drag operations
 * 
 * Usage:
 * ```tsx
 * const { startDrag, stopDrag } = useDragPerformance();
 * 
 * const handleDragStart = () => {
 *   startDrag();
 *   // ... your drag logic
 * };
 * 
 * const handleDragEnd = () => {
 *   const result = stopDrag();
 *   console.log(result.message);
 *   // ... your drag end logic
 * };
 * ```
 */
export function useDragPerformance() {
  const monitorRef = useRef<DragPerformanceMonitor>();

  useEffect(() => {
    if (!monitorRef.current) {
      monitorRef.current = new DragPerformanceMonitor();
    }

    return () => {
      // Cleanup if component unmounts during drag
      if (monitorRef.current) {
        try {
          monitorRef.current.stopDrag();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const startDrag = () => {
    monitorRef.current?.startDrag();
  };

  const stopDrag = (): DragPerformanceResult | null => {
    return monitorRef.current ? monitorRef.current.stopDrag() : null;
  };

  return {
    startDrag,
    stopDrag,
  };
}

/**
 * Hook to track component render count (dev mode only)
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   useRenderCount('MyComponent');
 *   // ...
 * }
 * ```
 */
export function useRenderCount(componentName: string) {
  const renderCountRef = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCountRef.current += 1;
      console.log(`[Render Count] ${componentName}: ${renderCountRef.current}`);
    }
  });
}
