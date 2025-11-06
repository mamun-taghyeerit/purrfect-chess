# Copilot Instructions for purrfect-chess

## Project Overview

Purrfect Chess is a cat-themed chess board web application with local Stockfish engine integration, appearance customization, time controls, and a hidden "gmmamun" engine analysis panel. This is a toy project within the Purrfect Universe.

## Technology Stack

- **Frontend Framework**: Next.js 14+ with React 18+ (migrating from Vanilla JavaScript)
- **Build Tool**: Vite 5.x (legacy), Next.js (current)
- **State Management**: MobX 6.x + MobX-State-Tree 7.x + mobx-react-lite 4.x + mst-persistent-store (with localforage)
- **Styling**: Tailwind CSS 3.x with PostCSS
- **Chess Logic**: chess.js 1.x
- **Chess Engine**: Stockfish 17.1 (auto-vendored from npm)
- **Package Manager**: Yarn Classic (v1.x)
- **Node Version**: See `.nvmrc` for the required version

## State Management with MobX

This project uses **MobX + MobX-State-Tree (MST)** for state management with persistent storage.

### Stack Components

- **mobx**: Core reactivity system
- **mobx-state-tree**: Type-safe state tree with runtime validation
- **mobx-react-lite**: Lightweight React bindings (observer HOC)
- **mst-persistent-store**: Persistence layer with localStorage/localforage
- **localforage**: Browser storage abstraction (required peer dependency)

### Architecture

```
stores/
├── root-store.ts        # MST model definitions (game, ui, settings)
└── store-setup.ts       # Persistent store factory with provider/hook

hooks/
└── useGameTimer.ts      # Timer management hook

components/
└── Provider.tsx         # Root store provider wrapper

app/
└── layout.tsx           # Provider wired in root layout
```

### Store Structure

The root store has four slices:

1. **game**: Chess game state (position, history, time controls, etc.) - **PERSISTED**
2. **ui**: Transient UI state (panel visibility, board flip, display modes) - **NOT PERSISTED**
3. **settings**: User preferences (default time controls, engine depth) - **PERSISTED**
4. **engine**: Engine analysis state (analysis lines, depth, status) - **NOT PERSISTED**

### Key Patterns and Best Practices

#### ⚠️ CRITICAL: Never Create Isolated Hook Instances with State

**NEVER** call stateful hooks (hooks with `useState`, `useRef`, etc.) in multiple components if they need to share state. Each hook invocation creates a NEW isolated instance.

```tsx
// ❌ WRONG: Each component gets its own isolated engine state
function EnginePanel() {
  const { analysis } = useEngine(); // Instance 1
  return <div>{analysis.length} lines</div>;
}

function Board() {
  const { analysis } = useEngine(); // Instance 2 - ISOLATED!
  return <div>{/* Won't see EnginePanel's analysis! */}</div>;
}

// ✅ CORRECT: Share state via root store
function EnginePanel() {
  const store = useRootStore();
  const engine = store.engine; // Shared global state
  useEngine(); // Initialize worker (hook manages lifecycle)
  return <div>{engine.analysis.length} lines</div>;
}

function Board() {
  const store = useRootStore();
  const engine = store.engine; // Same shared state!
  return <div>{engine.engineHighlights.map(...)}</div>;
}
```

**Rule of Thumb:**

- Stateful hooks should be called in ONE place (or use global store)
- Pass data down via props OR access shared store
- Use MobX store slices for cross-component state sharing

#### ✅ DO: Use useRootStore Directly

Always use `useRootStore()` from `@/stores/store-setup` to access the store. Access store slices directly:

```tsx
import { observer } from 'mobx-react-lite';
import { useRootStore } from '@/stores/store-setup';

const Home = observer(() => {
  const store = useRootStore();
  const game = store.game; // Access game slice
  const ui = store.ui; // Access UI slice

  return (
    <div>
      <p>Turn: {game.turn}</p>
      <button onClick={ui.toggleBoardFlip}>Flip</button>
    </div>
  );
});
```

#### ✅ DO: Late Destructuring for Reactivity

MobX tracks property access for reactivity. Keep store references and access properties in JSX:

```tsx
// ✅ GOOD: Reactivity works - access properties in JSX
const Home = observer(() => {
  const store = useRootStore();
  const game = store.game;

  return (
    <div>
      <p>Turn: {game.turn}</p>
      <p>FEN: {game.fen}</p>
    </div>
  );
});

// ❌ BAD: Reactivity broken - destructured too early
const Home = observer(() => {
  const store = useRootStore();
  const { turn, fen } = store.game; // ❌ Not reactive!

  return <div>Turn: {turn}</div>; // Won't update
});
```

#### ✅ DO: Use observer() Wrapper

Always wrap components that access MobX stores with `observer()`:

```tsx
import { observer } from 'mobx-react-lite';
import { useRootStore } from '@/stores/store-setup';

const MyComponent = observer(() => {
  const store = useRootStore();
  const game = store.game;
  return <div>{game.fen}</div>;
});

export default MyComponent;
```

#### ✅ DO: Prefer observer() Over React.memo()

MobX's `observer()` provides better performance optimization than `React.memo()` because it tracks exact property access:

```tsx
// ✅ GOOD: observer tracks which properties are used
const Clock = observer(() => {
  const store = useRootStore();
  const game = store.game;
  return <div>{game.whiteTime}</div>;
  // Only re-renders when whiteTime changes
});

// ❌ LESS OPTIMAL: React.memo requires manual prop comparison
const Clock = React.memo(
  ({ whiteTime }) => {
    return <div>{whiteTime}</div>;
  },
  (prev, next) => prev.whiteTime === next.whiteTime
);
```

#### ✅ DO: Access Store Slices Directly

Access store slices directly from `useRootStore()` - don't create wrapper hooks:

```tsx
// ✅ GOOD: Direct access to store slices
const MyComponent = observer(() => {
  const store = useRootStore();
  const ui = store.ui;
  const game = store.game;

  return (
    <div>
      <p>Flipped: {ui.isBoardFlipped}</p>
      <p>Turn: {game.turn}</p>
    </div>
  );
});

// ❌ BAD: Creating unnecessary wrapper hooks
export function useUIStore() {
  const store = useRootStore();
  return store.ui; // Unnecessary indirection
}
```

### Persistence Configuration

The store uses `mst-persistent-store` with a disallow list to control what gets persisted:

```typescript
// In stores/store-setup.ts
createPersistentStore(
  RootStoreModel,
  defaultStorage, // localforage for web
  initialSnapshot,
  {
    // Disallow list: UI state resets to defaults on hydration
    ui: {
      isEnginePanelVisible: false,
      isEvalBarVisible: false,
      isBoardFlipped: false,
      engineDisplayMode: 'both' as const,
    },
  },
  {
    storageKey: 'purrfect-chess-store',
    onHydrate(storeInstance) {
      storeInstance.hydrateStore();
      // Expose in dev for debugging
      if (process.env.NODE_ENV === 'development') {
        window.__rootStoreInstance = storeInstance;
      }
    },
  }
);
```

### Common Gotchas and Solutions

#### ❌ Gotcha 1: Early Destructuring Breaks Reactivity

**Problem:**

```tsx
const store = useRootStore();
const game = store.game;
const { turn, check } = game; // Destructured too early
return <div>{turn}</div>; // Won't update!
```

**Solution:**

```tsx
const store = useRootStore();
const game = store.game;
return <div>{game.turn}</div>; // Access in JSX
```

#### ❌ Gotcha 2: Forgetting observer() Wrapper

**Problem:**

```tsx
// Component doesn't re-render on store changes
function MyComponent() {
  const store = useRootStore();
  const game = store.game;
  return <div>{game.fen}</div>;
}
```

**Solution:**

```tsx
const MyComponent = observer(() => {
  const store = useRootStore();
  const game = store.game;
  return <div>{game.fen}</div>;
});
```

#### ❌ Gotcha 3: MST Enumeration Type Mismatch

**Problem:**

```tsx
// MST enumeration returns string, not union type
const UIStateModel = types.model({
  mode: types.enumeration(['a', 'b', 'c']),
});

// Type error: string not assignable to 'a' | 'b' | 'c'
<Component mode={store.mode} />;
```

**Solution:**

```tsx
// Add a view with explicit type cast
const UIStateModel = types
  .model({
    mode: types.enumeration(['a', 'b', 'c']),
  })
  .views((self) => ({
    get modeValue(): 'a' | 'b' | 'c' {
      return self.mode as 'a' | 'b' | 'c';
    },
  }));

// Use the view
<Component mode={store.modeValue} />;
```

#### ❌ Gotcha 4: Missing Provider Wrapper

**Problem:**

```tsx
// Tests fail with "useRootStore must be used within RootStoreProvider"
```

**Solution:**

```tsx
import { RootStoreProvider } from '@/stores/store-setup';

// Wrap test components
render(
  <RootStoreProvider>
    <MyComponent />
  </RootStoreProvider>
);
```

#### ❌ Gotcha 5: Volatile State Not Serialized

**Problem:**

```tsx
// Chess.js instance disappears on hydration
const GameModel = types.model({
  fen: types.string,
  // ❌ This won't work - Chess instance isn't serializable
  chess: types.frozen<Chess>(),
});
```

**Solution:**

```tsx
const GameModel = types
  .model({
    fen: types.string,
  })
  .volatile(() => ({
    // ✅ Volatile state: not persisted, recreated on hydration
    chessInstance: new Chess(),
  }))
  .actions((self) => ({
    afterCreate() {
      // Restore state from FEN
      if (self.fen) {
        self.chessInstance.load(self.fen);
      }
    },
  }));
```

### Testing with MobX Store

When writing tests, wrap components with the provider:

```tsx
import { RootStoreProvider } from '@/stores/store-setup';
import { render } from '@testing-library/react';

function renderWithStore(component: React.ReactElement) {
  return render(<RootStoreProvider>{component}</RootStoreProvider>);
}

test('component renders', () => {
  renderWithStore(<MyComponent />);
  // assertions...
});
```

### Debugging

In development mode, the root store is exposed on `window` for debugging:

```javascript
// In browser console
window.__rootStoreInstance.game.fen;
window.__rootStoreInstance.ui.toggleBoardFlip();
```

### Migration from useState/useReducer

When migrating React state to MobX store:

1. Identify state category: game logic, transient UI, or persistent settings
2. Add state to appropriate store slice in `stores/root-store.ts`
3. Add actions for state mutations
4. Update hooks in `hooks/useStores.ts` to expose store reference
5. Update components to use `observer()` and access `store.property` in JSX
6. Remove old `useState` / `useReducer` calls
7. Test reactivity by verifying UI updates on state changes

### Resources

- [MobX Documentation](https://mobx.js.org/)
- [MobX-State-Tree Documentation](https://mobx-state-tree.js.org/)
- [mobx-react-lite Documentation](https://mobx-react-lite.vercel.app/)
- [mst-persistent-store GitHub](https://github.com/kuasha420/mst-persistent-store)
- [Reference Implementation: bookcover-craft](https://github.com/purrfectsoft/bookcover-craft)

## Automation and Smart Thinking

### Philosophy: Automate, Don't Manually Maintain

This project follows modern automation principles with a focus on **purrfection** - collaborative excellence between human and AI, not perfection:

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

4. **Purrfect collaboration**: We aim for humane excellence through smart automation
   - Humans design the automation, AI executes it consistently
   - Feline-inspired approach: let the machines do the repetitive work while humans focus on creative solutions
   - Intelligent algorithms handle tedious tasks, humans handle strategic decisions

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

**ALWAYS look in package README or GitHub when using a complex library:**

- Before using a library, consult its README, documentation, or GitHub repository
- This reduces guesswork and ensures correct usage patterns
- Especially important for libraries with non-obvious APIs (e.g., chess.js, Stockfish, React libraries)
- Example: Check `node_modules/chess.js/README.md` or https://github.com/jhlywa/chess.js before implementing move logic

**NEVER:**

- Manually copy files from node_modules to public/
- Commit auto-generated files that can be regenerated from dependencies
- Create manual processes when automation is possible
- Guess at library APIs when documentation is readily available

## Project Structure

```
.
├── .github/                 # GitHub configuration
├── stores/                  # MobX-State-Tree stores
│   ├── root-store.ts       # MST model definitions
│   └── store-setup.ts      # Persistent store provider/hook factory
├── hooks/                   # React hooks
│   ├── useStores.ts        # Store access hooks
│   ├── useGame.ts          # Legacy game hook (deprecated)
│   ├── useEngine.ts        # Engine integration hook
│   └── ...                 # Other hooks
├── components/              # React components
│   ├── Provider.tsx        # Root store provider
│   ├── Board.tsx           # Chess board component
│   └── ...                 # Other components
├── app/                     # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── public/
│   ├── assets/             # Piece and square PNGs (CC BY 4.0)
│   └── libs/               # Stockfish binaries (auto-vendored)
├── src/                     # Legacy vanilla JS code (deprecated)
│   ├── board.js            # Legacy board rendering
│   ├── engine.js           # Legacy Stockfish integration
│   ├── game.js             # Legacy game state
│   └── ...                 # Other legacy files
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── yarn.lock               # Yarn lockfile
```

**Note:** The `src/` directory contains legacy vanilla JavaScript code from the original implementation. New development should use the Next.js + React + MobX architecture in `app/`, `components/`, `hooks/`, and `stores/`.

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
2. **Strive for purrfection**: Aim for collaborative excellence through smart automation, not manual perfection
3. **Maintain vanilla JS** (legacy) / **Use React + Next.js** (current): Follow the project's current architecture
4. **ES modules**: Use modern ES6+ module syntax (`import`/`export`)
5. **TypeScript for Next.js**: Use TypeScript in the Next.js app, plain JavaScript in legacy code
6. **Tailwind-first**: Use Tailwind utility classes for styling, avoid custom CSS unless necessary
7. **Feline wisdom**: Like a cat, be lazy where it counts - automate repetitive tasks, focus energy on what matters

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

### Debugging and State Management ⚠️ CRITICAL

**NEVER assume code is correct just by reading it. Always verify with actual testing and debug logging.**

When features aren't working as expected:

1. **Add Debug Logging FIRST**
   - Use `console.log()` to verify state values at key points
   - Log props being passed to components
   - Log hook return values
   - Example: `console.log('[Component] state:', state, 'props:', props)`

2. **Check for State Isolation Issues**
   - **CRITICAL**: In React, each component that calls a custom hook gets its OWN instance
   - Example: If `useGame()` is called in 3 components, there are 3 separate game instances
   - **Solution**: Share state via props or context, don't call stateful hooks in multiple places
   - **Rule**: Hooks with `useState` should typically be called in ONE parent component, then passed down

3. **Verify Data Flow**
   - Check that parent state updates trigger child re-renders
   - Verify props are being passed correctly
   - Ensure callbacks are updating the right state

4. **Use Browser DevTools**
   - React DevTools to inspect component props and state
   - Network tab to verify API calls
   - Console to see error messages and logs

5. **Test Don't Assume**
   - Run the app and manually test the feature
   - Use Playwright for automated visual testing when appropriate
   - Take screenshots to verify UI changes
   - **NEVER** say "the code looks correct" without actually running it

**Example of Critical Mistake to Avoid:**

```typescript
// ❌ WRONG: Multiple components creating isolated state
function ParentComponent() {
  const gameState = useGame(); // Instance 1
  return <ChildComponent />;
}

function ChildComponent() {
  const gameState = useGame(); // Instance 2 - ISOLATED from parent!
  // Changes here won't reflect in parent
}

// ✅ CORRECT: Single source of truth
function ParentComponent() {
  const gameState = useGame(); // Single instance
  return <ChildComponent gameState={gameState} />;
}

function ChildComponent({ gameState }) {
  // Uses shared state from parent
}
```

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
- **Goal**: Achieve purrfection through human-AI collaboration - smart automation, not manual perfection
- **Constraint**: Keep the project simple and maintainable as a toy project
- **Constraint**: Maintain offline-first capability (no external API dependencies)
- **Constraint**: Preserve the hidden "gmmamun" Easter egg feature
- **Philosophy**: Like a cat, be efficient - automate the tedious, focus on the creative
