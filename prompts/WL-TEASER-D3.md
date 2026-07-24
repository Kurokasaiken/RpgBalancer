# WL-TEASER-D3 — Hero, drag & astrolabe

## Context
Phase D3 of Wanderlust Triumph Steam Concept Slice (WL-TEASER-001). Implements hero, drag overlay, astrolabe scene, and outcome card.

## Objectives
- Create TeaserHeroSheet component
- Create TeaserDragOverlay component
- Create TeaserAstrolabeScene component
- Create TeaserOutcomeCard component
- Verify hero, drag, and astrolabe

## Scope

### Files to Create
- `src/ui/teaser/TeaserHeroSheet.tsx` — Hero sheet component
- `src/ui/teaser/TeaserDragOverlay.tsx` — Drag overlay component
- `src/ui/teaser/TeaserAstrolabeScene.tsx` — Astrolabe scene component
- `src/ui/teaser/TeaserOutcomeCard.tsx` — Outcome card component

### Files to Modify
- (None — standalone phase)

### Out of Scope
- Consequence, legacy, outro (deferred to D4)

## Guardrails

### Invariants
- **@trailer-only exemption**: No PersistenceService, no real engine, all mocked
- **Reuse existing components**: Reuse existing components with mocked props only
- **No standalone CSS**: Skin tokens only for component styling

### Constraints
- This is trailer-only code, no real gameplay integration
- 55s deterministic sequence, no random physics
- Reuse existing components with mocked props only

## Implementation Plan

### Step 1: Create TeaserHeroSheet
Create `TeaserHeroSheet.tsx` with:
- Hero sheet display
- Mocked props for hero component
- Config-driven hero parameters
- Skin token styling (no standalone CSS)

### Step 2: Create TeaserDragOverlay
Create `TeaserDragOverlay.tsx` with:
- Drag overlay display
- Mocked props for drag component
- Config-driven drag parameters
- Skin token styling (no standalone CSS)

### Step 3: Create TeaserAstrolabeScene
Create `TeaserAstrolabeScene.tsx` with:
- Astrolabe scene display
- Mocked props for astrolabe component
- Config-driven astrolabe parameters
- Skin token styling (no standalone CSS)

### Step 4: Create TeaserOutcomeCard
Create `TeaserOutcomeCard.tsx` with:
- Outcome card display
- Mocked props for outcome component
- Config-driven outcome parameters
- Skin token styling (no standalone CSS)

### Step 5: Verify Integration
- Ensure hero, drag, and astrolabe render correctly
- Test with realistic teaser scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `WL-TEASER-D2` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/teaser` (120s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/teaser` (120s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-teaser-d3-<date>.log` with:
- Lint results
- Build check output
- Kanban lint output
- Hero/drag/astrolabe summary

## Dependencies
- **blocked_by**: WL-TEASER-D2 (Scene composites)

## Execution Hint
**atomic** — This task is trailer-only code with @trailer-only exemption (no PersistenceService, no real engine, all mocked).

## Notes
- @trailer-only exemption applies per handoff notes
- Reuse existing components with mocked props only
- 55s deterministic sequence, no random physics
- Skin tokens are mandatory, no standalone CSS
