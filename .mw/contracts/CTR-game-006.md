---
id: CTR-game-006
kind: integration
components:
  - use-game-stage-zones
  - stage-band
  - quest-stage-cluster
  - hud-panel
  - floating-panel
  - hero-sheet-panel
  - quest-expedition-detail
  - quest-run-window
external_dependencies: []
fast_checks:
  - tests/unit/idleVillage/stageZonesSolver.test.ts
  - tests/unit/idleVillage/heroSheetPlacement.test.ts
e2e_checks:
  - tests/e2e/idleVillage/gameQuestPlannerLayout.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/components/gameFrame/stageZones/**
  - src/ui/idleVillage/components/gameFrame/HeroSheetPanel.tsx
  - src/ui/idleVillage/components/gameFrame/QuestStageCluster.tsx
  - src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx
  - src/ui/idleVillage/components/FloatingPanel.tsx
  - src/ui/idleVillage/skins/primitives/HudPanel.tsx
  - src/ui/idleVillage/questS1Lab/hud/**
  - src/ui/idleVillage/quests/QuestExpeditionDetail.tsx
invariants:
  - id: CTR-game-006.INV-1
    source: plan
    source_ref: PLAN-043
    statement: >-
      Il solver dello stage a 3 zone è deterministico e non ammette vicoli ciechi: zero overlap e zero collisione col
      chrome su tutti i viewport contrattati, replay di intent stream identici bit-identico, l'apertura sospende
      l'occupante espanso in conflitto (top-of-stack), il flip di regime ritira gli occupanti di sessione in un solo
      commit e le liste di occupazione restano ordinate per openSeq e uniche tra le zone. (R-253, ruling Director
      2026-10-22: in regime `run` il cluster quest è modal-grade e può dipingere SOPRA le bande chrome entro
      `stageZones.questChromeOverlap` — il vincolo chrome-clear resta pieno in regime `generic`.)
    test_refs:
      - tests/unit/idleVillage/stageZonesSolver.test.ts
  - id: CTR-game-006.INV-2
    source: plan
    source_ref: PLAN-043
    statement: >-
      Il placement della scheda eroe (heroSheet) non copre mai la carta che descrive né il planner; resta dentro lo
      schermo col margine e fuori dal chrome fisso HUD (barra top, navigazione); a parità di scelta sacrifica prima il
      roster che il planner, e in assenza di posti liberi minimizza la copertura.
    test_refs:
      - tests/unit/idleVillage/heroSheetPlacement.test.ts
  - id: CTR-game-006.INV-3
    source: plan
    source_ref: PLAN-043
    statement: >-
      Il planner (Dispatch Table / QuestExpeditionDetail) su `/game` non ha overflow interno a viewport ≥720px, tiene
      CTA e sidecar sullo schermo, si clampa dentro il viewport anche su drag verso gli angoli (l'ala pinnata non si
      muove) e mantiene la parità tastiera completa (tray pick, reorder token, bag pick, CTA reason senza pointer).
    test_refs:
      - tests/e2e/idleVillage/gameQuestPlannerLayout.spec.ts
---
# CTR-game-006 — Stage a 3 zone: orchestrazione pannelli/planner/teatro + placement scheda eroe

**id:** `CTR-game-006`

**components:** `stageZones/*` (`useGameStageZones`, `stageZonesReducer`), `StageBand`, `QuestStageCluster`, `HudPanel`, `FloatingPanel`, `HeroSheetPanel`, `QuestExpeditionDetail`, `QuestRunWindow`

**state:** `/game` caricato con pannelli HUD e planner/teatro orchestrati dal solver delle 3 zone (`resolveQuestShellLayout`, stageZonesReducer) — desktop e regime run.

**invariant:**
1. `INV-1` — Il solver dello stage a 3 zone è deterministico e non ammette vicoli ciechi: zero overlap e zero collisione col chrome su tutti i viewport contrattati, replay di intent stream identici bit-identico, l'apertura sospende l'occupante espanso in conflitto (top-of-stack), il flip di regime ritira gli occupanti di sessione in un solo commit e le liste di occupazione restano ordinate per openSeq e uniche tra le zone. (R-253, ruling Director 2026-10-22: in regime `run` il cluster quest è modal-grade e può dipingere SOPRA le bande chrome entro `stageZones.questChromeOverlap` — il vincolo chrome-clear resta pieno in regime `generic`.)
2. `INV-2` — Il placement della scheda eroe (heroSheet) non copre mai la carta che descrive né il planner; resta dentro lo schermo col margine e fuori dal chrome fisso HUD (barra top, navigazione); a parità di scelta sacrifica prima il roster che il planner, e in assenza di posti liberi minimizza la copertura.
3. `INV-3` — Il planner (Dispatch Table / QuestExpeditionDetail) su `/game` non ha overflow interno a viewport ≥720px, tiene CTA e sidecar sullo schermo, si clampa dentro il viewport anche su drag verso gli angoli (l'ala pinnata non si muove) e mantiene la parità tastiera completa (tray pick, reorder token, bag pick, CTA reason senza pointer).

**source:** `PLAN-043` (WS-3 Dispatch Table geometry, stage zones, heroSheet placement) | `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` righe mission-planner / quest

**check:**

- `npm run test -- tests/unit/idleVillage/stageZonesSolver.test.ts tests/unit/idleVillage/heroSheetPlacement.test.ts`
- `npx playwright test tests/e2e/idleVillage/gameQuestPlannerLayout.spec.ts` (preview build `mode playwright`)

**status:** `active`

**evidence:** `.mw/runs/plan054-t003-integration-contracts/`
