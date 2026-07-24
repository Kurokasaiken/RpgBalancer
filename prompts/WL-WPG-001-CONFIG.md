# WL-WPG-001-CONFIG — Presence grammar config + validation matrix

## Context
Phase CONFIG of World Presence Grammar (WL-WPG-001). Implements the presence grammar config and validation matrix.

## Objectives
- Create presence grammar config
- Create PresenceValidator
- Add unit tests for presence grammar
- Verify validation matrix

## Scope

### Files to Create
- `src/balancing/config/worldPresence/presenceGrammar.ts` — Presence grammar config
- `src/engine/world/presence/PresenceValidator.ts` — Presence validator
- `tests/unit/world/presenceGrammar.test.ts` — Unit tests

### Files to Modify
- (None — standalone phase)

### Out of Scope
- Goblin invasion concept (deferred to CONCEPT)

## Guardrails

### Invariants
- **Config-first**: All presence parameters in Zod schema
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Presence grammar must be configurable
- Validation matrix must be implemented as config
- Tests must cover all validation scenarios

## Implementation Plan

### Step 1: Define Presence Grammar Config
Create `presenceGrammar.ts` with:
- Zod schema for presence grammar
- World Presence Grammar Matrix (§3.2 from plan)
- Validation parameters
- Validation helpers for config values

### Step 2: Implement PresenceValidator
Create `PresenceValidator.ts` with:
- `validatePresence(presence)` — validate presence against grammar
- `checkDeltaTest(presence)` — check 4-frame Delta Test
- Config-driven validation parameters

### Step 3: Add Unit Tests
Create comprehensive tests in `presenceGrammar.test.ts`:
- Config validation tests (known valid/invalid configs)
- Presence validation tests
- Delta Test tests (40px, no-hover, 3am tests)
- Config sensitivity tests (changing parameters changes behavior)

### Step 4: Verify Integration
- Ensure presence grammar works with config
- Test with realistic presence scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `WL-WPG-001-CONCEPT` is marked as `Completato` in Kanban
- Run `npm run lint -- src/balancing/config/worldPresence src/engine/world/presence` (120s timeout)
- Run `npm run test -- tests/unit/world/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/config/worldPresence src/engine/world/presence` (120s timeout)
- Run `npm run test -- tests/unit/world/presenceGrammar.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-wpg-001-config-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Presence grammar summary

## Dependencies
- **blocked_by**: WL-WPG-001-CONCEPT (Goblin invasion 4-frame concept + Delta Test)

## Execution Hint
**verified** — This task touches invariants (config-first) and requires careful config schema design to ensure validation matrix is implemented correctly.

## Notes
- World Presence Grammar Matrix (§3.2) must be implemented as config
- 4 frames must pass Delta Test (§4.1)
- 40px, no-hover, 3am tests must pass
