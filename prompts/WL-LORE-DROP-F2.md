# WL-LORE-DROP-F2 — Lore drop mechanics + config

## Context
Phase F2 of Wanderlust Lore Drop Prototype. Implements lore drop mechanics (drop rates, rarity tiers, quality scaling) with config-driven design.

## Objectives
- Create lore drop config schema with Zod
- Implement drop rate calculator
- Add rarity tier system
- Add unit tests for drop mechanics

## Scope

### Files to Create
- `src/balancing/config/wanderlust/loreDropConfig.ts` — Zod schema for lore drops
- `src/engine/game/wanderlust/loreDropMechanics.ts` — Drop rate calculator
- `tests/unit/wanderlust/loreDropMechanics.test.ts` — Unit tests

### Files to Modify
- (None — standalone phase)

### Out of Scope
- UI integration (deferred to F3)
- Telemetry integration (deferred to F4)

## Guardrails

### Invariants
- **Config-first**: All drop rates and rarity tiers in Zod schema
- **Persistence**: Use `PersistenceService` for any state (though this phase is formula-only)
- **i18n**: Any user-facing strings must use `wanderlust` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Drop rates must be deterministic (same seed = same drops)
- Rarity tiers must be configurable, not hardcoded
- Tests must cover all drop scenarios

## Implementation Plan

### Step 1: Define Drop Config Schema
Create Zod schema in `loreDropConfig.ts`:
- `LoreDropConfig` — base drop rate, rarity tiers, quality scaling
- `RarityTierConfig` — common, uncommon, rare, legendary tiers
- Validation helpers for config values

### Step 2: Implement Drop Mechanics
Create `loreDropMechanics.ts` with:
- `calculateDropRate(seed, config)` — calculate drop based on seed
- `determineRarityTier(dropRate, config)` — determine rarity tier
- Config-driven drop rates and rarity thresholds
- Edge case handling (zero drop rate, max rarity)

### Step 3: Add Unit Tests
Create comprehensive tests in `loreDropMechanics.test.ts`:
- Drop rate correctness tests (known inputs/outputs)
- Rarity tier tests (correct tier assignment)
- Config sensitivity tests (changing rates changes drops)
- Edge case tests (zero drop rate, max rarity)

### Step 4: Verify Config Integration
- Ensure drop config integrates with defaultConfig
- Validate schema against config values
- Test with realistic drop scenarios

## Safeguards

### Pre-Execution
- Verify `WL-LORE-DROP-F1` is marked as `Completato` in Kanban
- Run `npm run lint -- src/balancing/config/wanderlust src/engine/game/wanderlust` (120s timeout)
- Run `npm run test -- tests/unit/wanderlust/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/config/wanderlust src/engine/game/wanderlust` (120s timeout)
- Run `npm run test -- tests/unit/wanderlust/loreDropMechanics.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-lore-drop-f2-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Drop mechanics summary

## Dependencies
- **blocked_by**: WL-LORE-DROP-F1 (Lore schema + persistence)

## Execution Hint
**verified** — This task touches invariants (config-first, determinism) and requires design judgment on drop rates and rarity tiers.

## Notes
- Deterministic drop rates are critical for reproducible gameplay
- Config must be easily tunable for game balance
- Rarity tiers must be clear and balanced
