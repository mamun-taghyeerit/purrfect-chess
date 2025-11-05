import path from 'path';
import { defineConfig } from 'vitest/config';

/// <reference types="vitest" />

// Note: Using vitest/config instead of vite since we removed the Vite build tool.
// Vitest has its own defineConfig that works without Vite dependencies.
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/**',
        '*.config.js',
        '*.config.ts',
        'dist/',
        'public/',
        '.next/',
        'coverage/',
      ],
      include: ['components/**', 'hooks/**', 'lib/**', 'app/**'],
    },
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
