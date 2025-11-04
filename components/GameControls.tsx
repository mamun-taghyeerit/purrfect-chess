'use client';

import React, { useState } from 'react';

/**
 * GameControls Component - Control panel for game operations
 *
 * Ported from src/ui.ts control panel functionality
 * Features:
 * - Reset game button
 * - FEN import/export
 * - PGN import/export
 */

interface GameControlsProps {
  onReset: () => void;
  onLoadFen: (fen: string) => void;
  onLoadPgn?: (pgn: string) => void;
  onExportFen: () => string;
  onExportPgn: () => string;
}

export default function GameControls({
  onReset,
  onLoadFen,
  onLoadPgn,
  onExportFen,
  onExportPgn,
}: GameControlsProps) {
  const [fenInput, setFenInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [showFenInput, setShowFenInput] = useState(false);
  const [showPgnInput, setShowPgnInput] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handleImportFen = () => {
    if (fenInput.trim()) {
      onLoadFen(fenInput.trim());
      setFenInput('');
      setShowFenInput(false);
    }
  };

  const handleImportPgn = () => {
    if (pgnInput.trim() && onLoadPgn) {
      onLoadPgn(pgnInput.trim());
      setPgnInput('');
      setShowPgnInput(false);
    }
  };

  const handleExportFen = () => {
    const fen = onExportFen();
    navigator.clipboard
      .writeText(fen)
      .then(() => {
        console.log('FEN copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy FEN:', err);
      });
  };

  const handleExportPgn = () => {
    const pgn = onExportPgn();
    navigator.clipboard
      .writeText(pgn)
      .then(() => {
        console.log('PGN copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy PGN:', err);
      });
  };

  return (
    <div className="space-y-4 w-full max-w-md">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Reset Game
        </button>

        <button
          onClick={() => setShowFenInput(!showFenInput)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          📥 Import FEN
        </button>

        <button
          onClick={handleExportFen}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          📤 Export FEN
        </button>

        {onLoadPgn && (
          <button
            onClick={() => setShowPgnInput(!showPgnInput)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📥 Import PGN
          </button>
        )}

        <button
          onClick={handleExportPgn}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          📋 Export PGN
        </button>
      </div>

      {showFenInput && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <label className="block text-sm font-medium mb-2">
            Enter FEN string:
          </label>
          <input
            type="text"
            value={fenInput}
            onChange={(e) => setFenInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 dark:bg-gray-700 dark:border-gray-600"
            placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          />
          <div className="flex gap-2">
            <button
              onClick={handleImportFen}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Load
            </button>
            <button
              onClick={() => {
                setShowFenInput(false);
                setFenInput('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPgnInput && onLoadPgn && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <label className="block text-sm font-medium mb-2">
            Enter PGN string:
          </label>
          <textarea
            value={pgnInput}
            onChange={(e) => setPgnInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
            placeholder='[Event "?"]&#10;[Site "?"]&#10;&#10;1. e4 e5 2. Nf3 Nc6 *'
            rows={8}
          />
          <div className="flex gap-2">
            <button
              onClick={handleImportPgn}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Load
            </button>
            <button
              onClick={() => {
                setShowPgnInput(false);
                setPgnInput('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
