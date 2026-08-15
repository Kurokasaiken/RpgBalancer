---
title: POI Training Spec
status: draft
updated: 2026-08-15
type: component-spec
---

# POI Training Spec

## Goal

Define the contract for **training POIs**: low-risk, stat/XP activities that improve residents over time.

## Canonical sources

- `ActivityCardKind: 'training'`
- `defaultConfig.ts` (`job_training_basics`)
- `ActivityDefinition.baseXpFormula`, `rewards` (XP)
- `statRequirement`
- Root: `poi_family_spec.md`

## Data flow

```text
ActivityDefinition (cardKind: 'training')
        │
        ├── statRequirement ──► slot validation
        ├── baseXpFormula ──► XP gain
        └── rewards ──► skill/stat gains
        │
        ▼
Training engine
        │
        └── apply XP/stat gains to resident on completion or tick
```

## Scenarios

### TR-001 — Basic combat training

**GIVEN** a `training` POI with `rewards` containing XP

**WHEN** the user assigns a resident and starts the training

**THEN** the resident gains the configured XP/stat on completion; the POI returns to `idle` and the resident is released

**Visual contract:** progress bar fills; halo is amber; completion shows a small `+XP` on the resident card

**Test:** `poiFamilyRegressions.spec.ts` — `should grant XP from a training POI`

### TR-002 — Training requirement mismatch

**GIVEN** a training POI with a `statRequirement`

**WHEN** the user tries to assign a resident that does not match

**THEN** the slot shows `invalid` bloom and the resident springs back to the roster

**Visual contract:** slot desaturates; drag token returns

**Test:** `poiFamilyRegressions.spec.ts` — `should reject incompatible residents from training`

## Invariants

- [ ] Training never deals injury or death; danger is 0 or purely for flavor.
- [ ] Rewards are XP and/or stat gains, never gold/wood/food directly.
- [ ] Resident is released at completion.

## References

- Root: `poi_family_spec.md`
- Related: `poi_job_spec.md`, `interaction_core_spec.md`
