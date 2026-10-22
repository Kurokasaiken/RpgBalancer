---
id: hud-event-ledger
kind: component
role: ui-component
tier: 1
root_file: src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx
fast_checks:
  - tests/unit/idleVillage/HudEventLedger.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hud-event-ledger.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      HudEventLedger elenca gli eventi per scadenza di default, raggruppa per tipo in ordine di priorità, tiene in vista
      una threat pinnata e mostra empty state quando non ci sono eventi.
    test_refs:
      - tests/unit/idleVillage/HudEventLedger.test.tsx
---

# hud-event-ledger

Unità `ui-component` (tier 1, ctr-reference) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Pannello rightWing registro eventi; target del fold card invasione (CTR-game-004).

## Scope

- `src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `events-ledger` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — verifiche di coerenza empty-state e choreography, nessun fix di mount necessario; stato — keep — mount verificato runtime su /game (DEF-01 ritrattato).

<!-- /plan054:generated -->
