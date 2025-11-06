'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '@/stores/store-setup';
import type { TimeControl } from '@/lib/types';

/**
 * TimeControlSelector Component - Select time control presets
 *
 * Ported from src/ui.ts time control selector functionality
 * Features:
 * - Preset time controls (3+0, 5+1, 10+0, etc.)
 * - Visual indication of selected preset
 * 
 * Performance Optimizations:
 * - Uses MobX observer for fine-grained reactivity
 * - Direct store access for time control state and actions
 */

interface TimeControlSelectorProps {
  disabled?: boolean;
}

const timePresets: Array<TimeControl & { label: string }> = [
  { label: '3 + 0', minutes: 3, increment: 0 },
  { label: '5 + 1', minutes: 5, increment: 1 },
  { label: '10 + 0', minutes: 10, increment: 0 },
  { label: '15 + 10', minutes: 15, increment: 10 },
  { label: '30 + 0', minutes: 30, increment: 0 },
  { label: '30 + 30', minutes: 30, increment: 30 },
];

const TimeControlSelector = observer(function TimeControlSelector({
  disabled = false,
}: TimeControlSelectorProps) {
  const store = useRootStore();
  const currentTimeControl = store.game.timeControl;

  const handleSelect = (preset: TimeControl) => {
    store.game.setTimeControl(preset.minutes, preset.increment);
  };

  const isSelected = (preset: TimeControl) =>
    preset.minutes === currentTimeControl.minutes &&
    preset.increment === currentTimeControl.increment;

  return (
    <div className="grid grid-cols-2 gap-2" style={{ minWidth: '233px' }}>
      {timePresets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => handleSelect(preset)}
          disabled={disabled}
          className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: isSelected(preset)
              ? 'linear-gradient(135deg, #9198e5, #e66465)'
              : '#555',
            color: '#fff',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            boxShadow: isSelected(preset)
              ? '0 4px 12px rgba(145, 152, 229, 0.4)'
              : 'none',
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isSelected(preset)) {
              e.currentTarget.style.background = '#666';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && !isSelected(preset)) {
              e.currentTarget.style.background = '#555';
            }
          }}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
});

export default TimeControlSelector;
