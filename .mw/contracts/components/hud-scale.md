---
id: hud-scale
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/components/gameFrame/hudScale.ts
scope_files:
  - src/ui/idleVillage/components/gameFrame/hudScale.ts
fast_checks:
  - tests/unit/idleVillage/hudScale.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hud-scale.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La scala HUD resta nel range configurato per ogni input (auto-step oltre full-HD, clamp sul lato minore in
      ultrawide, fixed ignora la finestra, parse robusto dei valori persistiti).
    test_refs:
      - tests/unit/idleVillage/hudScale.test.ts
---

# hud-scale

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/hudScale.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Binding panel→stato, drag, escape stack, scala HUD, material switch.

## Scope

- `src/ui/idleVillage/components/gameFrame/hudScale.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `panel-infra` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — investigare scala DOM/chrome (non solo Tauri); stato — documented — scala browser assente per design (useHudScale solo Tauri); decisione Director.

<!-- /plan054:generated -->
