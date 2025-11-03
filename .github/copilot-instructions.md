# Copilot Instructions for purrfect-chess

## Project Overview

Purrfect Chess is a cat-themed chess board web application with local Stockfish engine integration, appearance customization, time controls, and a hidden "gmmamun" engine analysis panel. This is a toy project within the Purrfect Universe.

## Technology Stack

- **Frontend Framework**: Vanilla JavaScript (ES modules)
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x with PostCSS
- **Chess Logic**: chess.js 1.x
- **Chess Engine**: Stockfish (vendored in `/public/libs/`)
- **Package Manager**: Yarn
- **Node Version**: See `.nvmrc` for the required version

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
yarn                        # Install dependencies
yarn dev                    # Start development server (Vite)
yarn build                  # Production build
yarn preview                # Preview production build
```

### Important Notes
- **Always use a development server**: The app cannot run from `file://` due to Worker and WASM requirements
- **Stockfish is vendored**: Engine binaries are in `/public/libs/` for stable URLs across dev/production
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
- **Stockfish binaries**: Do not modify vendored engine files in `/public/libs/`
- **Build configuration**: Changes to Vite, PostCSS, or Tailwind config should preserve existing behavior

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
- Stockfish communicates via Web Worker
- Engine analysis runs asynchronously
- Always stop engine before starting new analysis
- Handle engine messages gracefully (not all positions have evaluations)

## Dependencies and Licensing
- **chess.js**: Core chess logic library
- **Vite**: Development and build tooling
- **Tailwind CSS**: Utility-first CSS framework
- **Stockfish**: Open-source chess engine (GPL v3)
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
