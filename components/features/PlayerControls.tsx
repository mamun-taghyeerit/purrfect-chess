'use client';

import React, { useRef, useState } from 'react';
import Clock from '@/components/Clock';
import TimeControlSelector from '@/components/TimeControlSelector';
import AppearanceControls, {
  type AppearanceControlsHandle,
} from '@/components/AppearanceControls';
import MoveHistory from '@/components/MoveHistory';
import { useRootStore } from '@/stores/store-setup';
import { COLORS } from '@/lib/layout-constants';
import { observer } from 'mobx-react-lite';

/**
 * PlayerControls - Control panel content for a player (White or Black)
 *
 * Features:
 * - Player clock display
 * - Appearance controls (piece and square colors)
 * - Conditional sections:
 *   - White: Time presets and custom time controls
 *   - Black: Move history and PGN/FEN controls
 *
 * @param player - 'w' for White, 'b' for Black
 * @param showTimePresets - Whether to show time control presets (White only)
 * @param showMoveHistory - Whether to show move history (Black only)
 * @param onShowMessage - Callback to show notifications
 * @param pgnInput - PGN text input value
 * @param setPgnInput - Setter for PGN input
 * @param fenInput - FEN text input value
 * @param setFenInput - Setter for FEN input
 */

interface PlayerControlsProps {
  player: 'w' | 'b';
  showTimePresets?: boolean;
  showMoveHistory?: boolean;
  onShowMessage?: (type: 'info' | 'success' | 'error', message: string) => void;
  pgnInput?: string;
  setPgnInput?: (value: string) => void;
  fenInput?: string;
  setFenInput?: (value: string) => void;
}

export function PlayerControls({
  player,
  showTimePresets = false,
  showMoveHistory = false,
  onShowMessage,
  pgnInput = '',
  setPgnInput,
  fenInput = '',
  setFenInput,
}: PlayerControlsProps) {
  const store = useRootStore();
  const appearanceRef = useRef<AppearanceControlsHandle>(null);
  
  // Custom time control state
  const [customMinutes, setCustomMinutes] = useState(store.game.timeControl.minutes);
  const [customIncrement, setCustomIncrement] = useState(store.game.timeControl.increment);

  // Determine appearance control groups based on player
  const appearanceGroups =
    player === 'w' ? ['light', 'whitePieces'] : ['dark', 'blackPieces'];
  const playerName = player === 'w' ? 'White' : 'Black';
  
  // Handle custom time control apply
  const handleApplyCustomTime = () => {
    store.game.setTimeControl(customMinutes, customIncrement);
    if (onShowMessage) {
      onShowMessage('success', `Time control set to ${customMinutes}+${customIncrement}`);
    }
  };
  
  // Handle custom time control start
  const handleStartCustomTime = () => {
    store.game.setTimeControl(customMinutes, customIncrement);
    store.game.resetGame();
    if (onShowMessage) {
      onShowMessage('info', `New game started with ${customMinutes}+${customIncrement}`);
    }
  };

  return (
    <>
      {/* Player's Clock */}
      <Clock player={player} />

      {/* Appearance Controls */}
      <div className="mb-4">
        <div
          className="flex justify-between items-center mb-4"
          style={{
            borderBottom: `1px solid ${COLORS.border.secondary}`,
            paddingBottom: '10px',
          }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ color: COLORS.text.primary }}
          >
            Appearance
          </h3>
          <button
            onClick={() => {
              appearanceRef.current?.reset();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: COLORS.border.primary,
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
            title={`Reset ${playerName.toLowerCase()} appearance settings`}
          >
            <span>↻</span>
            <span>Reset</span>
          </button>
        </div>
        <AppearanceControls
          ref={appearanceRef}
          groups={
            appearanceGroups as (
              | 'light'
              | 'dark'
              | 'whitePieces'
              | 'blackPieces'
            )[]
          }
          showGlobalReset={false}
        />
      </div>

      {/* Time Presets - White only */}
      {showTimePresets && (
        <>
          <div className="mt-5">
            <h3
              className="text-lg font-semibold text-center mb-3 pb-2.5"
              style={{
                borderBottom: `1px solid ${COLORS.border.secondary}`,
                color: COLORS.text.primary,
              }}
            >
              Time Presets
            </h3>
            <TimeControlSelector disabled={store.game.history.length > 0} />
          </div>

          {/* Custom Time - White only */}
          <div className="mt-5">
            <h3
              className="text-lg font-semibold text-center mb-3 pb-2.5"
              style={{
                borderBottom: `1px solid ${COLORS.border.secondary}`,
                color: COLORS.text.primary,
              }}
            >
              Custom Time
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm"
                  style={{ color: COLORS.text.secondary }}
                >
                  Minutes
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="rounded-lg px-2.5 py-2"
                  style={{
                    background: COLORS.background.input,
                    border: `1px solid ${COLORS.border.primary}`,
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm"
                  style={{ color: COLORS.text.secondary }}
                >
                  Increment (s)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={customIncrement}
                  onChange={(e) => setCustomIncrement(Number(e.target.value))}
                  className="rounded-lg px-2.5 py-2"
                  style={{
                    background: COLORS.background.input,
                    border: `1px solid ${COLORS.border.primary}`,
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApplyCustomTime}
                className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all"
                style={{
                  background: COLORS.border.primary,
                  color: '#fff',
                  border: 'none',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#666')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = COLORS.border.primary)
                }
              >
                Apply
              </button>
              <button
                onClick={handleStartCustomTime}
                className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold"
                style={{
                  background: COLORS.gradient.primary,
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 6px 18px rgba(230, 100, 101, 0.35)',
                }}
              >
                Start
              </button>
            </div>
          </div>
        </>
      )}

      {/* Move History - Black only */}
      {showMoveHistory && (
        <div className="mt-5">
          <h3
            className="text-lg font-semibold text-center mb-3 pb-2.5"
            style={{
              borderBottom: `1px solid ${COLORS.border.secondary}`,
              color: COLORS.text.primary,
            }}
          >
            Moves
          </h3>
          <MoveHistory />

          {/* PGN/FEN Controls */}
          <div className="mt-4 flex flex-col gap-2">
            {/* PGN Section */}
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const pgn = store.game.getPgn();
                    try {
                      await navigator.clipboard.writeText(pgn);
                      onShowMessage?.('success', 'PGN copied to clipboard!');
                    } catch (error) {
                      onShowMessage?.('error', 'Unable to copy PGN.');
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all"
                  style={{
                    background: COLORS.border.primary,
                    color: '#fff',
                    border: 'none',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#666')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = COLORS.border.primary)
                  }
                >
                  Copy PGN
                </button>
                <button
                  onClick={() => {
                    if (pgnInput.trim()) {
                      const result = store.game.loadPgnWithValidation(
                        pgnInput,
                        (error: string) => onShowMessage?.('error', error)
                      );
                      if (result) {
                        onShowMessage?.('success', 'PGN loaded successfully.');
                        setPgnInput?.(''); // Clear input after successful load
                      }
                    } else {
                      onShowMessage?.(
                        'info',
                        'Enter a PGN in the text box below.'
                      );
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all"
                  style={{
                    background: COLORS.border.primary,
                    color: '#fff',
                    border: 'none',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#666')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = COLORS.border.primary)
                  }
                >
                  Load PGN
                </button>
              </div>
              <textarea
                className="w-full p-2 rounded-lg text-xs font-mono resize-none"
                rows={4}
                placeholder="Current PGN (or type to load)"
                value={pgnInput !== '' ? pgnInput : store.game.getPgn()}
                onChange={(e) => setPgnInput?.(e.target.value)}
                onFocus={(e) => {
                  // Select all on focus for easy editing
                  e.target.select();
                }}
                onBlur={() => {
                  // Clear input when blurred if empty, to show current PGN
                  if (pgnInput.trim() === '') {
                    setPgnInput?.('');
                  }
                }}
                style={{
                  background: COLORS.background.input,
                  border: `1px solid ${COLORS.border.primary}`,
                  color: '#bbb',
                }}
              />
            </div>

            {/* FEN Section */}
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const fen = store.game.fen;
                    try {
                      await navigator.clipboard.writeText(fen);
                      onShowMessage?.('success', 'FEN copied to clipboard!');
                    } catch (error) {
                      onShowMessage?.('error', 'Unable to copy FEN.');
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all"
                  style={{
                    background: COLORS.border.primary,
                    color: '#fff',
                    border: 'none',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#666')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = COLORS.border.primary)
                  }
                >
                  Copy FEN
                </button>
                <button
                  onClick={() => {
                    if (fenInput.trim()) {
                      const result = store.game.loadFenWithValidation(
                        fenInput,
                        (error: string) => onShowMessage?.('error', error)
                      );
                      if (result) {
                        onShowMessage?.('success', 'FEN loaded successfully.');
                        setFenInput?.(''); // Clear input after successful load
                      }
                    } else {
                      onShowMessage?.(
                        'info',
                        'Enter a FEN in the text box below.'
                      );
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all"
                  style={{
                    background: COLORS.border.primary,
                    color: '#fff',
                    border: 'none',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#666')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = COLORS.border.primary)
                  }
                >
                  Load FEN
                </button>
              </div>
              <textarea
                className="w-full p-2 rounded-lg text-xs font-mono resize-none"
                rows={2}
                placeholder="Current FEN (or type to load)"
                value={fenInput !== '' ? fenInput : store.game.fen}
                onChange={(e) => setFenInput?.(e.target.value)}
                onFocus={(e) => {
                  // Select all on focus for easy editing
                  e.target.select();
                }}
                onBlur={() => {
                  // Clear input when blurred if empty, to show current FEN
                  if (fenInput.trim() === '') {
                    setFenInput?.('');
                  }
                }}
                style={{
                  background: COLORS.background.input,
                  border: `1px solid ${COLORS.border.primary}`,
                  color: '#bbb',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
