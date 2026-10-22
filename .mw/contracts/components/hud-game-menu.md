---
id: hud-game-menu
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/HudGameMenu.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/HudGameMenu.tsx
fast_checks:
  - tests/unit/idleVillage/hudGameMenu.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-menu-no-theme
    source: director-bug
    source_ref: R-234
    statement: >-
      Il menu del giocatore non ha la sezione Tema: la skin bocciata Lacquer Atlas non si offre in nessuna build; il
      confronto resta in dev (PLAN-067 DN-6, Director 2026-10-21)
    test_refs:
      - tests/unit/idleVillage/hudGameMenu.test.tsx
  - id: PLAN-076-menu-entries
    source: director-bug
    source_ref: PLAN-076
    statement: >-
      «Carica partita», «Tutte le impostazioni» ed «Esci al titolo» sono voci attive (DN-7): ognuna chiude il menu e
      chiama il suo gestore; senza gestore restano disabilitate
    test_refs:
      - tests/unit/idleVillage/hudGameMenu.test.tsx
---
# hud-game-menu

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/HudGameMenu.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Lastra MENU top-left: menu di gioco.

## Scope

- `src/ui/idleVillage/components/gameFrame/HudGameMenu.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `hud-game-menu` (batch B1-fixed-hud, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep.

<!-- /plan054:generated -->
