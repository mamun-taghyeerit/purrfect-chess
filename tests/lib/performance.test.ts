import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FrameBudgetMonitor, DragPerformanceMonitor, assertPerformance } from '@/lib/performance';

describe('Performance Utilities', () => {
  describe('FrameBudgetMonitor', () => {
    let monitor: FrameBudgetMonitor;

    beforeEach(() => {
      monitor = new FrameBudgetMonitor();
    });

    afterEach(() => {
      monitor.stop();
    });

    it('should start and stop monitoring', () => {
      monitor.start();
      const stats = monitor.stop();
      
      expect(stats).toHaveProperty('avgFrameTime');
      expect(stats).toHaveProperty('fps');
      expect(stats).toHaveProperty('droppedFrames');
    });

    it('should return empty stats when no frames tracked', () => {
      const stats = monitor.getStats();
      expect(stats.totalFrames).toBe(0);
      expect(stats.fps).toBe(0);
    });

    it('should detect when performance meets targets', () => {
      monitor.start();
      // Allow some frames to be tracked
      const stats = monitor.getStats();
      
      // Should have meetsTargets method
      expect(typeof monitor.meetsTargets()).toBe('boolean');
    });
  });

  describe('DragPerformanceMonitor', () => {
    let dragMonitor: DragPerformanceMonitor;

    beforeEach(() => {
      dragMonitor = new DragPerformanceMonitor();
    });

    it('should track drag performance', () => {
      dragMonitor.startDrag();
      const result = dragMonitor.stopDrag();
      
      expect(result).toHaveProperty('meetsTarget');
      expect(result).toHaveProperty('message');
      expect(typeof result.meetsTarget).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('should provide performance message', () => {
      dragMonitor.startDrag();
      const result = dragMonitor.stopDrag();
      
      expect(result.message).toMatch(/(Excellent|Good|Degraded|Poor)/);
    });
  });

  describe('assertPerformance', () => {
    it('should measure operation performance', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      };

      const result = await assertPerformance(operation, 100, 'Test operation');
      expect(typeof result).toBe('boolean');
    });

    it('should handle synchronous operations', async () => {
      const operation = () => {
        // Synchronous operation
        const sum = Array(1000).fill(1).reduce((a, b) => a + b, 0);
        expect(sum).toBe(1000);
      };

      const result = await assertPerformance(operation, 100, 'Sync operation');
      expect(typeof result).toBe('boolean');
    });
    
    it('should return true when operation meets target', async () => {
      const fastOperation = () => {
        // Very fast operation
        return 1 + 1;
      };
      
      const result = await assertPerformance(fastOperation, 1000, 'Fast operation');
      expect(result).toBe(true);
    });
  });
});
