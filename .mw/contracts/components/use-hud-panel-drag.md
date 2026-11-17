---
id: use-hud-panel-drag
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/components/gameFrame/useHudPanelDrag.ts"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/useHudPanelDrag.ts"
fast_checks:
  - tests/unit/idleVillage/useHudPanelDrag.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-hud-panel-drag.INV-1
    source: plan
    source_ref: PLAN-043
    statement: >-
      L'hook espone un offset committed applicato tramite `panelStyle` (translate, mai per-pointermove)
      e una handle marcata `data-hud-drag-handle`; `resetPosition` azzera l'offset.
    test_refs:
      - tests/unit/idleVillage/useHudPanelDrag.test.ts
---
# use-hud-panel-drag

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/useHudPanelDrag.ts`.

## Scope

- `src/ui/idleVillage/components/gameFrame/useHudPanelDrag.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
