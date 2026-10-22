---
id: quest-expedition-detail
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/quests/QuestExpeditionDetail.tsx
scope_files:
  - src/ui/idleVillage/quests/QuestExpeditionDetail.tsx
fast_checks:
  - tests/unit/idleVillage/questExpeditionBag.test.tsx
  - tests/unit/idleVillage/questPlannerForecastWing.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: PLAN-073-bag-ledger-binding
    source: plan
    source_ref: PLAN-073
    statement: >-
      La bisaccia del planner è una vista del ledger globale `useVillageStashStore.bags[poi.id]`: click su slot occupato
      = release; gli slot vuoti aprono il picker tray; header espone release-all per-owner; le bozze persistono alla
      chiusura fino a release-all/commitRun. R-246 (Director 2026-10-21): click-only — nessun drag da/verso il
      warehouse.
    test_refs:
      - tests/unit/idleVillage/villageStashLedger.test.ts
      - tests/unit/idleVillage/questExpeditionBag.test.tsx
  - id: PLAN-073-loadout-header-no-overlap
    source: plan
    source_ref: PLAN-073
    statement: >-
      L'header LOADOUT è una grid esplicita (label|actions, coverage sotto): il pulsante «Apri magazzino» non può
      sovrapporsi al contatore «Sacca — n/max» sotto espansione di lingua (fix overlap PLAN-068).
    test_refs: []
  - id: R-234-planner-tooltip-inside
    source: director-bug
    source_ref: R-234
    statement: >-
      I tooltip degli oggetti del planner collidono con il guscio del planner: si spostano/ribaltano dentro, non escono
      sul roster (T-03, PLAN-067 T-A9)
    test_refs:
      - tests/unit/idleVillage/questPlanner.tooltipBoundary.test.tsx
  - id: R-239-journey-total
    source: director-bug
    source_ref: R-239
    statement: >-
      il sigillo durata del planner proiettava solo la fase sito (22d) mentre la strip journey narra 2+22+2=26d — totali
      discordi
    test_refs:
      - tests/unit/idleVillage/questS1Lab/questExpedition.test.ts
  - id: quest-expedition-detail.INV-1
    source: director-bug
    source_ref: R-248
    statement: >-
      La wing forecast collassa a 'computing'/'incomplete' a ogni cambio party e si riespande a sim completata: resize
      visibile della placca a ogni add/remove pg — deve tenere l'ultimo estimate visibile durante il ricalcolo.
    test_refs:
      - tests/unit/idleVillage/questPlannerForecastWing.test.tsx
  - id: quest-expedition-detail.INV-2
    source: director-bug
    source_ref: R-258
    statement: >-
      La sezione WHY della forecast wing è rimossa del tutto dalla superficie giocatore (né nomi delle fonti né
      statistiche Monte Carlo — i campi restano sul risultato sim, non renderizzati); il testo player-facing usa % mai
      pp.
    test_refs:
      - tests/unit/idleVillage/questPlannerWhyNames.test.tsx
  - id: R-239-forecast-copy
    source: director-bug
    source_ref: R-239
    statement: >-
      La copy del forecast planner non usa simboli criptici — «≈2.6d down» è prosa localizzata leggibile (en «days», it
      «giorni»).
    test_refs:
      - tests/unit/idleVillage/questCopyLabels.test.tsx
  - id: R-234-planner-hero-no-text
    source: director-bug
    source_ref: R-234
    statement: 'The planner hero image carries no text: title above, dispatch below, seals in the right preview wing (POI-D = A)'
    test_refs:
      - tests/unit/idleVillage/questPlanner.heroNoText.test.tsx
  - id: R-234-planner-key-stats-icons
    source: director-bug
    source_ref: R-234
    statement: Primary then secondary key stats under the dispatch line as icons only (POI-D)
    test_refs:
      - tests/unit/idleVillage/questPlanner.heroNoText.test.tsx
---
# quest-expedition-detail

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx`.

## Scope

- `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-073 (R-240, artifact-r003 5/5 ACCEPT): bisaccia ledger-bound (bags[poi.id]), release-all per-owner (D-2), header LOADOUT in grid anti-overlap.
- R-246 (Director 2026-10-21): DnD warehouse↔bag rimosso — slot e item packed sono click-only (release su click, picker tray su slot vuoto).

<!-- /plan054:generated -->
