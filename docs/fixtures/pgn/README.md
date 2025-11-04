# PGN Test Fixtures

This directory contains curated PGN games for parity testing between legacy and Next.js apps.

## Fixture Categories

1. **Short Games** (`short-*.pgn`) - Quick games (Scholar's Mate, Fool's Mate)
2. **Standard Games** (`standard-*.pgn`) - Full games with headers
3. **Famous Games** (`famous-*.pgn`) - Historic/instructive games

## Usage

### Manual Testing

Load each PGN in both legacy and Next.js apps:

```bash
# Copy PGN content
cat docs/fixtures/pgn/short-scholars-mate.pgn

# Paste into PGN import dialog in both apps
# Compare move history and board state
```

### Automated Testing

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

const pgnFixture = readFileSync(
  join(__dirname, '../../docs/fixtures/pgn/short-scholars-mate.pgn'),
  'utf-8'
);

// Use in test...
```

## Fixture Format

Each `.pgn` file follows standard PGN format:

```
[Event "Test Game"]
[Site "Purrfect Chess"]
[Date "2025.11.04"]
[Round "1"]
[White "Player 1"]
[Black "Player 2"]
[Result "1-0"]

1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0
```

## Validation Checklist

For each fixture, validate:

- [ ] PGN import succeeds in both apps
- [ ] Move history matches between apps
- [ ] Final board position matches
- [ ] PGN export format matches (headers + moves)
- [ ] Result field correct

---

**Last Updated:** 2025-11-04
