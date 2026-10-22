---
id: goblin-invasion-window
kind: component
role: ui-component
tier: 1
root_file: src/ui/idleVillage/components/GoblinInvasionWindow.tsx
scope_files:
  - src/ui/idleVillage/components/GoblinInvasionWindow.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: goblin-invasion-window.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La finestra invasione goblin mostra un goblin alla volta (case→sticker→marker), la card si ripiega in una riga
      ledger che resta.
    test_refs:
      - tests/e2e/idleVillage/gameInvasionScene.spec.ts
---

# goblin-invasion-window

Unità `ui-component` (tier 1, ctr-reference) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/GoblinInvasionWindow.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Coreografia invasione: peel→marker, card ripiegata nel registro (CTR-game-004).

## Scope

- `src/ui/idleVillage/components/GoblinInvasionWindow.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `invasion-marker` (batch B4-map, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — niente rework; ri-verifica fold con invasione live; stato — keep — fold ledger ha target su /game (verificato); ri-verifica live a F0.

<!-- /plan054:generated -->
