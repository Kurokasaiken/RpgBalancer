# IV-WSC-P2 — Surface state management + persistence

## Context
Phase P2 of World Surface Controller. Implements surface state management with PersistenceService integration for world surface state.

## Objectives
- Create surface state store with PersistenceService
- Implement state persistence for world surface
- Add state recovery mechanisms
- Add unit tests for state management

## Scope

### Files to Create
- `src/store/useWorldSurfaceStore.ts` — World surface state store
- `src/engine/game/idleVillage/surfaceStateManager.ts` — State management logic
- `tests/unit/idleVillage/surfaceStateManager.test.ts` — Unit tests

### Files to Modify
- (None — standalone phase)

### Out of Scope
- UI integration (deferred to P3)
- Telemetry integration (deferred to P4)

## Guardrails

### Invariants
- **Config-first**: All state parameters in Zod schema
- **Persistence**: Use `PersistenceService` for all state operations (mandatory)
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- State management must use PersistenceService (no direct localStorage)
- State recovery must be robust and handle corruption
- Tests must cover all state scenarios

## Implementation Plan

### Step 1: Define State Schema
Create Zod schema for world surface state:
- `WorldSurfaceState` — surface position, biome state, entity state
- Validation helpers for state values

### Step 2: Implement State Store
Create `useWorldSurfaceStore.ts` with:
- Zustand store for world surface state
- PersistenceService integration for save/load
- State recovery mechanisms
- Config-driven state parameters

### Step 3: Implement State Manager
Create `surfaceStateManager.ts` with:
- `saveSurfaceState(state)` — save state via PersistenceService
- `loadSurfaceState()` — load state via PersistenceService
- `recoverCorruptedState()` — recover from corrupted state
- Config-driven state parameters

### Step 4: Add Unit Tests
Create comprehensive tests in `surfaceStateManager.test.ts`:
- State save/load tests (known inputs/outputs)
- State recovery tests (corrupted state handling)
- PersistenceService integration tests
- Config sensitivity tests (changing parameters changes behavior)
- Edge case tests (empty state, max state size)

### Step 5: Verify Integration
- Ensure state management works with PersistenceService
- Test with realistic state scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `IV-WSC-P1` is marked as `Completato` in Kanban
- Run `npm run lint -- src/store src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/store src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/surfaceStateManager.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-wsc-p2-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- State management summary

## Dependencies
- **blocked_by**: IV-WSC-P1 (World Surface Controller foundation)

## Execution Hint
**verified** — This task touches invariants (PersistenceService, config-first) and requires careful state management with proper persistence.

## Notes
- PersistenceService integration is mandatory per invariants
- State recovery must be robust and handle corruption
- Config must be easily tunable for state parameters
