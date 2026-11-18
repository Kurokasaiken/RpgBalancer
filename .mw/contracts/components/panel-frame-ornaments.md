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
      La primitiva dipinge i set approvati: i set mockup-cut R-353 (`panel-frame/`, variant
      stash/roster) e le varianti 'cornici'/'corniciStash' R-357 — grammar panel-frame4: banda
      vine incisa su TUTTI i bordi come tile `background-repeat` SOTTO gli angoli + knuckles
      acanthus a misura fissa ai quattro angoli (TR mirror del TL). L'emblema forziere
      (`emblem-chest.webp`, seduto sul wire superiore ~40%) è dipinto SOLO da 'corniciStash';
      'cornici' non dipinge emblema. Il confine interno del frame cade sul bordo del pannello:
      niente invade la fascia contenuto (header/title liberi).
    test_refs:
      - tests/unit/idleVillage/panelFrameOrnaments.test.tsx
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
