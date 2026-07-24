# REND-SYS-P4 — Telemetry + end-to-end tests

## Context
Phase P4 of Rendering System. Adds telemetry tracking for rendering events and creates comprehensive end-to-end tests for the complete rendering system.

## Objectives
- Add telemetry tracking for rendering events
- Create end-to-end tests for rendering system
- Verify complete rendering flow
- Update plan document with completion status

## Scope

### Files to Create
- `src/analytics/common/renderingTelemetry.ts` — Telemetry event definitions
- `tests/unit/rendering/renderingSystem.test.ts` — End-to-end rendering tests

### Files to Modify
- `src/docs/docs/plans/rendering_system_plan.md` — Update changelog and status

### Out of Scope
- New rendering features (only testing and documentation)

## Guardrails

### Invariants
- **Documentation**: Update plan changelog with completion status
- **Runtime Verification**: End-to-end tests must pass with deterministic outcomes
- **Config-first**: All rendering configurations must be in config
- **i18n**: Any user-facing strings must use `common` namespace

### Constraints
- End-to-end tests must cover complete rendering flow
- Plan update must accurately reflect implementation
- All safeguards must pass before marking task complete

## Implementation Plan

### Step 1: Define Telemetry Events
Create `renderingTelemetry.ts` with:
- Zod schemas for rendering events (rendering_quality_changed, performance_mode_changed, fps_measured)
- Helper functions to emit telemetry events
- Integration with existing analytics infrastructure

### Step 2: Add Telemetry to Rendering
Hook telemetry into rendering system:
- Emit `rendering_quality_changed` event when quality changes
- Emit `performance_mode_changed` event when performance mode changes
- Emit `fps_measured` event with FPS metrics

### Step 3: Create End-to-End Tests
Create comprehensive tests in `renderingSystem.test.ts`:
- Test case for complete rendering flow (batching → optimization → rendering)
- Verification of rendering quality at each preset
- Verification of performance mode changes
- Edge case tests (max sprites, min quality, etc.)
- Config validation tests

### Step 4: Update Plan Document
Update `rendering_system_plan.md`:
- Add changelog entry for P1-P4 completion
- Document any deviations from original plan
- Update status to "completed"
- Add evidence log references

### Step 5: Verify Safeguards
Run all safeguards:
- `npm run lint -- src/engine/rendering src/analytics/common src/ui/common`
- `npm run test -- tests/unit/rendering/renderingSystem.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

## Safeguards

### Pre-Execution
- Verify all previous phases (P1-P3) are marked as `Completato` in Kanban
- Run `npm run lint -- src/engine/rendering` (120s timeout)
- Run `npm run test -- tests/unit/rendering/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/engine/rendering src/analytics/common src/ui/common` (120s timeout)
- Run `npm run test -- tests/unit/rendering/renderingSystem.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)
- Verify plan document is updated

### Evidence Log
Create `test-results/rend-sys-p4-<date>.log` with:
- Lint results
- Test results (end-to-end tests passing)
- Build check output
- Kanban lint output
- Plan update summary
- Final rendering system verification

## Dependencies
- **blocked_by**: REND-SYS-P1, REND-SYS-P2, REND-SYS-P3 (all previous phases)

## Execution Hint
**verified** — This task touches invariants (documentation governance, runtime verification) and requires comprehensive testing and documentation updates before closing the rendering plan.

## Notes
- End-to-end tests are critical for validating complete rendering flow
- Plan update must accurately reflect all phases completed
- All safeguards must pass before marking task complete
