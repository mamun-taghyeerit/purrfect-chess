'use client';

import Board from '@/components/Board';
import GameControls from '@/components/GameControls';
import MoveHistory from '@/components/MoveHistory';
import Clock from '@/components/Clock';
import TimeControlSelector from '@/components/TimeControlSelector';
import EnginePanel from '@/components/EnginePanel';
import AppearanceControls from '@/components/AppearanceControls';
import { useGame } from '@/hooks/useGame';
import { useEasterEgg } from '@/hooks/useEasterEgg';
import { useState } from 'react';

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

  const [isEnginePanelVisible, setIsEnginePanelVisible] = useState(false);

  const { setTargetElement } = useEasterEgg({
    onReveal: () => {
      setIsEnginePanelVisible(true);
    },
  });

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
              <div className="text-xl font-bold text-orange-600">
                Check! ⚠️
              </div>
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
            <Board />
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
            movement ✓, Move history ✓, Game controls ✓, Time controls ✓, Engine analysis ✓, Appearance ✓
          </p>
          <p className="mt-2">
            <strong>Phase 3:</strong> Complete! Try selecting the text above and typing a secret code...
          </p>
        </div>
      </div>
    </main>
  );
}
