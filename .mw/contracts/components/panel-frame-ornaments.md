---
id: panel-frame-ornaments
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/skins/primitives/PanelFrameOrnaments.tsx
scope_files:
  - src/ui/idleVillage/skins/primitives/PanelFrameOrnaments.tsx
fast_checks:
  - tests/unit/idleVillage/r353StashGrid.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: panel-frame-ornaments.INV-1
    source: code-baseline
    source_ref: R-353/R-357
    statement: >-
      La primitiva dipinge i due set approvati: il set mockup-cut (R-353, `panel-frame/`) e il set
      'cornici' 9-slice (R-357, `panel-frame3/`). Nel set 9-slice gli angoli sono pezzi a misura
      fissa e i bordi sono tile `background-repeat` che corrono SOTTO gli angoli; l'emblema forziere
      esiste solo per il set stash (`emblem-chest.webp`), il set roster non dipinge emblemi né pezzi
      agli angoli destri oltre i junction di wire previsti.
    test_refs: []
---

# panel-frame-ornaments

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/skins/primitives/PanelFrameOrnaments.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Cornici ornate dei pannelli stash/roster: pezzi angolari ritagliati dai mockup firmati (R-353) e set
'cornici' con vero 9-slice da un'unica cornice generata (R-357). Le dimensioni display di angoli e
spessori bordo sono tarate sul golden grammar e vivono nel file sorgente.
