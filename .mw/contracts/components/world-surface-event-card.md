---
id: world-surface-event-card
kind: component
role: ui-component
tier: 1
root_file: src/ui/idleVillage/components/WorldSurfaceEventCard.tsx
scope_files:
  - src/ui/idleVillage/components/WorldSurfaceEventCard.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: world-surface-event-card.INV-1
    source: plan
    source_ref: PLAN-054
    statement: La WorldSurfaceEventCard di annuncio sta interamente dentro il viewport, nella fascia centrale (BV-2).
    test_refs:
      - tests/e2e/idleVillage/gameInvasionSequence.spec.ts
  - id: R-234-invasion-action-armed
    source: director-bug
    source_ref: R-234
    statement: >-
      L'azione della card d'invasione si arma solo a card completamente apparsa: non conferma durante il fade-in
      (PLAN-067 T-A12)
    test_refs:
      - tests/unit/idleVillage/worldSurfaceEventCard.armed.test.tsx
  - id: world-surface-event-card.INV-2
    source: director-bug
    source_ref: R-270
    statement: >-
      CTA scalata sotto 32px: applicare actionStyle minHeight = ceil(32/cardScale) (Sentinel small-target S0/S1, run
      0829)
    test_refs: 
      - tests/unit/idleVillage/worldSurfaceEventCard.armed.test.tsx
---
# world-surface-event-card

Unità `ui-component` (tier 1, ctr-reference) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/WorldSurfaceEventCard.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Coreografia invasione: peel→marker, card ripiegata nel registro (CTR-game-004).

## Scope

- `src/ui/idleVillage/components/WorldSurfaceEventCard.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `invasion-marker` (batch B4-map, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — niente rework; ri-verifica fold con invasione live; stato — keep — fold ledger ha target su /game (verificato); ri-verifica live a F0.

<!-- /plan054:generated -->
