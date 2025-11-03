/**
 * Time control utilities for Purrfect Chess
 * 
 * Provides helpers for computing engine evaluation depth and formatting time displays
 * based on the game's time control settings.
 */

import type { TimeControl } from '../types';

/**
 * Compute the engine evaluation depth based on time control
 * 
 * Games with total time <= 10 minutes (600 seconds) use depth 18 for faster analysis.
 * Longer games use depth 22 for more accurate analysis.
 * 
 * @param timeControl - Time control configuration
 * @returns Recommended engine depth (18 or 22)
 */
export function computeEvalDepth(timeControl: TimeControl): number {
  if (!timeControl || typeof timeControl.minutes !== 'number') {
    return 22; // Default to deeper analysis if invalid input
  }
  
  const totalMinutes = timeControl.minutes;
  return totalMinutes <= 10 ? 18 : 22;
}

/**
 * Format remaining time for display
 * 
 * Formats time values as decimal seconds with two decimal places,
 * e.g., "3.50s/600.00" for 3.5 seconds remaining out of 600 total.
 * 
 * @param seconds - Remaining time in seconds
 * @param total - Total time in seconds
 * @returns Formatted time string (e.g., "3.50s/600.00")
 */
export function formatRemainingTime(seconds: number, total: number): string {
  if (typeof seconds !== 'number' || typeof total !== 'number' || 
      !Number.isFinite(seconds) || !Number.isFinite(total)) {
    return '0.00s/0.00';
  }
  
  const remainingSeconds = Math.max(0, seconds).toFixed(2);
  const totalSeconds = Math.max(0, total).toFixed(2);
  return `${remainingSeconds}s/${totalSeconds}`;
}
