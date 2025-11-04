# Copilot Instructions for purrfect-chess

## Project Overview

Purrfect Chess is a cat-themed chess board web application with local Stockfish engine integration, appearance customization, time controls, and a hidden "gmmamun" engine analysis panel. This is a toy project within the Purrfect Universe.

## Technology Stack

- **Frontend Framework**: Next.js 14+ with React 18+ (migrating from Vanilla JavaScript)
- **Build Tool**: Vite 5.x (legacy), Next.js (current)
- **Styling**: Tailwind CSS 3.x with PostCSS
- **Chess Logic**: chess.js 1.x
- **Chess Engine**: Stockfish 17.1 (auto-vendored from npm)
- **Package Manager**: Yarn Classic (v1.x)
- **Node Version**: See `.nvmrc` for the required version

## Automation and Smart Thinking

### Philosophy: Automate, Don't Manually Maintain

This project follows modern automation principles:

1. **Auto-vendoring**: Stockfish binaries are automatically copied from the `stockfish` devDependency via `scripts/vendor-stockfish.js`
   - Run manually: `yarn vendor:stockfish`
   - Runs automatically on: `yarn install` (postinstall hook) and `yarn next:build`
   - Source: `node_modules/stockfish/src/stockfish-17.1-lite-single-*.{js,wasm}`
   - Target: `public/libs/stockfish-lite-single.{js,wasm}`
   - DO NOT manually copy files - update the script configuration instead

2. **Build automation**: The build process automatically vendors dependencies before compilation
   - `yarn next:build` = `yarn vendor:stockfish` + `next build`
   - Ensures production builds always have the latest vendored files

3. **Version management**: Stockfish version is managed in package.json devDependencies
   - To upgrade: `yarn upgrade stockfish`
   - To change variants: Edit `scripts/vendor-stockfish.js` configuration

### Key Automation Scripts

- **`scripts/vendor-stockfish.js`**: ESM script that vendors Stockfish from node_modules
  - Configuration at top: `STOCKFISH_VERSION`, `VARIANT`, `VARIANT_HASH`
  - Supports multiple variants: `lite-single`, `lite`, `single`, `full`
  - Currently using: `lite-single` (~7MB, no CORS required, single-threaded WASM)
  
### When Adding Dependencies

**ALWAYS prefer automation over manual copying:**

1. Add package to `package.json` (dependencies or devDependencies as appropriate)
2. Create a vendor script if files need to be copied to `public/`
3. Add the vendor script to relevant npm scripts (`postinstall`, `build`, etc.)
4. Document the automation in this file

**NEVER:**
- Manually copy files from node_modules to public/
- Commit auto-generated files that can be regenerated from dependencies
- Create manual processes when automation is possible

## Project Structure

```
.
├── .github/                 # GitHub configuration
├── public/
│   ├── assets/             # Piece and square PNGs (CC BY 4.0)
│   ├── index.html
│   └── libs/               # Stockfish binaries (stockfish.js, stockfish.wasm)
├── src/
│   ├── board.js           # Board rendering and visual updates
│   ├── engine.js          # Stockfish worker integration
│   ├── game.js            # Chess game state and logic
│   ├── main.js            # Application entry point
│   ├── styles.css         # Global styles (Tailwind directives)
│   └── ui.js              # UI controls and interactions
├── index.html             # Main HTML entry point
├── package.json           # Project dependencies
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── yarn.lock              # Yarn lockfile
```

## Development Workflow

### Setup

```bash
nvm use                     # Use the correct Node.js version from .nvmrc
yarn                        # Install dependencies (using Yarn Classic v1.x)
yarn dev                    # Start development server (Vite)
yarn build                  # Production build
yarn preview                # Preview production build
```

### Important Notes

- **Always run `nvm use` first**: Ensure you're using the correct Node.js version specified in `.nvmrc`
- **Use Yarn Classic**: This project uses Yarn 1.x (Classic), not Yarn 2+ (Berry)
- **Merge from develop**: Always pull/merge the latest `develop` branch before starting work
- **yarn.lock commits**: Only commit `yarn.lock` changes if `package.json` or `.nvmrc` were also modified
- **Always use a development server**: The app cannot run from `file://` due to Worker and WASM requirements
- **Stockfish is auto-vendored**: Engine binaries are automatically generated in `/public/libs/` from the `stockfish` devDependency
  - **DO NOT** manually edit files in `/public/libs/stockfish-lite-single.*`
  - **DO** update `scripts/vendor-stockfish.js` if you need to change variants or versions
  - Vendored files are gitignored and regenerated on install/build
- **Hidden feature**: Type "gmmamun" while selecting the "(Reserved for future use)" text to reveal engine controls

## Coding Standards and Best Practices

### General Guidelines

1. **Keep it minimal**: This is a toy project—prefer simplicity over complexity
2. **Maintain vanilla JS**: Do not introduce frameworks like React, Vue, or Angular
3. **ES modules**: Use modern ES6+ module syntax (`import`/`export`)
4. **No TypeScript**: Project uses plain JavaScript
5. **Tailwind-first**: Use Tailwind utility classes for styling, avoid custom CSS unless necessary

### Code Style

- Use descriptive variable and function names
- Prefer `const` over `let` where possible
- Use arrow functions for callbacks
- Keep functions small and focused
- Add comments only for complex logic or non-obvious behavior

### Module Organization

- `game.js`: Pure chess logic (game state, moves, time controls)
- `board.js`: Visual board representation and rendering
- `engine.js`: Stockfish worker communication
- `ui.js`: User interface controls and DOM interactions
- `main.js`: Application initialization and state coordination

### File Modifications

- **Asset licensing**: All piece/square PNGs are CC BY 4.0 licensed—maintain attribution
- **Stockfish binaries**: Auto-generated from `stockfish` devDependency - modify `scripts/vendor-stockfish.js` to change variant/version
- **Build configuration**: Changes to Vite, PostCSS, Tailwind, or Next.js config should preserve existing behavior
- **Automation scripts**: Located in `scripts/` - use ESM format (not CommonJS) since package.json has `"type": "module"`

### Testing and Validation

- Always test changes with `yarn dev`
- Verify the hidden "gmmamun" engine panel still works
- Ensure time controls function correctly
- Test piece movement and game rules
- Check appearance sliders and customization options

## Common Tasks

### Adding New Features

1. Consider which module best fits the new functionality
2. Maintain separation of concerns (game logic vs. UI vs. rendering)
3. Test with both light and dark piece/square themes
4. Ensure mobile responsiveness (Tailwind breakpoints)

### Bug Fixes

1. Identify the affected module(s)
2. Make minimal changes to fix the issue
3. Verify fix doesn't break existing functionality
4. Test edge cases (e.g., en passant, castling, promotion)

### Styling Changes

1. Use Tailwind utilities first
2. Only add custom CSS in `src/styles.css` if Tailwind doesn't support it
3. Maintain the cat-themed aesthetic
4. Ensure sufficient color contrast for accessibility

### Engine Integration

- Stockfish 17.1 communicates via Web Worker (`workers/stockfish.worker.ts`)
- Engine binaries auto-vendored from `stockfish@17.1.0` npm package (chess.com maintained)
- Current variant: **Lite Single-threaded WASM** (~7MB, no CORS required)
  - Alternatives: `lite` (multi-threaded, requires CORS), `single` (full, ~75MB), `full` (multi-threaded, ~75MB)
  - Change variant: Edit `VARIANT` in `scripts/vendor-stockfish.js`
- Engine analysis runs asynchronously with real-time UCI protocol parsing
- Always stop engine before starting new analysis
- Handle engine messages gracefully (not all positions have evaluations)

## Dependencies and Licensing

- **chess.js**: Core chess logic library
- **Next.js**: React framework for production
- **React 18+**: UI framework
- **Vite**: Development and build tooling (legacy)
- **Tailwind CSS**: Utility-first CSS framework
- **Stockfish 17.1**: Open-source chess engine (GPL v3)
  - Source: `stockfish` npm package (chess.com maintained)
  - Automatically vendored to `/public/libs/` via build scripts
  - Variant: Lite Single-threaded WASM (no CORS, ~7MB)
- **Assets**: All images under `/public/assets/` are licensed under CC BY 4.0 (see `LICENSE.md`)

## Security and Best Practices

- No sensitive data or API keys in this project
- Stockfish runs locally in a Web Worker (no external API calls)
- All dependencies should be regularly updated for security patches
- Follow standard web security practices (CSP, XSS prevention)

## Goals and Constraints

- **Goal**: Provide a fun, cat-themed chess experience with engine analysis
- **Constraint**: Keep the project simple and maintainable as a toy project
- **Constraint**: Maintain offline-first capability (no external API dependencies)
- **Constraint**: Preserve the hidden "gmmamun" Easter egg feature
