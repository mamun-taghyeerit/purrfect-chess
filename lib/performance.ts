/**
 * Performance profiling utilities for purrfect-chess
 * 
 * Provides tools to monitor rendering performance and ensure parity with legacy app
 * - Frame time tracking (target: ≤16ms for ≥60 FPS)
 * - Drag operation monitoring
 * - Component render tracking
 */

/**
 * Frame budget monitoring
 * Tracks frame times to ensure ≥60 FPS (≤16ms frame time)
 */
export class FrameBudgetMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private rafId: number | null = null;
  private isMonitoring: boolean = false;

  /**
   * Start monitoring frame times
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameTimes = [];
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.measureFrame.bind(this));
  }

  /**
   * Stop monitoring and return statistics
   */
  stop(): FrameStats {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isMonitoring = false;

    return this.getStats();
  }

  /**
   * Measure a single frame
   */
  private measureFrame(timestamp: number) {
    if (!this.isMonitoring) return;

    const frameTime = timestamp - this.lastFrameTime;
    this.frameTimes.push(frameTime);
    this.lastFrameTime = timestamp;

    // Keep only last 120 frames (2 seconds at 60fps)
    if (this.frameTimes.length > 120) {
      this.frameTimes.shift();
    }

    this.rafId = requestAnimationFrame(this.measureFrame.bind(this));
  }

  /**
   * Get current frame statistics
   */
  getStats(): FrameStats {
    if (this.frameTimes.length === 0) {
      return {
        avgFrameTime: 0,
        minFrameTime: 0,
        maxFrameTime: 0,
        fps: 0,
        droppedFrames: 0,
        totalFrames: 0,
      };
    }

    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    const avg = sum / this.frameTimes.length;
    const min = Math.min(...this.frameTimes);
    const max = Math.max(...this.frameTimes);
    const fps = 1000 / avg;
    
    // Frames exceeding 16.67ms (1000ms / 60fps) are considered dropped
    const droppedFrames = this.frameTimes.filter(t => t > 16.67).length;

    return {
      avgFrameTime: Math.round(avg * 100) / 100,
      minFrameTime: Math.round(min * 100) / 100,
      maxFrameTime: Math.round(max * 100) / 100,
      fps: Math.round(fps * 10) / 10,
      droppedFrames,
      totalFrames: this.frameTimes.length,
    };
  }

  /**
   * Check if current performance meets targets
   */
  meetsTargets(): boolean {
    const stats = this.getStats();
    return stats.avgFrameTime <= 16 && stats.fps >= 60;
  }
}

export interface FrameStats {
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  fps: number;
  droppedFrames: number;
  totalFrames: number;
}

/**
 * Drag performance monitor
 * Specifically tracks performance during drag operations
 */
export class DragPerformanceMonitor {
  private monitor: FrameBudgetMonitor;
  private isDragging: boolean = false;

  constructor() {
    this.monitor = new FrameBudgetMonitor();
  }

  /**
   * Start monitoring drag operation
   */
  startDrag() {
    this.isDragging = true;
    this.monitor.start();
  }

  /**
   * Stop monitoring drag operation and return results
   */
  stopDrag(): DragPerformanceResult {
    this.isDragging = false;
    const stats = this.monitor.stop();

    return {
      ...stats,
      meetsTarget: stats.fps >= 60 && stats.avgFrameTime <= 16,
      message: this.getPerformanceMessage(stats),
    };
  }

  /**
   * Get human-readable performance message
   */
  private getPerformanceMessage(stats: FrameStats): string {
    if (stats.fps >= 60 && stats.avgFrameTime <= 16) {
      return `✓ Excellent performance: ${stats.fps} FPS (${stats.avgFrameTime}ms avg frame time)`;
    } else if (stats.fps >= 50) {
      return `⚠ Good but below target: ${stats.fps} FPS (${stats.avgFrameTime}ms avg frame time)`;
    } else if (stats.fps >= 30) {
      return `⚠ Degraded performance: ${stats.fps} FPS (${stats.avgFrameTime}ms avg frame time)`;
    } else {
      return `✗ Poor performance: ${stats.fps} FPS (${stats.avgFrameTime}ms avg frame time)`;
    }
  }
}

export interface DragPerformanceResult extends FrameStats {
  meetsTarget: boolean;
  message: string;
}

/**
 * Component render tracker
 * Tracks how many times a component renders (dev mode only)
 */
export function createRenderTracker(componentName: string) {
  if (process.env.NODE_ENV !== 'development') {
    return () => {}; // No-op in production
  }

  let renderCount = 0;
  const startTime = performance.now();

  return () => {
    renderCount++;
    const elapsed = performance.now() - startTime;
    console.log(
      `[Render Tracker] ${componentName}: Render #${renderCount} at ${Math.round(elapsed)}ms`
    );
  };
}

/**
 * Performance assertion helper for tests
 * Validates that operations complete within expected time budget
 * 
 * @returns true if performance meets target, false otherwise
 */
export async function assertPerformance(
  operation: () => Promise<void> | void,
  maxTimeMs: number,
  label: string = 'Operation'
): Promise<boolean> {
  const start = performance.now();
  await operation();
  const elapsed = performance.now() - start;

  const meetsTarget = elapsed <= maxTimeMs;
  
  if (!meetsTarget) {
    console.warn(
      `Performance assertion failed: ${label} took ${Math.round(elapsed)}ms (expected ≤${maxTimeMs}ms)`
    );
  } else {
    console.log(
      `✓ Performance assertion passed: ${label} took ${Math.round(elapsed)}ms`
    );
  }
  
  return meetsTarget;
}

/**
 * Log frame budget statistics to console
 */
export function logFrameBudget(stats: FrameStats) {
  console.group('📊 Frame Budget Statistics');
  console.log(`Average Frame Time: ${stats.avgFrameTime}ms`);
  console.log(`FPS: ${stats.fps}`);
  console.log(`Min Frame Time: ${stats.minFrameTime}ms`);
  console.log(`Max Frame Time: ${stats.maxFrameTime}ms`);
  console.log(`Dropped Frames: ${stats.droppedFrames}/${stats.totalFrames}`);
  console.log(
    `Target Met: ${stats.avgFrameTime <= 16 && stats.fps >= 60 ? '✓ Yes' : '✗ No'}`
  );
  console.groupEnd();
}
