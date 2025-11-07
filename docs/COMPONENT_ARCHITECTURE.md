# Component Architecture Documentation

This document describes the refactored component architecture implemented to address layout stability issues and improve maintainability.

## Overview

The monolithic `app/page.tsx` (previously 703 lines) has been refactored into a modular architecture with:

- **Layout components** for structural consistency
- **Feature components** for logical separation
- **Constants** for centralized styling and dimensions

This refactoring reduces the main page component to 175 lines (75% reduction) while maintaining full functional parity.

## Component Structure

### Layout Components (`components/layout/`)

Reusable layout components that provide consistent structure across the application:

#### MainLayout

- **Purpose**: Root layout wrapper with consistent max-width and spacing
- **Usage**: Wraps all page content
- **Key Features**:
  - 1260px max container width
  - Centered alignment
  - Consistent background color

#### GameLayout

- **Purpose**: Three-column responsive layout for the chess game
- **Layout**:
  - Left Panel: White player controls (320px fixed on xl screens)
  - Center Panel: Chess board and game controls (flexible)
  - Right Panel: Black player controls (320px fixed on xl screens)
- **Key Features**:
  - Fixed panel widths prevent layout shift (fixes critical bug)
  - `flex-shrink-0` prevents panel compression
  - Responsive: stacks vertically on mobile

#### ControlPanel

- **Purpose**: Reusable panel container with consistent styling
- **Usage**: Used for both White and Black control panels
- **Key Features**:
  - Fixed 320px width (min and max)
  - Consistent background, shadows, borders
  - Title header with separator

### Feature Components (`components/features/`)

Logical groupings of related functionality:

#### PlayerControls

- **Purpose**: Player-specific controls (White or Black)
- **Conditional Features**:
  - **White**: Time presets, custom time controls
  - **Black**: Move history, PGN/FEN controls
- **Common Features**:
  - Player clock
  - Appearance controls (pieces and squares)
  - Reset button

#### BoardSection

- **Purpose**: Central game area containing all board-related elements
- **Features**:
  - Chess board with engine overlays
  - Evaluation bar (conditionally visible)
  - Game controls (flip, reset, engine toggles, review)
  - Match card with game info
  - Engine panel (conditionally visible)
  - Easter egg trigger

## Layout Constants (`lib/layout-constants.ts`)

Centralized values prevent "magic numbers" throughout the codebase:

```typescript
export const LAYOUT = {
  PANEL_WIDTH: 320,           // Fixed panel width
  BOARD_MAX_SIZE: 600,        // Max board size
  GAP: 20,                    // Section gaps
  MAX_CONTAINER_WIDTH: 1260,  // App container max width
  BREAKPOINT_XL: 1280,        // XL breakpoint
} as const;

export const COLORS = {
  background: { ... },
  border: { ... },
  text: { ... },
  gradient: { ... },
  shadow: { ... },
} as const;
```

## Critical Bug Fix: Layout Shift

### Problem

Before refactoring:

- **Before first move**: Board X: 313px, Right Panel: 273px
- **After first move**: Board X: 305.5px (shifted LEFT by 7.5px), Right Panel: 288px (+15px)
- **Cause**: Unconstrained flex containers allowed content-based width changes

### Solution

After refactoring:

- Fixed panel widths: 320px (min and max)
- `flex-shrink-0` on panels prevents compression
- Centralized constants ensure consistency
- Layout tests verify stability

## File Organization

```
components/
├── layout/
│   ├── MainLayout.tsx
│   ├── GameLayout.tsx
│   ├── ControlPanel.tsx
│   └── index.ts
├── features/
│   ├── PlayerControls.tsx
│   ├── BoardSection.tsx
│   └── index.ts
└── (existing components)
    ├── Board.tsx
    ├── Clock.tsx
    ├── MoveHistory.tsx
    └── ...

lib/
├── layout-constants.ts
└── (existing utilities)

app/
└── page.tsx (refactored from 703 → 175 lines)

e2e/
└── layout-stability.spec.ts (Playwright tests)
```

## Testing

### Unit Tests

All existing tests pass (185 tests):

```bash
yarn test
```

### E2E Tests (Playwright)

Layout stability tests verify:

- Board position remains stable after moves
- Panel widths stay at 320px
- No layout shift across multiple moves
- Eval bar toggle doesn't affect layout
- Responsive layout works on mobile

```bash
yarn test:e2e          # Run Playwright tests
yarn test:e2e:ui       # Run with UI
yarn test:e2e:headed   # Run in headed mode
```

## Benefits

### Developer Experience

- **Faster debugging**: Components are isolated and testable
- **Easier maintenance**: Changes localized to specific components
- **Better onboarding**: Clear hierarchy and responsibilities
- **Safer refactoring**: Layout tests catch regressions

### Code Quality

- **75% reduction** in main page component size (703 → 175 lines)
- **Separation of concerns**: Layout, features, presentation
- **No magic numbers**: Centralized constants
- **Type safety**: TypeScript interfaces for all components

### User Experience

- **No layout shifts**: Fixed widths prevent content-based layout changes
- **Consistent feel**: Uniform panel sizing across screens
- **Smooth interactions**: Predictable board position

## Migration Notes

The refactoring maintains 100% functional parity with the previous implementation:

- All features work identically
- No visual changes (except fixing the layout shift bug)
- All tests pass
- Build succeeds

## References

- [ARCHITECTURE_REFACTORING_PLAN.md](../docs/ARCHITECTURE_REFACTORING_PLAN.md) - Comprehensive refactoring plan
- [E2E Tests](../e2e/layout-stability.spec.ts) - Layout stability tests
- [Layout Constants](../lib/layout-constants.ts) - Centralized values
