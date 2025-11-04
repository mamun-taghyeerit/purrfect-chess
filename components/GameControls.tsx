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
  onExportFen: () => string;
  onExportPgn: () => string;
}

export default function GameControls({
  onReset,
  onLoadFen,
  onExportFen,
  onExportPgn,
}: GameControlsProps) {
  const [fenInput, setFenInput] = useState('');
  const [showFenInput, setShowFenInput] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handleImportFen = () => {
    if (fenInput.trim()) {
      onLoadFen(fenInput.trim());
      setFenInput('');
      setShowFenInput(false);
    }
  };

  const handleExportFen = () => {
    const fen = onExportFen();
    navigator.clipboard.writeText(fen);
    alert('FEN copied to clipboard!');
  };

  const handleExportPgn = () => {
    const pgn = onExportPgn();
    navigator.clipboard.writeText(pgn);
    alert('PGN copied to clipboard!');
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
    </div>
  );
}
