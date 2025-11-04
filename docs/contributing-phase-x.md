# Contributing to Phase X: Parity Development

This guide helps contributors work on Phase X parity tasks efficiently while minimizing merge conflicts through proper separation of concerns.

## Quick Links

- **Master Issue:** [#31 - Modernization Roadmap](https://github.com/purrfectsoft/purrfect-chess/issues/31)
- **Phase X Issue:** [#40 - Functional + Visual Parity](https://github.com/purrfectsoft/purrfect-chess/issues/40)
- **Parity Documentation:** [`docs/phase-x-parity.md`](./phase-x-parity.md)
- **Side-by-Side Validation:** [`docs/runbooks/side-by-side.md`](./runbooks/side-by-side.md)

## Core Principles

### 1. Legacy is Source of Truth

The legacy Vite app in `src/` defines correct behavior. When in doubt:
- Check legacy implementation first
- Match legacy behavior exactly
- Document any intentional deviations

### 2. Test with Fixtures

Use provided test corpuses to validate parity:
- **FEN fixtures:** `docs/fixtures/fen/*.fen` (25 positions)
- **PGN fixtures:** `docs/fixtures/pgn/*.pgn` (10 games)

### 3. Side-by-Side Validation

Always run both apps side-by-side:
```bash
# Terminal 1: Legacy
yarn dev          # → http://localhost:5173

# Terminal 2: Next.js
yarn next:dev     # → http://localhost:3000
```

Compare visually and functionally for each change.

### 4. Modular Development

Follow separation of concerns to enable parallel work:
- One component per file
- One fixture per file
- One test suite per feature
- Clear module boundaries

## Development Workflow

### Step 1: Choose a Workstream

See [`docs/phase-x-parity.md`](./phase-x-parity.md) for 14 workstreams. Pick one that:
- Is not already in progress (check Issue #40 comments)
- Matches your expertise
- Has clear acceptance criteria

### Step 2: Set Up Development Environment

```bash
# Ensure correct Node version
nvm use

# Install dependencies
yarn

# Vendor Stockfish binaries
yarn vendor:stockfish

# Run tests to ensure baseline
yarn test
```

### Step 3: Review Legacy Implementation

Study the legacy code for your workstream:

**Example: Arrow Drawing (Workstream #9)**
```bash
# View legacy arrow implementation
cat src/board.ts | grep -A 20 "arrow"
```

Understand:
- Data structures used
- Interaction model (right-click drag)
- Visual rendering approach
- Edge cases handled

### Step 4: Implement in Next.js

Follow these guidelines:

#### Component Structure

```
components/
├── ArrowOverlay.tsx          # Single responsibility: draw arrows
├── BoardOverlay.types.ts     # Type definitions only
└── EvaluationBar.tsx         # Single responsibility: show eval
```

Each component:
- Has one clear purpose
- Accepts well-typed props
- Returns JSX (or null if stub)
- Exports types separately

#### Type-First Development

Define types before implementation:

```typescript
// components/ArrowOverlay.types.ts
export interface ArrowProps {
  from: string;
  to: string;
  color?: ArrowColor;
}
```

```typescript
// components/ArrowOverlay.tsx
import { ArrowProps } from './BoardOverlay.types';

export default function ArrowOverlay(props: ArrowProps) {
  // Implementation
}
```

#### Fixture-Driven Development

Test with fixtures as you develop:

```typescript
// Load fixture
const fen = readFileSync('docs/fixtures/fen/castling-ready-position.fen', 'utf-8');

// Test in component
loadFen(fen);
// Verify visual rendering matches legacy
```

### Step 5: Validate Parity

#### Automated Testing

```bash
# Run parity tests (if enabled)
yarn test tests/parity

# Run component tests
yarn test tests/components

# Run all tests
yarn test
```

#### Manual Testing

Follow [`docs/runbooks/side-by-side.md`](./runbooks/side-by-side.md):

1. Load both apps
2. Test your feature in both
3. Compare visually (screenshots)
4. Compare functionally (interactions)
5. Test all fixtures
6. Test edge cases

#### Visual Comparison

```bash
# Take screenshots at breakpoints
# 320px, 768px, 1280px

# Use browser dev tools:
# - Responsive Design Mode
# - Device Pixel Ratio: 1x and 2x
# - Rulers for pixel measurements
```

Acceptance criteria:
- **Visual:** ≤2px difference
- **Functional:** Identical behavior
- **Performance:** Equal or better

### Step 6: Document Findings

If you discover parity issues:

```markdown
## Parity Delta Report

**Feature:** Arrow Drawing
**Severity:** Minor

**Legacy Behavior:**
- Arrows persist until manually cleared
- Right-click drag creates arrow
- Maximum 10 arrows allowed

**Next.js Behavior:**
- Arrows clear on board click (bug)
- No limit on arrow count

**Action:** Fix Next.js to match legacy
```

### Step 7: Submit PR

```bash
# Create feature branch
git checkout -b feat/arrow-drawing-parity

# Commit changes
git add components/ArrowOverlay.tsx
git commit -m "feat: implement arrow drawing parity"

# Push and create PR
git push origin feat/arrow-drawing-parity
```

PR description should include:
- **Workstream:** Which of the 14 workstreams
- **Fixtures Tested:** List FEN/PGN files tested
- **Parity Status:** Visual/functional/performance results
- **Screenshots:** Before/after, legacy vs Next.js
- **Breaking Changes:** None expected for Phase X

## Avoiding Merge Conflicts

### File-Level Separation

Work on different files from other contributors:

**Good:**
- Alice: `components/ArrowOverlay.tsx`
- Bob: `components/EvaluationBar.tsx`
- Carol: `tests/parity/fenpgn.roundtrip.test.ts`

**Bad:**
- Alice: `components/Board.tsx` (lines 1-50)
- Bob: `components/Board.tsx` (lines 51-100)
- Carol: `components/Board.tsx` (lines 101-150)

### Fixture-Level Separation

Add new fixtures without modifying existing ones:

```bash
# Alice adds:
docs/fixtures/fen/edge-new-case-1.fen

# Bob adds:
docs/fixtures/fen/edge-new-case-2.fen

# Carol adds:
docs/fixtures/pgn/standard-new-game.pgn
```

No conflicts!

### Test-Level Separation

Each feature gets its own test file:

```
tests/
├── parity/
│   ├── fenpgn.roundtrip.test.ts      # FEN/PGN I/O
│   ├── board.visual.test.tsx         # Visual snapshots
│   └── arrow.drawing.test.tsx        # Arrow feature (new)
├── components/
│   ├── ArrowOverlay.test.tsx         # Arrow component tests
│   └── EvaluationBar.test.tsx        # Eval bar tests
```

### Type-Level Separation

Shared types in dedicated files:

```typescript
// components/BoardOverlay.types.ts - TYPE DEFINITIONS ONLY
export interface Arrow { ... }
export interface SquareHighlight { ... }

// components/ArrowOverlay.tsx - IMPLEMENTATION ONLY
import { Arrow } from './BoardOverlay.types';
```

Multiple developers can add types to `.types.ts` files with minimal conflicts.

## Running Tests Locally

```bash
# Run all tests
yarn test

# Run specific test file
yarn test tests/parity/fenpgn.roundtrip.test.ts

# Run tests in watch mode
yarn test:watch

# Run with coverage
yarn test:coverage

# Run Next.js linter
yarn next:lint

# Format code
yarn format
```

## Common Patterns

### Pattern 1: Component Stub → Implementation

```typescript
// Step 1: Create stub with props
export interface MyComponentProps {
  data: string;
}

export default function MyComponent(_props: MyComponentProps) {
  // TODO(Phase X): Implement
  return null;
}

// Step 2: Implement rendering
export default function MyComponent(props: MyComponentProps) {
  const { data } = props;
  return <div>{data}</div>;
}

// Step 3: Wire into app (behind feature flag if needed)
if (process.env.NEXT_PUBLIC_PHASE_X) {
  <MyComponent data="test" />
}
```

### Pattern 2: Fixture → Test → Implementation

```typescript
// 1. Add fixture
// docs/fixtures/fen/new-case.fen

// 2. Add test (skipped)
describe.skip('New feature', () => {
  it.todo('handles new case');
});

// 3. Implement feature

// 4. Enable test
describe('New feature', () => {
  it('handles new case', () => {
    // Test implementation
  });
});
```

### Pattern 3: Legacy Study → Type Definition → Implementation

```typescript
// 1. Study legacy
// src/board.ts - understand how arrows work

// 2. Define types
// components/BoardOverlay.types.ts
export interface Arrow { from: string; to: string; }

// 3. Implement component
// components/ArrowOverlay.tsx
import { Arrow } from './BoardOverlay.types';
export default function ArrowOverlay(props: { arrows: Arrow[] }) { ... }

// 4. Test parity
// tests/components/ArrowOverlay.test.tsx
```

## Troubleshooting

### Tests Failing

```bash
# Check if you're using correct Node version
nvm use

# Ensure dependencies installed
yarn

# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn

# Ensure Stockfish vendored
yarn vendor:stockfish
```

### Build Failing

```bash
# Check for TypeScript errors
yarn next:build

# Check for lint errors
yarn next:lint

# Format code
yarn format
```

### Parity Not Matching

1. **Visual difference:** Measure with browser rulers, ensure ≤2px tolerance
2. **Functional difference:** Check legacy logic carefully, might be subtle
3. **Performance difference:** Profile both apps, compare metrics

## Getting Help

- **Documentation questions:** Comment on this file via PR
- **Parity questions:** Comment on [Issue #40](https://github.com/purrfectsoft/purrfect-chess/issues/40)
- **General questions:** Comment on [Issue #31](https://github.com/purrfectsoft/purrfect-chess/issues/31)
- **Code questions:** Open discussion in PR

## Success Checklist

Before submitting PR:

- [ ] Implemented feature in Next.js app
- [ ] Tested all relevant fixtures
- [ ] Ran side-by-side validation (see runbook)
- [ ] Visual parity: ≤2px difference
- [ ] Functional parity: identical behavior
- [ ] Performance parity: equal or better
- [ ] Tests added (or TODOs documented)
- [ ] Tests passing (`yarn test`)
- [ ] Linter passing (`yarn next:lint`)
- [ ] Code formatted (`yarn format`)
- [ ] Screenshots captured (if visual changes)
- [ ] PR description complete
- [ ] Linked to Issue #40

---

**Last Updated:** 2025-11-04  
**Maintainers:** Purrfect Chess Team
