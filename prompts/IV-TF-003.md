# IV-TF-003 — Resident fatigue state + recovery

## Context
Phase 003 of Idle Village Tick & Fatigue System. Implements resident fatigue state management via PersistenceService and recovery logic based on fatigue config from TF-001.

## Objectives
- Extend resident store with fatigue state
- Implement recovery logic based on config
- Add unit tests for fatigue state and recovery
- Integrate with PersistenceService for fatigue state

## Scope

### Files to Create
- `src/engine/game/idleVillage/residentRecovery.ts` — Recovery logic
- `tests/unit/idleVillage/residentRecovery.test.ts` — Unit tests

### Files to Modify
- `src/store/useResidentStore.ts` — Extend with fatigue state

### Out of Scope
- UI hooks (deferred to TF-004)
- Modifier integration (deferred to TF-005)

## Guardrails

### Invariants
- **Config-first**: All recovery rates and thresholds in Zod schema from TF-001
- **Persistence**: Use `PersistenceService` for fatigue state (mandatory)
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Fatigue state must persist via PersistenceService
- Recovery must be deterministic (same config = same recovery)
- Tests must cover all recovery scenarios

## Implementation Plan

### Step 1: Extend Resident Store
Modify `useResidentStore.ts` to:
- Add fatigue state to resident model
- Integrate with PersistenceService for fatigue state
- Add actions for updating fatigue state
- Maintain backward compatibility with existing resident logic

### Step 2: Implement Recovery Logic
Create `residentRecovery.ts` with:
- `calculateRecovery(resident, config)` — calculate recovery based on config
- Config-driven recovery rates and thresholds
- Edge case handling (max recovery, zero recovery, invalid inputs)

### Step 3: Add Unit Tests
Create comprehensive tests in `residentRecovery.test.ts`:
- Recovery correctness tests (known inputs/outputs)
- Config sensitivity tests (changing rates changes recovery)
- Edge case tests (max recovery, zero recovery, invalid thresholds)
- Persistence integration tests

### Step 4: Verify Integration
- Ensure fatigue state persists via PersistenceService
- Test with realistic recovery scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `IV-TF-002` is marked as `Completato` in Kanban
- Run `npm run lint -- src/store src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/store src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/residentRecovery.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-tf-003-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Fatigue state and recovery summary

## Dependencies
- **blocked_by**: IV-TF-002 (Tick engine fatigue application)

## Execution Hint
**verified** — This task touches invariants (PersistenceService, config-first) and requires careful state management with proper persistence.

## Notes
- PersistenceService integration is mandatory per invariants
- Recovery must be deterministic and configurable
- Backward compatibility with existing resident logic is required
