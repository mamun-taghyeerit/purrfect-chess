'use client';

import { useGame } from '@/hooks/useGame';
import { useEngine, type EngineAnalysis } from '@/hooks/useEngine';

/**
 * Engine Analysis Panel Component
 *
 * Displays Stockfish engine analysis with multi-PV support
 * Shows top engine lines with evaluations and principal variations
 */

interface EngineLineProps {
  analysis: EngineAnalysis;
  index: number;
}

function EngineLine({ analysis, index }: EngineLineProps) {
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
}

export default function EnginePanel() {
  const { getFen } = useGame();
  const {
    isEngineReady,
    isAnalyzing,
    analysis,
    currentDepth,
    startAnalysis,
    stopAnalysis,
  } = useEngine();

  const handleAnalyzeClick = () => {
    const fen = getFen();
    if (isAnalyzing) {
      stopAnalysis();
    } else {
      startAnalysis(fen, 18, 3);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          🐱 Engine Analysis
        </h2>
        <button
          onClick={handleAnalyzeClick}
          disabled={!isEngineReady}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            isEngineReady
              ? isAnalyzing
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? 'Stop' : 'Analyze'}
        </button>
      </div>

      {/* Engine Status */}
      <div className="mb-4 text-sm">
        {!isEngineReady && (
          <div className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            Initializing Stockfish...
          </div>
        )}
        {isEngineReady && !isAnalyzing && (
          <div className="text-green-600 dark:text-green-400">
            ✓ Engine ready
          </div>
        )}
        {isAnalyzing && (
          <div className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <div className="animate-pulse h-2 w-2 bg-blue-600 rounded-full" />
            Analyzing... (depth {currentDepth})
          </div>
        )}
      </div>

      {/* Analysis Lines */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
        {analysis.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            {isAnalyzing
              ? 'Computing best moves...'
              : isEngineReady
                ? 'Click Analyze to start'
                : 'Waiting for engine...'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {analysis.map((line, index) => (
              <EngineLine key={line.multipv} analysis={line} index={index} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Powered by Stockfish 17
      </div>
    </div>
  );
}
