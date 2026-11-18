---
id: scene-reveal-layer
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/questS1Lab/render/SceneRevealLayer.tsx
scope_files:
  - src/ui/idleVillage/questS1Lab/render/SceneRevealLayer.tsx
fast_checks:
  - tests/unit/idleVillage/sceneRevealLayer.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: scene-reveal-layer.INV-1
    source: code-baseline
    source_ref: PLAN-084
    statement: >-
      `onReveal` scatta al massimo una volta per contratto di reveal (latch `firedRef`), resettato
      quando `revealed` torna false o cambia il contratto. Il trigger 'timed' auto-fuoriesce dopo
      `afterSeconds`; le regioni cliccabili chiamano lo stesso latch.
    test_refs:
      - tests/unit/idleVillage/sceneRevealLayer.test.tsx
  - id: scene-reveal-layer.INV-2
    source: code-baseline
    source_ref: PLAN-084
    statement: >-
      I tre modi di reveal sono quelli del contratto PLAN-084 — 'fade' (la plate rivelata sfuma sul
      frame), 'cutout-slide' (un ritaglio clip-path della plate nascosta scivola via), 'panel-slide'
      (un pannello foreground ~85% scivola fuori a sinistra). `revealFx` è previsto solo per
      panel-slide ('sprites' | 'strips') e `fxOverride` serve solo al confronto live nel lab.
    test_refs:
      - tests/unit/idleVillage/sceneRevealLayer.test.tsx
---

# scene-reveal-layer

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/questS1Lab/render/SceneRevealLayer.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Overlay DOM delle affordance nascoste nelle scene quest (PLAN-084): regione cliccabile/timed e
visual del reveal montati sopra la scena da ogni stage del lab. Il clip-path `inset()` ritaglia il
pezzo nascosto dalla stessa plate sorgente.
