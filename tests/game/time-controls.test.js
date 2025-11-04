/**
 * Unit tests for Time Controls Module
 */

import { describe, it, expect } from 'vitest';
import {
  computeEvalDepth,
  formatRemainingTime,
} from '../../src/game/time-controls.ts';

describe('computeEvalDepth', () => {
  describe('boundary cases for 10 minute threshold', () => {
    it('should return 18 for exactly 10 minutes', () => {
      expect(computeEvalDepth({ minutes: 10 })).toBe(18);
    });

    it('should return 18 for games below 10 minutes', () => {
      expect(computeEvalDepth({ minutes: 1 })).toBe(18);
      expect(computeEvalDepth({ minutes: 3 })).toBe(18);
      expect(computeEvalDepth({ minutes: 5 })).toBe(18);
      expect(computeEvalDepth({ minutes: 9 })).toBe(18);
    });

    it('should return 22 for games above 10 minutes', () => {
      expect(computeEvalDepth({ minutes: 11 })).toBe(22);
      expect(computeEvalDepth({ minutes: 15 })).toBe(22);
      expect(computeEvalDepth({ minutes: 30 })).toBe(22);
      expect(computeEvalDepth({ minutes: 60 })).toBe(22);
    });
  });

  describe('edge cases and invalid inputs', () => {
    it('should return 22 for null input', () => {
      expect(computeEvalDepth(null)).toBe(22);
    });

    it('should return 22 for undefined input', () => {
      expect(computeEvalDepth(undefined)).toBe(22);
    });

    it('should return 22 for empty object', () => {
      expect(computeEvalDepth({})).toBe(22);
    });

    it('should return 22 for object with non-numeric minutes', () => {
      expect(computeEvalDepth({ minutes: 'five' })).toBe(22);
      expect(computeEvalDepth({ minutes: null })).toBe(22);
      expect(computeEvalDepth({ minutes: undefined })).toBe(22);
    });

    it('should handle 0 minutes', () => {
      expect(computeEvalDepth({ minutes: 0 })).toBe(18);
    });

    it('should ignore increment field (not used in depth calculation)', () => {
      expect(computeEvalDepth({ minutes: 5, increment: 10 })).toBe(18);
      expect(computeEvalDepth({ minutes: 15, increment: 0 })).toBe(22);
    });
  });
});

describe('formatRemainingTime', () => {
  describe('normal formatting', () => {
    it('should format time with two decimal places', () => {
      expect(formatRemainingTime(3.5, 600)).toBe('3.50s/600.00');
      expect(formatRemainingTime(125.75, 300)).toBe('125.75s/300.00');
      expect(formatRemainingTime(0.5, 10)).toBe('0.50s/10.00');
    });

    it('should format integer seconds', () => {
      expect(formatRemainingTime(30, 600)).toBe('30.00s/600.00');
      expect(formatRemainingTime(5, 10)).toBe('5.00s/10.00');
    });

    it('should format zero values', () => {
      expect(formatRemainingTime(0, 600)).toBe('0.00s/600.00');
      expect(formatRemainingTime(5, 0)).toBe('5.00s/0.00');
      expect(formatRemainingTime(0, 0)).toBe('0.00s/0.00');
    });
  });

  describe('boundary cases', () => {
    it('should handle very small values', () => {
      expect(formatRemainingTime(0.01, 10)).toBe('0.01s/10.00');
      expect(formatRemainingTime(0.001, 5)).toBe('0.00s/5.00'); // Rounds to 2 decimals
    });

    it('should handle large values', () => {
      expect(formatRemainingTime(3600, 3600)).toBe('3600.00s/3600.00');
      expect(formatRemainingTime(1234.56, 5678.9)).toBe('1234.56s/5678.90');
    });

    it('should clamp negative values to 0', () => {
      expect(formatRemainingTime(-5, 600)).toBe('0.00s/600.00');
      expect(formatRemainingTime(30, -100)).toBe('30.00s/0.00');
      expect(formatRemainingTime(-10, -20)).toBe('0.00s/0.00');
    });
  });

  describe('invalid inputs', () => {
    it('should handle null/undefined inputs', () => {
      expect(formatRemainingTime(null, 600)).toBe('0.00s/0.00');
      expect(formatRemainingTime(30, null)).toBe('0.00s/0.00');
      expect(formatRemainingTime(null, null)).toBe('0.00s/0.00');
      expect(formatRemainingTime(undefined, undefined)).toBe('0.00s/0.00');
    });

    it('should handle non-numeric inputs', () => {
      expect(formatRemainingTime('30', 600)).toBe('0.00s/0.00');
      expect(formatRemainingTime(30, '600')).toBe('0.00s/0.00');
      expect(formatRemainingTime({}, [])).toBe('0.00s/0.00');
    });

    it('should handle NaN inputs', () => {
      expect(formatRemainingTime(NaN, 600)).toBe('0.00s/0.00');
      expect(formatRemainingTime(30, NaN)).toBe('0.00s/0.00');
      expect(formatRemainingTime(NaN, NaN)).toBe('0.00s/0.00');
    });

    it('should handle Infinity inputs', () => {
      expect(formatRemainingTime(Infinity, 600)).toBe('0.00s/0.00');
      expect(formatRemainingTime(30, Infinity)).toBe('0.00s/0.00');
    });
  });
});
