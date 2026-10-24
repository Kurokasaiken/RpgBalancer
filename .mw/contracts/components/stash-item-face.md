---
id: stash-item-face
kind: component
role: ui-component
tier: 2
root_file: "src/ui/idleVillage/components/gameFrame/stashItemFace.tsx"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/stashItemFace.tsx"
fast_checks:
  - tests/unit/idleVillage/villageStash.itemFace.test.tsx
  - tests/unit/idleVillage/questExpedition.trayFace.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants: []
---
# stash-item-face

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/stashItemFace.tsx`.

Vocabolario condiviso dello stash (R-270): tile lacquer, badge quantità «×N»
angolare e corpo tooltip (nome, descrizione, stat coperte, stock) usati
identici da `VillageStashPanel` (shelf) e `QuestExpeditionDetail` (tray/bag).

## Scope

- `src/ui/idleVillage/components/gameFrame/stashItemFace.tsx`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002);
contratto popolato in sessione R-270 (stash-uniformity, ruling Director
2026-10-23: container diversi, stessa item-face/badge/tooltip/tokens).
