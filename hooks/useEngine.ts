'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import type { UciInfoResult } from '@/lib/uci-parser';

/**
 * Custom hook for managing Stockfish chess engine
 *
 * Integrates with the stockfish npm package via Web Worker
 * Provides real-time analysis with multi-PV support
 */

export interface EngineAnalysis {
  multipv: number;
  depth: number;
  score: number;
  scoreType: 'cp' | 'mate';
  bestMove: string;
  san: string;
  pv: string[];
  pvSan: string[];
}

interface UseEngineReturn {
  isEngineReady: boolean;
  isAnalyzing: boolean;
  analysis: EngineAnalysis[];
  currentDepth: number;
  startAnalysis: (fen: string, depth?: number, multipv?: number) => void;
  stopAnalysis: () => void;
  setDepth: (depth: number) => void;
}

export function useEngine(): UseEngineReturn {
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<EngineAnalysis[]>([]);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [depth, setDepth] = useState(15);
  const workerRef = useRef<Worker | null>(null);
  const currentFenRef = useRef<string>('');
  const analysisMapRef = useRef<Map<number, Partial<EngineAnalysis>>>(
    new Map()
  );

  useEffect(() => {
    try {
      console.log('[useEngine] Initializing Stockfish worker...');

      const worker = new Worker(
        new URL('../workers/stockfish.worker.ts', import.meta.url)
      );

      worker.onmessage = (event) => {
        handleWorkerMessage(event.data);
      };

      worker.onerror = (error) => {
        console.error('[useEngine] Worker error:', error);
        setIsEngineReady(false);
        setIsAnalyzing(false);
      };

      worker.postMessage({ type: 'init' });
      workerRef.current = worker;

      return () => {
        console.log('[useEngine] Terminating worker...');
        worker.terminate();
      };
    } catch (error) {
      console.error(
        '[useEngine] Failed to initialize Stockfish worker:',
        error
      );
    }
  }, []);

  const convertUciToSan = useCallback(
    (fen: string, uciMove: string): string => {
      try {
        const game = new Chess(fen);
        const from = uciMove.slice(0, 2);
        const to = uciMove.slice(2, 4);
        const promotion =
          uciMove.length > 4 ? uciMove.slice(4).toLowerCase() : undefined;

        const move = game.move({ from, to, promotion });
        return move ? move.san : uciMove;
      } catch (error) {
        return uciMove;
      }
    },
    []
  );

  const convertPvToSan = useCallback(
    (fen: string, pvMoves: string[]): string[] => {
      const sanMoves: string[] = [];
      const game = new Chess(fen);

      for (const uciMove of pvMoves) {
        const from = uciMove.slice(0, 2);
        const to = uciMove.slice(2, 4);
        const promotion =
          uciMove.length > 4 ? uciMove.slice(4).toLowerCase() : undefined;

        try {
          const move = game.move({ from, to, promotion });
          if (move) {
            sanMoves.push(move.san);
          } else {
            break;
          }
        } catch (error) {
          break;
        }
      }

      return sanMoves;
    },
    []
  );

  const handleWorkerMessage = useCallback(
    (message: any) => {
      switch (message.type) {
        case 'ready':
          console.log('[useEngine] Engine ready');
          setIsEngineReady(true);
          break;

        case 'info': {
          const info: UciInfoResult = message.data;

          // Update current depth
          if (info.depth !== null) {
            setCurrentDepth(info.depth);
          }

          // Process multi-PV lines
          if (info.multipv !== null && info.pv && info.pvLine && info.score) {
            const pvMoves = info.pvLine.split(' ');
            const pvSan = convertPvToSan(currentFenRef.current, pvMoves);

            // Normalize score based on side to move
            const fen = currentFenRef.current;
            const turn = new Chess(fen).turn();
            let normalizedScore = info.score.value;

            if (info.score.type === 'cp' || info.score.type === 'mate') {
              if (turn === 'b') {
                normalizedScore = -normalizedScore;
              }
            }

            const analysis: EngineAnalysis = {
              multipv: info.multipv,
              depth: info.depth || 0,
              score: normalizedScore,
              scoreType: info.score.type,
              bestMove: info.pv,
              san: convertUciToSan(fen, info.pv),
              pv: pvMoves,
              pvSan: pvSan,
            };

            analysisMapRef.current.set(info.multipv, analysis);

            // Update state with sorted analysis lines
            const sortedAnalysis = Array.from(analysisMapRef.current.values())
              .filter(
                (a): a is EngineAnalysis =>
                  a.bestMove !== undefined &&
                  a.san !== undefined &&
                  a.pv !== undefined &&
                  a.pvSan !== undefined
              )
              .sort((a, b) => a.multipv - b.multipv);

            setAnalysis(sortedAnalysis);
          }
          break;
        }

        case 'bestmove':
          console.log('[useEngine] Analysis complete');
          setIsAnalyzing(false);
          break;

        case 'error':
          console.error('[useEngine] Engine error:', message.error);
          setIsAnalyzing(false);
          break;

        default:
          // Ignore unknown messages
          break;
      }
    },
    [convertUciToSan, convertPvToSan]
  );

  const startAnalysis = useCallback(
    (fen: string, analysisDepth?: number, multipv: number = 3) => {
      const targetDepth = analysisDepth || depth;

      if (!isEngineReady) {
        console.warn('[useEngine] Engine not ready');
        return;
      }

      if (!workerRef.current) {
        console.warn('[useEngine] Worker not initialized');
        return;
      }

      console.log(
        `[useEngine] Starting analysis: FEN=${fen.slice(0, 30)}..., Depth=${targetDepth}, MultiPV=${multipv}`
      );

      // Reset analysis state
      currentFenRef.current = fen;
      analysisMapRef.current.clear();
      setAnalysis([]);
      setCurrentDepth(0);
      setIsAnalyzing(true);

      workerRef.current.postMessage({
        type: 'analyze',
        data: { fen, depth: targetDepth, multipv },
      });
    },
    [isEngineReady, depth]
  );

  const stopAnalysis = useCallback(() => {
    console.log('[useEngine] Stopping analysis');

    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    }

    setIsAnalyzing(false);
  }, []);

  return {
    isEngineReady,
    isAnalyzing,
    analysis,
    currentDepth,
    startAnalysis,
    stopAnalysis,
    setDepth,
  };
}
