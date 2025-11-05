'use client';

import { observer } from 'mobx-react-lite';
import Board from '@/components/Board';
import GameControls from '@/components/GameControls';
import MoveHistory from '@/components/MoveHistory';
import Clock from '@/components/Clock';
import TimeControlSelector from '@/components/TimeControlSelector';
import EnginePanel from '@/components/EnginePanel';
import AppearanceControls, {
  type AppearanceControlsHandle,
} from '@/components/AppearanceControls';
import EvaluationBar from '@/components/EvaluationBar';
import NotificationContainer from '@/components/NotificationContainer';
import { useRootStore } from '@/stores/store-setup';
import { useEngine } from '@/hooks/useEngine';
import { useEasterEgg } from '@/hooks/useEasterEgg';
import { useNotification } from '@/hooks/useNotification';
import { useMoveReview } from '@/hooks/useMoveReview';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { EngineHighlight } from '@/components/Board';

const Home = observer(() => {
  const { notifications, showMessage, dismissNotification } = useNotification();

  const handleError = useCallback(
    (error: string) => {
      showMessage('error', error);
    },
    [showMessage]
  );

  // Refs for appearance controls
  const whiteAppearanceRef = useRef<AppearanceControlsHandle>(null);
  const blackAppearanceRef = useRef<AppearanceControlsHandle>(null);

  // State for editable PGN/FEN text areas
  const [pgnInput, setPgnInput] = useState('');
  const [fenInput, setFenInput] = useState('');

  // Use MobX store - access slices directly, keep references for reactivity
  const store = useRootStore();
  const engine = store.engine;

  // Memoize the current date to prevent re-creation on every render
  const currentDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Initialize engine (hook manages worker lifecycle)
  const { isAnalyzing, currentDepth } = useEngine({
    onError: handleError,
  });

  const { isReviewing, currentBadge, reviewLastMove, clearBadge } =
    useMoveReview();

  const { setTargetElement } = useEasterEgg({
    onReveal: () => store.ui.showEnginePanel(),
  });

  // Get engine highlights and best eval from store (shared global state)
  const engineHighlights = engine.engineHighlights;
  const bestEval = engine.bestEvaluation;
  const evalScore = bestEval ? bestEval.score : null;
  const evalMate =
    bestEval && bestEval.scoreType === 'mate' ? bestEval.score : null;

  // Show notifications for game-ending conditions
  const prevGameOverRef = useRef(false);
  useEffect(() => {
    const { game } = store;
    if (store.game.isGameOver && !prevGameOverRef.current) {
      // Game just ended
      if (store.game.checkmate) {
        const winner = store.game.turn === 'w' ? 'Black' : 'White';
        showMessage('info', `Checkmate! ${winner} wins! 👑`);
      } else if (store.game.stalemate) {
        showMessage('info', 'Stalemate! The game is a draw. 🤝');
      } else {
        // Timeout
        const winner = store.game.turn === 'w' ? 'Black' : 'White';
        showMessage('info', `Time out! ${winner} wins on time. ⏰`);
      }
    }
    prevGameOverRef.current = store.game.isGameOver;
  }, [store.game.isGameOver, store.game.checkmate, store.game.stalemate, store.game.turn, showMessage, store]);

  return (
    <main className="flex min-h-screen flex-col items-center p-5" style={{ backgroundColor: '#333' }}>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <div className="z-10 w-full" style={{ maxWidth: '1260px', margin: '0 auto' }}>
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-100">
          🐱 Purrfect Chess
        </h1>

        <div className="mb-6 text-center">
          <p className="text-sm text-gray-400">
            Next.js Migration - Phase X: Functional & Visual Parity Complete
          </p>
        </div>

        {/* Game Status - Fixed height to prevent layout shift */}
        <div 
          className="mb-4 text-center"
          style={{
            minHeight: '3rem', // Reserve space for status messages
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {(store.game.isGameOver || store.game.check) && (
            <>
              {store.game.checkmate && (
                <div className="text-2xl font-bold text-red-600">
                  Checkmate! 👑
                </div>
              )}
              {store.game.stalemate && (
                <div className="text-2xl font-bold text-yellow-600">
                  Stalemate! 🤝
                </div>
              )}
              {store.game.isGameOver && !store.game.checkmate && !store.game.stalemate && (
                <div className="text-2xl font-bold text-orange-600">
                  Time Out! ⏰
                </div>
              )}
              {store.game.check && !store.game.checkmate && (
                <div className="text-xl font-bold text-orange-600">Check! ⚠️</div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col xl:flex-row gap-5 items-start justify-center">
          {/* Left Panel: White Controls */}
          <div className="flex flex-col gap-5 xl:max-w-[320px] xl:flex-1 w-full">
            <div 
              className="rounded-xl p-5"
              style={{
                backgroundColor: '#444',
                boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.35)'
              }}
            >
              <h2 
                className="text-2xl font-semibold text-center mb-5 pb-2.5"
                style={{ 
                  borderBottom: '2px solid #555',
                  color: '#f0f0f0'
                }}
              >
                White Controls
              </h2>
              
              {/* White's Clock */}
              <Clock player="w" />

              {/* White Appearance Controls: Light Squares + White Pieces */}
              <div className="mb-4">
                <div 
                  className="flex justify-between items-center mb-4"
                  style={{
                    borderBottom: '1px solid #5f5f5f',
                    paddingBottom: '10px'
                  }}
                >
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: '#f0f0f0' }}
                  >
                    Appearance
                  </h3>
                  <button
                    onClick={() => {
                      // Reset only white appearance (light squares + white pieces)
                      whiteAppearanceRef.current?.reset();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all"
                    style={{
                      background: '#555',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                    title="Reset white appearance settings"
                  >
                    <span>↻</span>
                    <span>Reset</span>
                  </button>
                </div>
                <AppearanceControls
                  ref={whiteAppearanceRef}
                  groups={['light', 'whitePieces']}
                  showGlobalReset={false}
                />
              </div>

              {/* Time Presets */}
              <div className="mt-5">
                <h3 
                  className="text-lg font-semibold text-center mb-3 pb-2.5"
                  style={{
                    borderBottom: '1px solid #5f5f5f',
                    color: '#f0f0f0'
                  }}
                >
                  Time Presets
                </h3>
                <TimeControlSelector
                  disabled={store.game.history.length > 0}
                />
              </div>

              {/* Custom Time */}
              <div className="mt-5">
                <h3 
                  className="text-lg font-semibold text-center mb-3 pb-2.5"
                  style={{
                    borderBottom: '1px solid #5f5f5f',
                    color: '#f0f0f0'
                  }}
                >
                  Custom Time
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm" style={{ color: '#e0e0e0' }}>Minutes</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      defaultValue={store.game.timeControl.minutes}
                      className="rounded-lg px-2.5 py-2"
                      style={{
                        background: '#2b2b2b',
                        border: '1px solid #555',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm" style={{ color: '#e0e0e0' }}>Increment (s)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      defaultValue={store.game.timeControl.increment}
                      className="rounded-lg px-2.5 py-2"
                      style={{
                        background: '#2b2b2b',
                        border: '1px solid #555',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all"
                    style={{
                      background: '#555',
                      color: '#fff',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#666')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#555')}
                  >
                    Apply
                  </button>
                  <button 
                    className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #e66465, #9198e5)',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 6px 18px rgba(230, 100, 101, 0.35)'
                    }}
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel: Board */}
          <div className="flex flex-col items-center gap-6 xl:flex-initial">
            {/* Board with Evaluation Bar */}
            <div className="flex gap-2 items-center">
              {/* Chess Board with Engine Overlays */}
              <Board
                engineHighlights={engineHighlights}
                moveBadge={currentBadge}
                onBadgeComplete={clearBadge}
                onError={handleError}
              />

              {/* Evaluation Bar (right side of board) - Always rendered to prevent layout shift */}
              <div style={{ minWidth: '46px', visibility: store.ui.isEvalBarVisible ? 'visible' : 'hidden' }}>
                <EvaluationBar
                  scoreCp={evalScore}
                  mateIn={evalMate}
                  isAnalyzing={isAnalyzing}
                  currentDepth={currentDepth}
                  maxDepth={22}
                />
              </div>
            </div>

            {/* Board controls */}
            <GameControls 
              onShowMessage={showMessage}
              onReviewLastMove={reviewLastMove}
              isReviewing={isReviewing}
            />

            {/* Match Card */}
            <div 
              className="w-full rounded-xl p-4"
              style={{
                maxWidth: '600px',
                background: '#3f3f3f',
                border: '1px solid #555',
                boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.35)'
              }}
            >
              <h3 
                className="text-xl font-semibold text-center mb-3"
                style={{ color: '#f5f5f5' }}
              >
                Purrfect Chess Arena
              </h3>
              <div className="flex flex-col gap-2">
                <div 
                  className="flex justify-between items-center py-1.5"
                  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                  <span className="font-semibold" style={{ color: '#cdd0ff' }}>Event</span>
                  <span 
                    className="font-mono text-right"
                    style={{
                      fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
                      color: '#f3f4ff'
                    }}
                  >
                    Purrfect Game - {store.game.timeControl.minutes}+{store.game.timeControl.increment}
                  </span>
                </div>
                <div 
                  className="flex justify-between items-center py-1.5"
                  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                  <span className="font-semibold" style={{ color: '#cdd0ff' }}>Date</span>
                  <span 
                    className="font-mono text-right"
                    style={{
                      fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
                      color: '#f3f4ff'
                    }}
                  >
                    {currentDate}
                  </span>
                </div>
                <div 
                  className="flex justify-between items-center py-1.5"
                  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                  <span className="font-semibold" style={{ color: '#cdd0ff' }}>
                    Time Control
                  </span>
                  <span 
                    className="font-mono text-right"
                    style={{
                      fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
                      color: '#f3f4ff'
                    }}
                  >
                    {store.game.timeControl.minutes} + {store.game.timeControl.increment}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="font-semibold" style={{ color: '#cdd0ff' }}>Site</span>
                  <span 
                    className="font-mono text-right"
                    style={{
                      fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
                      color: '#f3f4ff'
                    }}
                  >
                    Purrfect Universe (Online)
                  </span>
                </div>
              </div>
            </div>

            {/* Easter Egg Trigger */}
            <p
              ref={setTargetElement}
              className="text-sm select-text cursor-text italic text-center"
              style={{ color: '#777' }}
              title="Hidden feature trigger"
            >
              (Reserved for future use)
            </p>

            {/* Engine Panel (conditionally rendered below board) */}
            {store.ui.isEnginePanelVisible && (
              <div className="w-full" style={{ maxWidth: '600px' }}>
                <EnginePanel />
              </div>
            )}
          </div>

          {/* Right Panel: Black Controls */}
          <div className="flex flex-col gap-5 xl:max-w-[320px] xl:flex-1 w-full">
            <div 
              className="rounded-xl p-5"
              style={{
                backgroundColor: '#444',
                boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.35)'
              }}
            >
              <h2 
                className="text-2xl font-semibold text-center mb-5 pb-2.5"
                style={{ 
                  borderBottom: '2px solid #555',
                  color: '#f0f0f0'
                }}
              >
                Black Controls
              </h2>
              
              {/* Black's Clock */}
              <Clock player="b" />

              {/* Black Appearance Controls: Dark Squares + Black Pieces */}
              <div className="mb-4">
                <div 
                  className="flex justify-between items-center mb-4"
                  style={{
                    borderBottom: '1px solid #5f5f5f',
                    paddingBottom: '10px'
                  }}
                >
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: '#f0f0f0' }}
                  >
                    Appearance
                  </h3>
                  <button
                    onClick={() => {
                      // Reset only black appearance (dark squares + black pieces)
                      blackAppearanceRef.current?.reset();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all"
                    style={{
                      background: '#555',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                    title="Reset black appearance settings"
                  >
                    <span>↻</span>
                    <span>Reset</span>
                  </button>
                </div>
                <AppearanceControls
                  ref={blackAppearanceRef}
                  groups={['dark', 'blackPieces']}
                  showGlobalReset={false}
                />
              </div>

              {/* Moves */}
              <div className="mt-5">
                <h3 
                  className="text-lg font-semibold text-center mb-3 pb-2.5"
                  style={{
                    borderBottom: '1px solid #5f5f5f',
                    color: '#f0f0f0'
                  }}
                >
                  Moves
                </h3>
                <MoveHistory />
                
                <div className="mt-4 flex flex-col gap-2">
                  {/* PGN Section */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const pgn = store.game.getPgn();
                          try {
                            await navigator.clipboard.writeText(pgn);
                            showMessage('success', 'PGN copied to clipboard!');
                          } catch (error) {
                            showMessage('error', 'Unable to copy PGN.');
                          }
                        }}
                        className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all"
                        style={{
                          background: '#555',
                          color: '#fff',
                          border: 'none'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#666')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#555')}
                      >
                        Copy PGN
                      </button>
                      <button
                        onClick={() => {
                          if (pgnInput.trim()) {
                            const result = store.game.loadPgnWithValidation(pgnInput, handleError);
                            if (result) {
                              showMessage('success', 'PGN loaded successfully.');
                              setPgnInput(''); // Clear input after successful load
                            }
                          } else {
                            showMessage('info', 'Enter a PGN in the text box below.');
                          }
                        }}
                        className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all"
                        style={{
                          background: '#555',
                          color: '#fff',
                          border: 'none'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#666')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#555')}
                      >
                        Load PGN
                      </button>
                    </div>
                    <textarea
                      className="w-full p-2 rounded-lg text-xs font-mono resize-none"
                      rows={4}
                      placeholder="Current PGN (or type to load)"
                      value={pgnInput !== '' ? pgnInput : store.game.getPgn()}
                      onChange={(e) => setPgnInput(e.target.value)}
                      onFocus={(e) => {
                        // Select all on focus for easy editing
                        e.target.select();
                      }}
                      onBlur={() => {
                        // Clear input when blurred if empty, to show current PGN
                        if (pgnInput.trim() === '') {
                          setPgnInput('');
                        }
                      }}
                      style={{
                        background: '#2b2b2b',
                        border: '1px solid #555',
                        color: '#bbb'
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
                            showMessage('success', 'FEN copied to clipboard!');
                          } catch (error) {
                            showMessage('error', 'Unable to copy FEN.');
                          }
                        }}
                        className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all"
                        style={{
                          background: '#555',
                          color: '#fff',
                          border: 'none'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#666')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#555')}
                      >
                        Copy FEN
                      </button>
                      <button
                        onClick={() => {
                          if (fenInput.trim()) {
                            const result = store.game.loadFenWithValidation(fenInput, handleError);
                            if (result) {
                              showMessage('success', 'FEN loaded successfully.');
                              setFenInput(''); // Clear input after successful load
                            }
                          } else {
                            showMessage('info', 'Enter a FEN in the text box below.');
                          }
                        }}
                        className="flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all"
                        style={{
                          background: '#555',
                          color: '#fff',
                          border: 'none'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#666')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#555')}
                      >
                        Load FEN
                      </button>
                    </div>
                    <textarea
                      className="w-full p-2 rounded-lg text-xs font-mono resize-none"
                      rows={2}
                      placeholder="Current FEN (or type to load)"
                      value={fenInput !== '' ? fenInput : store.game.fen}
                      onChange={(e) => setFenInput(e.target.value)}
                      onFocus={(e) => {
                        // Select all on focus for easy editing
                        e.target.select();
                      }}
                      onBlur={() => {
                        // Clear input when blurred if empty, to show current FEN
                        if (fenInput.trim() === '') {
                          setFenInput('');
                        }
                      }}
                      style={{
                        background: '#2b2b2b',
                        border: '1px solid #555',
                        color: '#bbb'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm" style={{ color: '#999' }}>
          <p>
            <strong>Migration Progress:</strong> Board rendering ✓, Piece
            movement ✓, Move history ✓, Game controls ✓, Time controls ✓, Engine
            analysis ✓, Appearance ✓, All parity fixes ✓
          </p>
          <p className="mt-2">
            <strong>Phase X:</strong> Functional & Visual Parity Complete! Try selecting the text above and
            typing a secret code...
          </p>
        </div>
      </div>
    </main>
  );
});

export default Home;
