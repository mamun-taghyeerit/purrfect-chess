'use client';

import { useGame } from '@/hooks/useGame';
import { useEngine, type EngineAnalysis } from '@/hooks/useEngine';
import { useState, memo, useRef, useEffect } from 'react';

/**
 * Engine Analysis Panel Component (Legacy-compatible version)
 *
 * Displays Stockfish engine analysis with multi-PV support
 * Shows top engine lines with evaluations and principal variations
 * Matches legacy appearance from src/ui.ts
 * 
 * Performance Optimizations:
 * - Throttled updates to prevent drag jank (max 4 updates/sec during analysis)
 * - Memoized EngineLine components to prevent unnecessary re-renders
 * - Debounced analysis display to reduce DOM thrashing
 */

interface EngineLineProps {
  analysis: EngineAnalysis;
  index: number;
}

interface EnginePanelProps {
  onClose?: () => void;
  engineDisplayMode?: 'squares' | 'arrows' | 'both' | 'none';
  onEngineDisplayModeChange?: (mode: 'squares' | 'arrows' | 'both') => void;
}

/**
 * Memoized EngineLine component to prevent unnecessary re-renders
 * Only re-renders when analysis data actually changes
 */
const EngineLine = memo(function EngineLine({ analysis, index }: EngineLineProps) {
  const formatScore = (score: number, scoreType: string) => {
    if (scoreType === 'mate') {
      return score > 0 ? `+M${score}` : `-M${Math.abs(score)}`;
    }
    // Convert centipawns to pawns with sign
    const pawns = (score / 100).toFixed(2);
    return score > 0 ? `+${pawns}` : pawns;
  };

  const scoreColor = (score: number) => {
    if (Math.abs(score) < 50) return 'text-gray-700 dark:text-gray-300';
    return score > 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 p-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-6">
          #{index + 1}
        </span>
        <span
          className={`font-mono text-lg font-bold ${scoreColor(analysis.score)}`}
        >
          {formatScore(analysis.score, analysis.scoreType)}
        </span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {analysis.san}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          depth {analysis.depth}
        </span>
      </div>
      {analysis.pvSan.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 ml-9">
          {analysis.pvSan.slice(0, 8).join(' ')}
          {analysis.pvSan.length > 8 && '...'}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders when analysis hasn't changed
  return (
    prevProps.analysis.multipv === nextProps.analysis.multipv &&
    prevProps.analysis.depth === nextProps.analysis.depth &&
    prevProps.analysis.score === nextProps.analysis.score &&
    prevProps.analysis.scoreType === nextProps.analysis.scoreType &&
    prevProps.analysis.san === nextProps.analysis.san &&
    prevProps.index === nextProps.index
  );
});

/**
 * EnginePanel component with throttled updates to prevent drag jank
 * Limits analysis updates to max 4 times per second (every 250ms)
 */
export default function EnginePanel({
  onClose,
  engineDisplayMode = 'arrows',
  onEngineDisplayModeChange,
}: EnginePanelProps) {
  const { getFen } = useGame();
  const {
    isEngineReady,
    isAnalyzing,
    analysis,
    currentDepth,
    startAnalysis,
    stopAnalysis,
  } = useEngine();

  const [depth, setDepth] = useState(18);
  
  // Throttled analysis state to prevent drag jank
  const [throttledAnalysis, setThrottledAnalysis] = useState(analysis);
  const [throttledDepth, setThrottledDepth] = useState(currentDepth);
  const lastUpdateTimeRef = useRef<number>(0);
  const UPDATE_THROTTLE_MS = 250; // Max 4 updates per second

  // Throttle analysis updates to prevent drag jank
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    if (timeSinceLastUpdate >= UPDATE_THROTTLE_MS) {
      // Update immediately if enough time has passed
      setThrottledAnalysis(analysis);
      setThrottledDepth(currentDepth);
      lastUpdateTimeRef.current = now;
    } else {
      // Schedule update for later
      const timeoutId = setTimeout(() => {
        setThrottledAnalysis(analysis);
        setThrottledDepth(currentDepth);
        lastUpdateTimeRef.current = Date.now();
      }, UPDATE_THROTTLE_MS - timeSinceLastUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [analysis, currentDepth]);

  const handleAnalyzeClick = () => {
    const fen = getFen();
    if (isAnalyzing) {
      stopAnalysis();
    } else {
      startAnalysis(fen, depth, 3);
    }
  };

  const handleClose = () => {
    if (isAnalyzing) {
      stopAnalysis();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleOverlayModeChange = (mode: 'squares' | 'arrows' | 'both') => {
    if (onEngineDisplayModeChange) {
      onEngineDisplayModeChange(mode);
    }
  };

  return (
    <div
      className="w-full rounded-xl p-4"
      style={{
        background: '#2f2f2f',
        border: '1px solid #575757',
        boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Header with Close button (matching legacy) */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: '#f0f0f0' }}>
          Engine Analysis
        </h3>
        <button
          onClick={handleClose}
          className="px-3 py-1.5 text-sm rounded-lg font-semibold transition-all"
          style={{
            background: '#555',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#666')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#555')}
        >
          Close
        </button>
      </div>

      {/* Depth Control (matching legacy) */}
      <label className="grid grid-cols-[auto_auto_1fr] items-center gap-2 mb-4 text-sm">
        <span style={{ color: '#dcdcdc' }}>Search Depth:</span>
        <span
          className="font-semibold min-w-[2rem] text-center"
          style={{ color: '#f0f0f0' }}
        >
          {depth}
        </span>
        <input
          type="range"
          min="6"
          max="30"
          step="1"
          value={depth}
          onChange={(e) => setDepth(parseInt(e.target.value, 10))}
          className="w-full"
          style={{
            accentColor: '#9198e5',
          }}
        />
      </label>

      {/* Start/Stop Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleAnalyzeClick}
          disabled={!isEngineReady || isAnalyzing}
          className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
          style={{
            background:
              isEngineReady && !isAnalyzing
                ? 'linear-gradient(135deg, #e66465, #9198e5)'
                : '#555',
            color: '#fff',
            border: 'none',
            cursor: isEngineReady && !isAnalyzing ? 'pointer' : 'not-allowed',
            boxShadow:
              isEngineReady && !isAnalyzing
                ? '0 6px 18px rgba(230, 100, 101, 0.35)'
                : 'none',
          }}
        >
          Start Analysis
        </button>
        <button
          onClick={() => stopAnalysis()}
          disabled={!isAnalyzing}
          className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
          style={{
            background: isAnalyzing ? '#dc2626' : '#555',
            color: '#fff',
            border: 'none',
            cursor: isAnalyzing ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (isAnalyzing) e.currentTarget.style.background = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            if (isAnalyzing) e.currentTarget.style.background = '#dc2626';
          }}
        >
          Stop
        </button>
      </div>

      {/* Overlay Controls (matching legacy) */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm" style={{ color: '#dcdcdc' }}>
          Overlay:
        </span>
        <div className="flex gap-2 flex-wrap">
          {(['squares', 'arrows', 'both'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleOverlayModeChange(mode)}
              className="px-4 py-1.5 text-sm rounded-lg font-semibold transition-all min-w-[96px]"
              style={{
                background:
                  engineDisplayMode === mode
                    ? 'linear-gradient(135deg, #e66465, #9198e5)'
                    : '#555',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow:
                  engineDisplayMode === mode
                    ? '0 6px 18px rgba(230, 100, 101, 0.35)'
                    : 'none',
              }}
              onMouseEnter={(e) => {
                if (engineDisplayMode !== mode)
                  e.currentTarget.style.background = '#666';
              }}
              onMouseLeave={(e) => {
                if (engineDisplayMode !== mode)
                  e.currentTarget.style.background = '#555';
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Engine Status */}
      <div className="mb-3 text-sm">
        {!isEngineReady && (
          <div className="flex items-center gap-2" style={{ color: '#999' }}>
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            Initializing Stockfish...
          </div>
        )}
        {isEngineReady && !isAnalyzing && (
          <div style={{ color: '#4ade80' }}>✓ Engine ready</div>
        )}
        {isAnalyzing && (
          <div className="flex items-center gap-2" style={{ color: '#60a5fa' }}>
            <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full" />
            Analyzing... (depth {throttledDepth})
          </div>
        )}
      </div>

      {/* Analysis Lines */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: '#1f1f1f',
          border: '1px solid #444',
        }}
      >
        {throttledAnalysis.length === 0 ? (
          <div className="p-4 text-center text-sm" style={{ color: '#999' }}>
            {isAnalyzing
              ? 'Computing best moves...'
              : isEngineReady
                ? 'Click Start Analysis to begin'
                : 'Waiting for engine...'}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {throttledAnalysis.map((line, index) => (
              <EngineLine key={line.multipv} analysis={line} index={index} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-center" style={{ color: '#999' }}>
        Powered by Stockfish 17
      </div>
    </div>
  );
}
