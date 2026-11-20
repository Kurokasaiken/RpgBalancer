# Idle Village Gameplay Math Spec

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Goal

This document is the single reference for the gameplay math that drives Idle Village: time, fatigue, injury, job rewards, quest power, quest outcomes, and death. It lists the canonical engine files, the formulas, and which pieces are still mocked or stubbed.

## Math Engines

| Engine | File | Scope | Status |
|---|---|---|---|
| Time Engine | `src/engine/game/idleVillage/TimeEngine.ts` | Tick progression, scheduling, activity lifecycle, daily food | implemented |
| Job Resolver | `src/engine/game/idleVillage/JobResolver.ts` | Job reward evaluation, auto-repeat | implemented (formula evaluation stub) |
| Quest Resolver | `src/engine/game/idleVillage/QuestResolver.ts` | Quest reward and XP payout | implemented (variance stub) |
| Quest Power Engine | `src/engine/game/idleVillage/QuestPowerEngine.ts` | Party power vs difficulty, outcome distribution, injury/death | implemented |
| Injury Engine | `src/engine/game/idleVillage/InjuryEngine.ts` | Light injury probability from fatigue + danger | implemented |

## Time Engine

### Time unit
- `VillageTimeUnit` is an integer.
- `config.globalRules.dayLengthInTimeUnits` defines how many time units make one in-game day.
- `tick(intervalMs, 'auto')` advances time by `config.globalRules.tickSizeMs` per call.

### Activity scheduling
- `scheduleActivity({ activityId, characterIds, slotId, startTime?, isAuto?, snapshotDeathRisk? })`
- `startTime` defaults to `state.currentTime`.
- `endTime = startTime + durationMs / tickSizeMs` (converted to time units).
- Only `status === 'available'` residents can be assigned (enforced by consumer, not `TimeEngine`).

### Daily food consumption
- When the in-game day advances, every resident consumes 1 food.
- If `resources.food < residentCount`, a `food_consumed_daily` event is still emitted and food goes to 0 or negative.
- Game over is logged to console when food < 1; no UI modal exists yet.

### Fatigue progression
- For non-continuous jobs, fatigue is applied progressively using `applyActivityFatigueProgress`.
- Total fatigue gain for the activity: `getActivityFatigueGain(config, activityId, activityDuration)`.
- A resident with `fatigue >= maxFatigueBeforeExhausted` becomes `exhausted` on completion.

## Job Resolver

### Reward evaluation
- `evaluateRewardAmount(delta)` parses `amountFormula` as a number.
- **KNOWN LIMITATION:** complex formulas are not evaluated; non-numeric strings log a warning and return 0.
- Rewards are added to `resources[delta.resourceId]`.

### Auto-repeat
- Triggered when `activity.supportsAutoRepeat && scheduled.isAuto`.
- `checkAutoRescheduleConditions` checks:
  - All assigned characters are `available`.
  - Enough resources for `perTickCostProfile`.
  - Average fatigue + `dailyFatigueCost` does not exceed `maxFatigueBeforeExhausted`.
- If conditions pass, a new `activity_scheduled` event is emitted. The actual scheduling must happen at a higher level.

## Quest Resolver

### XP
- `questLevel` from `activity.metadata.level` or default `1`.
- `baseXpPerLevel` is parsed from `config.globalRules.questXpFormula` if it is a plain integer; otherwise `10`.
- `xpAwarded = baseXpPerLevel * questLevel`.

### Rewards
- Same `evaluateRewardAmount` as Job Resolver; numeric formulas only.
- **Variance:** the resolver reads `config.variance.rewardCategories`, but for now it just takes the first category and uses the midpoint of `[minMultiplier, maxMultiplier]`.

### Outcome application
- `QuestResolver` does NOT call `QuestPowerEngine`. It returns `quest_completed` with rewards and XP.
- Injury/death hooks are returned in `injuryRolls` but the downstream application is TODO.

## Quest Power Engine

### Resident power

```text
rawPower = Σ (statValue * statWeight) for each stat in rules.statWeights
if resident.isHero: rawPower *= heroPowerMultiplier
fatiguePenalty = resident.fatigue * fatiguePenaltyFactor
rawPower *= max(0, 1 - fatiguePenalty)
if resident.isInjured: rawPower *= injuryPowerMultiplier
residentPower = max(0, rawPower)
```

### Party power

```text
partyPower = Σ residentPower for all assigned residents
```

### Quest difficulty

```text
baseDifficulty = basePowerPerLevel * questLevel * (1 + dangerRating * dangerScaling)
questDifficulty = baseDifficulty * difficultyMultiplier (default 1)
```

### Power ratio

```text
powerRatio = partyPower / questDifficulty
```

### Outcome distribution

- `outcomeBreakpoints` are sorted by `threshold` descending.
- The first breakpoint where `powerRatio >= threshold` wins.
- Default breakpoints (config-driven but shipped in `DEFAULT_QUEST_POWER_RULES`):

| Power ratio | perfect | success | partial | fail | deadly |
|---|---|---|---|---|---|
| ≥ 2.0 | 60 | 30 | 8 | 2 | 0 |
| ≥ 1.5 | 25 | 45 | 20 | 8 | 2 |
| ≥ 1.0 | 10 | 35 | 30 | 18 | 7 |
| ≥ 0.7 | 2 | 15 | 30 | 35 | 18 |
| < 0.7 | 0 | 5 | 15 | 40 | 40 |

### Outcome resolution

- A random roll is made against the distribution weights.
- `rewardMultiplier[outcome]` is applied to quest rewards.
- `injuryChanceByOutcome` and `deathChanceByOutcome` are rolled independently for each party member.

### Consequences

| Outcome | rewardMultiplier | injuryChance | deathChance |
|---|---|---|---|
| perfect | 1.5 | 0.0 | 0.0 |
| success | 1.0 | 0.05 | 0.0 |
| partial | 0.5 | 0.20 | 0.02 |
| fail | 0.1 | 0.40 | 0.05 |
| deadly | 0.0 | 0.70 | 0.15 |

## Injury Engine

### Light injury chance

```text
normalizedFatigue = resident.fatigue / maxFatigueBeforeExhausted (clamped [0, 1])
baseChance = baseLightInjuryChanceAtMaxFatigue * normalizedFatigue
dangerScale = 1 + dangerInjuryMultiplierPerPoint * dangerRating
chance = baseChance * dangerScale (clamped [0, 1])
```

### Application
- If the RNG roll is below the chance, the resident's status becomes `injured`.
- `injuryRecoveryTime = now + dayLengthInTimeUnits`.
- Light injury duration is currently one in-game day; full recovery logic is TODO.

## What is Mocked or Missing

| Feature | Status | Notes |
|---|---|---|
| Formula evaluator for `amountFormula` | STUB | `JobResolver`/`QuestResolver` only parse simple integers |
| Reward variance | STUB | Uses only the first `rewardCategories` entry and the midpoint |
| Quest failure recovery UI | MISSING | No screen/modal for `fail`/`deadly` outcomes |
| Quest timeout event | MISSING | `TimeEngine` marks quest `completed` at `endTime` with no partial logic |
| Death state wiring | MISSING | `QuestPowerEngine` can return `dead` but the UI/roster does not reflect it |
| Chronic injury system | MISSING | Only `light` injury exists; `heavy` is referenced but not implemented |
| Stat growth on level-up | MISSING | XP is awarded; level-up math is not yet connected |

## Invariants

- All math must read from `IdleVillageConfig`; no hardcoded numbers in components.
- RNG is deterministic when a seed is provided.
- `QuestPowerEngine` is pure: it does not mutate `VillageState`.
- `InjuryEngine` returns a new `VillageState`; it never mutates in place.
- Fatigue can never be negative. It is clamped to `[0, maxFatigue]`.

## Test Commands

```bash
npm run test -- tests/unit/idleVillage/QuestPowerEngine.test.ts 2>/dev/null || true
npm run test -- tests/unit/idleVillage/InjuryEngine.test.ts 2>/dev/null || true
npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts
npm run build:check
```

## References

- `src/engine/game/idleVillage/QuestPowerEngine.ts`
- `src/engine/game/idleVillage/InjuryEngine.ts`
- `src/engine/game/idleVillage/JobResolver.ts`
- `src/engine/game/idleVillage/QuestResolver.ts`
- `src/engine/game/idleVillage/TimeEngine.ts`
- `src/balancing/config/idleVillage/defaultConfig.ts`
