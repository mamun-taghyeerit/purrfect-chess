'use client';

import Board from '@/components/Board';
import GameControls from '@/components/GameControls';
import MoveHistory from '@/components/MoveHistory';
import Clock from '@/components/Clock';
import TimeControlSelector from '@/components/TimeControlSelector';
import EnginePanel from '@/components/EnginePanel';
import AppearanceControls from '@/components/AppearanceControls';
import EvaluationBar from '@/components/EvaluationBar';
import { useGame } from '@/hooks/useGame';
import { useEngine } from '@/hooks/useEngine';
import { useEasterEgg } from '@/hooks/useEasterEgg';
import { useState } from 'react';
import type { EngineHighlight } from '@/components/Board';

export default function Home() {
  const {
    resetGame,
    loadFen,
    getFen,
    getPgn,
    loadPgn,
    history,
    isGameOver,
    checkmate,
    stalemate,
    check,
    whiteTime,
    blackTime,
    turn,
    timeControl,
    setTimeControl,
    isTimerRunning,
  } = useGame();

  const { isAnalyzing, analysis, currentDepth } = useEngine();
  const [isEnginePanelVisible, setIsEnginePanelVisible] = useState(false);
  const [isEvalBarVisible, setIsEvalBarVisible] = useState(false);
  const [engineDisplayMode, setEngineDisplayMode] = useState<
    'squares' | 'arrows' | 'both' | 'none'
  >('arrows');

  const { setTargetElement } = useEasterEgg({
    onReveal: () => {
      setIsEnginePanelVisible(true);
    },
  });

  // Convert engine analysis to highlights for Board
  const engineHighlights: EngineHighlight[] = analysis.map((line, index) => ({
    from: line.bestMove.slice(0, 2),
    to: line.bestMove.slice(2, 4),
    rank: index + 1, // 1-based rank (1 = best move)
  }));

  // Get best evaluation for EvaluationBar (from first PV line)
  const bestEval = analysis.length > 0 ? analysis[0] : null;
  const evalScore = bestEval ? bestEval.score : null;
  const evalMate =
    bestEval && bestEval.scoreType === 'mate' ? bestEval.score : null;

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="z-10 w-full max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-4">
          🐱 Purrfect Chess
        </h1>

        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Next.js Migration - Phase 2: Core Structure & Initial Port
          </p>
        </div>

        {/* Game Status */}
        {(isGameOver || check) && (
          <div className="mb-4 text-center">
            {checkmate && (
              <div className="text-2xl font-bold text-red-600">
                Checkmate! 👑
              </div>
            )}
            {stalemate && (
              <div className="text-2xl font-bold text-yellow-600">
                Stalemate! 🤝
              </div>
            )}
            {isGameOver && !checkmate && !stalemate && (
              <div className="text-2xl font-bold text-orange-600">
                Time Out! ⏰
              </div>
            )}
            {check && !checkmate && (
              <div className="text-xl font-bold text-orange-600">Check! ⚠️</div>
            )}
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-8 items-start justify-center">
          {/* Left Panel: White Controls */}
          <div className="flex flex-col gap-6 xl:max-w-[320px] xl:flex-1">
            <div className="bg-gray-800 dark:bg-gray-800 rounded-xl p-5 shadow-lg">
              <h2 className="text-xl font-bold text-center mb-4 pb-3 border-b border-gray-700">
                White Controls
              </h2>
              
              {/* White's Clock Only */}
              <div
                className={`p-3 rounded-xl text-center font-mono text-4xl font-bold mb-6 transition-all ${
                  turn === 'w' && isTimerRunning
                    ? 'bg-gray-900 text-white ring-2 ring-blue-400 shadow-lg shadow-blue-500/50'
                    : 'bg-gray-900 text-gray-400'
                }`}
              >
                {Math.floor(whiteTime / 60000)
                  .toString()
                  .padStart(2, '0')}
                :
                {Math.floor((whiteTime % 60000) / 1000)
                  .toString()
                  .padStart(2, '0')}
              </div>

              {/* White Appearance Controls: Light Squares + White Pieces */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Appearance</h3>
                  <button
                    onClick={() => {
                      // Reset handled by individual group reset buttons in AppearanceControls
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-1.5"
                    title="Reset all appearance settings"
                  >
                    <span>↻</span>
                    <span>Reset</span>
                  </button>
                </div>
                <AppearanceControls
                  groups={['light', 'whitePieces']}
                  showGlobalReset={false}
                />
              </div>

              {/* Time Presets */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-center mb-3 pb-2 border-b border-gray-700">
                  Time Presets
                </h3>
                <TimeControlSelector
                  currentTimeControl={timeControl}
                  onSelect={setTimeControl}
                  disabled={history.length > 0}
                />
              </div>

              {/* Custom Time */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-center mb-3 pb-2 border-b border-gray-700">
                  Custom Time
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-400">Minutes</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      defaultValue={timeControl.minutes}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-400">Increment (s)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      defaultValue={timeControl.increment}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-semibold">
                    Apply
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm bg-gradient-to-br from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg transition-colors font-semibold shadow-lg">
                    Start
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel: Board */}
          <div className="flex flex-col items-center gap-4 xl:flex-initial">
            {/* Board with Evaluation Bar */}
            <div className="flex gap-2 items-center">
              {/* Evaluation Bar (left side of board) */}
              {isEvalBarVisible && (
                <EvaluationBar
                  scoreCp={evalScore}
                  mateIn={evalMate}
                  isAnalyzing={isAnalyzing}
                  isVisible={isEvalBarVisible}
                  currentDepth={currentDepth}
                  maxDepth={22}
                />
              )}

              {/* Chess Board with Engine Overlays */}
              <Board
                engineHighlights={engineHighlights}
                engineDisplayMode={engineDisplayMode}
              />
            </div>

            {/* Board controls */}
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={resetGame}
                className="px-3 py-1.5 text-sm rounded-full border border-gray-600 hover:bg-gray-700 text-white transition-colors flex items-center gap-2"
              >
                <span>↻</span>
                <span>Reset Game</span>
              </button>
              <button
                onClick={() => setIsEvalBarVisible(!isEvalBarVisible)}
                className="px-3 py-1.5 text-sm rounded-full border border-gray-600 hover:bg-gray-700 text-white transition-colors flex items-center gap-2"
              >
                <span>📊</span>
                <span>{isEvalBarVisible ? 'Hide' : 'Show'} Eval Bar</span>
              </button>
              <button
                onClick={() => {
                  // TODO: Implement move review functionality
                  alert('Move review feature coming soon!');
                }}
                className="px-3 py-1.5 text-sm rounded-full border border-gray-600 hover:bg-gray-700 text-white transition-colors flex items-center gap-2"
              >
                <span>⭐</span>
                <span>Move Review</span>
              </button>
            </div>

            {/* Match Card */}
            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg">
              <h3 className="text-xl font-semibold text-center mb-3">
                Purrfect Chess Arena
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-700/50">
                  <span className="font-semibold text-blue-300">Event</span>
                  <span className="font-mono text-gray-100">
                    Purrfect Game - {timeControl.minutes}+{timeControl.increment}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-700/50">
                  <span className="font-semibold text-blue-300">Date</span>
                  <span className="font-mono text-gray-100">
                    {new Date().toLocaleDateString('en-CA')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-700/50">
                  <span className="font-semibold text-blue-300">
                    Time Control
                  </span>
                  <span className="font-mono text-gray-100">
                    {timeControl.minutes} + {timeControl.increment}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="font-semibold text-blue-300">Site</span>
                  <span className="font-mono text-gray-100">
                    Purrfect Universe (Online)
                  </span>
                </div>
              </div>
            </div>

            {/* Easter Egg Trigger */}
            <p
              ref={setTargetElement}
              className="text-sm text-gray-500 dark:text-gray-600 select-text cursor-text italic"
              title="Hidden feature trigger"
            >
              (Reserved for future use)
            </p>

            {/* Engine Panel (conditionally rendered below board) */}
            {isEnginePanelVisible && (
              <div className="w-full max-w-md">
                <EnginePanel />
              </div>
            )}
          </div>

          {/* Right Panel: Black Controls */}
          <div className="flex flex-col gap-6 xl:max-w-[320px] xl:flex-1">
            <div className="bg-gray-800 dark:bg-gray-800 rounded-xl p-5 shadow-lg">
              <h2 className="text-xl font-bold text-center mb-4 pb-3 border-b border-gray-700">
                Black Controls
              </h2>
              
              {/* Black's Clock Only */}
              <div
                className={`p-3 rounded-xl text-center font-mono text-4xl font-bold mb-6 transition-all ${
                  turn === 'b' && isTimerRunning
                    ? 'bg-gray-900 text-white ring-2 ring-blue-400 shadow-lg shadow-blue-500/50'
                    : 'bg-gray-900 text-gray-400'
                }`}
              >
                {Math.floor(blackTime / 60000)
                  .toString()
                  .padStart(2, '0')}
                :
                {Math.floor((blackTime % 60000) / 1000)
                  .toString()
                  .padStart(2, '0')}
              </div>

              {/* Black Appearance Controls: Dark Squares + Black Pieces */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Appearance</h3>
                  <button
                    onClick={() => {
                      // Reset handled by individual group reset buttons in AppearanceControls
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-1.5"
                    title="Reset all appearance settings"
                  >
                    <span>↻</span>
                    <span>Reset</span>
                  </button>
                </div>
                <AppearanceControls
                  groups={['dark', 'blackPieces']}
                  showGlobalReset={false}
                />
              </div>

              {/* Moves */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-center mb-3 pb-2 border-b border-gray-700">Moves</h3>
                <MoveHistory history={history} />
                
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const pgn = getPgn();
                        await navigator.clipboard.writeText(pgn);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-semibold"
                    >
                      Copy PGN
                    </button>
                    <button
                      onClick={() => {
                        const pgnText = prompt('Enter PGN:');
                        if (pgnText) {
                          try {
                            loadPgn(pgnText);
                          } catch (error) {
                            alert('Invalid PGN format');
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-semibold"
                    >
                      Load PGN
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const fen = getFen();
                        await navigator.clipboard.writeText(fen);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-semibold"
                    >
                      Copy FEN
                    </button>
                    <button
                      onClick={() => {
                        const fenText = prompt('Enter FEN:');
                        if (fenText) {
                          loadFen(fenText);
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-semibold"
                    >
                      Load FEN
                    </button>
                  </div>
                </div>

                {/* PGN and FEN text areas (hidden by default, match legacy) */}
                <textarea
                  className="w-full mt-3 p-2 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono text-gray-400 resize-none"
                  rows={4}
                  placeholder="PGN will appear here"
                  value={getPgn()}
                  readOnly
                />
                <textarea
                  className="w-full mt-2 p-2 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono text-gray-400 resize-none"
                  rows={2}
                  placeholder="FEN will appear here"
                  value={getFen()}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Migration Progress:</strong> Board rendering ✓, Piece
            movement ✓, Move history ✓, Game controls ✓, Time controls ✓, Engine
            analysis ✓, Appearance ✓
          </p>
          <p className="mt-2">
            <strong>Phase 3:</strong> Complete! Try selecting the text above and
            typing a secret code...
          </p>
        </div>
      </div>
    </main>
  );
}
