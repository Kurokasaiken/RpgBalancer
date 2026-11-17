---
id: quest-initial-state
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/components/gameFrame/questInitialState.ts"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/questInitialState.ts"
fast_checks:
  - tests/unit/idleVillage/questInitialState.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: quest-initial-state.INV-1
    source: plan
    source_ref: PLAN-043
    statement: >-
      «Stato iniziale» enumera OGNI chiave di progresso: le chiavi fisse del mondo (gameplay, village,
      history, POI consumati, invasione, loadout) più un save `idleVillage.questRun.<questId>` per ogni
      quest authored, senza duplicati; le bozze expedition vivono sotto un unico prefisso per-giorno —
      le preferenze (HUD, skin, scala) restano fuori.
    test_refs:
      - tests/unit/idleVillage/questInitialState.test.ts
---
# quest-initial-state

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/questInitialState.ts`.

## Scope

- `src/ui/idleVillage/components/gameFrame/questInitialState.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
