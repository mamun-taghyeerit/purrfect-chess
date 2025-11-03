'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing Stockfish chess engine
 *
 * This hook will eventually replace the engine integration from src/engine.ts
 *
 * Integration points from vanilla app:
 * - src/engine.ts: Stockfish worker integration
 * - src/engine/uci-parser.ts: UCI protocol parsing
 * - src/types.ts: EngineAnalysisLine, EngineHighlight
 *
 * TODO for future PRs:
 * 1. Initialize the Stockfish web worker
 * 2. Implement UCI communication protocol
 * 3. Parse engine analysis results (multi-PV support)
 * 4. Calculate and format evaluation scores
 * 5. Extract principal variation (PV) lines
 * 6. Support depth configuration
 * 7. Implement analysis start/stop controls
 * 8. Add error handling and recovery
 *
 * Current status: STUB - Returns placeholder data
 */

interface EngineAnalysis {
  multipv: number;
  depth: number;
  score: number;
  scoreType: 'cp' | 'mate';
  bestMove: string;
  pv: string[];
}

interface UseEngineReturn {
  isEngineReady: boolean;
  isAnalyzing: boolean;
  analysis: EngineAnalysis[];
  startAnalysis: (fen: string, depth?: number) => void;
  stopAnalysis: () => void;
  setDepth: (depth: number) => void;
}

export function useEngine(): UseEngineReturn {
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<EngineAnalysis[]>([]);
  const [depth, setDepth] = useState(15);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // TODO: Initialize the Stockfish worker when this hook is used
    // For now, this is a stub implementation

    // Example of how to initialize the worker (to be implemented):
    // try {
    //   const worker = new Worker(
    //     new URL('@/workers/stockfish.worker.ts', import.meta.url)
    //   );
    //
    //   worker.onmessage = (event) => {
    //     handleWorkerMessage(event.data);
    //   };
    //
    //   worker.postMessage({ type: 'init' });
    //   workerRef.current = worker;
    //
    //   return () => {
    //     worker.terminate();
    //   };
    // } catch (error) {
    //   console.error('Failed to initialize Stockfish worker:', error);
    // }

    console.log('[useEngine] Hook initialized (STUB)');

    // Simulate engine being ready after a short delay
    const timeout = setTimeout(() => {
      setIsEngineReady(true);
      console.log('[useEngine] Engine ready (simulated)');
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleWorkerMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'ready':
        setIsEngineReady(true);
        break;

      case 'info':
        // TODO: Parse UCI info lines and update analysis state
        console.log('[useEngine] Analysis update:', message.data);
        break;

      case 'bestmove':
        setIsAnalyzing(false);
        console.log('[useEngine] Analysis complete:', message.data);
        break;

      case 'error':
        console.error('[useEngine] Engine error:', message.error);
        setIsAnalyzing(false);
        break;

      default:
        console.log('[useEngine] Unknown message:', message);
    }
  }, []);

  const startAnalysis = useCallback(
    (fen: string, analysisDepth?: number) => {
      const targetDepth = analysisDepth || depth;

      if (!isEngineReady) {
        console.warn('[useEngine] Engine not ready');
        return;
      }

      console.log(
        `[useEngine] Starting analysis (STUB): FEN=${fen}, Depth=${targetDepth}`
      );

      setIsAnalyzing(true);

      // TODO: Send analysis command to worker
      // workerRef.current?.postMessage({
      //   type: 'analyze',
      //   data: { fen, depth: targetDepth },
      // });

      // Placeholder: Simulate analysis result
      setTimeout(() => {
        setAnalysis([
          {
            multipv: 1,
            depth: targetDepth,
            score: 50,
            scoreType: 'cp',
            bestMove: 'e2e4',
            pv: ['e2e4', 'e7e5', 'g1f3'],
          },
        ]);
        setIsAnalyzing(false);
      }, 2000);
    },
    [isEngineReady, depth]
  );

  const stopAnalysis = useCallback(() => {
    console.log('[useEngine] Stopping analysis (STUB)');

    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    }

    setIsAnalyzing(false);
  }, []);

  return {
    isEngineReady,
    isAnalyzing,
    analysis,
    startAnalysis,
    stopAnalysis,
    setDepth,
  };
}
