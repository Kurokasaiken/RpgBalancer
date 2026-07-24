# IV-PROG-P4 — Production scaling integration

## Context
Phase P4 of Idle Village Progression System. Integrates progression system with production engine, ensuring that production rates scale appropriately with player level and effective power.

## Objectives
- Extend production engine to use progression scaling
- Integrate power calculator with production rates
- Add config-driven production scaling
- Add unit tests for production scaling

## Scope

### Files to Modify
- `src/engine/game/idleVillage/ProductionEngine.ts` — Extend with progression scaling
- `src/balancing/config/idleVillage/productionScaling.ts` — Zod schema for production scaling

### Files to Create
- `tests/unit/idleVillage/productionScaling.test.ts` — Unit tests

### Out of Scope
- UI integration (deferred to P5)
- Telemetry integration (deferred to P5)
- New production features (only scaling integration)

## Guardrails

### Invariants
- **Config-first**: All production scaling formulas in Zod schema
- **Persistence**: Use `PersistenceService` for production state
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Production scaling must not break existing production logic
- Scaling must be configurable, not hardcoded
- Tests must cover all production types

## Implementation Plan

### Step 1: Define Production Scaling Schema
Create Zod schema in `productionScaling.ts`:
- `ProductionScalingConfig` — scaling factors per production type
- Integration with progression config from P1-P3
- Validation helpers for config values

### Step 2: Extend Production Engine
Modify `ProductionEngine.ts` to:
- Accept progression level and power as inputs
- Apply scaling to production rates
- Maintain backward compatibility with existing calls
- Add logging for scaling application

### Step 3: Add Unit Tests
Create comprehensive tests in `productionScaling.test.ts`:
- Scaling correctness tests (known inputs/outputs)
- Backward compatibility tests (existing production logic unchanged)
- Edge case tests (level 1, max level, zero power)
- Config validation tests

### Step 4: Verify Integration
- Ensure production engine works with P1-P3 progression
- Test end-to-end flow (level → power → production)
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `IV-PS0` and `IV-PROG-P1` are marked as `Completato` in Kanban
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/productionScaling.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-prog-p4-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Production scaling summary

## Dependencies
- **blocked_by**: IV-PS0 (Progression System P0), IV-PROG-P1 (XP progression formula + level table)

## Execution Hint
**verified** — This task touches invariants (config-first, backward compatibility) and requires careful integration to avoid breaking existing production logic.

## Notes
- Backward compatibility is critical — existing production must continue to work
- Scaling must be additive, not replacing existing logic
- Test coverage must ensure no regressions in production engine
