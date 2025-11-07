'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';

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
      {
        key: 'hue',
        label: 'Hue',
        min: -180,
        max: 180,
        step: 1,
        format: (v) => `${v}°`,
      },
      {
        key: 'saturation',
        label: 'Saturation',
        min: 0,
        max: 200,
        step: 1,
        format: (v) => `${v}%`,
      },
      {
        key: 'brightness',
        label: 'Brightness',
        min: 25,
        max: 200,
        step: 1,
        format: (v) => `${v}%`,
      },
    ],
  },
  {
    key: 'dark',
    label: 'Dark Squares',
    sliders: [
      {
        key: 'hue',
        label: 'Hue',
        min: -180,
        max: 180,
        step: 1,
        format: (v) => `${v}°`,
      },
      {
        key: 'saturation',
        label: 'Saturation',
        min: 0,
        max: 200,
        step: 1,
        format: (v) => `${v}%`,
      },
      {
        key: 'brightness',
        label: 'Brightness',
        min: 25,
        max: 200,
        step: 1,
        format: (v) => `${v}%`,
      },
    ],
  },
  {
    key: 'whitePieces',
    label: 'White Pieces',
    sliders: [
      {
        key: 'hue',
        label: 'Hue',
        min: -180,
        max: 180,
        step: 1,
        format: (v) => `${v}°`,
      },
      {
        key: 'saturation',
        label: 'Saturation',
        min: 0,
        max: 200,
        step: 1,
        format: (v) => `${v}%`,
      },
      {
        key: 'brightness',
        label: 'Brightness',
        min: 25,
        max: 200,
        step: 1,
        format: (v) => `${v}%`,
      },
      {
        key: 'scale',
        label: 'Size',
        min: 80,
        max: 120,
        step: 1,
        format: (v) => `${v}%`,
      },
    ],
  },
  {
    key: 'blackPieces',
    label: 'Black Pieces',
    sliders: [
      {
        key: 'hue',
        label: 'Hue',
        min: -180,
        max: 180,
        step: 1,
        format: (v) => `${v}°`,
      },
      {
        key: 'saturation',
        label: 'Saturation',
        min: 0,
        max: 200,
        step: 1,
        format: (v) => `${v}%`,
      },
      {
        key: 'brightness',
        label: 'Brightness',
        min: 25,
        max: 200,
        step: 1,
        format: (v) => `${v}%`,
      },
      {
        key: 'scale',
        label: 'Size',
        min: 80,
        max: 120,
        step: 1,
        format: (v) => `${v}%`,
      },
    ],
  },
];

interface AppearanceControlsProps {
  /** Which appearance groups to display. If not provided, shows all groups. */
  groups?: Array<keyof AppearanceState>;
  /** Whether to show the global "Reset All" button. Default: true when showing all groups */
  showGlobalReset?: boolean;
}

export interface AppearanceControlsHandle {
  /** Reset the appearance settings for the configured groups */
  reset: () => void;
}

const AppearanceControls = forwardRef<
  AppearanceControlsHandle,
  AppearanceControlsProps
>(function AppearanceControls({ groups, showGlobalReset }, ref) {
  const [appearance, setAppearance] =
    useState<AppearanceState>(appearanceDefaults);

  // Determine which groups to display
  const displayGroups = groups
    ? groupConfigs.filter((g) => groups.includes(g.key))
    : groupConfigs;

  // Show global reset by default only if showing all groups
  const shouldShowGlobalReset =
    showGlobalReset !== undefined
      ? showGlobalReset
      : !groups || groups.length === groupConfigs.length;

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
        root.style.setProperty(
          '--white-piece-scale',
          formatScale(group.scale || 100)
        );
      } else if (key === 'blackPieces') {
        root.style.setProperty('--black-piece-filter', filter);
        root.style.setProperty(
          '--black-piece-scale',
          formatScale(group.scale || 100)
        );
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

  // Public reset method for filtered groups
  const handleFilteredReset = useCallback(() => {
    if (groups) {
      setAppearance((prev) => {
        const newState = { ...prev };
        groups.forEach((groupKey) => {
          newState[groupKey] = { ...appearanceDefaults[groupKey] } as any;
        });
        return newState;
      });
    } else {
      setAppearance({ ...appearanceDefaults });
    }
  }, [groups]);

  // Expose reset method via ref
  useImperativeHandle(
    ref,
    () => ({
      reset: handleFilteredReset,
    }),
    [handleFilteredReset]
  );

  return (
    <div className="flex flex-col gap-3">
      {shouldShowGlobalReset && (
        <div
          className="flex justify-between items-center mb-1"
          style={{
            borderBottom: '1px solid #5f5f5f',
            paddingBottom: '10px',
          }}
        >
          <h3 className="text-lg font-semibold" style={{ color: '#f0f0f0' }}>
            Appearance
          </h3>
          <button
            onClick={handleGlobalReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: '#555',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.filter = 'brightness(1.05)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.filter = 'brightness(1)')
            }
            title="Reset all appearance settings"
          >
            <span>↻</span>
            <span>Reset All</span>
          </button>
        </div>
      )}

      {displayGroups.map((group) => (
        <div
          key={group.key}
          className="rounded-lg p-3"
          style={{
            background: '#3a3a3a',
            border: '1px solid #565656',
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-base" style={{ color: '#ddd' }}>
              {group.label}
            </h4>
            <button
              onClick={() => handleGroupReset(group.key)}
              className="text-lg p-0.5 transition-all hover:rotate-[30deg]"
              style={{
                background: 'none',
                border: 'none',
                color: '#9198e5',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#e66465')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9198e5')}
              title={`Reset ${group.label}`}
            >
              ↻
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {group.sliders.map((slider) => {
              const value = appearance[group.key][slider.key] as number;
              return (
                <label
                  key={slider.key}
                  className="flex flex-col gap-1.5 text-sm"
                  style={{ color: '#e0e0e0' }}
                >
                  <div className="flex justify-between items-center">
                    <span>{slider.label}</span>
                    <span className="text-xs" style={{ color: '#bbb' }}>
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
                      handleSliderChange(
                        group.key,
                        slider.key,
                        Number(e.target.value)
                      )
                    }
                    className="w-full cursor-pointer slider-legacy"
                    style={{
                      height: '8px',
                      borderRadius: '5px',
                      background: '#666',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      opacity: 0.85,
                    }}
                  />
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

export default AppearanceControls;
