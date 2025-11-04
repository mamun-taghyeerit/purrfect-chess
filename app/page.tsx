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
          {/* Left Column: Clocks and Board */}
          <div className="flex flex-col items-center gap-4">
            <Clock
              whiteTime={whiteTime}
              blackTime={blackTime}
              activeColor={turn}
              isRunning={isTimerRunning}
            />
            
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
                onClick={() => setIsEvalBarVisible(!isEvalBarVisible)}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                {isEvalBarVisible ? 'Hide' : 'Show'} Eval Bar
              </button>
              <button
                onClick={() => {
                  const modes: Array<'squares' | 'arrows' | 'both' | 'none'> = [
                    'none',
                    'squares',
                    'arrows',
                    'both',
                  ];
                  const currentIndex = modes.indexOf(engineDisplayMode);
                  const nextIndex = (currentIndex + 1) % modes.length;
                  setEngineDisplayMode(modes[nextIndex]);
                }}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                title="Cycle through: None → Squares → Arrows → Both"
              >
                Overlay: {engineDisplayMode}
              </button>
              {/* Dev-only: Quick access to engine panel for testing */}
              {process.env.NODE_ENV === 'development' && !isEnginePanelVisible && (
                <button
                  onClick={() => setIsEnginePanelVisible(true)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-purple-700 hover:bg-purple-600 text-white transition-colors"
                  title="Development only: Reveal engine panel"
                >
                  🔧 Show Engine
                </button>
              )}
            </div>
          </div>

          {/* Middle Column: Controls, Time Control, and Move History */}
          <div className="flex flex-col gap-6">
            <TimeControlSelector
              currentTimeControl={timeControl}
              onSelect={setTimeControl}
              disabled={history.length > 0}
            />

            <GameControls
              onReset={resetGame}
              onLoadFen={loadFen}
              onExportFen={getFen}
              onExportPgn={getPgn}
            />

            <MoveHistory history={history} />

            {/* Appearance Controls */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <AppearanceControls />
            </div>
          </div>

          {/* Right Column: Engine Analysis */}
          <div className="flex flex-col gap-6">
            {isEnginePanelVisible && <EnginePanel />}

            {/* Easter Egg Trigger */}
            {!isEnginePanelVisible && (
              <div className="text-center mt-8">
                <p
                  ref={setTargetElement}
                  className="text-sm text-gray-400 dark:text-gray-600 select-text cursor-text"
                  title="Hidden feature trigger"
                >
                  (Reserved for future use)
                </p>
              </div>
            )}
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
