# IV-PROG-P3 — Effective power calculator

## Context
Phase P3 of Idle Village Progression System. Implements effective power calculator that combines player stats (level, equipment, skills) into a single power metric for matchmaking and difficulty scaling.

## Objectives
- Create effective power formula combining multiple stats
- Implement power calculator with config-driven weights
- Add unit tests for power calculation
- Integrate with reward/risk scaling from P2

## Scope

### Files to Create
- `src/engine/game/idleVillage/EffectivePowerCalculator.ts` — Power calculation implementation
- `src/balancing/config/idleVillage/powerConfig.ts` — Zod schema for power weights
- `tests/unit/idleVillage/EffectivePowerCalculator.test.ts` — Unit tests

### Files to Modify
- (None — standalone phase, but integrates with P2 config)

### Out of Scope
- UI integration (deferred to P5)
- Telemetry integration (deferred to P5)
- Production scaling integration (deferred to P4)

## Guardrails

### Invariants
- **Config-first**: All power weights and formulas in Zod schema
- **Persistence**: Use `PersistenceService` for any state (though this phase is formula-only)
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Power formula must be deterministic (same stats = same power)
- Weights must be configurable for game balance
- Tests must cover all stat combinations

## Implementation Plan

### Step 1: Define Power Schema
Create Zod schema in `powerConfig.ts`:
- `PowerWeightConfig` — weights for each stat (level, equipment, skills, etc.)
- `EffectivePowerConfig` — formula parameters, scaling factors
- Validation helpers for config values

### Step 2: Implement Power Calculator
Create `EffectivePowerCalculator.ts` with:
- `calculateEffectivePower(stats)` — combines stats into single power value
- Config-driven weight application
- Normalization/scaling functions
- Edge case handling (missing stats, invalid inputs)

### Step 3: Add Unit Tests
Create comprehensive tests in `EffectivePowerCalculator.test.ts`:
- Formula correctness tests (known inputs/outputs)
- Weight sensitivity tests (changing weights changes power)
- Edge case tests (missing stats, zero stats, max stats)
- Config validation tests

### Step 4: Integrate with P2
- Ensure power calculator works with reward/risk scaling
- Test combined progression flow (level → power → reward/risk)
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `IV-PROG-P2` is marked as `Completato` in Kanban
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/config/idleVillage src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/EffectivePowerCalculator.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-prog-p3-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Power formula summary

## Dependencies
- **blocked_by**: IV-PROG-P2 (Reward and risk scaling)

## Execution Hint
**verified** — This task touches invariants (config-first, formula validation) and requires design judgment on power weights while ensuring fair matchmaking.

## Notes
- Power formula must be transparent and explainable to players
- Weights must be easily tunable for game balance
- Integration with P2 is critical for end-to-end progression
