# IV-TF-002 — Tick engine fatigue application

## Context
Phase 002 of Idle Village Tick & Fatigue System. Extends the TickEngine to apply fatigue to residents based on tick intervals and fatigue config from TF-001.

## Objectives
- Extend TickEngine to apply fatigue based on config
- Implement fatigue application logic with proper tick intervals
- Add unit tests for fatigue application
- Integrate with fatigue config from TF-001

## Scope

### Files to Create
- `src/engine/game/idleVillage/fatigueApplication.ts` — Fatigue application logic
- `tests/unit/idleVillage/fatigueApplication.test.ts` — Unit tests

### Files to Modify
- `src/engine/game/idleVillage/TickEngine.ts` — Extend with fatigue application

### Out of Scope
- Resident fatigue state (deferred to TF-003)
- UI hooks (deferred to TF-004)
- Modifier integration (deferred to TF-005)

## Guardrails

### Invariants
- **Config-first**: All fatigue rates and intervals in Zod schema from TF-001
- **Persistence**: Use `PersistenceService` for fatigue state (deferred to TF-003)
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Fatigue application must be deterministic (same tick = same fatigue)
- Tick intervals must be configurable, not hardcoded
- Tests must cover all fatigue application scenarios

## Implementation Plan

### Step 1: Implement Fatigue Application
Create `fatigueApplication.ts` with:
- `applyFatigue(resident, tickInterval, config)` — apply fatigue based on config
- Config-driven fatigue rates and intervals
- Edge case handling (max fatigue, zero fatigue, invalid inputs)

### Step 2: Extend TickEngine
Modify `TickEngine.ts` to:
- Call fatigue application on each tick
- Use config from TF-001 for rates and intervals
- Maintain backward compatibility with existing tick logic
- Add logging for fatigue application

### Step 3: Add Unit Tests
Create comprehensive tests in `fatigueApplication.test.ts`:
- Fatigue application correctness tests (known inputs/outputs)
- Config sensitivity tests (changing rates changes fatigue)
- Edge case tests (max fatigue, zero fatigue, invalid intervals)
- TickEngine integration tests

### Step 4: Verify Integration
- Ensure fatigue application works with TF-001 config
- Test with realistic tick scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `IV-TF-001` is marked as `Completato` in Kanban
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/fatigueApplication.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-tf-002-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Fatigue application summary

## Dependencies
- **blocked_by**: IV-TF-001 (Fatigue config schema + recovery rates)

## Execution Hint
**verified** — This task touches invariants (config-first, determinism) and requires careful integration with TickEngine while maintaining backward compatibility.

## Notes
- Deterministic fatigue application is critical for reproducible gameplay
- Config must be easily tunable for game balance
- Backward compatibility with existing tick logic is required
