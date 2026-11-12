---
id: village-director-view
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/VillageDirectorView.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/VillageDirectorView.tsx
  - src/ui/idleVillage/config/villageDirectorConfig.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-326-layer-disjoint
    source: director-bug
    source_ref: R-326
    statement: >-
      Layer villaggio ritagliati male: gli alpha grown si sovrappongono e ogni layer dipinto porta pixel identici degli
      edifici vicini (pezzi di altre case visibili quando toggled singolarmente). lumber contiene ~20k px di chief-house
      e ~3k di hut-far-1 e il sawmill e' tagliato a dx/sx. Invariante: i layer dipinti sono alpha-disgiunti a due a due
      e lumber non contiene pixel dentro la sagoma di chief-house.
    test_refs:
      - tests/unit/idleVillage/villageLayers.test.ts
  - id: R-326-no-small-west
    source: director-bug
    source_ref: R-326
    statement: >-
      house-small-west non deve comparire nel menu director: il pannello costruisce le azioni da layers.json, quindi il
      layer va rimosso dal manifest (e il webp eliminato). La striscia di pietra contesa con house-big-west resta di
      quest'ultimo, cosi' l'identita' base+layer dipinti = dipinto regge ovunque tranne nell'area esclusiva dello strato
      rimosso (li' atteso il base fill).
    test_refs:
      - tests/unit/idleVillage/villageLayers.test.ts
---
# village-director-view

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/VillageDirectorView.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/VillageDirectorView.tsx`
- `src/ui/idleVillage/config/villageDirectorConfig.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
