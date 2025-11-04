'use client';

import React, { useState, useEffect, useCallback } from 'react';

/**
 * Appearance Controls Component
 * 
 * Ported from src/ui.ts (lines 20-341)
 * Provides sliders for customizing board appearance:
 * - Light/Dark square colors (hue, saturation, brightness)
 * - White/Black piece colors (hue, saturation, brightness, scale)
 * 
 * Uses CSS custom properties to apply filters
 */

interface AppearanceValues {
  hue: number;
  saturation: number;
  brightness: number;
  scale?: number;
}

interface AppearanceState {
  light: AppearanceValues;
  dark: AppearanceValues;
  whitePieces: AppearanceValues & { scale: number };
  blackPieces: AppearanceValues & { scale: number };
}

interface SliderConfig {
  key: keyof AppearanceValues;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

interface GroupConfig {
  key: keyof AppearanceState;
  label: string;
  sliders: SliderConfig[];
}

const appearanceDefaults: AppearanceState = {
  light: { hue: 0, saturation: 100, brightness: 100 },
  dark: { hue: 0, saturation: 100, brightness: 100 },
  whitePieces: { hue: 0, saturation: 100, brightness: 100, scale: 100 },
  blackPieces: { hue: 0, saturation: 100, brightness: 100, scale: 100 },
};

const groupConfigs: GroupConfig[] = [
  {
    key: 'light',
    label: 'Light Squares',
    sliders: [
      { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
      { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` },
    ],
  },
  {
    key: 'dark',
    label: 'Dark Squares',
    sliders: [
      { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
      { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` },
    ],
  },
  {
    key: 'whitePieces',
    label: 'White Pieces',
    sliders: [
      { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
      { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'scale', label: 'Size', min: 80, max: 120, step: 1, format: (v) => `${v}%` },
    ],
  },
  {
    key: 'blackPieces',
    label: 'Black Pieces',
    sliders: [
      { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
      { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'scale', label: 'Size', min: 80, max: 120, step: 1, format: (v) => `${v}%` },
    ],
  },
];

export default function AppearanceControls() {
  const [appearance, setAppearance] = useState<AppearanceState>(appearanceDefaults);

  // Helper to calculate scale value
  const formatScale = (scale: number) => ((scale || 100) / 100).toFixed(2);

  // Apply appearance to CSS custom properties
  const applyAppearance = useCallback((state: AppearanceState) => {
    const root = document.documentElement;

    Object.entries(state).forEach(([key, group]) => {
      const filter = `hue-rotate(${group.hue}deg) saturate(${group.saturation / 100}) brightness(${group.brightness / 100})`;

      if (key === 'light') {
        root.style.setProperty('--light-square-filter', filter);
      } else if (key === 'dark') {
        root.style.setProperty('--dark-square-filter', filter);
      } else if (key === 'whitePieces') {
        root.style.setProperty('--white-piece-filter', filter);
        root.style.setProperty('--white-piece-scale', formatScale(group.scale || 100));
      } else if (key === 'blackPieces') {
        root.style.setProperty('--black-piece-filter', filter);
        root.style.setProperty('--black-piece-scale', formatScale(group.scale || 100));
      }
    });
  }, []);

  // Apply appearance on mount and when it changes
  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance, applyAppearance]);

  const handleSliderChange = (
    groupKey: keyof AppearanceState,
    sliderKey: keyof AppearanceValues,
    value: number
  ) => {
    setAppearance((prev) => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey],
        [sliderKey]: value,
      },
    }));
  };

  const handleGroupReset = (groupKey: keyof AppearanceState) => {
    setAppearance((prev) => ({
      ...prev,
      [groupKey]: { ...appearanceDefaults[groupKey] },
    }));
  };

  const handleGlobalReset = () => {
    setAppearance({ ...appearanceDefaults });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Appearance</h3>
        <button
          onClick={handleGlobalReset}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Reset all appearance settings"
        >
          ↻ Reset All
        </button>
      </div>

      {groupConfigs.map((group) => (
        <div key={group.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm">{group.label}</h4>
            <button
              onClick={() => handleGroupReset(group.key)}
              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`Reset ${group.label}`}
            >
              ↻
            </button>
          </div>

          <div className="space-y-3">
            {group.sliders.map((slider) => {
              const value = appearance[group.key][slider.key] as number;
              return (
                <div key={slider.key} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      {slider.label}
                    </label>
                    <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                      {slider.format(value)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={value}
                    onChange={(e) =>
                      handleSliderChange(group.key, slider.key, Number(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
