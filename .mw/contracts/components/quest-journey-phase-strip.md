---
id: quest-journey-phase-strip
kind: component
role: ui-component
tier: 2
root_file: "src/ui/idleVillage/components/gameFrame/QuestJourneyPhaseStrip.tsx"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/QuestJourneyPhaseStrip.tsx"
fast_checks:
  - tests/unit/idleVillage/questJourneyPhaseStrip.test.tsx
e2e_checks: []
e2e_trigger_globs:
  - src/ui/idleVillage/components/gameFrame/QuestJourneyPhaseStrip.tsx
invariants:
  - id: quest-journey-phase-strip.INV-1
    source: plan
    source_ref: PLAN-053
    statement: >-
      A live journey run shows exactly three leg bars — andata Nd (authored, exact), svolgimento ~Nd
      (soft POI estimate, live), ritorno Nd (equal to andata) — filled from the persisted journey
      journal via `faseAt`; a «waiting for a decision» chip appears only while parked, an
      encumbered-loot count chip only on ritorno with loot aboard, and nothing renders for legacy
      or terminal runs.
    test_refs:
      - tests/unit/idleVillage/questJourneyPhaseStrip.test.tsx
---
# quest-journey-phase-strip

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/QuestJourneyPhaseStrip.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/QuestJourneyPhaseStrip.tsx`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
