# purrfect-chess

Cat-themed chess board with local Stockfish, appearance sliders, time controls, and a hidden "gmmamun" engine panel. Part of the Purrfect Universe toy projects.

Built with **TypeScript** for improved type safety and developer experience.

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
