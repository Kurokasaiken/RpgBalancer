# IV-PROG-P2 — Reward and risk scaling

## Context
Phase P2 of Idle Village Progression System. Implements reward and risk scaling formulas that adjust quest rewards and difficulty based on player progression level. This ensures balanced gameplay throughout the progression curve.

## Objectives
- Create reward scaling formula (XP, gold, items based on level)
- Create risk scaling formula (difficulty, enemy strength based on level)
- Implement scaling config with Zod schema
- Add unit tests for scaling formulas

## Scope

### Files to Create
- `src/balancing/config/idleVillage/rewardRiskConfig.ts` — Zod schema for reward/risk scaling
- `src/engine/game/idleVillage/RewardRiskScaling.ts` — Scaling formula implementation
- `tests/unit/idleVillage/RewardRiskScaling.test.ts` — Unit tests

### Files to Modify
- (None — standalone phase)

### Out of Scope
- UI integration (deferred to P5)
- Telemetry integration (deferred to P5)
- Effective power calculator (deferred to P3)

## Guardrails

### Invariants
- **Config-first**: All scaling formulas and thresholds in Zod schema
- **Persistence**: Use `PersistenceService` for any state (though this phase is formula-only)
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Scaling must be monotonic (higher level = higher reward/risk)
- Formulas must be configurable, not hardcoded
- Tests must cover edge cases (level 1, max level, negative levels)

## Implementation Plan

### Step 1: Define Scaling Schema
Create Zod schema in `rewardRiskConfig.ts`:
- `RewardScalingConfig` — base reward, scaling factor, level multiplier
- `RiskScalingConfig` — base difficulty, scaling factor, level multiplier
- Validation helpers for config values

### Step 2: Implement Scaling Formulas
Create `RewardRiskScaling.ts` with:
- `calculateReward(level, baseReward)` — XP/gold/item scaling
- `calculateRisk(level, baseDifficulty)` — difficulty/enemy scaling
- Config-driven formula parameters
- Edge case handling (level bounds, invalid inputs)

### Step 3: Add Unit Tests
Create comprehensive tests in `RewardRiskScaling.test.ts`:
- Formula correctness tests (known inputs/outputs)
- Monotonicity tests (higher level = higher reward/risk)
- Edge case tests (level 1, max level, invalid levels)
- Config validation tests

### Step 4: Verify Config Integration
- Ensure scaling config integrates with defaultConfig
- Validate schema against config values
- Test with realistic progression data

## Safeguards

### Pre-Execution
- Verify `IV-PROG-P1` is marked as `Completato` in Kanban
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/RewardRiskScaling.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-prog-p2-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Scaling formula summary

## Dependencies
- **blocked_by**: IV-PROG-P1 (XP progression formula + level table)

## Execution Hint
**verified** — This task touches invariants (config-first, formula validation) and requires design judgment on scaling curves while ensuring balanced progression.

## Notes
- Focus on balanced scaling curves — not too steep, not too flat
- Config must be easily tunable for game balance
- Monotonicity is critical for fair progression
