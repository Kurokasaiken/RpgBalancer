---
id: hud-hide-toggle
kind: component
role: ui-component
tier: 1
root_file: src/ui/idleVillage/components/gameFrame/HudHideToggle.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/HudHideToggle.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hud-hide-toggle.INV-1
    source: plan
    source_ref: PLAN-054
    statement: HudHideToggle rende un bottone accessibile che invoca onToggle al click, in entrambi gli stati hidden/visible.
    test_refs:
      - tests/unit/idleVillage/tier1ContractCoverage.test.tsx
---

# hud-hide-toggle

Unità `ui-component` (tier 1, ctr-reference) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/HudHideToggle.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

FAB bottom-right che nasconde/mostra il chrome.

## Scope

- `src/ui/idleVillage/components/gameFrame/HudHideToggle.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `hud-hide-toggle` (batch B1-fixed-hud, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep.

<!-- /plan054:generated -->
