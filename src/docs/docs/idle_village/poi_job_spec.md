---
title: POI Job Spec
status: draft
updated: 2026-08-15
type: component-spec
---

# POI Job Spec

## Goal

Define the contract for **job POIs**: repeatable activities that consume resident stamina and produce resources or XP. Jobs can be **one-shot** (single duration, then collect) or **continuous** (ticking while time runs, with automatic resource streaming and rest cycles).

## Canonical sources

- Config: `src/balancing/config/idleVillage/types.ts` (`ActivityDefinition.dailyRewardProfile`, `dailyFatigueCost`, `continuousJob`, `supportsAutoRepeat`, `supportsPartialResolution`, `resolutionMode`)
- Default config: `src/balancing/config/idleVillage/defaultConfig.ts` (`job_city_rats`, `job_wood_gathering_stable`, `job_training_basics`)
- Root: `src/docs/docs/idle_village/poi_family_spec.md`
- Resource HUD: `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` (`resourceHudKit`)

## Data flow

```text
ActivityDefinition (cardKind: 'job')
        │
        ├── dailyRewardProfile  ──► Resource HUD  (per-tick / per-day)
        ├── dailyFatigueCost    ──► Resident fatigue
        ├── continuousJob       ──► auto-repeat / stay assigned
        └── resolutionMode: 'tick' | 'final'
        │
        ▼
Job resolution engine
        │
        ├── time tick ──► stream rewards ──► Resource HUD
        └── manual extract or activity completion ──► resident released
```

| Step | Source | Data | Consumer | Effect |
|------|--------|------|----------|--------|
| 1 | `dailyRewardProfile` | `ResourceRateDefinition[]` | Resource HUD | Small `+` delta on the matching resource |
| 2 | `dailyFatigueCost` | number | Resident fatigue | Subtract per tick/day; when exhausted, auto-extract |
| 3 | `continuousJob` | boolean | Job engine | Resident stays assigned and repeats |
| 4 | `supportsAutoRepeat` | boolean | Job engine | Re-queue the same job with the same resident |
| 5 | `resolutionMode` | `'tick' \| 'final'` | Job engine | Pay per tick or at completion |

## State machine

### One-shot job

```text
idle ──(assign)──► ready ──(start)──► in-progress
 in-progress ──(complete)──► completed ──(collect)──► idle
```

### Continuous job

```text
idle ──(assign)──► ready ──(start)──► running
 running ──(tick)──► running
 running ──(manual extract)──► idle
```

## Scenarios

### J-001 — One-shot wood gathering

**GIVEN** a `job_wood_gathering_stable` with `continuousJob: false` and `resolutionMode: 'final'`

**WHEN** the user assigns a resident and starts the job while time is running

**THEN** after the duration the POI shows `completed`, the resident stays in the slot, and a Collect CTA appears

**Visual contract:** progress bar fills to 100%, halo turns amber, collect button becomes active

**Test:** `poiFamilyRegressions.spec.ts` — `should complete a one-shot job and allow manual collection`

### J-002 — Continuous rat clearing

**GIVEN** a `job_city_rats` with `continuousJob: true` and `resolutionMode: 'tick'`

**WHEN** the user assigns a resident and starts the job

**THEN** every tick the resource HUD shows a small `+gold` / `+xp`; the resident remains in the slot

**Visual contract:** tiny `+` floats over the resource HUD; POI remains `in-progress` until manually extracted or fatigue runs out

**Test:** `poiFamilyRegressions.spec.ts` — `should stream rewards for a continuous job`

### J-003 — Continuous job continues until manual extract

**GIVEN** a continuous job with `continuousJob: true` and `resolutionMode: 'tick'`

**WHEN** the resident's fatigue reaches the configured minimum

**THEN** the job stops producing rewards but the resident remains assigned until manually extracted

**Visual contract:** resident card is disabled; POI halo dims or turns warning; resource `+` stops

**Test:** `poiFamilyRegressions.spec.ts` — `should pause reward stream when a resident is exhausted`

### J-004 — Manual extract resets the job

**GIVEN** an exhausted or finished resident in a continuous job slot

**WHEN** the user extracts the resident

**THEN** the slot is empty, the resident returns to the roster, and the POI returns to `idle`

**Visual contract:** resident token flies back to the roster; the CTA returns to Start

**Test:** `poiFamilyRegressions.spec.ts` — `should cancel a continuous job when the resident is extracted`

## Visual / runtime contract

- **One-shot:** a Collect CTA appears at completion; rewards are applied on click; resident returns to roster.
- **Continuous:** no Collect CTA; rewards are applied automatically each tick; resident stays unless extracted.
- **Resource HUD delta:** the `dailyRewardProfile` drives a small `+<resource>` animation on the relevant resource row.
- **Fatigue bar / status:** resident card shows fatigue depletion; at threshold, card is disabled and reward production stops; the user must manually extract the resident.

## Invariants

- [ ] Job rewards and costs are always derived from `ActivityDefinition` config, never hardcoded.
- [ ] `resolutionMode: 'tick'` means per-tick payout; `resolutionMode: 'final'` means one payout at completion.
- [ ] `continuousJob: true` keeps the resident assigned across ticks; `continuousJob: false` releases them at completion.
- [ ] `dailyFatigueCost` is the canonical source for per-day stamina drain; per-tick delta is derived by dividing by ticks per day.
- [ ] Auto-extract happens only when the resident's fatigue is insufficient for the next tick.
- [ ] The resource HUD `+` delta is driven by `dailyRewardProfile` and is purely visual feedback; the actual resource change is applied through the store.
- [ ] No local timers; the job engine queries `TimeEngine` elapsed time.

## Slot modifiers mapping

| Field | Meaning |
|-------|---------|
| `ActivitySlotModifier.yieldMult` | Multiplier on this slot's resource/XP output |
| `ActivitySlotModifier.fatigueMult` | Multiplier on fatigue consumed by this slot |
| `residentRiskModifiers` | For jobs, mainly injury chance from danger; death is off by default unless `trialOfFire` is enabled |

## Test commands

```bash
npx playwright test tests/e2e/idleVillage/poiFamilyRegressions.spec.ts --project="Desktop Chrome" --grep "job"
npm run build:check
```

## Evidence

- Config: `src/balancing/config/idleVillage/defaultConfig.ts` (`job_city_rats`, `job_wood_gathering_stable`)
- Type: `src/balancing/config/idleVillage/types.ts` (`dailyRewardProfile`)

## References

- Root: `poi_family_spec.md`
- Related: `interaction_core_spec.md`, `time_engine_spec.md`, `resourceHudKit` row in `COMPONENT_MASTER_INDEX.md`
