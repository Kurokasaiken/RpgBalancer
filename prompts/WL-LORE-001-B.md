# WL-LORE-001-B — LoreDiscoveryService with triggers

## Context
Phase B of Lore System (WL-LORE-001). Implements the LoreDiscoveryService with trigger logic for lore discovery.

## Objectives
- Create LoreDiscoveryService
- Implement lore discovery triggers
- Add unit tests for discovery service
- Verify trigger logic

## Scope

### Files to Create
- `src/engine/game/lore/LoreDiscoveryService.ts` — Lore discovery service
- `tests/unit/lore/LoreDiscoveryService.test.ts` — Unit tests

### Files to Modify
- (None — standalone phase)

### Out of Scope
- LoreStore (deferred to C)
- LoreBook UI (deferred to D)

## Guardrails

### Invariants
- **Config-first**: All discovery parameters in Zod schema
- **Persistence**: Use `PersistenceService` for discovery state (no localStorage)
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Discovery triggers must be configurable
- Discovery logic must be deterministic
- Tests must cover all discovery scenarios

## Implementation Plan

### Step 1: Define Discovery Config Schema
Create Zod schema for discovery parameters:
- `DiscoveryConfig` — trigger types, probabilities, cooldowns
- Validation helpers for config values

### Step 2: Implement LoreDiscoveryService
Create `LoreDiscoveryService.ts` with:
- `checkDiscoveryTrigger(context)` — check if lore should be discovered
- `discoverLore(loreId, context)` — discover lore entry
- Config-driven discovery parameters
- Trigger types: quest completion, location visit, curio interaction, etc.

### Step 3: Add Unit Tests
Create comprehensive tests in `LoreDiscoveryService.test.ts`:
- Discovery trigger tests (known inputs/outputs)
- Discovery logic tests (probabilities, cooldowns)
- Config sensitivity tests (changing parameters changes behavior)
- Edge case tests (max discoveries, cooldown exhaustion)

### Step 4: Verify Integration
- Ensure discovery service works with lore config from A
- Test with realistic discovery scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `WL-LORE-001-A` is marked as `Completato` in Kanban
- Run `npm run lint -- src/engine/game/lore` (120s timeout)
- Run `npm run test -- tests/unit/lore/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/engine/game/lore` (120s timeout)
- Run `npm run test -- tests/unit/lore/LoreDiscoveryService.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-lore-001-b-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Discovery service summary

## Dependencies
- **blocked_by**: WL-LORE-001-A (Lore config schema + sample entries)

## Execution Hint
**verified** — This task touches invariants (PersistenceService, config-first) and requires careful discovery logic implementation to ensure deterministic behavior.

## Notes
- PersistenceService integration is mandatory per invariants
- Discovery triggers must be configurable
- Config must be easily tunable for discovery parameters
