# purrfect-chess

Cat-themed chess board with local Stockfish, appearance sliders, time controls, and a hidden "gmmamun" engine panel. Part of the Purrfect Universe toy projects.

Built with **TypeScript** for improved type safety and developer experience.

## Requirements

- Node.js (see `.nvmrc` for the recommended version)
- Yarn

## Setup

```bash
yarn
yarn dev
```

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

### Testing
```bash
yarn test              # Run all tests
yarn test:watch        # Run tests in watch mode
yarn test:coverage     # Generate coverage report
```

### Building
```bash
yarn build             # Production build
yarn preview           # Preview production build
```
