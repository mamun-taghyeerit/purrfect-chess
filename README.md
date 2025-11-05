# purrfect-chess

Cat-themed chess board with local Stockfish, appearance sliders, time controls, and a hidden "gmmamun" engine panel. Part of the Purrfect Universe toy projects.

Built with **TypeScript** for improved type safety and developer experience.

## Project Status

**Phase X Complete ✅** - The Next.js migration has achieved full functional and visual parity with the legacy Vite app. All 14 workstreams validated through comprehensive testing with 27 FEN fixtures, 10 PGN fixtures, and 366 passing tests.

**Next:** Phase 4 (Testing & Cleanup) - Implement remaining features (arrow drawing, eval bar integration), improve test infrastructure, add CI/CD pipeline, and prepare for production release.

See [`docs/phase-x/phase-x-audit.md`](./docs/phase-x/phase-x-audit.md) for the complete Phase X audit report.

## 🚀 Next.js Migration

**This project is being migrated to Next.js!** See [`MIGRATION.md`](./MIGRATION.md) for details about the Next.js skeleton and incremental migration strategy (relates to [Issue #31](https://github.com/purrfectsoft/purrfect-chess/issues/31)).

### Running the Next.js App (New)

```bash
yarn next:dev   # Next.js development server (http://localhost:3000)
```

### Running the Original Vite App

```bash
yarn dev        # Vite development server (original app)
```

Both versions can coexist during the migration phase.

---

## Requirements

- **Node.js**: Version specified in `.nvmrc` (currently Node 22)
- **Yarn**: Classic (v1.22.22) - the project uses `yarn.lock` for deterministic installs

## Setup

### Agent/CI Quickstart

For GitHub Copilot Coding Agents and CI environments:

```bash
# One-liner setup (installs Node from .nvmrc, Yarn v1, deps, and vendors Stockfish)
yarn run setup || bash scripts/setup-dev-env.sh
```

This script will:

- ✅ Install/configure nvm (Node Version Manager) if not present
- ✅ Install Node.js version from `.nvmrc` (Node 22)
- ✅ Install Yarn Classic (v1.22.22) globally
- ✅ Install all project dependencies via `yarn install --frozen-lockfile`
- ✅ Vendor Stockfish binaries to `public/libs/`

After setup, run either app:

```bash
yarn dev        # Vite dev server
yarn next:dev   # Next.js dev server
```

**Available tooling:**

- `yarn lint` / `yarn lint:fix` - ESLint code quality checks
- `yarn format` / `yarn format:check` - Prettier formatting
- `yarn test` / `yarn test:watch` - Vitest test runner
- `yarn build` / `yarn next:build` - Production builds

### Manual Setup

If you already have the correct Node version and Yarn classic installed:

```bash
yarn install
yarn dev        # or yarn next:dev
```

**Note**: The `postinstall` script automatically vendors Stockfish binaries from the `stockfish` npm package to `public/libs/`.

The app uses TypeScript, Vite, Tailwind CSS, and chess.js. Stockfish is loaded from `/public/libs/stockfish.js` and `/public/libs/stockfish.wasm`. The engine binaries are vendored instead of pulled from a package registry so the worker URL remains stable across dev/production builds and because the original prototype shipped the engine locally. You **must** run a development server (the included Vite scripts are perfect). Opening the HTML from `file://` will not work because the Worker and WASM bundle cannot load directly from disk.

All piece and square PNGs live under `/public/assets/` and are licensed under CC BY 4.0 (see `LICENSE.md`).

### Hidden engine panel

Select the grey text inside the board column that reads `(Reserved for future use)` and, while it is highlighted, type `gmmamun`. The Stockfish controls will appear, letting you choose the search depth and view the top three moves.

## Project structure

```
.
├── .gitignore
├── .nvmrc
├── LICENSE.md
├── README.md
├── index.html
├── package.json
├── postcss.config.js
├── tsconfig.json          # TypeScript configuration
├── public
│   ├── assets/
│   ├── index.html
│   └── libs/
├── src
│   ├── board.ts          # Board rendering and visual updates
│   ├── engine.ts         # Stockfish worker integration
│   ├── game.ts           # Chess game state and logic
│   ├── main.ts           # Application entry point
│   ├── types.ts          # Shared TypeScript type definitions
│   ├── styles.css
│   ├── ui.ts             # UI controls and interactions
│   ├── engine/
│   │   └── uci-parser.ts
│   ├── game/
│   │   ├── move-validator.ts
│   │   ├── position-utils.ts
│   │   └── time-controls.ts
│   └── ui/
│       └── easter-egg.ts
├── tests/                # Vitest test suites
├── tailwind.config.js
├── vitest.config.ts
└── yarn.lock
```

## Development

### TypeScript

This project uses TypeScript for type safety and improved developer experience. The TypeScript configuration is optimized for gradual typing with a relaxed mode to support the migration from JavaScript.

### Linting and Formatting

```bash
yarn lint              # Check code for linting issues
yarn lint:fix          # Fix auto-fixable linting issues
yarn format            # Format all code files
yarn format:check      # Check if files are formatted correctly
```

The project uses:

- **ESLint** with Next.js rules for code quality
- **Prettier** for consistent code formatting

### Testing

```bash
yarn test              # Run all tests
yarn test:watch        # Run tests in watch mode
yarn test:coverage     # Generate coverage report
```

See [TESTING.md](./TESTING.md) for comprehensive testing guidelines.

### Building

```bash
yarn build             # Production build (Vite)
yarn preview           # Preview production build
yarn next:build        # Next.js production build
yarn next:start        # Start Next.js production server
```

## Verification

To reproduce the validation checks from the Phase X audit:

### Build Verification

```bash
# Next.js production build (should complete with zero errors)
yarn next:build

# Expected output:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Generating static pages
# First Load JS: ~168 kB (acceptable)
```

### Lint Verification

```bash
# ESLint code quality checks
yarn next:lint

# Expected warnings (non-blocking):
# - React Hook useCallback unnecessary dependency (performance optimization)
# - Next.js Image component recommendation (performance optimization)
```

### Test Verification

```bash
# Run all tests
yarn test

# Expected results:
# - 366 passing tests (parity, engine, components, hooks, integration)
# - 12 intentional TODOs (Phase 4 tasks)
# - Known failures documented in Phase X audit (see docs/phase-x/phase-x-audit.md)

# Run tests in watch mode
yarn test:watch

# Generate coverage report
yarn test:coverage
```

### Format Verification

```bash
# Check code formatting
yarn format:check

# Auto-fix formatting issues
yarn format
```

### CI/CD Status

**Current State:** Limited CI workflow exists (`.github/workflows/copilot-setup-steps.yml`) for environment setup only.

**Phase 4 Goal:** Add comprehensive CI workflow with:
- Automated build/lint/test on all PRs
- Deploy preview environments
- Status badges in README
- Automated dependency updates

See [Phase 4 tasks in NEXT_STEPS_ISSUE.md](./NEXT_STEPS_ISSUE.md#phase-4-testing--cleanup-next) for CI/CD implementation plan.

