---
id: poi-zanara
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/poi/PoiZanara.tsx
scope_files:
  - src/ui/idleVillage/components/poi/PoiZanara.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: poi-zanara.INV-1
    source: director-bug
    source_ref: R-388
    statement: >-
      Le punte/gemme zaffiro del POI quest non devono avere vuoti trasparenti causati da disallineamento dei layer:
      restano piene, azzurre e cromaticamente coerenti sulla mappa; la punta nord non deve restare troppo chiara o
      diversa dal resto delle gemme.
    test_refs:
      - tests/unit/idleVillage/poiQuestSapphireTips.test.ts
---
# poi-zanara

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/poi/PoiZanara.tsx`.

## Scope

- `src/ui/idleVillage/components/poi/PoiZanara.tsx`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
