---
id: expedition-edge-tab
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/ExpeditionEdgeTab.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/ExpeditionEdgeTab.tsx
fast_checks:
  - tests/unit/idleVillage/r339ExpeditionStates.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: expedition-edge-tab.INV-1
    source: plan
    source_ref: PLAN-119
    statement: >-
      Senza quest selezionata la superficie expedition si riduce a `ExpeditionEdgeTab` docked sul bordo
      destro (`right: 0`) con il meccanismo esplicitato via i18n; nessun pannello/modal, il tab non ruba
      input alla mappa, e `visible=false` non renderizza nulla.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionStates.test.tsx
---
# expedition-edge-tab

Stato di riposo della superficie expedition (R-339/PLAN-119 D6-b): tab sottile
sul bordo destro, primitivi `HudPlaque` + `EngravedIcon`, nessuna duplicazione.
