---
id: CTR-game-010
kind: integration
components:
  - quest-run-window
  - game-frame-pixi
external_dependencies: []
fast_checks:
  - tests/unit/idleVillage/questRunWindow.test.tsx
e2e_checks:
  - tests/e2e/idleVillage/gameQuestInputCoordination.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx
  - src/pages/game-frame-pixi.tsx
invariants:
  - id: input-1
    source: director-bug
    source_ref: R-225
    statement: >-
      Selezione pendente possiede i tasti: `1` sceglie l'opzione e non tocca il moltiplicatore velocità (bug #2
      riportato).
    test_refs:
      - tests/e2e/idleVillage/gameQuestInputCoordination.spec.ts
  - id: input-2
    source: director-bug
    source_ref: R-225
    statement: >-
      Senza selezione pendente (locked frontier: opzioni renderizzate ma tutte disabled, nowTick < readyAt) il
      binding velocità resta vivo — la policy stabilita è «speed solo senza selezione pendente».
    test_refs:
      - tests/e2e/idleVillage/gameQuestInputCoordination.spec.ts
  - id: input-3
    source: director-bug
    source_ref: R-225
    statement: >-
      Frontier verify (la lamentela #1): la maturazione readyAt sblocca l'opzione e un click reale avanza la fase.
    test_refs:
      - tests/e2e/idleVillage/gameQuestInputCoordination.spec.ts
  - id: input-4
    source: director-bug
    source_ref: R-225
    statement: >-
      Durante un beat in scena la finestra possiede ogni tasto: premere una cifra avanza il beat, mai la velocità.
    test_refs:
      - tests/e2e/idleVillage/gameQuestInputCoordination.spec.ts
---

# CTR-game-010 — arbitrato input QuestRunWindow ↔ binding globali

Contratto di integrazione adottato in PLAN-054 T-004 a partire dai tag
`// INV:input-N` già presenti in `gameQuestInputCoordination.spec.ts`
(sessione parallela). Regola: mentre la finestra di run ha una selezione
pendente o un beat in scena, i tasti appartengono a lei; fuori da quei
frangenti i binding globali (velocità) restano vivi anche con opzioni
renderizzate ma bloccate dal frontier.
