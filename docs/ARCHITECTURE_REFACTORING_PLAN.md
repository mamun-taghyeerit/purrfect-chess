# Architecture Refactoring Plan for Purrfect Chess

## Executive Summary

This document outlines a comprehensive plan for refactoring the Purrfect Chess application architecture to address layout stability issues and improve maintainability. The current implementation suffers from a **critical layout shift bug** where the board moves left by ~7.5px after the first move, caused by the right panel (Black Controls) expanding from 273px to 288px. This is a symptom of deeper architectural issues in the monolithic `app/page.tsx` component.

## Critical Issue Diagnosed

### Layout Shift Root Cause

**Measured Impact:**
- **Before first move**: Board X: 313px, Right Panel: 273px wide
- **After first move**: Board X: 305.5px (shifted LEFT by 7.5px), Right Panel: 288px wide (+15px)
- **Effect**: Entire layout shifts left because the flex container rebalances when right panel expands

**Why It Happens:**
1. The right panel (Black Controls) contains the Move History component
2. When the first move is made, Move History changes from "No moves yet" to displaying "1. e4"
3. The Move History component's content is not properly constrained
4. The parent panel flex container allows width growth, causing the layout shift
5. PR #101's fix (minWidth on TimeControlSelector) only addressed the Time Presets section, not the Move History section

### Why PR #101 Failed to Fix the Issue

PR #101 added `minWidth: '233px'` to the TimeControlSelector grid container, which prevented the Time Preset buttons from shrinking. However:

1. **Wrong target**: The fix targeted the left panel (White Controls), but the problem is in the right panel (Black Controls)
2. **Incomplete solution**: Only constrained the Time Presets section, not the Move History section where the actual content change occurs
3. **Symptom treatment**: Fixed one symptom without addressing the root cause of unconstrained content in flex containers

## Current Architecture Problems

### 1. **Monolithic Page Component** (`app/page.tsx`)

**File**: `app/page.tsx` (703 lines)

**Issues:**
- **Too many responsibilities**: Game state, UI state, engine management, appearance controls, time controls, move history, PGN/FEN handling
- **Deep nesting**: 10+ levels of div nesting make layout debugging extremely difficult
- **Mixed concerns**: Business logic, presentation, and styling all intermingled
- **Difficult debugging**: Layout shifts require inspecting deeply nested flex containers
- **Poor testability**: Cannot test individual sections in isolation
- **Hard to maintain**: Changes in one section can unexpectedly affect others

**Example of problematic structure:**
```tsx
<main>
  <div> {/* Container */}
    <div> {/* Max-width wrapper */}
      <div className="flex"> {/* Flex container */}
        <div> {/* Left Panel - White Controls */}
          <div> {/* Rounded container */}
            {/* Appearance Controls */}
            {/* Time Presets */}
            {/* Custom Time */}
          </div>
        </div>
        <div> {/* Center Panel - Board */}
          {/* Board + Eval Bar */}
          {/* Game Controls */}
          {/* Match Card */}
        </div>
        <div> {/* Right Panel - Black Controls */}
          <div> {/* Rounded container */}
            {/* Appearance Controls */}
            {/* Move History - UNCONSTRAINED! */}
            {/* PGN/FEN Controls */}
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
```

### 2. **Lack of Layout Components**

**Problem**: No dedicated layout components to enforce consistent structure

**Missing abstractions:**
- `<MainLayout>` - Root layout with proper constraints
- `<GameLayout>` - Three-column game layout (White Controls | Board | Black Controls)
- `<ControlPanel>` - Reusable panel with fixed width
- `<PanelSection>` - Consistent section styling and spacing

### 3. **Inconsistent Width Constraints**

**Evidence from measurements:**
- Left Panel: 273px (sometimes)
- Right Panel: 273px → 288px (grows!)
- TimeControlSelector: `minWidth: '233px'` (PR #101 fix)
- MoveHistory: `max-w-md` (responsive, not fixed)

**Problems:**
- Mix of fixed widths, max-widths, and flex-grow
- No consistent constraint strategy
- Flex containers allow unexpected growth
- Responsive classes (`max-w-md`) conflict with fixed layout expectations

### 4. **Component Coupling**

**Examples:**
- `page.tsx` directly imports and renders 12+ components
- Components access `useRootStore()` directly (good for MobX, but creates coupling)
- No composition boundaries or prop interfaces

### 5. **Inline Styles and Tailwind Mix**

**Issues:**
- Inconsistent styling approach (mix of Tailwind classes and inline styles)
- Hard to audit layout-affecting properties
- Difficult to establish global layout constants

## Recommended Architecture

### Phase 1: Extract Layout Components (Immediate)

**Goal**: Create reusable layout components with fixed constraints

#### 1.1 Create `components/layout/MainLayout.tsx`
```tsx
interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center p-5" 
          style={{ backgroundColor: '#333' }}>
      <div className="z-10 w-full" style={{ maxWidth: '1260px', margin: '0 auto' }}>
        {children}
      </div>
    </main>
  );
}
```

#### 1.2 Create `components/layout/GameLayout.tsx`
```tsx
interface GameLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export function GameLayout({ leftPanel, centerPanel, rightPanel }: GameLayoutProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-5 items-start justify-center">
      {/* Fixed width panels prevent layout shift */}
      <div className="xl:w-[320px] xl:flex-shrink-0 w-full">
        {leftPanel}
      </div>
      <div className="flex flex-col items-center gap-6 xl:flex-initial">
        {centerPanel}
      </div>
      <div className="xl:w-[320px] xl:flex-shrink-0 w-full">
        {rightPanel}
      </div}
    </div>
  );
}
```

**Key fixes:**
- Use `xl:w-[320px]` for exact width
- Add `xl:flex-shrink-0` to prevent shrinking
- Remove `xl:flex-1` which allows growth

#### 1.3 Create `components/layout/ControlPanel.tsx`
```tsx
interface ControlPanelProps {
  title: string;
  children: React.ReactNode;
}

export function ControlPanel({ title, children }: ControlPanelProps) {
  return (
    <div 
      className="rounded-xl p-5 w-full"
      style={{
        backgroundColor: '#444',
        boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.35)',
        minWidth: '320px',  // Prevent shrinking
        maxWidth: '320px',  // Prevent growing
      }}
    >
      <h2 
        className="text-2xl font-semibold text-center mb-5 pb-2.5"
        style={{ 
          borderBottom: '2px solid #555',
          color: '#f0f0f0'
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
```

### Phase 2: Extract Feature Components (Short-term)

#### 2.1 Player Controls Components

**Create**: `components/features/PlayerControls.tsx`
```tsx
interface PlayerControlsProps {
  player: 'w' | 'b';
  showTimePresets?: boolean;  // Only for white
  showMoveHistory?: boolean;  // Only for black
}
```

**Responsibilities:**
- Clock display
- Appearance controls
- Conditional sections (time presets OR move history)
- PGN/FEN controls (for black only)

#### 2.2 Board Section Components

**Create**: `components/features/BoardSection.tsx`
```tsx
interface BoardSectionProps {
  // ... props for board, controls, match card
}
```

**Responsibilities:**
- Board with eval bar
- Game controls
- Match card
- Engine panel (conditional)

### Phase 3: Create Presentational Components (Medium-term)

#### 3.1 Separate Presentational from Container Components

**Pattern**: Container components manage state, presentational components render UI

**Examples:**
- `TimePresetSelector` (container) → `TimePresetButtons` (presentational)
- `MoveHistory` (container) → `MoveHistoryList` (presentational)
- `AppearanceControls` (container) → `AppearanceSliders` (presentational)

#### 3.2 Benefits
- Easier testing (presentational components are pure)
- Better reusability
- Clearer separation of concerns
- Simpler prop interfaces

### Phase 4: Establish Layout Constants (Medium-term)

**Create**: `lib/layout-constants.ts`
```typescript
export const LAYOUT = {
  PANEL_WIDTH: 320,
  BOARD_SIZE: 600,
  GAP: 20,
  MAX_CONTAINER_WIDTH: 1260,
  BREAKPOINTS: {
    XL: 1280,
  },
} as const;
```

**Usage**: Reference constants instead of magic numbers
```tsx
style={{ width: `${LAYOUT.PANEL_WIDTH}px` }}
```

### Phase 5: Implement Layout Tests (Long-term)

#### 5.1 Add Playwright Visual Regression Tests

**Create**: `tests/layout/board-stability.spec.ts`
```typescript
test('board position remains stable after first move', async ({ page }) => {
  await page.goto('/');
  
  // Measure board position before move
  const boardBefore = await page.locator('[role="application"]').boundingBox();
  
  // Make first move
  await page.click('[aria-label="e2, White pawn"]');
  await page.click('[aria-label="e4, empty, legal move"]');
  
  // Measure board position after move
  const boardAfter = await page.locator('[role="application"]').boundingBox();
  
  // Assert no horizontal shift
  expect(boardAfter.x).toBe(boardBefore.x);
  expect(boardAfter.y).toBe(boardBefore.y);
});
```

#### 5.2 Add Panel Width Tests

```typescript
test('control panels maintain fixed width', async ({ page }) => {
  await page.goto('/');
  
  const leftPanel = await page.locator('.left-panel').boundingBox();
  const rightPanel = await page.locator('.right-panel').boundingBox();
  
  // Make several moves
  // ... make moves ...
  
  const leftPanelAfter = await page.locator('.left-panel').boundingBox();
  const rightPanelAfter = await page.locator('.right-panel').boundingBox();
  
  expect(leftPanelAfter.width).toBe(leftPanel.width);
  expect(rightPanelAfter.width).toBe(rightPanel.width);
});
```

## Migration Strategy

### Approach: Incremental Refactoring

**NOT a big rewrite** - gradual extraction to minimize risk

1. **Week 1**: Create layout components, update `page.tsx` to use them
2. **Week 2**: Extract player controls into feature components
3. **Week 3**: Extract board section into feature components
4. **Week 4**: Add Playwright layout regression tests
5. **Week 5**: Refactor to presentational/container pattern
6. **Week 6**: Establish layout constants and audit all components

### Testing Strategy for Each Phase

1. **Before changes**: Document current behavior with screenshots
2. **During changes**: Visual comparison testing
3. **After changes**: Automated Playwright tests
4. **Regression prevention**: CI/CD integration of layout tests

## Immediate Fix for Layout Shift

While the full refactoring is planned, here's the immediate fix:

### Fix in `app/page.tsx`

**Change the flex container for panels:**

```tsx
// BEFORE (current - allows growth)
<div className="flex flex-col xl:flex-row gap-5 items-start justify-center">
  <div className="flex flex-col gap-5 xl:max-w-[320px] xl:flex-1 w-full">

// AFTER (fixed - prevents growth)
<div className="flex flex-col xl:flex-row gap-5 items-start justify-center">
  <div className="flex flex-col gap-5 w-full" style={{ minWidth: '320px', maxWidth: '320px' }}>
```

**Apply to BOTH left and right panels** to ensure symmetry and prevent any shift.

### Fix in `components/MoveHistory.tsx`

**Constrain the container width:**

```tsx
// BEFORE
<div className="w-full max-w-md">

// AFTER
<div className="w-full" style={{ minWidth: '273px', maxWidth: '273px' }}>
```

## Long-term Benefits

### Developer Experience
- **Faster debugging**: Layout components are isolated and testable
- **Easier maintenance**: Changes are localized to specific components
- **Better onboarding**: Clear component hierarchy and responsibilities
- **Safer refactoring**: Layout tests catch regressions immediately

### User Experience
- **No layout shifts**: Fixed widths prevent content-based layout changes
- **Consistent feel**: Uniform panel sizing across all screen sizes
- **Smooth interactions**: Predictable board position for piece movements

### Code Quality
- **Lower complexity**: Smaller, focused components
- **Higher testability**: Isolated units with clear interfaces
- **Better reusability**: Layout components work across pages
- **Easier evolution**: Add new features without touching layout logic

## Risks and Mitigations

### Risk 1: Breaking Existing Functionality
**Mitigation**: Incremental changes with extensive visual testing

### Risk 2: Responsive Layout Issues
**Mitigation**: Test across breakpoints (mobile, tablet, desktop, xl)

### Risk 3: Performance Regression
**Mitigation**: Use React.memo and MobX observer strategically

### Risk 4: Over-engineering
**Mitigation**: Start simple, add complexity only when needed

## Success Metrics

1. **Layout Stability**: 0 pixel shift in board position after any move
2. **Panel Consistency**: Left and right panels maintain 320px width
3. **Test Coverage**: >80% layout component test coverage
4. **Build Performance**: No increase in bundle size
5. **Developer Velocity**: Reduced time to implement new UI features

## Conclusion

The current monolithic `app/page.tsx` architecture creates layout stability issues and maintenance challenges. By systematically extracting layout components, feature components, and presentational components, we can:

1. **Immediately fix** the board shift bug
2. **Prevent future** layout regressions with tests
3. **Accelerate** feature development with better component structure
4. **Improve** code maintainability and developer experience

This refactoring plan provides a clear, incremental path to a more robust and maintainable architecture while fixing the critical layout shift issue.

---

**Document Version**: 1.0  
**Date**: 2025-11-06  
**Author**: Copilot Agent  
**Related Issue**: purrfectsoft/purrfect-chess - Board shifting left after first move
