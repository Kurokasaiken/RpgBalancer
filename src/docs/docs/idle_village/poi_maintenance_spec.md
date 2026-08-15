---
title: POI Maintenance Spec
status: draft
updated: 2026-08-15
type: component-spec
---

# POI Maintenance Spec

## Goal

Define the contract for **maintenance POIs**: activities that consume resources to keep buildings, equipment, or world systems in good condition.

## Canonical sources

- `ActivityCardKind: 'maintenance'`
- `ActivityDefinition.costs`, `rewards`
- Root: `poi_family_spec.md`

## Data flow

```text
ActivityDefinition (cardKind: 'maintenance')
        │
        ├── costs ──► resource drain per tick/final
        └── rewards ──► building condition / unlock / buff
        │
        ▼
Maintenance engine
        │
        ├── pay cost
        └── apply condition/buff
```

## Scenarios

### M-001 — Repair the mill

**GIVEN** a `maintenance` POI for a building

**WHEN** the user assigns residents and starts the activity

**THEN** resources (wood, gold) are consumed and the building condition improves

**Visual contract:** resource HUD shows `-wood`/`-gold`; building status bar increases

**Test:** `poiFamilyRegressions.spec.ts` — `should consume resources and improve building condition`

### M-002 — Maintenance while building is OK

**GIVEN** a building at full condition

**WHEN** the user tries to start a maintenance POI

**THEN** the Start CTA is disabled or the activity completes with no effect

**Visual contract:** CTA disabled; tooltip says "already at full condition"

**Test:** `poiFamilyRegressions.spec.ts` — `should not over-repair a building`

## Invariants

- [ ] Maintenance consumes resources before or during the activity, never after failure.
- [ ] Condition/buff rewards are the only outcome; no XP or combat risk.
- [ ] Can not push a building condition above its maximum.

## References

- Root: `poi_family_spec.md`
- Related: `poi_job_spec.md`, `economyConfig.ts`
