---
id: game-frame-game-frame
kind: component
role: ui-component
tier: 1
root_file: src/ui/idleVillage/components/gameFrame/GameFrame.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/GameFrame.tsx
  - src/ui/idleVillage/components/gameFrame/gameFrameCursors.css
fast_checks:
  - tests/unit/idleVillage/gameHudIdle.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: game-frame-game-frame.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      GameFrame orchestra la visibilità del chrome: idle-hide dopo inattività, hide manuale via 'h'/perla, risveglio su
      hudWakeSignal anche oltre una hide manuale, con causa riportata via onHudHiddenChange.
    test_refs:
      - tests/unit/idleVillage/gameHudIdle.test.tsx
---

# game-frame-game-frame

Unità `ui-component` (tier 1, ctr-reference) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/GameFrame.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Navigazione di regime + recenter mappa + stati lock (workshop/tavern).

## Scope

- `src/ui/idleVillage/components/gameFrame/GameFrame.tsx`
- `src/ui/idleVillage/components/gameFrame/gameFrameCursors.css`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `nav-cluster` (batch B1-fixed-hud, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — verificare scala e spaziature vs Roster.
- PLAN-043 WS-5 scheda `cursors` (batch B5-tools, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — pulizia asset post-approvazione; stato — implemented — 21 asset legacy rimossi; manifest+CSS invariati; 8/8 test verdi.

<!-- /plan054:generated -->
