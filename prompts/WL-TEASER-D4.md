# WL-TEASER-D4 — Consequence, legacy, outro

## Context
Phase D4 of Wanderlust Triumph Steam Concept Slice (WL-TEASER-001). Implements consequence overlay, legacy screen, and outro screen.

## Objectives
- Create TeaserImpactOverlay component
- Create TeaserLegacyScreen component
- Create TeaserOutroScreen component
- Verify consequence, legacy, and outro

## Scope

### Files to Create
- `src/ui/teaser/TeaserImpactOverlay.tsx` — Impact overlay component
- `src/ui/teaser/TeaserLegacyScreen.tsx` — Legacy screen component
- `src/ui/teaser/TeaserOutroScreen.tsx` — Outro screen component

### Files to Modify
- (None — standalone phase)

### Out of Scope
- Polish & controls (deferred to D5)

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

### Step 1: Create TeaserImpactOverlay
Create `TeaserImpactOverlay.tsx` with:
- Impact overlay display
- Mocked props for impact component
- Config-driven impact parameters
- Skin token styling (no standalone CSS)

### Step 2: Create TeaserLegacyScreen
Create `TeaserLegacyScreen.tsx` with:
- Legacy screen display
- Mocked props for legacy component
- Config-driven legacy parameters
- Skin token styling (no standalone CSS)

### Step 3: Create TeaserOutroScreen
Create `TeaserOutroScreen.tsx` with:
- Outro screen display
- Mocked props for outro component
- Config-driven outro parameters
- Skin token styling (no standalone CSS)

### Step 4: Verify Integration
- Ensure consequence, legacy, and outro render correctly
- Test with realistic teaser scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `WL-TEASER-D3` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/teaser` (120s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/teaser` (120s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-teaser-d4-<date>.log` with:
- Lint results
- Build check output
- Kanban lint output
- Consequence/legacy/outro summary

## Dependencies
- **blocked_by**: WL-TEASER-D3 (Hero, drag & astrolabe)

## Execution Hint
**atomic** — This task is trailer-only code with @trailer-only exemption (no PersistenceService, no real engine, all mocked).

## Notes
- @trailer-only exemption applies per handoff notes
- Reuse existing components with mocked props only
- 55s deterministic sequence, no random physics
- Skin tokens are mandatory, no standalone CSS
