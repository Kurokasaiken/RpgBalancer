# IV-WSV3-P6 — Underwater biome (caustic, luminescence)

## Context
Phase P6 of World Surface V3. Implements underwater biome with caustic lighting effects and luminescence for deep water areas.

## Objectives
- Create underwater biome config with Zod
- Implement caustic lighting effects
- Add luminescence for deep water
- Add unit tests for underwater biome

## Scope

### Files to Create
- `src/balancing/config/idleVillage/underwaterBiomeConfig.ts` — Zod schema for underwater biome
- `src/engine/game/idleVillage/underwaterBiome.ts` — Underwater biome implementation
- `tests/unit/idleVillage/underwaterBiome.test.ts` — Unit tests

### Files to Modify
- (None — standalone phase)

### Out of Scope
- UI integration (deferred to P7)
- Telemetry integration (deferred to P7)

## Guardrails

### Invariants
- **Config-first**: All biome parameters in Zod schema
- **Persistence**: Use `PersistenceService` for any state (though this phase is biome-only)
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Biome effects must be deterministic (same seed = same effects)
- Caustic lighting must be configurable, not hardcoded
- Tests must cover all biome scenarios

## Implementation Plan

### Step 1: Define Underwater Biome Schema
Create Zod schema in `underwaterBiomeConfig.ts`:
- `UnderwaterBiomeConfig` — caustic parameters, luminescence thresholds, depth effects
- `CausticConfig` — caustic intensity, frequency, direction
- Validation helpers for config values

### Step 2: Implement Underwater Biome
Create `underwaterBiome.ts` with:
- `applyCausticEffects(position, config)` — apply caustic lighting
- `applyLuminescence(depth, config)` — apply luminescence based on depth
- Config-driven biome parameters
- Edge case handling (zero depth, max depth, invalid inputs)

### Step 3: Add Unit Tests
Create comprehensive tests in `underwaterBiome.test.ts`:
- Caustic effects correctness tests (known inputs/outputs)
- Luminescence tests (correct luminescence based on depth)
- Config sensitivity tests (changing parameters changes effects)
- Edge case tests (zero depth, max depth, invalid inputs)

### Step 4: Verify Config Integration
- Ensure underwater biome config integrates with defaultConfig
- Validate schema against config values
- Test with realistic biome scenarios

## Safeguards

### Pre-Execution
- Verify `IV-WSV3-P5` is marked as `Completato` in Kanban
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/underwaterBiome.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-wsv3-p6-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Underwater biome summary

## Dependencies
- **blocked_by**: IV-WSV3-P5 (Wonders biome)

## Execution Hint
**verified** — This task touches invariants (config-first, determinism) and requires design judgment on caustic lighting and luminescence effects.

## Notes
- Deterministic biome effects are critical for reproducible visuals
- Config must be easily tunable for visual balance
- Caustic lighting must perform well
