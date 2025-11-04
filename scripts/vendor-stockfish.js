#!/usr/bin/env node
/**
 * Stockfish Vendoring Script
 *
 * Automatically copies the appropriate Stockfish variant from node_modules
 * to the public/libs directory for use in the Next.js application.
 *
 * Stockfish Package Details:
 * - Package: stockfish@17.1.0 (chess.com maintained)
 * - Source: https://github.com/nmrugg/stockfish.js
 * - License: GPL v3
 *
 * Available Variants:
 * 1. Multi-threaded WASM (~75MB): Strongest, requires CORS headers
 * 2. Single-threaded WASM (~75MB): Strong, no CORS required
 * 3. Lite Multi-threaded WASM (~7MB): Weaker, requires CORS headers
 * 4. Lite Single-threaded WASM (~7MB): Weaker, no CORS required
 * 5. ASM.js (~10MB): Weakest, universal compatibility
 *
 * Selected Variant: Lite Single-threaded WASM
 * Rationale:
 * - No CORS headers required (works in all deployment scenarios)
 * - Reasonable file size (~7MB vs ~75MB)
 * - WASM performance (faster than asm.js)
 * - Single-threaded (no SharedArrayBuffer complexity)
 * - Sufficient strength for in-browser analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const STOCKFISH_VERSION = '17.1';
const VARIANT = 'lite-single';
const VARIANT_HASH = '03e3232';

const SOURCE_DIR = path.join(
  __dirname,
  '..',
  'node_modules',
  'stockfish',
  'src'
);
const TARGET_DIR = path.join(__dirname, '..', 'public', 'libs');

// Determine which files to copy based on variant
const getFilesToCopy = (variant, hash) => {
  const baseName = `stockfish-${STOCKFISH_VERSION}-${variant}-${hash}`;

  switch (variant) {
    case 'lite-single':
      return [
        { src: `${baseName}.js`, dest: 'stockfish-lite-single.js' },
        { src: `${baseName}.wasm`, dest: 'stockfish-lite-single.wasm' },
      ];
    default:
      throw new Error(`Unknown variant: ${variant}`);
  }
};

// Main vendoring function
function vendorStockfish() {
  console.log('=== Stockfish Vendoring Script ===');
  console.log(`Version: ${STOCKFISH_VERSION}`);
  console.log(`Variant: ${VARIANT}`);
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Target: ${TARGET_DIR}`);
  console.log('');

  // Ensure target directory exists
  if (!fs.existsSync(TARGET_DIR)) {
    console.log('Creating target directory...');
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  // Get files to copy
  const files = getFilesToCopy(VARIANT, VARIANT_HASH);

  let totalSize = 0;
  let copiedCount = 0;

  // Copy each file
  for (const { src, dest } of files) {
    const sourcePath = path.join(SOURCE_DIR, src);
    const targetPath = path.join(TARGET_DIR, dest);

    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Source file not found: ${src}`);
      console.error(`   Expected at: ${sourcePath}`);
      process.exit(1);
    }

    // Copy file
    fs.copyFileSync(sourcePath, targetPath);

    // Get file size
    const stats = fs.statSync(targetPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    totalSize += stats.size;
    copiedCount++;

    console.log(`✓ Copied: ${dest} (${sizeMB} MB)`);
  }

  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log('');
  console.log(`=== Vendoring Complete ===`);
  console.log(`Files copied: ${copiedCount}`);
  console.log(`Total size: ${totalSizeMB} MB`);
  console.log('');
  console.log('Stockfish files are now available in public/libs/');
  console.log(`Worker will load from: /libs/stockfish-${VARIANT}.js`);
}

// Run the script
try {
  vendorStockfish();
} catch (error) {
  console.error('❌ Vendoring failed:', error.message);
  process.exit(1);
}
