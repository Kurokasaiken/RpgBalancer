# IV-WSV3-P7 — UI integration + telemetry

## Context
Phase P7 of World Surface V3. Integrates all biomes (parallax, breathing, events, wonders, underwater) with UI components and adds telemetry tracking for biome events.

## Objectives
- Create useWorldSurface hook for biome state
- Integrate all biomes with UI components
- Add telemetry tracking for biome events
- Add i18n strings for biome UI

## Scope

### Files to Create
- `src/ui/idleVillage/hooks/useWorldSurface.ts` — World surface state hook
- `src/analytics/idleVillage/worldSurfaceTelemetry.ts` — Telemetry event definitions

### Files to Modify
- `public/locales/en/idleVillage.json` — Add i18n strings for biome UI

### Out of Scope
- End-to-end tests (deferred to P8)

## Guardrails

### Invariants
- **Config-first**: All UI thresholds and labels in config
- **Persistence**: Use existing biome state from previous phases
- **i18n**: All UI strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only for component styling

### Constraints
- UI must be responsive and accessible
- Biome components must use skin tokens, not standalone CSS
- i18n coverage is mandatory for all UI strings

## Implementation Plan

### Step 1: Create useWorldSurface Hook
Create `useWorldSurface.ts` with:
- Hook for accessing world surface state from store
- Computed values for all biomes (parallax, breathing, events, wonders, underwater)
- Actions for biome interactions

### Step 2: Integrate Biomes with UI
- Ensure all biome components work with UI
- Verify skin token styling for all biomes
- Test biome interactions (clicks, hovers, etc.)

### Step 3: Add Telemetry Events
Create `worldSurfaceTelemetry.ts` with:
- Zod schemas for biome events (biome_viewed, biome_interacted, wonder_unlocked)
- Helper functions to emit telemetry events
- Integration with existing analytics infrastructure

### Step 4: Add i18n Strings
Add to `idleVillage.json`:
- Biome labels
- Biome action labels
- Biome messages

### Step 5: Add Unit Tests
Create comprehensive tests:
- Hook tests (state access, computed values)
- Telemetry validation tests (schema validation, event emission)
- i18n coverage tests

### Step 6: Verify Integration
- Ensure UI displays all biomes accurately
- Verify skin token styling works correctly
- Test with realistic biome scenarios

## Safeguards

### Pre-Execution
- Verify `IV-WSV3-P6` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/idleVillage/hooks src/analytics/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/idleVillage/hooks src/analytics/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/useWorldSurface.test.ts tests/unit/idleVillage/worldSurfaceTelemetry.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-wsv3-p7-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- UI integration summary

## Dependencies
- **blocked_by**: IV-WSV3-P6 (Underwater biome)

## Execution Hint
**verified** — This task touches invariants (i18n, skin tokens, telemetry) and requires UI/telemetry integration with proper validation.

## Notes
- Skin tokens are mandatory, no standalone CSS
- i18n coverage is required for all UI strings
- Telemetry must be additive, not modify biome logic
