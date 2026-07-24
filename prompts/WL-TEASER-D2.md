# WL-TEASER-D2 — Scene composites (map, village, choice)

## Context
Phase D2 of Wanderlust Triumph Steam Concept Slice (WL-TEASER-001). Implements scene composites for map, village, and choice.

## Objectives
- Create TeaserMapScene component
- Create TeaserVillageScene component
- Create TeaserChoiceCard component
- Verify scene composites

## Scope

### Files to Create
- `src/ui/teaser/TeaserMapScene.tsx` — Map scene component
- `src/ui/teaser/TeaserVillageScene.tsx` — Village scene component
- `src/ui/teaser/TeaserChoiceCard.tsx` — Choice card component

### Files to Modify
- (None — standalone phase)

### Out of Scope
- Hero, drag & astrolabe (deferred to D3)

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

### Step 1: Create TeaserMapScene
Create `TeaserMapScene.tsx` with:
- Map scene display
- Mocked props for map component
- Config-driven scene parameters
- Skin token styling (no standalone CSS)

### Step 2: Create TeaserVillageScene
Create `TeaserVillageScene.tsx` with:
- Village scene display
- Mocked props for village component
- Config-driven scene parameters
- Skin token styling (no standalone CSS)

### Step 3: Create TeaserChoiceCard
Create `TeaserChoiceCard.tsx` with:
- Choice card display
- Mocked props for choice component
- Config-driven choice parameters
- Skin token styling (no standalone CSS)

### Step 4: Verify Integration
- Ensure scene composites render correctly
- Test with realistic teaser scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `WL-TEASER-D1` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/teaser` (120s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/teaser` (120s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-teaser-d2-<date>.log` with:
- Lint results
- Build check output
- Kanban lint output
- Scene composite summary

## Dependencies
- **blocked_by**: WL-TEASER-D1 (Scaffolding: route + controller + config)

## Execution Hint
**atomic** — This task is trailer-only code with @trailer-only exemption (no PersistenceService, no real engine, all mocked).

## Notes
- @trailer-only exemption applies per handoff notes
- Reuse existing components with mocked props only
- 55s deterministic sequence, no random physics
- Skin tokens are mandatory, no standalone CSS
