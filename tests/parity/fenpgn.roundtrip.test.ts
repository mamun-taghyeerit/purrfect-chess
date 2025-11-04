import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Chess } from 'chess.js';
import { renderHook, act } from '@testing-library/react';
import { useGame } from '@/hooks/useGame';

/**
 * FEN/PGN Round-Trip Parity Tests
 * 
 * Purpose: Validate that FEN import/export and PGN export
 * produce identical results between legacy and Next.js apps.
 * 
 * Status: ENABLED - Testing FEN/PGN I/O parity
 */

describe('Phase X Parity: FEN Round-Trip Corpus', () => {
  const fenFixturesDir = join(__dirname, '../../docs/fixtures/fen');
  
  it('should have FEN fixtures directory', () => {
    expect(() => readdirSync(fenFixturesDir)).not.toThrow();
  });

  it('should load all FEN fixtures', () => {
    const fenFiles = readdirSync(fenFixturesDir).filter((f) => f.endsWith('.fen'));
    expect(fenFiles.length).toBeGreaterThan(0);
  });

  // TODO: Implement FEN round-trip test
  // 1. Load each .fen file from docs/fixtures/fen/
  // 2. Import FEN using useGame.loadFen()
  // 3. Export FEN using useGame.getFen()
  // 4. Assert: exported FEN matches original FEN
  //    NOTE: "Semantically equivalent" means:
  //      - Board position must be identical
  //      - Side to move must match
  //      - Castling rights must match
  //      - En passant square must match (if any)
  //      - Half-move clock may differ slightly (acceptable if logic differs)
  //      - Full-move number must match
  // 5. Test in both legacy app logic and Next.js useGame hook
  
  it('imports and exports FEN identically to legacy', () => {
    const fenFiles = readdirSync(fenFixturesDir).filter((f) => f.endsWith('.fen'));
    
    expect(fenFiles.length).toBeGreaterThan(0);
    
    for (const fenFile of fenFiles) {
      const fenPath = join(fenFixturesDir, fenFile);
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [originalFen] = fenContent.split('\n');
      
      // Test with legacy logic (chess.js directly)
      const legacyGame = new Chess();
      legacyGame.load(originalFen);
      const legacyExportedFen = legacyGame.fen();
      
      // Test with Next.js useGame hook
      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(originalFen);
      });
      const nextExportedFen = result.current.getFen();
      
      // Both should match the original FEN (byte-equivalent)
      expect(legacyExportedFen).toBe(originalFen);
      expect(nextExportedFen).toBe(originalFen);
      expect(nextExportedFen).toBe(legacyExportedFen);
    }
  });
});

describe('Phase X Parity: PGN Export Format Corpus', () => {
  const pgnFixturesDir = join(__dirname, '../../docs/fixtures/pgn');
  
  it('should have PGN fixtures directory', () => {
    expect(() => readdirSync(pgnFixturesDir)).not.toThrow();
  });

  it('should load all PGN fixtures', () => {
    const pgnFiles = readdirSync(pgnFixturesDir).filter((f) => f.endsWith('.pgn'));
    expect(pgnFiles.length).toBeGreaterThan(0);
  });

  // TODO: Implement PGN export format test
  // 1. Load each .pgn file from docs/fixtures/pgn/
  // 2. Parse PGN and replay moves
  // 3. Export PGN using useGame.getPgn()
  // 4. Assert: exported PGN format matches expected format
  // 5. Validate headers (Event, Site, Date, Round, White, Black, Result)
  // 6. Validate move notation (SAN format)
  
  it('exports PGN with expected formatting', () => {
    const pgnFiles = readdirSync(pgnFixturesDir).filter((f) => f.endsWith('.pgn'));
    
    expect(pgnFiles.length).toBeGreaterThan(0);
    
    for (const pgnFile of pgnFiles) {
      const pgnPath = join(pgnFixturesDir, pgnFile);
      const expectedPgn = readFileSync(pgnPath, 'utf-8').trim();
      
      // Test with legacy logic (chess.js directly)
      const legacyGame = new Chess();
      legacyGame.loadPgn(expectedPgn);
      const legacyExportedPgn = legacyGame.pgn();
      
      // Test with Next.js useGame hook
      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadPgn(expectedPgn);
      });
      const nextExportedPgn = result.current.getPgn();
      
      // Both should match the expected PGN format (byte-equivalent)
      expect(legacyExportedPgn).toBe(expectedPgn);
      expect(nextExportedPgn).toBe(expectedPgn);
      expect(nextExportedPgn).toBe(legacyExportedPgn);
    }
  });

  it('round-trips PGN (import → export → import)', () => {
    const pgnFiles = readdirSync(pgnFixturesDir).filter((f) => f.endsWith('.pgn'));
    
    for (const pgnFile of pgnFiles) {
      const pgnPath = join(pgnFixturesDir, pgnFile);
      const originalPgn = readFileSync(pgnPath, 'utf-8').trim();
      
      // Load → export → load → export cycle with Next.js hook
      const { result } = renderHook(() => useGame());
      
      // First load
      act(() => {
        result.current.loadPgn(originalPgn);
      });
      const firstExport = result.current.getPgn();
      const firstFen = result.current.getFen();
      
      // Reset and load exported PGN
      act(() => {
        result.current.resetGame();
        result.current.loadPgn(firstExport);
      });
      const secondExport = result.current.getPgn();
      const secondFen = result.current.getFen();
      
      // PGN and FEN should be identical after round-trip
      expect(secondExport).toBe(firstExport);
      expect(secondFen).toBe(firstFen);
    }
  });
});

/**
 * Implementation Guide:
 * 
 * 1. Enable tests by removing .skip
 * 2. Implement FEN round-trip logic:
 *    - Use renderHook from @testing-library/react
 *    - Import useGame hook
 *    - Test loadFen() → getFen() round-trip
 * 3. Implement PGN export logic:
 *    - Parse PGN fixtures
 *    - Replay moves using useGame
 *    - Export using getPgn()
 *    - Validate format
 * 4. Add edge case handling:
 *    - Invalid FEN
 *    - Incomplete PGN
 *    - Non-standard notation
 */
