'use client';

import React, { useMemo } from 'react';
import Board from '@/components/Board';
import GameControls from '@/components/GameControls';
import EvaluationBar from '@/components/EvaluationBar';
import EnginePanel from '@/components/EnginePanel';
import { useRootStore } from '@/stores/store-setup';
import { COLORS, LAYOUT } from '@/lib/layout-constants';
import type { EngineHighlight } from '@/components/Board';
import type { MoveBadge } from '@/hooks/useMoveReview';

/**
 * BoardSection - Central panel containing the chess board and related controls
 *
 * Features:
 * - Chess board with engine overlays
 * - Evaluation bar (conditionally visible)
 * - Game controls (flip, reset, engine toggles, review)
 * - Match card with game info
 * - Engine panel (conditionally visible)
 * - Easter egg trigger
 *
 * @param engineHighlights - Engine analysis highlights to display on board
 * @param bestEval - Best evaluation from engine (can be MST model or null)
 * @param isAnalyzing - Whether engine is currently analyzing
 * @param currentDepth - Current analysis depth
 * @param onShowMessage - Callback to show notifications
 * @param onReviewLastMove - Callback to review the last move
 * @param isReviewing - Whether a move review is in progress
 * @param reviewStatus - Status of the move review
 * @param currentBadge - Badge to display on the board (e.g., "Brilliant!")
 * @param clearBadge - Callback to clear the badge
 * @param setTargetElement - Callback to set easter egg target element
 * @param onError - Callback for error handling
 */

interface BoardSectionProps {
  engineHighlights: EngineHighlight[];
  bestEval: { score: number; scoreType: string } | null;
  isAnalyzing: boolean;
  currentDepth: number;
  onShowMessage: (type: 'info' | 'success' | 'error', message: string) => void;
  onReviewLastMove: (
    lastMove: any,
    callback: (classification: string) => void
  ) => void;
  isReviewing: boolean;
  reviewStatus: {
    depth: number;
    remainingTime: number;
    totalTime: number;
  } | null;
  currentBadge: MoveBadge | null;
  clearBadge: () => void;
  setTargetElement: (element: HTMLElement | null) => void;
  onError: (error: string) => void;
}

export function BoardSection({
  engineHighlights,
  bestEval,
  isAnalyzing,
  currentDepth,
  onShowMessage,
  onReviewLastMove,
  isReviewing,
  reviewStatus,
  currentBadge,
  clearBadge,
  setTargetElement,
  onError,
}: BoardSectionProps) {
  const store = useRootStore();

  // Memoize the current date to prevent re-creation on every render
  const currentDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Extract eval score and mate
  const evalScore = bestEval ? bestEval.score : null;
  const evalMate =
    bestEval && bestEval.scoreType === 'mate' ? bestEval.score : null;

  return (
    <>
      {/* Board with Evaluation Bar */}
      <div className="flex gap-2 items-start">
        {/* Chess Board with Engine Overlays */}
        <Board
          engineHighlights={
            // Only show highlights if eval bar or engine panel is visible
            // Clear highlights when both are hidden to prevent stale overlays
            store.ui.isEvalBarVisible || store.ui.isEnginePanelVisible
              ? engineHighlights
              : []
          }
          showEvalBarOverlay={
            store.ui.isEvalBarVisible && !store.ui.isEnginePanelVisible
          }
          moveBadge={currentBadge}
          onBadgeComplete={clearBadge}
          onError={onError}
        />

        {/* Evaluation Bar (right side of board) - Always rendered to prevent layout shift */}
        <div
          style={{
            minWidth: '46px',
            width: '46px',
            height: `min(90vw, ${LAYOUT.BOARD_MAX_SIZE}px)`, // Match board height
            visibility: store.ui.isEvalBarVisible ? 'visible' : 'hidden',
          }}
        >
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
        onShowMessage={onShowMessage}
        onReviewLastMove={onReviewLastMove}
        isReviewing={isReviewing}
        reviewStatus={reviewStatus}
      />

      {/* Board status info (depth display) */}
      <div className="board-status-info">
        {/* Eval bar depth info - shown when eval bar is visible */}
        {store.ui.isEvalBarVisible && currentDepth > 0 && (
          <div className="eval-bar-depth-info">
            (current depth: <span>{currentDepth}</span> | max depth:{' '}
            <span>{store.settings.defaultEngineDepth}</span>)
          </div>
        )}

        {/* Move review status - shown when reviewing */}
        {isReviewing && reviewStatus && (
          <div className="move-review-status">
            (analyzing move... depth: <span>{reviewStatus.depth}</span> | time:{' '}
            <span>{Math.ceil(reviewStatus.remainingTime / 1000)}s</span>)
          </div>
        )}
      </div>

      {/* Match Card */}
      <div
        className="w-full rounded-xl p-4"
        style={{
          maxWidth: `${LAYOUT.BOARD_MAX_SIZE}px`,
          background: COLORS.background.card,
          border: `1px solid ${COLORS.border.primary}`,
          boxShadow: COLORS.shadow.inset,
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
            <span className="font-semibold" style={{ color: '#cdd0ff' }}>
              Event
            </span>
            <span
              className="font-mono text-right"
              style={{
                fontFamily:
                  "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
                color: COLORS.text.code,
              }}
            >
              Purrfect Game - {store.game.timeControl.minutes}+
              {store.game.timeControl.increment}
            </span>
          </div>
          <div
            className="flex justify-between items-center py-1.5"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <span className="font-semibold" style={{ color: '#cdd0ff' }}>
              Date
            </span>
            <span
              className="font-mono text-right"
              style={{
                fontFamily:
                  "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
                color: COLORS.text.code,
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
                fontFamily:
                  "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
                color: COLORS.text.code,
              }}
            >
              {store.game.timeControl.minutes} +{' '}
              {store.game.timeControl.increment}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="font-semibold" style={{ color: '#cdd0ff' }}>
              Site
            </span>
            <span
              className="font-mono text-right"
              style={{
                fontFamily:
                  "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
                color: COLORS.text.code,
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
        style={{ color: COLORS.text.muted }}
        title="Hidden feature trigger"
      >
        (Reserved for future use)
      </p>

      {/* Engine Panel (conditionally rendered below board) */}
      {store.ui.isEnginePanelVisible && (
        <div
          className="w-full"
          style={{ maxWidth: `${LAYOUT.BOARD_MAX_SIZE}px` }}
        >
          <EnginePanel />
        </div>
      )}
    </>
  );
}
