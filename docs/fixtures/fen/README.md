# FEN Test Fixtures

This directory contains curated FEN positions for parity testing between legacy and Next.js apps.

## Fixture Categories

1. **Basic Positions** (`basic-*.fen`)
2. **Castling** (`castling-*.fen`)
3. **En Passant** (`enpassant-*.fen`)
4. **Promotions** (`promotion-*.fen`)
5. **Checkmates** (`checkmate-*.fen`)
6. **Stalemates** (`stalemate-*.fen`)
7. **Draws** (`draw-*.fen`)
8. **Edge Cases** (`edge-*.fen`)

## Usage

### Manual Testing

Load each FEN in both legacy and Next.js apps:

```bash
# Copy FEN string from file
cat docs/fixtures/fen/basic-starting-position.fen

# Paste into FEN import dialog in both apps
# Compare visual rendering
```

### Automated Testing

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

const fenFixture = readFileSync(
  join(__dirname, '../../docs/fixtures/fen/basic-starting-position.fen'),
  'utf-8'
).trim();

// Use in test...
```

## Fixture Format

Each `.fen` file contains:

- Line 1: FEN string
- Line 2+: Comment describing the position (optional)

Example:

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
Starting position - all pieces in initial placement
```

## Adding New Fixtures

1. Create `.fen` file in appropriate category directory
2. Use descriptive filename: `category-description.fen`
3. Add FEN string as first line
4. Add comment describing test scenario
5. Update test files to include new fixture

## Validation Checklist

For each fixture, validate:

- [ ] Visual rendering matches between apps
- [ ] FEN export matches input (round-trip)
- [ ] Legal moves calculated correctly
- [ ] Game state detected correctly (check, mate, stalemate, draw)

---

**Last Updated:** 2025-11-04
