# WL-LORE-001-C — LoreStore with PersistenceService

## Context
Phase C of Lore System (WL-LORE-001). Implements the LoreStore with PersistenceService integration for lore state management.

## Objectives
- Create LoreStore with Zustand
- Implement PersistenceService integration for lore state
- Add unit tests for LoreStore
- Verify state persistence

## Scope

### Files to Create
- `src/store/loreStore.ts` — Lore state store
- `tests/unit/lore/loreStore.test.ts` — Unit tests

### Files to Modify
- (None — standalone phase)

### Out of Scope
- LoreBook UI (deferred to D)
- Gameplay integration (deferred to E)

## Guardrails

### Invariants
- **Config-first**: All store parameters in Zod schema
- **Persistence**: Use `PersistenceService` for all state operations (mandatory)
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- LoreStore must use PersistenceService (no direct localStorage)
- State persistence must be robust and handle corruption
- Tests must cover all state scenarios

## Implementation Plan

### Step 1: Define Lore State Schema
Create Zod schema for lore state:
- `LoreBookState` — discovered lore entries, discovery history, read status
- Validation helpers for state values

### Step 2: Implement LoreStore
Create `loreStore.ts` with:
- Zustand store for lore state
- PersistenceService integration for save/load
- State recovery mechanisms
- Actions: discoverLore, markAsRead, getDiscoveredLore, etc.

### Step 3: Add Unit Tests
Create comprehensive tests in `loreStore.test.ts`:
- State save/load tests (known inputs/outputs)
- State recovery tests (corrupted state handling)
- PersistenceService integration tests
- Config sensitivity tests (changing parameters changes behavior)
- Edge case tests (empty state, max state size)

### Step 4: Verify Integration
- Ensure LoreStore works with PersistenceService
- Test with realistic state scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `WL-LORE-001-B` is marked as `Completato` in Kanban
- Run `npm run lint -- src/store` (120s timeout)
- Run `npm run test -- tests/unit/lore/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/store` (120s timeout)
- Run `npm run test -- tests/unit/lore/loreStore.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-lore-001-c-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- LoreStore summary

## Dependencies
- **blocked_by**: WL-LORE-001-B (LoreDiscoveryService with triggers)

## Execution Hint
**verified** — This task touches invariants (PersistenceService, config-first) and requires careful state management with proper persistence.

## Notes
- PersistenceService integration is mandatory per invariants
- State recovery must be robust and handle corruption
- Config must be easily tunable for state parameters
