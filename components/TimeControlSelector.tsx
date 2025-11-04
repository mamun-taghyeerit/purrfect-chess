'use client';

import React from 'react';

/**
 * TimeControlSelector Component - Select time control presets
 *
 * Ported from src/ui.ts time control selector functionality
 * Features:
 * - Preset time controls (3+0, 5+1, 10+0, etc.)
 * - Visual indication of selected preset
 */

interface TimeControl {
  minutes: number;
  increment: number;
}

interface TimeControlSelectorProps {
  currentTimeControl: TimeControl;
  onSelect: (timeControl: TimeControl) => void;
  disabled?: boolean;
}

const timePresets: Array<TimeControl & { label: string }> = [
  { label: '1 + 0', minutes: 1, increment: 0 },
  { label: '3 + 0', minutes: 3, increment: 0 },
  { label: '3 + 2', minutes: 3, increment: 2 },
  { label: '5 + 0', minutes: 5, increment: 0 },
  { label: '5 + 1', minutes: 5, increment: 1 },
  { label: '10 + 0', minutes: 10, increment: 0 },
  { label: '15 + 10', minutes: 15, increment: 10 },
  { label: '30 + 0', minutes: 30, increment: 0 },
];

export default function TimeControlSelector({
  currentTimeControl,
  onSelect,
  disabled = false,
}: TimeControlSelectorProps) {
  const isSelected = (preset: TimeControl) =>
    preset.minutes === currentTimeControl.minutes &&
    preset.increment === currentTimeControl.increment;

  return (
    <div className="w-full max-w-md">
      <h3 className="text-sm font-bold mb-2">Time Control</h3>
      <div className="grid grid-cols-4 gap-2">
        {timePresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() =>
              onSelect({ minutes: preset.minutes, increment: preset.increment })
            }
            disabled={disabled}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isSelected(preset)
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
