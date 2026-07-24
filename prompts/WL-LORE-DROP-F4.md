# WL-LORE-DROP-F4 — Telemetry + end-to-end tests

## Context
Phase F4 of Wanderlust Lore Drop Prototype. Adds telemetry tracking for lore drop events and creates comprehensive end-to-end tests for the complete lore drop system.

## Objectives
- Add telemetry tracking for lore drop events
- Create end-to-end tests for lore drop system
- Verify complete lore drop flow
- Update plan document with completion status

## Scope

### Files to Create
- `src/analytics/wanderlust/loreDropTelemetry.ts` — Telemetry event definitions
- `tests/unit/wanderlust/loreDropSystem.test.ts` — End-to-end lore drop tests

### Files to Modify
- `src/docs/docs/plans/wanderlust_lore_drop_plan.md` — Update changelog and status

### Out of Scope
- New lore drop features (only testing and documentation)

## Guardrails

### Invariants
- **Documentation**: Update plan changelog with completion status
- **Runtime Verification**: End-to-end tests must pass with deterministic outcomes
- **Config-first**: All lore drop configurations must be in config
- **i18n**: Any user-facing strings must use `wanderlust` namespace

### Constraints
- End-to-end tests must cover complete lore drop flow
- Plan update must accurately reflect implementation
- All safeguards must pass before marking task complete

## Implementation Plan

### Step 1: Define Telemetry Events
Create `loreDropTelemetry.ts` with:
- Zod schemas for lore drop events (drop_collected, rarity_unlocked, quality_viewed)
- Helper functions to emit telemetry events
- Integration with existing analytics infrastructure

### Step 2: Add Telemetry to Lore Drop
Hook telemetry into lore drop system:
- Emit `drop_collected` event when lore is collected
- Emit `rarity_unlocked` event when new rarity tier is unlocked
- Emit `quality_viewed` event when lore is viewed

### Step 3: Create End-to-End Tests
Create comprehensive tests in `loreDropSystem.test.ts`:
- Test case for complete lore drop flow (drop → collect → view)
- Verification of drop rates at each seed
- Verification of rarity tier assignment
- Edge case tests (zero drop rate, max rarity)
- Config validation tests

### Step 4: Update Plan Document
Update `wanderlust_lore_drop_plan.md`:
- Add changelog entry for F1-F4 completion
- Document any deviations from original plan
- Update status to "completed"
- Add evidence log references

### Step 5: Verify Safeguards
Run all safeguards:
- `npm run lint -- src/balancing/config/wanderlust src/engine/game/wanderlust src/analytics/wanderlust src/ui/wanderlust`
- `npm run test -- tests/unit/wanderlust/loreDropSystem.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

## Safeguards

### Pre-Execution
- Verify all previous phases (F1-F3) are marked as `Completato` in Kanban
- Run `npm run lint -- src/balancing/config/wanderlust src/engine/game/wanderlust` (120s timeout)
- Run `npm run test -- tests/unit/wanderlust/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/config/wanderlust src/engine/game/wanderlust src/analytics/wanderlust src/ui/wanderlust` (120s timeout)
- Run `npm run test -- tests/unit/wanderlust/loreDropSystem.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)
- Verify plan document is updated

### Evidence Log
Create `test-results/wl-lore-drop-f4-<date>.log` with:
- Lint results
- Test results (end-to-end tests passing)
- Build check output
- Kanban lint output
- Plan update summary
- Final lore drop system verification

## Dependencies
- **blocked_by**: WL-LORE-DROP-F1, WL-LORE-DROP-F2, WL-LORE-DROP-F3 (all previous phases)

## Execution Hint
**verified** — This task touches invariants (documentation governance, runtime verification) and requires comprehensive testing and documentation updates before closing the lore drop plan.

## Notes
- End-to-end tests are critical for validating complete lore drop flow
- Plan update must accurately reflect all phases completed
- All safeguards must pass before marking task complete
