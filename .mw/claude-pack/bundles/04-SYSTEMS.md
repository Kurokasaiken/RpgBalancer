# 04-SYSTEMS — bundle tematico (snapshot 2026-11-19)

File uniti per provider con cap documenti. Fonti:
- repo-snapshot/idle_village_gameplay_math_spec.md
- repo-snapshot/skill_check_workflow_spec.md
- repo-snapshot/quest_failure_and_recovery_spec.md
- repo-snapshot/village_event_system_spec.md
- repo-snapshot/BALANCING_DEEP_DIVE.md
- repo-snapshot/BALANCING_SYSTEM.md
- repo-snapshot/STAT_BALANCING_ANALYSIS.md
- repo-snapshot/COMBAT_SYSTEM_DESIGN.md
- repo-snapshot/SPELL_CREATION_SPEC.md
- repo-snapshot/SPELL_TYPE_GUIDELINES.md
- repo-snapshot/VILLAGE_ECONOMY.md
- repo-snapshot/PROGRESSION.md

---

<!-- ===== repo-snapshot/idle_village_gameplay_math_spec.md ===== -->

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

<!-- ===== repo-snapshot/skill_check_workflow_spec.md ===== -->

# Skill Check / Spell Resolution Workflow Spec

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Goal

Idle Village has two main skill-check subsystems: a simple D20 component (`SkillCheckComponent`) for quick checks, and a cinematic D100 Astrolabe (`DestinyAstrolabe`) for quest milestones and high-stakes rolls. This document describes both, how they are configured, how they consume resident stats, and where a future "spell creator" or custom skill editor would fit.

## Subsystems

| Name | File | Dice | Use Case | Status |
|---|---|---|---|---|
| `SkillCheckComponent` | `src/ui/idleVillage/components/SkillCheckComponent.tsx` | D20 | Generic skill check, debugging, legacy | implemented |
| `DestinyAstrolabe` (V1) | `src/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe.tsx` | D100 | Cinematic quest milestone resolution | implemented |
| `DestinyAstrolabeV2` | `src/ui/idleVillage/components/destinyAstrolabeV2/` | D100 | V2 iteration | **unused** |
| `DestinyAstrolabeV3` | `src/ui/idleVillage/components/destinyAstrolabeV3/` | D100 | V3 iteration | **unused** |
| `DestinyAstrolabeV4` | `src/ui/idleVillage/components/destinyAstrolabeV4/DestinyAstrolabeV4.tsx` | D100 | Latest component | **candidate** |
| `MilestoneCheckModal` | `src/ui/idleVillage/components/MilestoneCheckModal.tsx` | D100 | Wrapper for quest-phase skill checks | implemented |

## D20 Skill Check (`SkillCheckComponent`)

### Contract

```ts
export interface SkillCheckComponentProps {
  dcTarget: number;      // Difficulty Class to beat
  residentSkill: number; // Skill bonus added to the d20 roll
  activityName?: string; // Display label
  autoStart?: boolean;   // Start rolling on mount
  onComplete?: (result: { success: boolean; roll: number; total: number }) => void;
}
```

### Resolution

1. After an 1.8s rolling animation, a `d20` is rolled: `roll = Math.floor(Math.random() * 20) + 1`.
2. `total = roll + residentSkill`.
3. `success = total >= dcTarget`.
4. `isCrit` if `roll === 20`.
5. `isFumble` if `roll === 1`.

### Limitations
- Not seeded; uses `Math.random()`.
- Hardcoded animation and palette.
- Not wired to the config-first system or the skin registry.
- Currently a debug/legacy component, not used in the main quest flow.

## D100 Destiny Astrolabe

### Contract

```ts
export interface DestinyAstrolabeProps {
  skills: AstrolabeSkill[];
  config?: AstrolabeConfig & { mode?: string };
  onResolve?: (result: AstrolabeResult) => void;
  autoStart?: boolean;
  autoThrow?: boolean;
  skipAnimation?: boolean;
  // ...
}
```

### Skill input

```ts
interface AstrolabeSkill {
  name: string;
  stat: number;       // Resident's relevant stat (e.g. strength, agility)
  difficulty: number; // Difficulty of the check
}
```

### TST calculation

```text
TST (Target Success Threshold) = clamp(50 + (stat - difficulty), 1, 99)
```

This is computed in `DestinyAstrolabe.tsx` and mirrors the engine factory in `engine.ts`.

### Config-first values

- All timing, geometry, risk thresholds, and animation values live in `astrolabeV3Config` (`src/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config.ts`).
- V1 uses `astrolabe-ui.css` and `astrolabe.css` (legacy, not preset-driven).
- V4 is the candidate for full skin/preset integration.

### Resolution phases

1. **Threat slam** — the difficulty obelisks settle.
2. **Agency burst** — the resident's stat bands appear.
3. **Risk pour** — death/wound percentages are shown.
4. **The spin** — the D100 ball rolls and lands.
5. **Snap / verdict** — compare `roll <= TST` for success; `<= critSuccessPct` for crit.

### Milestone integration

- `MilestoneCheckModal` mounts `DestinyAstrolabe` at quest milestones.
- A milestone fires every 25% of quest duration (from `useMilestoneEngine`).
- `buildAstrolabeSkillsForPhase` (quest logic) maps resident stats and quest difficulty to `AstrolabeSkill[]`.

## Spell / Skill Creator (Missing)

There is currently **no canonical "spell creator" or skill editor**. The following capabilities are absent:

- Authoring new skills/spells with a UI.
- Associating a spell with a cost, cooldown, stat, or school.
- Saving custom skills to `IdleVillageConfig` or `PersistenceService`.
- Validating a custom skill with a Zod schema.

### What is configured

The existing "skill" content is data-driven through:
- `IdleVillageConfig.questSkillCheckConfig` — tuning for quest milestone checks.
- `ActivityDefinition.statRequirement` / `requiredStats` — quest entry requirements.
- `QuestPowerEngine` — party power calculation from stats.

### Future spell creator workflow (proposed)

1. **Author** — define name, school, stat, base difficulty, mana/stamina cost, cooldown, effect list.
2. **Validate** — Zod schema ensures no overlap with existing IDs and valid references.
3. **Preview** — render `DestinyAstrolabe` with the custom difficulty/stat in a sandbox.
4. **Publish** — save to a `spells` config tab and persist via `PersistenceService`.
5. **Use** — quest blueprint can reference the spell by ID as a consumable or prerequisite.

## Invariants

- All skill-check tunings (TST clamp, crit/wound thresholds, animation timings) must live in config, not in component code.
- D100 outcomes must be deterministic when a seed is supplied.
- A skill check never mutates `ResidentState` directly; it emits a result to `onResolve`.

## What is Mocked or Missing

| Feature | Status | Notes |
|---|---|---|
| D20 `SkillCheckComponent` | Legacy | `Math.random()`, not config-first or skinned |
| D100 Astrolabe V1 | Implemented | Functional but uses legacy CSS |
| Astrolabe V3 config | Implemented | Not consumed by V1; V3 component is unused |
| Astrolabe V4 | Candidate | Best candidate for skin/preset integration |
| Milestone → Astrolabe | Implemented | `MilestoneCheckModal` wires V1 |
| Spell creator UI | **MISSING** | No design, no route, no config tab |
| Custom spell persistence | **MISSING** | No schema, no storage key |
| Spell effect engine | **MISSING** | Quest rewards are resource-only; no spell effects |

## Test Commands

```bash
npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts
npx playwright test tests/e2e/idleVillage/minimal-destiny-astrolabe.spec.ts 2>/dev/null || true
npm run build:check
```

## References

- `src/ui/idleVillage/components/SkillCheckComponent.tsx`
- `src/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe.tsx`
- `src/ui/idleVillage/components/destinyAstrolabe/engine.ts`
- `src/ui/idleVillage/components/destinyAstrolabeV4/DestinyAstrolabeV4.tsx`
- `src/ui/idleVillage/components/MilestoneCheckModal.tsx`
- `src/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config.ts`
- `src/engine/game/idleVillage/QuestPowerEngine.ts`

<!-- ===== repo-snapshot/quest_failure_and_recovery_spec.md ===== -->

# Quest Failure, Timeout and Recovery Spec

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Goal

This document describes what happens when a quest does **not** succeed, and how a player recovers. It covers the five quest outcomes, their consequences, the missing failure UI, and the missing timeout behavior.

## Quest Outcomes

`QuestPowerEngine` produces five ordered outcomes from best to worst:

1. `perfect`
2. `success`
3. `partial`
4. `fail`
5. `deadly`

See `idle_village_gameplay_math_spec.md` §Quest Power Engine for the exact formulas.

## Consequences by Outcome

| Outcome | Rewards | XP | Injury | Death |
|---|---|---|---|---|
| `perfect` | `1.5 × base` | full | 0% | 0% |
| `success` | `1.0 × base` | full | 5% | 0% |
| `partial` | `0.5 × base` | full | 20% | 2% |
| `fail` | `0.1 × base` (or none) | full | 40% | 5% |
| `deadly` | `0` | full | 70% | 15% |

- `QuestResolver` currently always awards full `xpAwarded` regardless of outcome. This is a **known simplification**.
- Resource rewards are computed in `QuestResolver` from `activity.rewards` and are not yet multiplied by `rewardMultipliers[outcome]`. This is **not wired** to `QuestPowerEngine`.
- `QuestResolver` returns `injuryRolls` as a field, but the caller does **not apply them**.

## Failure Flow

### Current flow (what the code does)

```text
Quest reaches endTime
   │
   ▼
QuestResolver.resolveQuest()
   │
   ├─ emits quest_completed event
   ├─ applies unmultiplied rewards
   ├─ returns injuryRolls (unused)
   ▼
QuestChronicle opens
   │
   ├─ shows phases
   ├─ shows "Raccogli ricompense"
   ▼
Residents return to roster with status 'available' (or 'exhausted')
```

### What is missing

- **Outcome awareness in the UI:** `QuestChronicle` does not show `perfect/success/partial/fail/deadly`. It always presents the quest as completed.
- **Failure modal:** there is no dedicated failure/recovery screen. `QuestSuccessModal` exists; `QuestFailureModal` does not.
- **Injury/death application:** the engine can roll injuries and death, but the UI does not show or apply them.
- **Resource penalty:** failing a quest should not give rewards, or should give reduced/penalty rewards. Today it gives the base reward amount.
- **Retry / abandon:** there is no retry or abandon quest action.

## Timeout

### Current behavior

- The `TimeEngine` does not have a special `quest_timeout` event.
- When `currentTime >= endTime`, the activity is marked `completed` and `activity_completed` is emitted.
- The quest is treated the same as a normal completion.

### Missing behavior

- No `quest_timeout` event type in `VillageEvent`.
- No partial-completion reward for a quest that runs out of time.
- No "return with nothing" or "abort" path.
- No visible countdown that warns the player when a quest is about to expire.

## Recovery (Proposed)

When a quest fails, the following steps should be available:

1. **Show the outcome card** — result, injuries/deaths, lost resources.
2. **Return residents** — living residents go back to the roster with `status: 'available'` or `'exhausted'`.
3. **Apply injuries/death** — update `ResidentState`, trigger `injury_applied` / `death` events.
4. **Apply resources** — add reduced/penalty rewards, or none.
5. **Chronicle entry** — add a `quest_failed` / `quest_deadly` entry to the event log.
6. **Player options**:
   - `Reattempt` (if quest is still offered and residents are able)
   - `Dismiss` (close the card, return to map)
   - `Heal / Rest` (if injuries need recovery)

## Invariants

- A quest outcome must be deterministic for the same RNG seed and inputs.
- A failed quest must still return residents to the roster; they must not remain stuck in the slot.
- `ResidentState.status` must reflect `dead` if a death roll succeeds; UI must handle `dead` residents.
- `QuestResolver` must not silently ignore `rewardMultipliers` or `injuryRolls`.

## What is Mocked or Missing

| Feature | Status | Notes |
|---|---|---|
| Outcome-based reward multiplier | **MISSING** | `QuestResolver` ignores `QuestPowerEngine` multipliers |
| Injury/death application | **MISSING** | `injuryRolls` returned but unused |
| Failure UI | **MISSING** | No `QuestFailureModal`; `QuestChronicle` always positive |
| Timeout event / partial completion | **MISSING** | `TimeEngine` treats timeout as completion |
| Death state UI | **MISSING** | `dead` not rendered in roster or PgCard |
| Recovery actions (retry/heal) | **MISSING** | Not designed or implemented |
| XP outcome adjustment | **MOCKED** | Full XP always awarded |

## Test Commands

```bash
npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts
npm run build:check
```

## References

- `src/engine/game/idleVillage/QuestPowerEngine.ts`
- `src/engine/game/idleVillage/QuestResolver.ts`
- `src/engine/game/idleVillage/TimeEngine.ts`
- `src/engine/game/idleVillage/InjuryEngine.ts`
- `src/docs/docs/idle_village/idle_village_gameplay_math_spec.md`
- `src/docs/docs/idle_village/village_event_system_spec.md`

<!-- ===== repo-snapshot/village_event_system_spec.md ===== -->

# Village Event System Spec

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Goal

The `VillageEvent` system is the canonical log of everything that happens inside the village simulation. Every scheduling, start, completion, cancellation, injury, daily food consumption, and trial-of-fire event is emitted by the `TimeEngine` and recorded in `VillageState.eventLog`. This document describes the event types, their lifecycle, how they are produced, and which parts are still mocked or not wired to the UI.

## Data Flow

```text
User action / Time tick
   │
   ▼
TimeEngine.tick() / scheduleActivity() / cancelActivity()
   │
   ├─ writes new event to newEvents[]
   ├─ updates VillageState (residents, resources, activities)
   ▼
VillageState.eventLog (append-only, chronological)
   │
   ▼
Consumers: ChronicleStrip, QuestChronicle, WorldSurface notifications, telemetry
```

## Event Types

| Type | Emit Condition | Payload | Status |
|---|---|---|---|
| `activity_scheduled` | User assigns resident(s) to an activity | `scheduledId`, `activityId`, `characterIds`, `slotId` | implemented |
| `activity_started` | `tick()` reaches `activity.startTime` | `scheduledId`, `activityId` | implemented |
| `activity_completed` | `tick()` reaches `activity.endTime` or resolver fires | `scheduledId`, `activityId`, `rewards?`, `continuousJob?` | implemented |
| `activity_cancelled` | User cancels an activity before completion | `scheduledId`, `activityId`, `reason` | partially implemented (stub in UI) |
| `fatigue_changed` | Fatigue is updated during a tick | `residentId`, `delta`, `newFatigue` | **MOCKED — not actively emitted** |
| `injury_applied` | `InjuryEngine` rolls a light injury | `residentId`, `scheduledId`, `activityId`, `severity`, `recoveryTime`, `fatigueAtInjury`, `dangerRating` | implemented |
| `food_consumed_daily` | Daily food consumption tick | `amount`, `newFood` | implemented |
| `trial_of_fire` | A quest phase reaches a milestone requiring a skill check | `scheduledId`, `phaseIndex` | implemented |

## Event Lifecycle

### Production

Events are produced in three places:
1. **Scheduling** (`TimeEngine.scheduleActivity`) → `activity_scheduled`
2. **Tick progression** (`TimeEngine.tick`) → `activity_started`, `activity_completed`, `fatigue_changed`, `food_consumed_daily`
3. **Resolvers** (`JobResolver.resolveJob`, `QuestResolver.resolveQuest`, `InjuryEngine.applyFatigueInjuryForActivity`) → `activity_completed`, `injury_applied`

### Ordering
- `eventLog` is append-only.
- Events are stored with `time: VillageTimeUnit`.
- Consumers should sort by `time` before presenting, because resolver events may be emitted slightly out of tick order.

## Post-Quest Outcomes

When a quest completes, `QuestResolver` emits a `quest_completed` event (not yet in `VillageEvent` union, but it is the contract shape used by the resolver). The `QuestPowerEngine` determines the outcome distribution and modifiers.

### Possible quest outcomes (best → worst)

1. `perfect`
2. `success`
3. `partial`
4. `fail`
5. `deadly`

### Post-failure effects

| Outcome | Resource rewards | Injury chance | Death chance | Resident return |
|---|---|---|---|---|
| `perfect` | full × `rewardMultipliers.perfect` | low | 0 | immediate |
| `success` | full × `rewardMultipliers.success` | low | 0 | immediate |
| `partial` | reduced × `rewardMultipliers.partial` | moderate | 0 | immediate |
| `fail` | none / penalty | high | 0 | immediate |
| `deadly` | none | high | high | immediate, may die |

### What is NOT yet implemented
- **Quest failure recovery UI:** there is no dedicated screen or card for "quest failed" beyond `QuestChronicle`. The reward modal exists for success; a failure modal is MOCKED.
- **Timeout behavior:** if a quest is not manually completed before its deadline, the `TimeEngine` still marks it `completed` at `endTime`; there is no explicit `quest_timeout` event or partial-failure logic yet.
- **Resident death handling:** `death` can be rolled by `QuestPowerEngine` but the downstream state transition (`status: 'dead'`) is not fully wired through `ResidentState` consumers.

## World Event Registry

The `worldEventRegistry` (`src/engine/world/config/worldEventRegistry.ts`) holds templates for visual/atmospheric events:

- `weather` — environment tint
- `threat` — red global tint
- `resource` — green global tint

These are **currently visual-only** in the `useWorldState` store. They do **not** emit `VillageEvent`s and do **not** affect village gameplay math yet.

## Trigger System

### Current
- Quest milestones trigger `trial_of_fire` events.
- Continuous jobs trigger `activity_completed` at each cycle and optionally auto-reschedule.
- Daily food consumption is checked every tick.

### Missing / Mocked
- **Event tiers (from `DESIGN_PILLARS.md`):** ambient, threat, major, run-threatening. No tiering logic exists in `VillageEvent`.
- **Reactive world triggers:** hidden discoveries, hover-easter eggs, zone entry. These are only in `DESIGN_PILLARS.md`; no code or `VillageEvent` type for them.
- **Event queue UI:** `ChronicleStrip` is a `DESIGN_PILLARS` proposal; no canonical component exists.

## Invariants

- `eventLog` is never mutated in place; every tick produces a new `VillageState`.
- Events must have a `time` value ≥ the previous `currentTime`.
- A `quest_completed` event must contain the same `rewards` that were actually applied to `resources`.
- `injury_applied` must only occur for living residents with `status !== 'dead'`.

## Test Commands

```bash
npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts
npx playwright test tests/e2e/idleVillage/minimal-job-poi-roster-time-integration.spec.ts
npm run build:check
```

## References

- Code: `src/engine/game/idleVillage/TimeEngine.ts`, `JobResolver.ts`, `QuestResolver.ts`, `InjuryEngine.ts`
- World events: `src/engine/world/config/worldEventRegistry.ts`
- Quest power: `src/engine/game/idleVillage/QuestPowerEngine.ts`
- Design pillars: `DESIGN_PILLARS.md`

<!-- ===== repo-snapshot/BALANCING_DEEP_DIVE.md ===== -->

# 🔬 Balancing Deep Dive: Analysis & Findings

**Date:** 2025-11-28
**Scope:** Comprehensive analysis of the current "Weight-Based" balancing system using empirical Monte Carlo simulations.

---

## 📊 Executive Summary

We performed a "Reality Check" on the project's balancing logic using the new CLI Calibration Tool. The results reveal significant discrepancies between *theoretical* weights and *actual* in-game power.

| Stat | Theoretical Weight | **Actual Weight (Simulated)** | Status |
|------|-------------------|------------------------------|--------|
| **Damage** | 5.0 HP | **0.50 HP** | ✅ Consistent (Linear) |
| **Armor** | 5.0 HP | **0.40 HP** | ⚠️ **Extremely Weak** |
| **TxC** | 2.0 HP | **0.00 HP** | 🚨 **BROKEN / Capped** |
| **Evasion** | 4.0 HP | **0.69 HP** | ⚠️ Undervalued |
| **HP** | 1.0 HP | **1.00 HP** | ✅ Control |

> **Key Insight:** The current "Universal Weights" (e.g. 5.0 for Armor) are vastly overestimating defensive stats in the current low-HP baseline context.

---

## 1. The "Armor Problem" (Weight 0.40 vs 5.0)

**The Finding:**
Simulations show that **1 point of Armor is worth only 0.40 HP**.
The theoretical weight is **5.0 HP**. This is a **12x discrepancy**.

**The Cause:**
The Path of Exile formula (`Armor / (Armor + 10 * Damage)`) is highly dependent on the incoming damage and total HP pool.
*   **Baseline:** 100 HP, 25 Damage.
*   **Test (+500 Armor):** Reduces 25 Damage to ~8.3 (66% reduction).
*   **Survival:** Increases from 4 hits to 12 hits.
*   **Value:** This 3x survival boost is equivalent to adding ~200 HP.
*   **Math:** 200 HP / 500 Armor = **0.40 HP/point**.

**Conclusion:**
Armor is NOT linear. Its value per point drops drastically as you add more, and its relative value depends entirely on your HP pool.
*   **Low HP (100):** Armor is worth little (0.4).
*   **High HP (1000):** Armor would be worth much more (likely ~4.0).

**Recommendation:**
We cannot use a single static weight for Armor if HP varies wildly. We must either:
1.  **Dynamic Weighting:** Calculate weight based on the entity's HP bucket.
2.  **Re-Baseline:** Calibrate weights against a "Endgame" baseline (e.g. 1000 HP) if that's the target gameplay.

---

## 2. The "TxC Anomaly" (Weight 0.00)

**The Finding:**
Adding +20 TxC resulted in **0.00 HP** value. The win rate did not change.

**The Investigation:**
*   **Formula:** `HitChance = TxC + 50 - Evasion` (Clamped 1-100).
*   **Baseline:** TxC 25, Evasion 0.
*   **Base Hit Chance:** `25 + 50 - 0 = 75%`.
*   **Test (+20 TxC):** `45 + 50 - 0 = 95%`.
*   **Expected Result:** Going from 75% to 95% hit chance is a **26% DPS increase**. This *should* have massive value.

**Why 0.00?**
This indicates a potential bug in the `CombatSimulator` or `StatValueAnalyzer`.
*   Possibility A: The `HitChanceModule` is not being called correctly in the simulator.
*   Possibility B: The `BASELINE_STATS` has a hardcoded `hitChance` property that overrides the calculation.
*   Possibility C: The `StatValueAnalyzer` binary search failed to converge (unlikely for such a clear advantage).

**Recommendation:**
Immediate debugging of `CombatSimulator.ts` to ensure `txc` stat changes actually affect the hit roll.

---

## 3. Evasion (Weight 0.69 vs 4.0)

**The Finding:**
Evasion is worth **0.69 HP**. Theoretical is 4.0.

**The Analysis:**
*   **Test (+20 Evasion):** Reduces enemy hit chance from 75% to 55%.
*   **Mitigation:** You take damage 26% less often.
*   **EHP Value:** Increases EHP from 133 to 181 (+48 EHP).
*   **Math:** 48 EHP / 20 Evasion = **2.4 HP/point**.
*   **Simulated Weight (0.69):** Much lower than expected (2.4).

**Why the Discrepancy?**
The simulation balances against **Raw HP**.
*   Adding Raw HP increases survival linearly.
*   Adding Evasion increases survival exponentially (EHP).
*   In the low-HP baseline (100), the raw HP needed to match Evasion's value is lower than EHP theory suggests because of "Overkill" and "Time to Kill" breakpoints.
*   Example: If you die in 4 hits, dodging 1 hit lets you live for 5 hits. Adding 25 HP also lets you live for 5 hits.
*   So 20 Evasion ≈ 25 HP -> Weight 1.25. (Closer to 0.69).

---

## 🚀 Strategic Recommendations

### 1. Abandon "Universal Weights" for Non-Linear Stats
Armor and Evasion cannot have a single weight (e.g. "5.0") that is accurate for both Level 1 (100 HP) and Level 50 (5000 HP).
*   **Action:** Define weights as **Functions** of HP/Level, or stick to a "Standard Tier" baseline for balancing.

### 2. Fix the TxC/Hit Logic
The 0.00 weight for TxC is a critical bug.
*   **Action:** Verify `CombatSimulator` uses `HitChanceModule` correctly and ignores hardcoded `hitChance` if `txc` is present.

### 3. Re-Calibrate `statWeights.ts`
The current file contains "Empirical" weights (Damage=1.0) that contradict our fresh findings (Damage=0.5).
*   **Action:** Update `statWeights.ts` with the *actual* values found today (Damage 0.5, Armor 0.4) to reflect the *current* reality of the engine.

### 3.b Single Source of Truth for Weights (Dec 2025)

Following the Config-Driven Balancer work (Phase 10), weights are now **owned by** the BalancerConfig:

* Canonical values live in `DEFAULT_CONFIG.stats[statId].weight` under `src/balancing/config/defaultConfig.ts`.
* `NORMALIZED_WEIGHTS` and `STAT_WEIGHTS` in `src/balancing/statWeights.ts` now **read from** `DEFAULT_CONFIG` for all stats that exist in the config (hp, damage, txc, evasion, armor, resistance, armorPen, penPercent, lifesteal, regen, critChance, critMult, ward, etc.).
* Legacy consumers (SpellCost, BalanceConfigManager, ArchetypeBuilder presets) still import `NORMALIZED_WEIGHTS`, but the numeric values are no longer independent—they mirror the BalancerConfig defaults.
* The AutoStatBalancer and StatWeightAdvisor already operate directly on `config.stats[statId].weight` and should be considered the primary way to evolve weights.

**Implication:** when we say "update stat weights" we now mean:

1. Change `DEFAULT_CONFIG.stats[statId].weight` (or via the Balancer UI when wired).
2. Let `statWeights.ts`/`NORMALIZED_WEIGHTS` pick up those changes automatically.
3. Avoid introducing new hard-coded weight tables outside of the config.

### 4. Adopt "Standard Baselines"
Define 3 baselines for calibration:
*   **Early Game:** 100 HP, 25 Dmg (Current)
*   **Mid Game:** 1000 HP, 200 Dmg
*   **End Game:** 5000 HP, 1000 Dmg
*   Calibrate weights for each to see the scaling curve.

---

**Next Steps:**
1.  Debug TxC logic.
2.  Update `statWeights.ts` with these findings.
3.  Run calibration on Mid-Game baseline to verify scaling hypothesis.

<!-- ===== repo-snapshot/BALANCING_SYSTEM.md ===== -->

# Balancing System Documentation

## Table of Contents
1. [Philosophy](#philosophy)
2. [Core Concepts](#core-concepts)
3. [Complete Stat Reference](#complete-stat-reference)
4. [Combat Formulas](#combat-formulas)
5. [Configuration Flags](#configuration-flags)
6. [Balancing Tools](#balancing-tools)
7. [Archmage Balancing Extensions](#archmage-balancing-extensions)

---

## Philosophy

### The "Turns" Currency
The entire balancing system revolves around **Turns** as the universal currency. Every stat, item, and spell is ultimately valued by its impact on:
-   **Time to Kill (TTK)**: How many turns to defeat a balanced enemy
-   **Time to Die (TTD)**: How many turns you survive against a balanced enemy

**Balance Axiom**: A perfectly balanced character has `TTK ≈ TTD` against an equally balanced opponent, resulting in a ~50% win rate.

### HP as Weight Reference
Stat weights are expressed as **HP equivalents**:
-   `+10 Damage ≈ +50 HP` (5.0 weight)
-   `+100 Armor ≈ +500 HP` (5.0 weight)

This allows direct comparison: "Is +10 Damage better than +100 Armor?" Both are worth the same HP_eq, so they should perform similarly.

### Monte Carlo Validation
All weights are empirically validated through Monte Carlo simulations:
1.  Incrementally add a stat (e.g., +10 Damage)
2.  Use binary search to find HP_eq that restores 50% win rate
3.  Repeat for multiple increments
4.  Calculate average ratio

---

## Core Concepts

### 1. Base Stat Kit (Human Growth + Quests)

The **Base Stat Kit** identifies which stats belong to the default human template.  
These stats are:
- available when generating or growing human characters,
- exposed to quest/skill-check pools (e.g., Skill Check Lab),
- exported/imported via the `baseStat` flag in balancing config.

Designers can toggle the `baseStat` flag per stat in the Balancer UI. Any stat without the flag is ignored when building human kits or quest radar charts.

#### Flag Reference

| Flag | Meaning | Typical Stats | Notes |
|------|---------|---------------|-------|
| `baseStat: true` | Human growth/quest pool | `hp`, `damage`, `txc`, `evasion`, `baseHitChance`, `critChance`, `critMult`, `critTxCBonus` | Level-up + quest checks use solo queste stat. |
| `baseStat: false` (equip/bonus) | Solo da equip, talenti, o razze speciali | `ward`, `armor`, `resistance`, `armorPen`, `penPercent`, `lifesteal`, `regen` | Non entrano nelle quest umane; restano editabili per bozze razziali. |
| `isDetrimental: true` (“Hero Only”) | Benefici per l’eroe ma dannosi nelle quest | `failChance`, `failMult`, `failTxCMalus` (tutte anche `isPenalty`) | Filtrate dal kit umano; visibili solo nelle build giocatore. |

Derived stats (`isDerived === true`) vengono sempre trattate come `baseStat: false`, indipendentemente dal flag manuale.

#### Single Source of Truth

- **TypeScript defaults**: `src/balancing/config/defaultConfig.ts`  
- **JSON di bootstrap/import**: `src/balancing/config/balancer-default-config.json`

Entrambi contengono i flag aggiornati; il `BalancerConfigStore` applica `mergeWithDefaults + applyStatFlagDefaults` per garantire che qualsiasi import/export mantenga la semantica.  
Se servono modifiche senza passare dalla UI, editare **entrambi** i file sopra (o almeno il JSON) per evitare divergenze tra il reset iniziale e il salvataggio locale.

#### Flag & Testing Pipeline

- **Skill Check Lab** usa solo le stat con `baseStat: true` e `isDetrimental: false` per costruire i poligoni e le simulazioni (anche nelle viste alternative).
- **Stat Stress Testing / Round-Robin** importa l’elenco dei driver tramite `isStressTestCandidate`, quindi ignora automaticamente stats derivate, di equip o contrarie alle quest.  
  (Generator: `StatsArchetypeGenerator`, Harness CLI/UI: `StatStressHarness`, Dashboard UI: `StressTestDashboard`).
- Se una nuova stat deve entrare nei test, assicurarsi che `baseStat=true` e non sia marcata `isDetrimental`. Stats equip-only o penalità rimangono comunque disponibili nel Balancer ma non vengono allenate nei tool di testing.

### 2. Baseline Stats
The "Standard Enemy" used for all calculations:
```typescript
BASELINE_STATS = {
    hp: 100,
    damage: 25,
    txc: 25,
    armor: 0,
    evasion: 0,
    // ... (see baseline.ts for full list)
}
```

### 3. Derived Stats
Stats that are CALCULATED from other stats, not directly set:
-   `hitChance` = `TxC + 50 - Evasion` (clamped 1-100%)
-   `effectiveDamage` = Damage after mitigation
-   `attacksPerKo` = `HTK / (HitChance/100)`

### 4. Configuration Flags
Combat behavior can be customized via flags:
-   `configFlatFirst`: Apply Armor before or after Resistance?
-   `configApplyBeforeCrit`: Apply Mitigation before or after Crit?

---

## Complete Stat Reference

### Offensive Stats

#### Damage
-   **Description**: Raw physical/magical attack power
-   **Formula**: Base value, modified by buffs
-   **Weight**: 5.0 HP/point
-   **Example**: +10 Damage ≈ +50 HP value

#### TxC (To Hit Chance)
-   **Description**: Accuracy rating. Higher values increase hit chance.
-   **Formula**: `HitChance = TxC + 50 - Target.Evasion`
-   **Weight**: 2.0 HP/point
-   **Linearity**: 95% (nearly linear)
-   **Derived**: `Efficiency (%)` = HitChance

#### Crit Chance
-   **Description**: Probability (0-100%) to deal critical damage
-   **Formula**: `DPS Multiplier = 1 + (CritChance * (CritMult - 1))`
-   **Weight**: 4.0 HP/point
-   **Default CritMult**: 2.0 (200% damage)
-   **Example**: 20% Crit

 with x2 Mult = +20% DPS

#### Crit Multiplier
-   **Description**: Damage multiplier on critical hits
-   **Formula**: `CritDamage = BaseDamage * CritMult`
-   **Weight**: 10.0 HP/0.1 (expensive!)
-   **Example**: 2.0 → 2.5 is a +25% DPS increase (with 20% CritChance)

#### Armor Penetration (Flat)
-   **Description**: Ignores X points of enemy armor
-   **Formula**: `EffectiveArmor = max(0, Armor - ArmorPen)`
-   **Weight**: 1.5 HP/point
-   **Use Case**: Effective against low-armor enemies

#### Penetration (%)
-   **Description**: Ignores X% of enemy resistance
-   **Formula**: `EffectiveRes = max(0, Resistance - PenPercent)`
-   **Weight**: 80 HP/point (very strong!)
-   **Use Case**: Essential against high-resistance enemies

---

### Defensive Stats

#### Armor
-   **Description**: Physical damage reduction using Path of Exile formula
-   **Formula**: `Reduction = Armor / (Armor + 10 * RawDamage)`
-   **Weight**: 5.0 HP/point (tuned empirically)
-   **Linearity**: 82% (non-linear scaling)
-   **Cap**: 90% max reduction
-   **Derived**: `EHP Boost (%)` = `(Armor / (10*BaseDmg)) * 100`
-   **Example**: 250 Armor vs 25 Dmg → 50% reduction → +100% EHP

> **Why PoE Formula?**  
> EHP scales **linearly** with Armor using this formula:  
> `EHP = HP * (1 + Armor / (10*Dmg))`  
> This prevents diminishing returns and makes Armor stacking viable.

#### Resistance (%)
-   **Description**: Magical damage reduction (percentage-based)
-   **Formula**: `DamageTaken *= (1 - Resistance/100)`
-   **Weight**: 100 HP/point (extremely valuable)
-   **Example**: 20% Resistance = 20% damage reduction = +25% EHP

#### Evasion
-   **Description**: Avoidance rating. Higher values reduce enemy hit chance.
-   **Formula**: `EnemyHitChance = EnemyTxC + 50 - Evasion`
-   **Weight**: 4.0 HP/point (symmetric to TxC)
-   **Linearity**: 95%

---

### Sustain Stats

#### Lifesteal (%)
-   **Description**: Heals for X% of damage dealt
-   **Formula**: `HealPerHit = DamageDealt * (Lifesteal/100)`
-   **Weight**: 100 HP/point (empirical - very strong)
-   **TTD Impact**: Subtracts from DTPS
-   **Example**: 5% Lifesteal with 100 DPS = 5 HP/turn heal
-   **Heal Cap Policy**: l’heal ottenuto per turno non può superare la quota di TTD assegnata a sustain (es. “lifesteal può ridare al massimo 0.4 turni di TTD per round”). In pratica il cap viene calcolato in HP equivalenti usando il TTD baseline e applicato via `SustainModule.applyHealingCap`. Questo mantiene “healing feels good” senza far diventare il sustain dominante nei match prolungati.

#### Regen
-   **Description**: HP restored per turn (flat)
-   **Formula**: Adds to HP at start of each turn
-   **Weight**: 20 HP/point
-   **TTD Impact**: Subtracts from DTPS
-   **Example**: 5 Regen = 5 HP/turn
-   **Heal Cap Policy**: ogni tick di regen è limitato in base al TTD target: il cap si esprime come “% di TTD recuperabile” anziché come HP grezzi, così da evitare che regen/HoT superino l’obiettivo di sopravvivenza prefissato (es. max 0.6 turni di TTD recuperabili in prep phase). I valori sono configurabili nei moduli sustain e devono restare coerenti con `TTK ≈ TTD`.

#### Ward
-   **Description**: One-time damage shield
-   **Formula**: Absorbs damage 1:1 until depleted
-   **Weight**: 1.5 HP/point
-   **Example**: 50 Ward = 50 HP of temporary shielding

#### Block (%)
-   **Description**: Probability to completely negate an attack
-   **Formula**: `if (random() < Block%) Damage = 0`
-   **Weight**: 80 HP/point
-   **Linearity**: 75% (non-linear - probabilistic)

---

## Combat Formulas

### Order of Operations (Standard)

1.  **Start of Turn Effects**
    -   Apply Regen
    -   Apply DoT/HoT ticks
    -   Tick down buff durations

2.  **Attack Resolution**
    ```
    rawDamage = Attacker.Damage * BuffMultipliers
    
    IF configApplyBeforeCrit == FALSE (STANDARD):
        // A. Crit Roll FIRST
        isCrit = random() < CritChance
        if isCrit: rawDamage *= CritMult
        
        // B. Mitigation AFTER
        mitigation = calculateMitigation(rawDamage, Armor, Resistance, ...)
        finalDamage = rawDamage * (1 - mitigation)
    ELSE:
        // Rare: Mitigation BEFORE Crit
        mitigation = calculateMitigation(rawDamage, Armor, Resistance, ...)
        mitigatedDamage = rawDamage * (1 - mitigation)
        
        isCrit = random() < CritChance
        if isCrit: finalDamage = mitigatedDamage * CritMult
        else: finalDamage = mitigatedDamage
    
    // C. Hit Chance
    hitChance = TxC + 50 - Evasion
    if random() > hitChance: finalDamage = 0
    
    // D. Apply Damage
    target.HP -= finalDamage
    
    // E. Lifesteal
    attacker.HP += finalDamage * (Lifesteal / 100)
    ```

3.  **End of Turn**
    -   Check for death
    -   Increment turn counter

### Mitigation Formula

```typescript
function calculateMitigation(
    rawDamage: number,
    armor: number,
    resistance: number, // 0-100 percentage
    armorPen: number,
    penPercent: number,
    flatFirst: boolean
): number {
    // 1. Effective Stats (after penetration)
    effArmor = max(0, armor - armorPen)
    effRes = max(0, resistance - penPercent)
    
    // 2. Calculate Reductions
    armorReduction = effArmor / (effArmor + 10 * rawDamage) // PoE formula, capped at 90%
    resReduction = effRes / 100
    
    // 3. Apply in Order
    if (flatFirst) {
        damage = rawDamage * (1 - armorReduction) * (1 - resReduction)
    } else {
        damage = rawDamage * (1 - resReduction) * (1 - armorReduction)
    }
    
    return max(1, damage) // Minimum 1 damage
}
```

> **Order Matters!**  
> Armor reduction depends on raw damage. If applied after Resistance, the effective damage is lower, so Armor is more effective.

---

## Combat Turn & Simulation Overview

### 1. Filosofia di base
- **Moneta universale**: i turni sono convertiti in HP equivalenti; ogni stat, buff o malus si misura per l’impatto su TTK/TTD.
- **Obiettivo di bilanciamento**: in uno scontro 1v1 tra pari livello la baseline è `TTK ≈ TTD`, quindi ~50% di win rate. Tutte le spell/armi/armature devono convergere su questa metrica.

### 2. Sequenza di un turno
1. **Prep Phase** – incremento contatore turni, logging e raccolta delle entità vive.
2. **Sustain Phase** – applica regen e cap di healing tramite `SustainModule`.
3. **Status Effects Phase** – DoT/HoT e tick dei debuff gestiti da `StatusEffectManager`.
4. **Initiative Phase** – ordine dei turni determinato dall’`InitiativeModule` (solo runtime; nei calcoli deterministici l’ordine è ignorato).
5. **Action Phase** – controlli su stun/silence/CC, AI che decide spell buff/debuff o attacco base, applicazione di hit chance, crit, mitigazione, lifesteal e logging.
6. **Basic Attack Fallback** – se nessuna spell è lanciata si calcola il danno base usando le stat effettive e i modificatori correnti.
7. **End Turn / Win Check** – verifica delle morti e aggiornamento dei timer TTK/TTD.

### 3. Strati di simulazione e bilanciamento
#### 3.1 Deterministic Math Engine
- Funzione: `simulateExpectedTTK`.
- Input: valori attesi delle stat (EDPT, buff, lifesteal, regen).
- Output: TTK/TTD senza RNG (crit/hit/lifesteal mediati, regen a fine turno). Ideale per UI, anteprime e calcolo dei pesi.

#### 3.2 Monte Carlo / Combat Simulator
- Funzione: `CombatSimulator.simulate` (interna a `runMonteCarlo`).
- Input: stesso `resolveCombatRound` del runtime con RNG seedato.
- Output: distribuzione completa (TTK, win rate, overkill, edge case). Usato per validare empiricamente i pesi e scoprire outlier.

Entrambi gli strati condividono `DEFAULT_1V1_CONFIG`, così preview deterministiche e simulazioni statistiche restano allineate al comportamento runtime.

### 4. Variabili chiave
- **TTK**: turni medi necessari per uccidere l’avversario.
- **TTD**: turni medi prima di morire.
- **HP equivalenti**: unità comune che permette di confrontare stats offensive/defensive/sustain.
- **Overkill**: danno sprecato, utile per misurare burst inefficiente.
- **Timeout Policy / Sudden Death**: regole di pareggio e moltiplicatori danno per stoppare loop infiniti.

### 5. Spell / Equip Integration
- Spell, armi e armature generano gli input del motore di combattimento (`StatBlock`).
- Qualsiasi modifica (danni, buff, AoE, trigger) aggiorna TTK/TTD in modo lineare o scalato in base ai pesi configurati.
- Il motore restituisce il “valore in HP” di ogni stat/bonus, mantenendo il single source of truth con i moduli di bilanciamento.

### 6. Metriche di output
- TTK medio, TTD medio, win rate e overkill.
- Facoltativo ma consigliato: analisi dell’impatto front-loaded vs back-loaded per capire dove cade la potenza di una build nel timeline.
- Tutte le metriche sono calcolate come valori medi per semplificare il tuning di spell e archetipi.

### 7. Consigli di implementazione
- Rispettare sempre l’ordine delle fasi documentato per avere preview affidabili nelle UI.
- Usare l’engine deterministico per valutare i pesi delle stats e i costi (niente RNG → risultati stabili).
- Eseguire Monte Carlo solo per edge case, regressioni e validazione empirica dei win rate.
- Dichiarare cap/limiti (regen, lifesteal, CC duration) come HP equivalenti nelle config per evitare hardcoding locale.

### 8. Applicazione pratica (Windsurf / AI tooling)
- Qualsiasi entità (player, boss, mob) viene ridotta a input numerici del motore.
- Ogni spell/equip può essere valutato in termini di impatto sui turni, generando prompt del tipo: “Crea una spell che riduca il TTK avversario di 1 turno senza aumentare il TTD del caster”.
- Le AI possono usare gli output TTK/TTD per tarare power, mana cost, cooldown e scaling mantenendo il vincolo `TTK ≈ TTD`.

---

## Configuration Flags

### configFlatFirst
-   **Default**: `true`
-   **Effect**: Determines if Armor (flat) is applied before or after Resistance (%)
-   **Use Case**: 
    -   `true` (standard): Armor reduces first, then Resistance
    -   `false` (alternate): Resistance reduces first, then Armor (makes Armor stronger)

### configApplyBeforeCrit
-   **Default**: `false`
-   **Effect**: Determines if Mitigation is applied before or after Crit
-   **Use Case**:
    -   `false` (standard): Crit amplifies pre-mitigation damage (standard RPG)
    -   `true` (rare): Mitigation applies first, then Crit amplifies the mitigated value (less variance)

---

## Balancing Tools

### 1. Monte Carlo Simulator
-   **Path**: `src/balancing/simulation/MonteCarloSimulation.ts`
-   **Purpose**: Runs thousands of simulated battles to measure win rates
-   **Usage**: `npm run calibrate <stat> [increment] [iterations]`

### 2. Stat Value Analyzer
-   **Path**: `src/balancing/simulation/StatValueAnalyzer.ts`
-   **Purpose**: Auto-calibrates stat weights using binary search
-   **Algorithm**:
    1.  Add +X to stat
    2.  Find HP_eq that restores 50% win rate
    3.  Weight = HP_eq / X

### 3. Combat Predictor
-   **Path**: `src/balancing/modules/combatPredictor.ts`
-   **Purpose**: Calculates TTK and TTD analytically (without simulation)
-   **Use Case**: Real-time UI feedback in Spell Creator

### 4. Spell Creator
-   **Path**: `src/ui/spell/SpellCreation.tsx`
-   **Purpose**: Interactive balancing UI
-   **Features**:
    -   "Smart Stats": Shows derived values (Efficiency, EHP Boost, DPS Multiplier)
    -   Combat Preview: Shows TTK vs TTD in real-time
    -   Balance Score: Target vs Actual HP cost

---

## Example: Full Combat Calculation

```typescript
// Attacker Stats
const attacker = {
    damage: 30,
    txc: 25,
    critChance: 20,
    critMult: 2.0,
    armorPen: 0,
    penPercent: 0
};

// Defender Stats
const defender = {
    hp: 100,
    armor: 100,
    resistance: 0,
    evasion: 0,
    configFlatFirst: true
};

// 1. Crit Roll (BEFORE mitigation)
const isCrit = random() < 0.20; // 20% chance
let rawDmg = isCrit ? 30 * 2.0 : 30; // Crit: 60, Normal: 30

// 2. Mitigation (PoE formula for Armor)
const armorReduction = 100 / (100 + 10 * rawDmg);
// If Crit (60 dmg): 100/(100+600) = 14.3%
// If Normal (30 dmg): 100/(100+300) = 25%
const finalDmg = rawDmg * (1 - armorReduction);
// If Crit: 60 * 0.857 = 51.4
// If Normal: 30 * 0.75 = 22.5

// 3. Hit Chance
const hitChance = 25 + 50 - 0 = 75%;
if (random() > 0.75) finalDmg = 0; // Miss!

// 4. Apply
defender.hp -= finalDmg;
```

---

## Archmage Balancing Extensions

### Spell Lifecycle Balancing

Spell-creatures progress through lifecycle stages (infant, juvenile, mature) with different stat configurations. Each stage uses weight-based ticks for attributes like power, mana cost, mood, and training difficulty. Progression costs are expressed in turns currency, validated empirically via Monte Carlo simulations to ensure balanced growth curves.

Example: Infant stage might have low power but high mood variability, while mature stage offers optimized power with stable mood.

### Mental Palace Balancing

Mental palace rooms are balanced using HP equivalents for strategic depth:

- **Mana Generation Rate**: Weight expressed as HP_eq per turn (e.g., +10 mana/turn ≈ +50 HP)
- **Creature Capacity**: Weight for maximum creatures housed
- **Defense Rating**: Weight for resisting demonic incursions

Room expansion costs use the same turns currency, with Monte Carlo validation ensuring that palace upgrades provide measurable strategic advantages without dominating gameplay.

See `docs/archmage/GameplayPillars.md` for full mechanics.

---

## Links
-   [Stat Weights Database](../balancing/statWeights.ts)
-   [Baseline Stats](../balancing/baseline.ts)
-   [Combat Logic](../engine/combat/logic.ts)
-   [Monte Carlo Testing](../balancing/simulation/MonteCarloSimulation.test.ts)

<!-- ===== repo-snapshot/STAT_BALANCING_ANALYSIS.md ===== -->

# Project-Specific Stat Balancing Analysis
**RPG Balancer - Combat Simulation & Weight Calibration Strategy**

**Date:** 2025-11-28  
**Purpose:** Targeted analysis of stat balancing methodology for THIS project's specific architecture and philosophy

> **🚨 CRITICAL RULE: ZERO HARDCODING**
> 
> All baseline stats, formulas, and configurations MUST be imported from existing modules.
> **NEVER define stats manually** - always use:
> - `BASELINE_STATS` from `src/balancing/baseline.ts`
> - `DEFAULT_STATS` from `src/balancing/types.ts`
> - Formulas from `src/balancing/modules/*`
> 
> This is the **SINGLE SOURCE OF TRUTH** principle.

---

## 🎯 Project Context & Philosophy

### Core System: Weight-Based Creator Pattern

**Formula:**
```
Balance = Σ(selected_weights) - Target_Budget
```

**Key Principle:** HP as Universal Currency
- All stats measured in "HP equivalency"
- Baseline: **1 Damage = 4 HP** (current empirical ratio from simulations)
- Weight = "How many HP is this stat worth?"

### Current Stat System

**From `statWeights.ts` Analysis:**

| Stat | Weight (HP per point) | Confidence | Linearity | Notes |
|------|----------------------|------------|-----------|-------|
| `hp` | 1.0 | 1.00 | Perfect | Reference stat |
| `damage` | 5.0 | 0.98 | 0.99 | Very linear, auto-calibrated |
| `armor` | 5.0 | 0.95 | 0.82 | **Non-linear (PoE formula)** |
| `resistance` | 5.0 | 0.90 | 0.88 | % based, strong |
| `txc` (accuracy) | 2.0 | 0.92 | 0.95 | Hit chance modifier |
| `evasion` | 4.0 | 0.92 | 0.95 | Symmetric to txc |
| `critChance` | 4.0 | 0.90 | 0.93 | % based (with 2x mult) |
| `lifesteal` | 100.0 | 0.98 | 0.87 | Extremely valuable |
| `regen` | 20.0 | 0.97 | 0.91 | Per-turn healing |

---

## 📊 Research-Based Insights for THIS Project

### 1. Path of Exile Formula Integration

**Current Implementation (CORRECT):**
```typescript
// src/balancing/modules/mitigation.ts
armorReduction = armor / (armor + 10 * damage)
// Capped at 90%
```

**Why This Matters for Weight-Based System:**
- ✅ Armor value changes based on incoming damage
- ❌ Makes armor weight NON-LINEAR (0.82 linearity score confirms this)
- 🎯 **Implication:** Armor's HP equivalency varies by combat scenario

**Recommendation for Simulation:**
```typescript
// When calculating stat value via simulation:
// Test armor at MULTIPLE damage levels
const testDamageLevels = [10, 20, 50, 100, 200];
testDamageLevels.forEach(dmg => {
  // Run 10k sims with attacker.damage = dmg
  // Calculate armor's effective HP value
  // Average across all damage levels
});
```

### 2. Effective Health Points (EHP) Philosophy

**Formula (from research):**
```
EHP = HP / (1 - damage_reduction)
```

**Applied to THIS Project:**
```typescript
// For a tank with:
const stats = {
  hp: 1000,
  armor: 500,  
  resistance: 50,  // 50%
};

// Against 100 damage attack:
armorReduction = 500 / (500 + 10*100) = 0.33 (33%)
resistanceReduction = 0.50 (50%)

// Apply in order (flatFirst flag):
if (flatFirst) {
  damageAfterArmor = 100 * (1 - 0.33) = 67
  finalDamage = 67 * (1 - 0.50) = 33.5
} else {
  damageAfterRes = 100 * (1 - 0.50) = 50
  finalDamage = 50 * (1 - 0.33) = 33.5
}

// EHP calculation:
EHP = 1000 / (33.5 / 100) = ~2985 HP
```

**Weight Calibration Implication:**
- Armor + Resistance **MULTIPLY** their effectiveness
- **Current weights (both 5.0) may UNDERVALUE defensive stacking**

---

## 🔬 Simulation-Based Calibration Strategy

### Method 1: Binary Search for Equilibrium (RECOMMENDED)

**Goal:** Find stat value that produces 50% win rate#### **STEP 1: Importare Baseline (MAI Hardcodare)**

```typescript
// ✅ CORRETTO: Importa da modulo esistente
import { BASELINE_STATS } from '../baseline';
import type { StatBlock } from '../types';

// Entità di riferimento (validata con 10k simulazioni)
const baseline: StatBlock = BASELINE_STATS;

// ❌ MAI FARE COSÌ:
// const baseline = { hp: 100, attack: 20, ... }  // VIOLAZIONE!
```

**Perché questo è critico:**
- `BASELINE_STATS` è già validato (50.05% win rate)
- Contiene TUTTE le stat necessarie per `StatBlock`
- Se cambiano le formule, baseline si aggiorna automaticamente(high - low > 0.1) {
    const mid = (low + high) / 2;
    
    // Test: baseline vs baseline with +mid of stat
    const challenger = { ...baseline, [stat]: baseline[stat] + mid };
    
```typescript
// Simulazione: BASELINE_STATS vs Challenger
const result = MonteCarloSimulation.run({
  combat: {
    entity1: BASELINE_STATS,
    entity2: challenger,
    turnLimit: 100
  },
  iterations: 10000  // 10k combattimenti
});
    
    const winRate = result.summary.winRates.entity2;
    
    if (winRate > 0.51) {
      high = mid; // Stat too strong
    } else if (winRate < 0.49) {
      low = mid; // Stat too weak
    } else {
      break; // Found equilibrium!
    }
  }
  
  const equilibriumValue = (low + high) / 2;
  
  // HP equivalency = how much HP gives same power
  return equilibriumValue / baseline.hp; // Weight in HP per stat point
}
```

### Method 2: Marginal Value Analysis

**Test increments instead of absolute values:**

```typescript
function calculateMarginalValue(stat: string): number[] {
  const baseline = BASELINE_STATS;
  const increments = [1, 5, 10, 20, 50];
  const marginalValues = [];
  
  for (const inc of increments) {
    const modified = { ...baseline, [stat]: baseline[stat] + inc };
    
    const result = MonteCarloSimulation.run({
      combat: { entity1: baseline, entity2: modified, turnLimit: 100 },
      iterations: 5000
    });
    
    // HP margin = average HP remaining for winner
    const avgHPMargin = calculateAvgHPMargin(result);
    
    // HP value per stat point
    marginalValues.push(avgHPMargin / inc);
  }
  
  return marginalValues; // Check for diminishing returns
}
```

---

## 🎯 Specific Recommendations for THIS Project

### Priority 1: Validate Current Weights via Simulation

**Action:** Run auto-calibration for all core stats

```typescript
// File: src/balancing/simulation/AutoCalibrator.ts
const statsToCalibrate = [
  'damage', 'armor', 'resistance', 'txc', 'evasion',
  'critChance', 'lifesteal', 'regen'
];

const calibrationResults = {};

for (const stat of statsToCalibrate) {
  calibrationResults[stat] = {
    currentWeight: CORE_STAT_WEIGHTS[stat].avgRatio,
    simulatedWeight: calibrateStatWeight(stat),
    discrepancy: Math.abs(current - simulated),
    recommendation: discrepancy > 1.0 ? 'ADJUST' : 'OK'
  };
}

// Export report
exportCalibrationReport(calibrationResults);
```

### Priority 2: Account for Defensive Layering

**Issue:** Armor + Resistance stack multiplicatively

**Test Case:**
```typescript
// ✅ CORRETTO: Usa baseline importato
import { BASELINE_STATS } from '../baseline';

// Voglio sapere: "Quanti HP valgono 10 punti armor?"

// Creo variante con +10 armor
const challenger: StatBlock = {
  ...BASELINE_STATS,
  armor: BASELINE_STATS.armor + 10  // +10 rispetto a baseline
};
// Run 10k sims for each
// Compare EHP
// Adjust weights if Scenario C DRASTICALLY outperforms A+B
```

**Expected Finding:**
- If defensive stacking is overpowered, reduce armor/resistance weights
- If armor/resistance are independent, current weights OK

### Priority 3: Combat Duration Sensitivity

**Ob servation from weights:**
```
regen: 20.0 HP  // Per-turn
lifesteal: 100.0 HP // % based
```

**Regen is MUCH stronger than expected** because:
- Triggers every turn (guaranteed)
- Longer combat = more value
- Linear scaling with turns

**Test:**
```typescript
// Run sims with different turn limit caps
const turnLimits = [10, 20, 50, 100];

for (const limit of turnLimits) {
  // Test regen value at each limit
  // Check if weight should scale with turn limit
}
```

**Recommendation:**
- Consider **dynamic weights** based on expected combat duration
- OR: Set turn limit as a balancing constant (e.g., always 50 turns)

### Priority 4: Offensive vs Defensive Ratio

**Research Finding:** Balance depends on game mode (hardcore = more defense)

**For THIS Project:**
```typescript
// Define target ratios for different build types
const archetypeRatios = {
  tank: { offense: 0.3, defense: 0.7 },
  dps: { offense: 0.7, defense: 0.3 },
  balanced: { offense: 0.5, defense: 0.5 }
};

// Test: Do weights produce these ratios naturally?
function validateArchetypeBalance(archetype: string) {
  const stats = buildArchetype(archetype);
  
  const offensivePower = 
    stats.damage * WEIGHTS.damage +
    stats.critChance * WEIGHTS.critChance;
    
  const defensivePower =
    stats.hp * WEIGHTS.hp +
    stats.armor * WEIGHTS.armor +
    stats.resistance * WEIGHTS.resistance;
    
  const actualRatio = offensivePower / (offensivePower + defensivePower);
  const expectedRatio = archetypeRatios[archetype].offense;
  
  return Math.abs(actualRatio - expectedRatio) < 0.1; // Within 10%
}
```

---

## 🛠️ Implementation Roadmap

### Phase 1: Validation (1-2 days)
- [ ] Run binary search calibration for all stats
- [ ] Compare simulated weights vs current weights
- [ ] Generate discrepancy report
- [ ] Identify stats that need adjustment

### Phase 2: Refinement (2-3 days)
- [ ] Test defensive stacking scenarios
- [ ] Measure combat duration impact on sustain stats
- [ ] Test archetype ratio validation
- [ ] Adjust weights based on findings

### Phase 3: Documentation (1 day)
- [ ] Update `statWeights.ts` with new empirical data
- [ ] Document calibration methodology
- [ ] Create "last calibrated" timestamps
- [ ] Add confidence intervals to all weights

### Phase 4: Continuous Calibration (ongoing)
- [ ] Create automated weight calibration CLI tool
- [ ] Run weekly calibrations as combat formulas evolve
- [ ] Track weight drift over time
- [ ] Alert when weights deviate >10% from expected

---

## 📐 Formula Recommendations

### Stat Value Equivalency (for UI Display)

```typescript
// Show users: "10 Armor ≈ 50 HP"
function displayStatEquivalency(stat: string, value: number): string {
  const weight = getStatWconsole.log(`\n✅ RISULTATO:`);
console.log(`+5 Attack richiede +${finalHP - BASELINE_STATS.hp} HP per equilibrio`);
console.log(`Peso: 1 Attack = ${damageWeight.toFixed(1)} HP`);
console.log(`\nBaseline usato: hp=${BASELINE_STATS.hp}, damage=${BASELINE_STATS.damage}`);
console.log(`Source: src/balancing/baseline.ts (validated 2025-11-23)`);
}
```

### Balance Score (for Creator UI)

```typescript
// Current: just sum - budget
// Improved: normalize by budget
function calculateBalanceScore(stats: StatConfig, budget: number): number {
  const totalCost = calculateTotalCost(stats);
  const balance = totalCost - budget;
  
  // Normalize: -1.0 to +1.0 scale
  const normalizedBalance = balance / budget;
  
  // Color code:
  // Green: [-0.05, +0.05] (within 5%)
  // Yellow: [-0.15, -0.05] or [+0.05, +0.15]
  // Red: outside ±15%
  
  return normalizedBalance;
}
```

---

## 🚨 Critical Warnings

### ⚠️ Non-Linear Stats (Armor)

**Current Issue:**
- Armor weight is 5.0 (constant)
- But armor effectiveness varies with damage
- Weight should reflect AVERAGE case, not best case

**Solution:**
```typescript
// When calibrating armor:
const damageLevels = [10, 20, 50, 100, 200]; // 4. Calcolo peso
const damageWeight = (finalHP - BASELINE_STATS.hp) / 5; // +5 attack testatomageLevel(dmg)
);

// Use median or weighted average
const finalArmorWeight = median(armorWeights);
```

### ⚠️ Interaction Effects

**Crit Chance + Crit Multiplier:**
- Currently weighted independently
- But they multiply together
- **crit_value = crit_chance × (crit_mult - 1.0) × base_damage**

**Recommendation:**
- Test in combination
- Adjust weights based on typical multiplier (e.g., 1.5x)

### ⚠️ Percentage vs Flat Stats

**Resistance (%) vs Armor (flat):**
- Different scaling curves
- Don't compare directly
- Always test in realistic scenarios

---

## 🎓 Learning from Path of Exile

**What to ADOPT:**
1. ✅ Defensive layering (already doing via armor + resistance)
2. ✅ Damage-dependent mitigation (already using PoE armor formula)
3. ✅ Cap defensive stats at 90% (already implemented)

**What to AVOID:**
1. ❌ Too many interconnected mechanics (keeps weights simple)
2. ❌ Unclear stat scaling (your linear weights are better)
3. ❌ Hidden calculations (your weight-based system is transparent)

**What THIS Project Does BETTER:**
- ✅ Explicit weight-based balancing (easier to understand)
- ✅ User-defined baselines (more flexible)
- ✅ Simulation-driven validation (data > guessing)

---

## 📚 References (Tailored to THIS Project)

**Your Existing Files:**
- `src/balancing/statWeights.ts` - Current weight database
- `src/balancing/modules/mitigation.ts` - PoE armor formula
- `src/balancing/simulation/CombatSimulator.ts` - Testing engine
- `docs/PROJECT_PHILOSOPHY.md` - Weight-based creator pattern

**Research Applied:**
- Path of Exile: Armor formula mechanics
- EHP Theory: Defensive layering principles
- Simulation-Based Tuning: Monte Carlo calibration

---

**Next Action:** Implement `AutoCalibrator.ts` to validate all current weights via simulation and generate adjustment recommendations.

<!-- ===== repo-snapshot/COMBAT_SYSTEM_DESIGN.md ===== -->

# Combat System & Encounter Design Specification

**Auditor:** Gemini Antigravity  
**Date:** 2025-11-23  
**Next Review:** After test implementation

---

## 8. 1v1 Combat Viewer (Upcoming)

- **Objective:** Provide an interactive page that replays deterministic duels (and future multi-unit skirmishes) using existing combat engine outputs.
- **Data Flow:** `CombatSimulator` emits enriched `turnByTurnLog` + per-entity metrics that `useCombatPlayback` (new hook) will normalize into animation frames (@see `docs/plans/1v1_combat_viewer_plan.md`).
- **Presentation:** Config-driven fighter sprites (idle/attack/hit states), timeline scrubber for turn/phase navigation, and split-pane telemetry (TTK, DPS, hit/crit %, status uptime).
- **Extensibility:** Layout logic treats `teamA`/`teamB` as arrays from the start, unlocking >1 entity per side without refactors; targeting overlays and multi-target actions will reuse the same frame schema.
- **Design Guardrails:** No hardcoded stats or sprites—pull everything from balancing config and archetype presets; animations only react to state transitions to keep simulation logic centralized.
 Planned

---

## Archmage Duel Integration

The duel mechanics described in this document form the foundation for Archmage expedition combats. Spell-creatures use similar HP, damage, crit, and evasion systems, but with creature-specific attributes and mood-based modifiers. The 1v1 Combat Viewer can be extended to visualize creature duels.

The remainder of this document focuses on PunchClub legacy archetypes and combat, which may be archived once Archmage systems are fully implemented. See `docs/archmage/GameplayPillars.md` for expedition duel mechanics.

---

## 1. Core Archetypes

### 1.1 Archetype Definitions

Each archetype has distinct stat priorities, scaling patterns, and tactical roles.

#### **Tank (Juggernaut)**
- **Base Stats:** HP 200, Armor 30, Resistance 20, Damage 25, Agility 5
- **Scaling Priority:** HP > Armor > Block > Resistance
- **Role:** Absorb damage, create space, protect allies
- **Gameplay:** High durability, low mobility, zone control
- **Balance Priority:** Must survive 3+ DPS rotations, but deal <40% of DPS damage
- **Testing:** 1v1 vs DPS should last 8-12 turns, lose slowly

#### **DPS (Berserker)**
- **Base Stats:** HP 120, Damage 45, Crit Chance 15%, Crit Mult 1.8x, Agility 12
- **Scaling Priority:** Damage > Crit > ArmorPen > TxC
- **Role:** High burst damage, glass cannon
- **Gameplay:** High risk/reward, positioning critical
- **Balance Priority:** Must kill Tank in 10-15 turns, but die to Assassin in 4-6
- **Testing:** 1v1 vs Tank = win in 12±2 turns, vs Assassin = lose in 5±1 turns

#### **Assassin (Shadowblade)**
- **Base Stats:** HP 110, Damage 40, Evasion 25%, Crit Chance 20%, Agility 18
- **Scaling Priority:** Evasion > Crit > Damage > Agility
- **Role:** Eliminate high-value targets quickly
- **Gameplay:** Hit-and-run, punish mistakes
- **Balance Priority:** Counter DPS, vulnerable to AoE and Tank CC
- **Testing:** 1v1 vs DPS = win in 5±1 turns via evasion + crit burst

#### **Support (Cleric)**
- **Base Stats:** HP 140, Healing 30/turn, Mana Regen 15/turn, Resistance 25
- **Scaling Priority:** Healing > Mana > Resistance > HP
- **Role:** Sustain, buff, debuff, utility
- **Gameplay:** Multiply team effectiveness, poor solo damage
- **Balance Priority:** Heal = 60% of DPS damage/turn, survives 1v1 vs DPS for 15+ turns
- **Testing:** 1v1 vs DPS = stalemate or slow loss after mana exhaustion

#### **Bruiser (Brawler)**
- **Base Stats:** HP 160, Damage 35, Armor 15, Lifesteal 12%, Agility 10
- **Scaling Priority:** Lifesteal > HP > Damage > Armor
- **Role:** Self-sufficient frontline, sustained damage
- **Gameplay:** Balanced offense/defense, duel specialist
- **Balance Priority:** Beat Tank 1v1, lose to kiting DPS or Assassin burst
- **Testing:** 1v1 vs Tank = win in 10-12 turns, vs DPS = 50/50 depending on engagement

---

## 2. Combat System Mechanics

### 2.1 Turn Order (Initiative System)

```typescript
initiative = baseAgility + random(0, 10) + statusModifiers
turnOrder = entities.sortBy(initiative, DESC)
```

- **Re-roll each round** (dynamic initiative)
- **Agility** provides consistent speed advantage but allows upsets
- **Stun/Slow** reduces initiative by 50%
- **Haste** increases initiative by 30%

### 2.2 Hit Calculation

```typescript
hitChance = baseAccuracy + attackerTxC - defenderEvasion
finalHitChance = clamp(hitChance, 5%, 95%) // Always 5% miss, 5% hit
roll = random(0, 100)
isHit = roll <= finalHitChance
```

### 2.3 Damage Calculation

#### Physical Damage
```typescript
baseDamage = attackerDamage * skillMultiplier
armorReduction = defenderArmor / (defenderArmor + 100)
mitigatedDamage = baseDamage * (1 - armorReduction)
finalDamage = mitigatedDamage * (1 - blockChance ? 0.5 : 0)
```

#### Magical Damage
```typescript
baseDamage = attackerIntelligence * spellPower
resistanceReduction = defenderResistance / (defenderResistance + 100)
mitigatedDamage = baseDamage * (1 - resistanceReduction)
finalDamage = mitigatedDamage * (ward > 0 ? 0 : 1) // Ward blocks 1 spell
```

### 2.4 Critical Hits

```typescript
isCrit = random(0, 100) <= critChance
critDamage = baseDamage * critMultiplier
```

### 2.5 Status Effects

| Status | Effect | Duration | Stackable |
|--------|--------|----------|-----------|
| **Stun** | Skip turn, -50% initiative next turn | 1 turn | No |
| **Burn** | -10% max HP per turn, ignores armor | 3 turns | Yes (3 max) |
| **Poison** | -5% current HP per turn | 5 turns | Yes (5 max) |
| **Slow** | -30% initiative, -2 movement | 2 turns | No |
| **Bleed** | -15 flat damage/turn, scales with damage dealt | 4 turns | Yes (2 max) |

### 2.6 Combat Logging

```typescript
interface CombatEvent {
  turn: number;
  actor: string;
  action: 'attack' | 'spell' | 'move' | 'status';
  target?: string;
  damage?: number;
  healing?: number;
  status?: StatusEffect;
  hit?: boolean;
  crit?: boolean;
}
```

**Telemetry Metrics:**
- Average damage per turn (ADPT)
- Time to kill (TTK)
- Hit rate %
- Crit rate %
- Damage mitigated
- Healing done
- Status effect uptime

---

## 3. Spell System

### 3.1 Base Spell List (Phase 1)

#### Offensive
| Spell | Type | Target | Scaling | Effect |
|-------|------|--------|---------|--------|
| **Strike** | Physical | Single | 100% ATK | Basic attack |
| **Fireball** | Magical | Single | 120% INT | High damage, 10% burn |
| **Poison Dart** | Magical | Single | 80% INT | Apply Poison (5 turns) |
| **Execute** | Physical | Single | 150% ATK | +50% vs <30% HP targets |

#### Defensive/Utility
| Spell | Type | Target | Effect |
|-------|------|--------|--------|
| **Heal** | Restore | Single | Restore 40% max HP |
| **Shield** | Buff | Self | +50% armor for 2 turns |
| **Cleanse** | Utility | Single | Remove 1 debuff |

#### Control
| Spell | Type | Target | Effect |
|-------|------|--------|--------|
| **Stun Strike** | Physical | Single | 70% ATK + Stun (1 turn) |
| **Slow** | Debuff | Single | -30% initiative for 2 turns |

### 3.2 Spell Variants (Phase 2+)

Each base spell can have variants:
- **Single Target** vs **AoE** (2.0x cost, 0.65x damage per target)
- **Burst** (150% damage, 3-turn cooldown) vs **DoT** (100% over 4 turns)
- **Ignore 50% Resistance** (1.5x cost)
- **Ignore 100% Armor** (2.5x cost, -40% damage)
- **Debuff Hybrid** (80% damage + status effect)

**Example:**
- **Fireball** → **Meteor** (AoE, 0.65x per target, 10% burn all)
- **Heal** → **Mass Heal** (AoE, 25% per target)
- **Strike** → **Armor Break** (80% damage, -20 armor for 3 turns)

### 3.3 Scaling Formulas

```typescript
spellDamage = basePower * (1 + relevantStat / 100)
spellCost = baseCost * costMultiplier * (AoE ? 2.0 : 1.0)
cooldown = baseCooldown + (powerful ? 2 : 0)
```

---

## 4. Testing & Balancing Framework

### 4.1 Automated 1v1 Simulation Suite

```typescript
function runBalanceTests() {
  const matchups = generateAllPairs(archetypes);
  const results = [];
  
  for (const [a, b] of matchups) {
    const outcome = simulateCombat(a, b, iterations=1000);
    results.push({
      matchup: `${a.name} vs ${b.name}`,
      winRate: outcome.aWins / 1000,
      avgTTK: outcome.avgTurns,
      avgDamagePerTurn: outcome.totalDamage / outcome.totalTurns
    });
  }
  
  return validateBalance(results);
}
```

### 4.2 Balance Validation Criteria

| Matchup | Expected Win Rate | Expected TTK | Tolerance |
|---------|-------------------|--------------|-----------|
| Tank vs DPS | 30-40% | 10-15 turns | ±15% |
| DPS vs Assassin | 35-45% | 5-7 turns | ±10% |
| Assassin vs Tank | 55-65% | 12-18 turns | ±20% |
| Support vs DPS | 20-30% | 12-20 turns | ±20% |
| Bruiser vs Tank | 60-70% | 10-14 turns | ±15% |

### 4.3 Iterative Tuning Process

1. **Run baseline simulation** (1000 iterations per matchup)
2. **Identify outliers** (>20% deviation from target)
3. **Adjust stat weights** (HP, Armor, Damage, Evasion)
4. **Re-run simulation**
5. **Log delta** (% change in win rate, TTK)
6. **Repeat until convergence** (<5% deviation)

### 4.4 Telemetry Dashboard

Real-time metrics exposed by combat engine:
- Win rate matrix (NxN heatmap)
- TTK distribution (histogram)
- Damage breakdown (physical vs magical, mitigated vs actual)
- Status effect effectiveness (% uptime, damage contribution)
- Spell usage frequency
- Critical moment analysis (turn where battle outcome decided)

---

## 5. Grid-Based Combat (Phase 2)

### 5.1 Coordinate System

```typescript
interface Position {
  x: number; // 0-7
  y: number; // 0-7
}

interface GridEntity extends Entity {
  position: Position;
  movementRange: number; // Based on agility
  attackRange: number; // Melee=1, Ranged=3-5
}
```

### 5.2 Movement Mechanics

- **Movement Points = Agility / 5** (rounded)
- **Movement Cost = 1 per tile** (diagonal = 1.4)
- **Pathfinding:** A* algorithm, avoid occupied tiles
- **Opportunity Attacks:** Moving away from melee range triggers free attack

### 5.3 Range & Line of Sight

```typescript
function inRange(attacker: GridEntity, target: GridEntity): boolean {
  const distance = euclideanDistance(attacker.pos, target.pos);
  return distance <= attacker.attackRange;
}

function hasLineOfSight(from: Position, to: Position, grid: Grid): boolean {
  return raycast(from, to, grid).every(tile => !tile.blocksLOS);
}
```

### 5.4 Basic AI

```typescript
function selectAction(entity: GridEntity, enemies: GridEntity[]): Action {
  const inRangeTargets = enemies.filter(e => inRange(entity, e));
  
  if (inRangeTargets.length > 0) {
    return { type: 'attack', target: inRangeTargets[0] };
  } else {
    const nearest = findNearestEnemy(entity, enemies);
    return { type: 'move', path: calculatePath(entity.pos, nearest.pos) };
  }
}
```

---

## 6. Multi-Unit Combat (Phase 3)

### 6.1 Party Composition (5v5 / 5vMany)

**Standard 5-Hero Party:**
1. Tank (frontline)
2. Support (backline)
3. DPS (mid/backline)
4. Bruiser (frontline/mid)
5. Assassin (flex)

### 6.2 AoE Mechanics

```typescript
function applyAoE(spell: Spell, center: Position, radius: number) {
  const targets = getAllEntitiesInRadius(center, radius);
  targets.forEach(t => {
    const damage = spell.baseDamage * 0.65; // AoE penalty
    applyDamage(t, damage);
  });
}
```

### 6.3 Buff/Debuff System

```typescript
interface Buff {
  id: string;
  source: string; // Caster ID
  target: string;
  type: 'stat_modifier' | 'damage_over_time' | 'immunity';
  stat?: string; // e.g., 'damage', 'armor'
  value: number;
  mode: 'additive' | 'multiplicative';
  duration: number; // turns
  stackable: boolean;
}
```

**Examples:**
- **Battle Cry:** +20% damage to all allies (3 turns)
- **Armor Shred:** -30 armor to target (4 turns, stackable 3x)
- **Fortify:** +50 armor to self (2 turns)

### 6.4 Synergies

| Combo | Effect |
|-------|--------|
| Tank + Support | Tank gets +30% healing, Support gets +20% armor while near Tank |
| Assassin + DPS | First crit on target grants DPS +15% damage vs same target for 2 turns |
| Bruiser + Tank | Both gain +10% lifesteal when adjacent |

### 6.5 Multi-Unit Metrics

- **Team DPS:** Sum of all damage/turn
- **Damage Distribution:** % contribution per role
- **Survival Rate:** % of team alive at end
- **Focus Fire Efficiency:** Avg turns to eliminate priority target
- **Utility Uptime:** % of combat with active buffs

---

## 7. Encounter Check System

### 7.1 Elite Check Types

#### **Elite 1: High Armor Scaling**
- **Enemy Composition:** 1 Tank, 2 DPS
- **Mechanic:** Tank gains +10 armor per turn (max 200)
- **Failure:** Team runs out of damage before breaking armor
- **Success:** Eliminate DPS quickly, then chip Tank with armor penetration
- **Effective Builds:** Assassin (ArmorIgnore spell), Bruiser (sustained DPS), Support (armor debuff)

#### **Elite 2: Evasion Boss**
- **Enemy:** Single boss with 90% evasion, 5000 HP
- **Mechanic:** Standard attacks have 10% hit chance
- **Failure:** Team lacks accuracy or guaranteed-hit spells
- **Success:** Use AoE (can't evade area effects), TxC buffs, or guaranteed-hit ultimates
- **Effective Builds:** Support (TxC buff), DPS with AoE variant

#### **Elite 3: Swarm (5v20)**
- **Enemy:** 20 weak enemies (50 HP each, 15 damage)
- **Mechanic:** Overwhelm through numbers
- **Failure:** Single-target focus, no AoE
- **Success:** AoE spam, Tank zone control, Support mass heals
- **Effective Builds:** DPS (Meteor), Support (Mass Heal), Tank (AoE taunt)

#### **Elite 4: Burst Race**
- **Enemy:** 3 Glass Cannon enemies (100 HP, 80 damage each)
- **Mechanic:** Kill or be killed in 3 turns
- **Failure:** Too slow, team wiped turn 3-4
- **Success:** Assassin burst, DPS priority targeting, Support preemptive shields
- **Effective Builds:** 2 Assassins, 1 Support (shields), skip Tank entirely

#### **Elite 5: Immunity Phases**
- **Enemy:** Boss with rotating 100% physical/magical immunity (alternates every 2 turns)
- **Mechanic:** Must have both damage types
- **Failure:** Pure physical or pure magical team
- **Success:** Balanced damage types, adapt targeting per phase
- **Effective Builds:** Hybrid DPS (physical + magical spells), Bruiser (mixed damage)

#### **Elite 6: Healing Boss**
- **Enemy:** Boss with 40% lifesteal and self-heal every 3 turns
- **Mechanic:** Outheals player damage if low burst
- **Failure:** Sustained damage insufficient, boss recovers
- **Success:** Burst windows, healing reduction debuffs, execute finishers
- **Effective Builds:** Assassin (Execute), Support (Grievous Wounds), DPS (burst rotation)

### 7.2 Check Matrix

| Check | Required Roles | Effective Spells | Alternative Solutions |
|-------|----------------|------------------|----------------------|
| High Armor | DPS, Bruiser | ArmorPen, Execute | Prolonged fight with Support sustain |
| Evasion | Support, DPS | AoE, TxC Buff | Mass Heal + attrition |
| Swarm | Tank, DPS | AoE Multi-target | Heavy single-target if protected by Tank |
| Burst Race | 2+ DPS/Assassin | Burst Variants | Support shields to survive counterattack |
| Immunity | Hybrid DPS | Mixed Damage Types | Summons/DoTs bypass immunity windows |
| Healing Boss | Assassin, DPS | Burst, Healing Reduction | Massive overkill damage in single turn |

---

## 8. Drop System & Build Variability

### 8.1 Drop Mechanics

**Drop Pools:**
- Common: 60% (base variants)
- Rare: 30% (improved variants, +1 stat modifier)
- Epic: 9% (AoE/Burst/Ignore variants)
- Legendary: 1% (unique mechanics, double stat modifiers)

**Example Drops:**
- Common: **Fireball** (120% INT)
- Rare: **Greater Fireball** (150% INT, 15% burn)
- Epic: **Meteor** (AoE, 0.65x per target, 10% burn all)
- Legendary: **Cataclysm** (AoE, 1.0x per target, 20% burn, 5-turn cooldown)

### 8.2 Situational Value

**"Bad" drops that become optimal:**
- **Weak Heal (20% max HP):** Useless in boss fights, perfect for 5v20 swarm (cheap spam)
- **Low Damage AoE (40% per target):** Bad vs single boss, essential vs swarm
- **50% ArmorIgnore, -30% damage:** Bad vs low-armor, breaks High Armor Elite

### 8.3 Emergent Solutions

**Scenario:** Elite 4 (Burst Race) but only have 1 Assassin and weak DPS
- **Solution:** Support uses all mana for damage buffs turn 1, sacrifice self to empower Assassin burst
- **Alternative:** Tank taunts 2 enemies, team focuses 1 at a time (risky but possible)

### 8.4 Build Constraints

**No Perfect Builds:**
- Players cannot choose drops, must adapt to what they find
- Spell synergies discovered through experimentation
- Some encounters become impossible with wrong drops → roguelike failure state

---

### 8.5 Combat Viewer Sprite Registry (Phase 6, Visual Mock)

Added in Phase 6 to connect archetype templates to sprite metadata for the 1v1 combat viewer visual mockup.
- **Purpose:** map archetype tags → vector sprite sets (`idle`, `windup`, `attack`, `hit`, `defeated`, `statusFx`) plus FX assets (trail, slash, shield, onHit).
- **Palette Tokens:** align with Gilded Observatory colors (obsidian base, gilded rim, teal accent) to keep viewer visuals consistent with the rest of the UI ecosystem.
- **Usage Contract:**
  - Visual layers call `getCombatSpriteByTags(archetype.tags)` to resolve the default sprite set.
  - Archetype templates can override sprite ids via future config fields; until then tag matching provides sensible defaults.
  - Timeline animator reads `durationMs` from sprite entries to keep idle/attack loops in sync with `mapFrameToAnimations`.
- **Next Steps:** wire sprite id references into archetype definitions and expose registry data through `useCombatPlayback` frames so the viewer can render LoL-style 2D vector avatars.

#### 8.5.1 Archetype Sprite Persistence

- `ArchetypeTemplate` now supports an optional `spriteId` field. When provided, this acts as a hard binding to a sprite entry in `COMBAT_SPRITE_REGISTRY`.
- Sprite metadata flows from registry → archetype template → `EntityStats` → `Entity` instances → combat timeline snapshots. This ensures any UI layer (React, exporter, QA tooling) receives the same authoritative sprite id + palette without re-deriving it.
- `resolveSpriteForArchetype` helper centralizes the fallback logic: explicit `spriteId` beats tag-based inference; tag matching reuses `getCombatSpriteByTags`.

---

## 9. Roadmap

### **Phase 1: Core 1v1 System (4-6 weeks)**
- [x] Implement 5 base archetypes
- [x] Combat engine (damage, hit/miss, crit)
- [x] 10 base spells (5 offensive, 3 utility, 2 control)
- [x] Automated testing suite
- [x] Balance iteration (target ±10% win rates)

### **Phase 2: Advanced Spells & Resources (3-4 weeks)**
- [ ] Mana system
- [ ] Cooldown mechanics
- [ ] 20 spell variants (AoE, Burst, DoT, Ignore)
- [ ] Status effect expansion (6 → 12 types)
- [ ] Testing suite v2 (spell effectiveness metrics)

### **Phase 3: Grid & AI (5-7 weeks)**
- [ ] 8x8 grid implementation
- [ ] Movement & pathfinding (A*)
- [ ] Range & Line of Sight
- [ ] Basic AI (move → attack logic)
- [ ] 1v1 grid validation tests

### **Phase 4: Multi-Unit & Encounters (6-8 weeks)**
- [ ] 5v5 / 5vMany support
- [ ] AoE spell mechanics
- [ ] Buff/Debuff system
- [ ] Synergy system
- [ ] 6 Elite encounter templates
- [ ] Victory/defeat conditions

### **Phase 5: Drop System & Polish (4-5 weeks)**
- [ ] Random drop generation
- [ ] Spell variant tagging (AoE, Burst, etc.)
- [ ] Roguelike run structure (floors, elite encounters)
- [ ] Advanced telemetry (encounter success rates, drop effectiveness)
- [ ] Final balance pass (all encounters, all builds)

---

## 10. Design Principles for New Encounters

### 10.1 Encounter Creation Checklist

1. **Define the Core Mechanic**
   - What makes this fight unique? (scaling, immunity, swarm, etc.)
   - What mistake should punish the player?

2. **Set Numerical Parameters**
   - Enemy HP, Armor, Evasion
   - Damage output (per turn, burst potential)
   - Scaling rates (if applicable)
   - Turn thresholds (e.g., "enrage at turn 10")

3. **Identify Counters**
   - List 2-3 spell types that trivialize the fight
   - List 2-3 spell types that make it very hard

4. **Design Multiple Solutions**
   - Optimal solution (specific spell combo)
   - Suboptimal but viable (creative use of "bad" drops)
   - High-risk gambit (sacrifice strategy)

5. **Validate with Simulator**
   - Run 100 sims with optimal build → 80%+ win rate
   - Run 100 sims with suboptimal → 40-60% win rate
   - Run 100 sims with counter-build → 10%- win rate

### 10.2 Example: Designing "Elite 7: Mirror Match"

**Concept:** Enemy team is a perfect copy of player team

**Mechanic:** AI gets +20% stats to compensate for worse decision-making

**Failure:** Player plays too aggressively, loses resource war

**Success:** Exploit AI predictability, bait cooldown usage, win micro-decisions

**Counters:**
- Burst specs (kill before AI adapts)
- Superior positioning (AI follows simple rules)
- Defensive pivot (outlast with superior macro)

**Parameters:**
- Enemy HP: Player HP × 1.2
- Enemy Damage: Player Damage × 1.2
- AI logic: Focus lowest HP, use strongest spell off cooldown

**Testing:**
- Player with perfect play: 70% win rate
- Player with average play: 50% win rate
- Player with poor play: 30% win rate

---

## 11. Integration with Existing Systems

### 11.1 Balancing Module Integration

All numerical values (stat weights, damage formulas, TTK targets) are sourced from `BalanceConfigManager`:

```typescript
import { BalanceConfigManager } from '@/balancing/BalanceConfigManager';

const config = BalanceConfigManager.getInstance();
const hpWeight = config.getStatWeight('hp');
const targetTTK = config.getTargetTTK('tank_vs_dps');
```

### 11.2 Fantasy UI Integration

Encounter UI will use Fantasy components:
- `FantasyCard` for enemy stat display
- `FantasyButton` for spell casting
- `FantasyModal` for victory/defeat screens

### 11.3 Persistence

Encounter results, drop history, and run progress stored via:
- `ArchetypeStorage` (party composition)
- New: `RunStorage` (current floor, drops, encounters cleared)

---

**End of Specification**

<!-- ===== repo-snapshot/SPELL_CREATION_SPEC.md ===== -->

# Spell Creation UI - Feature Specification

**Component:** `FantasySpellCreation.tsx`  
**Based On:** Original `SpellCreation.tsx` (fully functional version)  
**Status:** ✅ Restored

---

## Archmage Alignment

This spell creation spec has been aligned with the Archmage spell-creature lifecycle. Spells are now semi-sentient creatures with stages (infant, juvenile, mature), mood systems, and training mechanics. The UI features (stats grid, balance display, persistence) are reused for creature creation.

For full lifecycle details, see `docs/archmage/GameplayPillars.md`. This spec may be merged into the Gameplay docs once creature creation is implemented.

---

## 🎯 Required Features

### 1. Spell Identity Card
- Name input
- Type selection (damage/heal/buff/debuff/cc/shield)
- Target budget slider (0-100)
- Target stat selector (for buffs/debuffs)

### 2. Combat Preview Card
- **Damage calculation:** `effect% × baseDamage × eco`
- **Buff/Debuff:** Show modification %, duration (turns), target stat
- **Dynamic stat display:** Only non-default values from spell object
- **Real-time updates:** As sliders change

### 3. Stats Grid (Core Feature)
- **Drag & Drop Reordering:** Cards can be rearranged
- **Collapsible Cards:** Click to expand/collapse each stat
- **Multi-Step Ticks:** Each stat has 3+ customizable ticks
  - Add/remove tick buttons (`+` / `-`)
  - Each tick has:
    - **Value** (stat value at that point)
    - **Weight** (cost multiplier)
- **Selected Tick Indicator:** Shows current active tick
- **Stat Descriptions:** Malus warnings (red) for negative stats

### 4. Advanced Configuration
- **Save Default Config:** Stores:
  - Current spell state
  - Card order (drag/drop positions)
  - Collapsed states
  - Stat steps (all ticks + weights)
  - Selected tick indices
- **Reset to Defaults:** Restores from localStorage

### 5. Actions Bar
- **Reset Button:** Clear all to empty spell
- **Save Button:** Persist spell to library
- **Save Default Button:** Save current config as baseline
- **Balance Display:** `totalWeight - targetBudget` (±0.00)

### 6. Persistence
- **Custom Baseline:** User can set own spell as baseline (via localStorage `userSpellBaseline`)
- **Custom Weights:** Each stat can have custom weight curve
- **Minimal Save:** Only save fields that differ from default spell

---

## 🔧 Implementation Details

### Key Functions
```typescript
- handleDragStart(e, field): Initialize drag
- handleDragOver(e): Allow drop
- handleDrop(e, targetField): Reorder stat cards
- getStatSteps(field): Get tick array for stat
- updateStatStep(field, idx, step): Modify tick value/weight
- handleSelectTick(field, idx): Switch active tick
- addStatStep(field, idx): Insert new tick
- removeStatStep(field, idx): Delete tick (min 3)
- toggleCollapse(field): Expand/collapse card
- calculateBalance(): Sum(weights) - target
- getUserBaseline(): Load custom baseline
- getCustomWeights(): Extract weight per stat from ticks
- handleSave(): Save minimal spell to library
- handleSaveDefault(): Persist full config to localStorage
```

### React Hooks Used
- `useDefaultStorage()`: Centralized state for spell, order, steps, ticks
- `useState`: Local component state (targetBudget)

---

## ⚠️ Non-Negotiable Requirements

1. **All stat configuration MUST be via StatsGrid** (no placeholder "coming soon")
2. **Drag & Drop MUST work** for card reordering
3. **Multi-step ticks MUST be editable** (add/remove/modify)
4. **Save Default MUST persist** all configuration
5. **Balance calculation MUST use custom weights** from ticks

---

## 🧪 Testing Checklist

- [ ] Create spell → Modify stats → Save → Reload → Stats persist
- [ ] Drag stat card → Order changes and persists
- [ ] Add tick → New tick appears → Save Default → Reload → New tick still there
- [ ] Collapse card → Space reclaimed → Reload → Collapsed state persists
- [ ] Change target budget → Balance updates in real-time
- [ ] Save Default → Reset → Spell reverts to saved default (not empty)
- [ ] Combat preview shows correct damage (effect × baseDamage × eco)

---

## 📄 Related Files

- `src/ui/spell/SpellCreation.tsx` - Original fully-functional implementation
- `src/ui/fantasy/FantasySpellCreation.tsx` - Fantasy UI wrapper (MUST maintain all features)
- `src/ui/spell/components/StatsGrid.tsx` - Core stats configuration component
- `src/ui/spell/components/SpellIdentityCard.tsx` - Identity + target budget
- `src/ui/spell/components/ActionsBar.tsx` - Save/Reset/SaveDefault buttons
- `src/shared/hooks/useDefaultStorage.ts` - State management hook

---

**Last Verified:** 2025-12-01  
**Restoration Method:** Direct copy from `SpellCreation.tsx` + `FantasyLayout` wrapper

<!-- ===== repo-snapshot/SPELL_TYPE_GUIDELINES.md ===== -->

# Spell Type Extension Guidelines

## Archmage Update
With the shift to the Archmage direction, traditional spell types are now attributes of semi-sentient spell-creatures. For new terminology and mechanics, see `docs/archmage/Glossary.md`. This document remains as a reference for existing spell implementation but may be deprecated as spell-creature systems mature.

**⚠️ IMPORTANT: When adding new spell types, ALL of the following must be updated!**

When you add a new spell type (e.g., `'buff'`, `'debuff'`, `'summon'`, etc.) to the `SpellType` union in `spellTypes.ts`, you MUST update these files to maintain consistency:

## 📋 Required Updates Checklist

### 1. **Type Definitions** (`src/balancing/spellTypes.ts`)
- [ ] Add type to `SpellType` union
- [ ] Add type-specific fields to `Spell` interface if needed
- [ ] Update `createEmptySpell()` factory with defaults

### 2. **UI - Spell Creation** (`src/ui/spell/`)
- [ ] **SpellCreation.tsx**: Add type option to spell type selector
- [ ] **SpellIdentityCard.tsx**: Add visual distinction/icon for new type
- [ ] **SpellMetadataCard.tsx**: Add conditional fields for type-specific config
- [ ] **SpellInfoForm.tsx**: Add any additional input fields

### 3. **UI - Spell Editor** (`src/ui/spell/SpellEditor.tsx`)
- [ ] Add type option to selector
- [ ] Add conditional rendering for type-specific fields
- [ ] Update validation logic if needed

### 4. **Combat Engine** (`src/engine/`)
- [ ] **combat/logic.ts**: Add spell type handling in combat resolution
- [ ] **idle/ai.ts**: Update AI spell selection logic
- [ ] **core/spell.ts**: Add casting logic if needed

### 5. **Balancing** (`src/balancing/`)
- [ ] **spellCost.ts**: Add cost calculation for new type
- [ ] **spellBalancingConfig.ts**: Add balance parameters
- [ ] **spell/SpellBuilder.ts**: Add builder support

### 6. **Preview/Simulation** (`src/ui/balancing/`)
- [ ] **SpellBalancingLab.tsx**: Add preview rendering
- [ ] **SimulationDashboard.tsx**: Add metrics tracking

### 7. **Testing**
- [ ] Add unit tests for new spell type behavior
- [ ] Add integration tests with combat simulator
- [ ] Test UI creation/editing flow

---

## 📝 Example: Adding a "Heal" Spell Type

```typescript
// 1. spellTypes.ts
export type SpellType = 'damage' | 'heal' | 'buff' | ...;

export interface Spell {
  // ...
  healingModifier?: number; // For type === 'heal'
}

// 2. SpellCreation.tsx
<option value="heal">Heal</option>

// 3. SpellMetadataCard.tsx
{spell.type === 'heal' && (
  <input 
    label="Healing Modifier" 
    value={spell.healingModifier}
    onChange={...}
  />
)}

// 4. combat/logic.ts
if (spell.type === 'heal') {
  targetEntity.currentHp += calculateHealing(spell);
}

// 5. spellCost.ts
if (spell.type === 'heal') {
  cost += spell.healingModifier * HEAL_COST_MULTIPLIER;
}
```

---

## 🔄 Current Spell Types Status

| Type | UI Creation | UI Editor | Combat Engine | AI Logic | Cost Calc | Preview |
|------|-------------|-----------|---------------|----------|-----------|---------|
| `damage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `heal` | ✅ | ✅ | ⚠️ Partial | ⚠️ Partial | ✅ | ⚠️ Partial |
| `shield` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `buff` | ✅ | ✅ | ❌ **NEEDS IMPL** | ❌ | ✅ | ❌ |
| `debuff` | ✅ | ✅ | ❌ **NEEDS IMPL** | ❌ | ✅ | ❌ |
| `cc` | ✅ | ✅ | ⚠️ Partial (Stun only) | ⚠️ Partial | ✅ | ⚠️ Partial |

**Legend:**
- ✅ Fully implemented
- ⚠️ Partially implemented
- ❌ Not implemented

---

## 🚨 Common Pitfalls

1. **Forgetting UI update**: Adding backend logic but no way to configure in UI → users can't create the spell
2. **Missing cost calculation**: New spell type not priced → balance broken
3. **No combat integration**: Spell can be created but does nothing in combat
4. **Inconsistent preview**: Spell works in combat but preview shows wrong info
5. **AI doesn't use it**: AI ignores new spell type → never gets tested

---

## 📚 Related Documents

- [DEVELOPMENT_GUIDELINES.md](../DEVELOPMENT_GUIDELINES.md) - General code guidelines
- [BALANCING_SYSTEM.md](BALANCING_SYSTEM.md) - Balance philosophy
- [docs/plans/combat_expansion_plan.md](plans/combat_expansion_plan.md) - Combat system roadmap

<!-- ===== repo-snapshot/VILLAGE_ECONOMY.md ===== -->

---
title: Village Economy — economia del villaggio e delle spedizioni
type: canonical-draft
status: DRAFT — bozza di piano da migliorare (Director 2026-10-05: «ci stiamo
  lavorando»); le proposte non ratificate restano marcate `proposta`
updated: 2026-10-05
---

# VILLAGE_ECONOMY — economia villaggio e spedizioni

Dominio: produzione di risorse, forza lavoro, costo reale delle quest,
capacità di spedizione. Bozza compilata da fonti esistenti — non aggiunge
regole nuove.

**Regole quest** (vigenti) → `QUEST_RULES.md`. Questo documento copre il
lato villaggio/economia, non la risoluzione delle quest.

## 1. Loop economico (visione — `GAMEPLAY_DESIGN.md` §2.3)

**STATUS:** `vigente` come visione di design.

- Gli **artigiani/peasant** producono materiali (ferro, legname, cibo, oro);
  i materiali comprano equipaggiamento; l'equip permette agli eroi quest più
  difficili; quest → XP e ricompense rare → level up e upgrade edifici → più
  produzione. Divisorio netto forza lavoro ↔ forza avventuriera.
- **SOURCE:** `GAMEPLAY_DESIGN.md` §2; `GLOSSARY.md` (Peasant/Hero).

## 2. Proposte economia-villaggio — `proposta` (OPEN-010)

Non ratificate; fonte `context/QUEST_ECONOMY_NOTES.md` (conversazione
Director/ChatGPT 2026-10-04, R-083), ledger in
`context/ingestions/2026-10-05-progettare-quest-strategiche.md`.

- **human-days** — costo reale di una quest = `persone × giorni`; una ferita
  è «uomo non disponibile per X giorni», non «−10 HP». Esempio: 4 persone ×
  ~7 giorni ≈ 28 human-days.
- **Regola leader-capacity** — la capacità di spedizione è limitata dallo
  stato del leader e dal pool di umani disponibili, NON da un cooldown
  «1 quest/X giorni». Direttiva Director verbatim: *«fino a quando il leader
  nn è stanco o ferito (o morto) puoi continuare a fare quest fino a quando
  hai altri umani»*.
- **Quest come opportunità** — 8–10 quest compaiono/mese, 4–5
  realisticamente affrontabili; alcune scadono, altre richiedono uomini o
  equip non pronti. Domanda strategica: *«qual è il prossimo miglior uso dei
  miei umani?»* — non «prossimo bottone da premere».
- **Test proposto** — scenario 30 giorni → X quest generate → 1–2 party →
  4–5 spedizioni → human-days/feriti/morti → nuove opportunità, per
  verificare se emerge il gioco cercato.

## 3. Vincoli e avvisi

- **Avviso bilanciamento (CONSTRAINT):** ~1 morto medio/quest rischia
  «roulette russa» — è un warning, non un target di design
  (`QUEST_ECONOMY_NOTES.md`, ingestion E-05).
- **Losabilità (vigente):** una quest che non può fallire è inutile —
  criterio di diagnosi, non percentuale target (`QUEST_RULES.md` §8).
- Config-first: i valori di dominio vivono in `src/balancing/config/**`,
  non in questo documento.

## 4. Domande aperte

- Ratifica delle proposte §2 → `context/OPEN.md` OPEN-010.
- Parametri numerici dell'economia villaggio (produzione/ciclo, costi
  reclutamento) → `idle_village_gameplay_math_spec.md` è la spec più vicina;
  la mappatura completa non è formalizzata.
- Collocazione nel macro-piano: candidato per PLAN-019 S4.

## Provenance

Compilato 2026-10-05 (R-085) da: `GAMEPLAY_DESIGN.md`, `context/QUEST_ECONOMY_NOTES.md`,
`context/ingestions/2026-10-05-progettare-quest-strategiche.md`, `RICHIESTE.md` R-083.

<!-- ===== repo-snapshot/PROGRESSION.md ===== -->

---
title: Progression — progressione eroi, villaggio e contenuti
type: canonical-draft
status: DRAFT — bozza di piano da migliorare (R-085); compila solo conoscenza
  esistente, le lacune sono marcate OPEN
updated: 2026-10-05
---

# PROGRESSION — progressione di eroi, villaggio e contenuti

Dominio: crescita dei personaggi, sblocco di contenuti, upgrade del
villaggio, reputazione. Bozza — non contiene formule canoniche.

## 1. Progressione eroi

- Gli **eroi** arrivano spontaneamente alla taverna come avventurieri di
  passaggio; si assoldano con oro proporzionale a stat/rarità. Si inizia con
  1–2 eroi base.
  **STATUS:** `vigente` (visione). **SOURCE:** `GAMEPLAY_DESIGN.md` §2.2.
- Le quest completate fanno guadagnare **XP**; ricompense rare → level up +
  upgrade edifici.
  **STATUS:** `vigente` (visione); formule/curva XP `open` (§3).
- Dopo quest completate o crescita della reputazione del villaggio, nuovi
  eroi compaiono.
  **STATUS:** `vigente` (visione). **SOURCE:** `GAMEPLAY_DESIGN.md` §2.2.

## 2. Progressione villaggio

- Le quest sbloccano **upgrade di edifici**, **blueprint** e l'acquisto di
  **licenze** (es. Licenza di Caccia, dal mercante ambulante).
  **STATUS:** `vigente` (visione). **SOURCE:** `GAMEPLAY_DESIGN.md` §1.3;
  `GLOSSARY.md` (Blueprint, License).
- Sequenza contenuti della vertical slice: `VERTICAL_SLICE_ROADMAP.md`;
  stato operativo dei piani in `plans/INDEX.md`.

## 3. Domande aperte

- **OPEN** — curva XP, scaling dei livelli, costo di assoldamento: nessun
  parametro canonico documentato; i valori nel lab S1 sono mock.
- **OPEN** — meccanica di reputazione: citata nella visione, mai formalizzata.
- **OPEN** — relazione tra progressione eroi e stat del balancer
  (`balancer-default-config.json`): le stat di Idle Village sono mock
  (`QUEST_RULES.md` §7); la derivazione completa è OPEN-003.

## Provenance

Compilato 2026-10-05 (R-085) da `GAMEPLAY_DESIGN.md` §1–2, `GLOSSARY.md`,
`QUEST_RULES.md` §7, `context/OPEN.md` OPEN-003.
