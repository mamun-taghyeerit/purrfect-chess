# purrfect-chess

Cat-themed chess board with local Stockfish, appearance sliders, time controls, and a hidden “gmmamun” engine panel. Part of the Purrfect Universe toy projects.

## Requirements

- Node.js (see `.nvmrc` for the recommended version)
- Yarn

## Setup

```bash
yarn
yarn dev
```

The app uses Vite, Tailwind CSS, and chess.js. Stockfish is loaded from `/public/libs/stockfish.js` and `/public/libs/stockfish.wasm`. You **must** run a development server (the included Vite scripts are perfect). Opening the HTML from `file://` will not work because the Worker and WASM bundle cannot load directly from disk.

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
├── public
│   ├── assets/
│   ├── index.html
│   └── libs/
├── src
│   ├── board.js
│   ├── engine.js
│   ├── game.js
│   ├── main.js
│   ├── styles.css
│   └── ui.js
├── tailwind.config.js
└── yarn.lock
```
