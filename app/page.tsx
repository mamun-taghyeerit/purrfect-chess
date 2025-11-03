'use client';

import Board from '@/components/Board';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          🐱 Purrfect Chess - Next.js Migration Skeleton
        </h1>

        <div className="mb-8 text-center">
          <p className="text-lg mb-2">
            This is the initial Next.js migration skeleton for Purrfect Chess.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The board below is a placeholder component. Original vanilla JS
            modules will be incrementally migrated to React components.
          </p>
        </div>

        {/* Placeholder Board Component */}
        <div className="flex justify-center">
          <Board />
        </div>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Next Steps:</strong> Integrate chess.js logic, Stockfish
            engine, and UI controls from the original app.
          </p>
        </div>
      </div>
    </main>
  );
}
