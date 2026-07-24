# IV-WSC-P4 — Telemetry + end-to-end tests

## Context
Phase P4 of World Surface Controller. Adds telemetry tracking for world surface events and creates comprehensive end-to-end tests for the complete world surface controller system.

## Objectives
- Add telemetry tracking for world surface events
- Create end-to-end tests for world surface controller
- Verify complete world surface controller flow
- Update plan document with completion status

## Scope

### Files to Create
- `src/analytics/idleVillage/worldSurfaceControllerTelemetry.ts` — Telemetry event definitions
- `tests/unit/idleVillage/worldSurfaceControllerSystem.test.ts` — End-to-end tests

### Files to Modify
- `src/docs/docs/plans/world_surface_controller_plan.md` — Update changelog and status

### Out of Scope
- New world surface controller features (only testing and documentation)

## Guardrails

### Invariants
- **Documentation**: Update plan changelog with completion status
- **Runtime Verification**: End-to-end tests must pass with deterministic outcomes
- **Config-first**: All world surface controller configurations must be in config
- **i18n**: Any user-facing strings must use `idleVillage` namespace

### Constraints
- End-to-end tests must cover complete world surface controller flow
- Plan update must accurately reflect implementation
- All safeguards must pass before marking task complete

## Implementation Plan

### Step 1: Define Telemetry Events
Create `worldSurfaceControllerTelemetry.ts` with:
- Zod schemas for world surface controller events (surface_navigated, biome_changed, state_saved, state_loaded)
- Helper functions to emit telemetry events
- Integration with existing analytics infrastructure

### Step 2: Add Telemetry to World Surface Controller
Hook telemetry into world surface controller:
- Emit `surface_navigated` event when surface position changes
- Emit `biome_changed` event when biome changes
- Emit `state_saved` event when state is saved
- Emit `state_loaded` event when state is loaded

### Step 3: Create End-to-End Tests
Create comprehensive tests in `worldSurfaceControllerSystem.test.ts`:
- Test case for complete world surface controller flow (state → navigation → save → load)
- Verification of surface navigation at each step
- Verification of state persistence and recovery
- Edge case tests (max state size, corrupted state, etc.)
- Config validation tests

### Step 4: Update Plan Document
Update `world_surface_controller_plan.md`:
- Add changelog entry for P1-P4 completion
- Document any deviations from original plan
- Update status to "completed"
- Add evidence log references

### Step 5: Verify Safeguards
Run all safeguards:
- `npm run lint -- src/engine/game/idleVillage src/analytics/idleVillage src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/worldSurfaceControllerSystem.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

## Safeguards

### Pre-Execution
- Verify all previous phases (P1-P3) are marked as `Completato` in Kanban
- Run `npm run lint -- src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/engine/game/idleVillage src/analytics/idleVillage src/ui/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/worldSurfaceControllerSystem.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)
- Verify plan document is updated

### Evidence Log
Create `test-results/iv-wsc-p4-<date>.log` with:
- Lint results
- Test results (end-to-end tests passing)
- Build check output
- Kanban lint output
- Plan update summary
- Final world surface controller verification

## Dependencies
- **blocked_by**: IV-WSC-P1, IV-WSC-P2, IV-WSC-P3 (all previous phases)

## Execution Hint
**verified** — This task touches invariants (documentation governance, runtime verification) and requires comprehensive testing and documentation updates before closing the world surface controller plan.

## Notes
- End-to-end tests are critical for validating complete world surface controller flow
- Plan update must accurately reflect all phases completed
- All safeguards must pass before marking task complete
