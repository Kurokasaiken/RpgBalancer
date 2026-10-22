---
id: CTR-game-008
kind: integration
components:
  - map-quest-poi
  - poi-marker
  - quest-expedition-detail
  - use-quest-poi-session
  - time-engine-strip
  - quest-poi
external_dependencies:
  - src/ui/idleVillage/hooks/useTimeEngineLoop.ts
fast_checks:
  - tests/unit/idleVillage/mapQuestPoi.test.ts
  - tests/unit/idleVillage/poiSigillo.test.tsx
e2e_checks:
  - tests/e2e/idleVillage/gameQuestExpedition.spec.ts
  - tests/e2e/idleVillage/gameQuestLifecycle.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/components/gameFrame/MapQuestPoi.tsx
  - src/ui/idleVillage/components/gameFrame/poiSigillo.ts
  - src/ui/idleVillage/components/poi/PoiMarker.tsx
  - src/ui/idleVillage/components/minimal/QuestPOI.tsx
  - src/ui/idleVillage/components/minimal/TimeEngineStrip.tsx
  - src/ui/idleVillage/quests/QuestExpeditionDetail.tsx
  - src/ui/idleVillage/hooks/useTimeEngineLoop.ts
invariants:
  - id: CTR-game-008.INV-1
    source: plan
    source_ref: PLAN-019
    statement: >-
      Un marker quest rivelato è `available` con sigillo non scritto — la halo esiste solo mentre una run la riempie
      (R-200 supera il gate «nessun POI al boot»: le offerte si rivelano da sole a stagger dopo il veil); il click sul
      marker apre il QuestExpeditionDetail e «Invia spedizione» resta gated sugli slot required con forecast
      `incomplete`.
    test_refs:
      - tests/e2e/idleVillage/gameQuestLifecycle.spec.ts
  - id: CTR-game-008.INV-2
    source: plan
    source_ref: PLAN-019
    statement: >-
      La halo è `elapsed/live-duration` sul clock canonico (D-J): traccia i tick trascorsi anche mentre una decisione
      attende; nessuna decisione si auto-risolve oltre un tick-jump — il catch-up consuma i nodi maturati, le
      decisioni si risolvono in ordine e un'assenza lunga riempie la halo oltre la stima ma non conclude mai una
      frontiera in attesa (badge sull'overflow).
    test_refs:
      - tests/e2e/idleVillage/gameQuestExpedition.spec.ts
  - id: CTR-game-008.INV-3
    source: plan
    source_ref: PLAN-019
    statement: >-
      Un solo driver alimenta il time engine: la pausa ferma il tick, la ripresa lo riavvia, ×4 accelera
      misurabilmente rispetto a ×1; la frontiera pending di una run non matura in pausa e matura a ×4 sul clock reale.
    test_refs:
      - tests/e2e/idleVillage/gameQuestLifecycle.spec.ts
  - id: CTR-game-008.INV-4
    source: plan
    source_ref: PLAN-019
    statement: >-
      Il settlement si applica una sola volta (nessun doppio settle); i PG rilasciati tornano assegnabili; un POI
      `repeatable` resta sulla mappa con la run sganciata — riproponibile subito e di nuovo `available` dopo reload.
    test_refs:
      - tests/e2e/idleVillage/gameQuestLifecycle.spec.ts
  - id: CTR-game-008.INV-5
    source: plan
    source_ref: R-260
    statement: >-
      Il commit del settlement avviene al dismiss del report di ritorno, mai a `ended`: `beginSettlement` marca
      `settling` al primo frame dipinto del report senza mutare l'aggregato, `commitSettlement` applica gli effetti
      al dismiss; un `settling` idratato auto-committa al mount; il gate «una spedizione alla volta» resta chiuso
      finché il report non è riconosciuto.
    test_refs:
      - tests/unit/idleVillage/questCollectCommit.test.tsx
---
# CTR-game-008 — MapQuestPoi Sigillo ↔ QuestExpeditionDetail ↔ TimeEngine: offerta, halo-clock, gating e lifecycle del POI

**id:** `CTR-game-008`

**components:** `MapQuestPoi` (`mapQuestPoiView`, `poiSigillo`), `PoiMarker`, `QuestExpeditionDetail`, `useQuestPoiSession`, `TimeEngineStrip`, `QuestPOI`

**state:** `/game` con POI quest rivelati, clock canonico (`useTimeEngineLoop`) e sessione POI attiva — reveal via hook `revealQuestPois` o trigger naturale.

**invariant:**
1. `INV-1` — Un marker quest rivelato è `available` con sigillo non scritto — la halo esiste solo mentre una run la riempie; il click sul marker apre il QuestExpeditionDetail e «Invia spedizione» resta gated sugli slot required con forecast `incomplete`.
2. `INV-2` — La halo è `elapsed/live-duration` sul clock canonico (D-J): traccia i tick trascorsi anche mentre una decisione attende; nessuna decisione si auto-risolve oltre un tick-jump — il catch-up consuma i nodi maturati, le decisioni si risolvono in ordine e un'assenza lunga riempie la halo oltre la stima ma non conclude mai una frontiera in attesa (badge sull'overflow).
3. `INV-3` — Un solo driver alimenta il time engine: la pausa ferma il tick, la ripresa lo riavvia, ×4 accelera misurabilmente rispetto a ×1; la frontiera pending di una run non matura in pausa e matura a ×4 sul clock reale.
4. `INV-4` — Il settlement si applica una sola volta (nessun doppio settle); i PG rilasciati tornano assegnabili; un POI `repeatable` resta sulla mappa con la run sganciata — riproponibile subito e di nuovo `available` dopo reload.
5. `INV-5` — Il commit del settlement avviene al dismiss del report di ritorno, mai a `ended` (R-260): `settling` marca il report dipinto senza mutare l'aggregato; il dismiss applica gli effetti; un `settling` idratato auto-committa al mount; il gate «una spedizione alla volta» resta chiuso finché il report non è riconosciuto.

**source:** `PLAN-019-S2.4/S2.5` (D-J/D-K clock contract, settlement + sequential POIs) | `R-200` (repeatable POI) | `R-260` (collect-commit boundary) | `QUEST_RULES.md`

**check:**

- `npm run test -- tests/unit/idleVillage/mapQuestPoi.test.ts tests/unit/idleVillage/poiSigillo.test.tsx tests/unit/idleVillage/questCollectCommit.test.tsx`
- `npx playwright test tests/e2e/idleVillage/gameQuestExpedition.spec.ts tests/e2e/idleVillage/gameQuestLifecycle.spec.ts`

**status:** `active`

**evidence:** `.mw/runs/plan054-t003-integration-contracts/`
