# IV-WSV3-P8 — End-to-end tests + plan update

## Context
Phase P8 of World Surface V3. Creates end-to-end tests for the complete world surface system and updates the plan document with completion status and changelog.

## Objectives
- Create end-to-end tests for world surface system
- Verify complete world surface flow (all biomes)
- Update plan document with completion status
- Add changelog entry for world surface system

## Scope

### Files to Create
- `tests/unit/idleVillage/worldSurfaceSystem.test.ts` — End-to-end world surface tests

### Files to Modify
- `src/docs/docs/plans/world_surface_v3_plan.md` — Update changelog and status

### Out of Scope
- New world surface features (only testing and documentation)

## Guardrails

### Invariants
- **Documentation**: Update plan changelog with completion status
- **Runtime Verification**: End-to-end tests must pass with deterministic outcomes
- **Config-first**: All world surface configurations must be in config
- **i18n**: Any user-facing strings must use `idleVillage` namespace

### Constraints
- End-to-end tests must cover complete world surface flow
- Plan update must accurately reflect implementation
- All safeguards must pass before marking task complete

## Implementation Plan

### Step 1: Create End-to-End Tests
Create `worldSurfaceSystem.test.ts` with:
- Test case for complete world surface flow (all biomes)
- Verification of parallax at each position
- Verification of breathing animation
- Verification of events, wonders, underwater effects
- Edge case tests (invalid positions, max depth, etc.)
- Config validation tests

### Step 2: Verify Complete Flow
- Run end-to-end tests with seeded RNG
- Verify deterministic outcomes
- Check for any missing integration points
- Validate config coverage

### Step 3: Update Plan Document
Update `world_surface_v3_plan.md`:
- Add changelog entry for P1-P8 completion
- Document any deviations from original plan
- Update status to "completed"
- Add evidence log references

### Step 4: Verify Safeguards
Run all safeguards:
- `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage src/analytics/idleVillage src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/worldSurfaceSystem.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

## Safeguards

### Pre-Execution
- Verify all previous phases (P1-P7) are marked as `Completato` in Kanban
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage src/analytics/idleVillage src/ui/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/worldSurfaceSystem.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)
- Verify plan document is updated

### Evidence Log
Create `test-results/iv-wsv3-p8-<date>.log` with:
- Lint results
- Test results (end-to-end tests passing)
- Build check output
- Kanban lint output
- Plan update summary
- Final world surface system verification

## Dependencies
- **blocked_by**: IV-WSV3-P1, IV-WSV3-P2, IV-WSV3-P3, IV-WSV3-P4, IV-WSV3-P5, IV-WSV3-P6, IV-WSV3-P7 (all previous phases)

## Execution Hint
**verified** — This task touches invariants (documentation governance, runtime verification) and requires comprehensive testing and documentation updates before closing the world surface plan.

## Notes
- End-to-end tests are critical for validating complete world surface flow
- Plan update must accurately reflect all phases completed
- All safeguards must pass before marking task complete
