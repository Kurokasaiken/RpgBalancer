# Manual Task: PLAN-032-SP2

## Title
Magazzino del villaggio (schermata mock) + MapBuildingPoi — PLAN-032 SP-2

## Description
Implementare SP-2 di PLAN-032 secondo la spec vincolante
`plans/PLAN-032-SP-2-village-stash.md` (artifact r003, sha256
`c0432832a95b887578e6cfdfb27984106ed20e3f7e089abd123115597922a9c8`).

Pezzi: `villageStashConfig.ts` (Zod, itemId ⊆ consumabili picker, sum ≤
capacityMax, marker bounds su canvas 4240×2828), `VillageStashPanel`
(HudPlaque modeless, role=list read-only, footer ICU), `MapBuildingPoi`
(medaglione PoiMatericV3_5 sigillo, role=button, delta-click 5px, coarse
pointer senza tooltip, reduced-motion), wiring `poiToPanel` +
`buildingOpenerRef` per il focus return.

## Files Modified
- `src/balancing/config/idleVillage/villageStashConfig.ts` (nuovo)
- `src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx` (nuovo)
- `src/ui/idleVillage/components/gameFrame/MapBuildingPoi.tsx` (nuovo)
- `src/ui/idleVillage/components/gameFrame/villageStashViewModel.ts` (nuovo)
- `src/ui/idleVillage/components/gameFrame/villageStashItemIcons.tsx` (nuovo)
- `src/ui/idleVillage/components/gameFrame/hudPanelRegistry.ts`, `index.ts`
- `src/pages/game-frame-pixi.tsx` (anchor + panel render + poiToPanel)
- `public/locales/en|it-IT/idleVillage.json` (`gameFrame.stash.*`, `gameFrame.buildings.stash.name`)
- `tests/unit/idleVillage/villageStash.test.tsx` (nuovo, 12 test)

## Outcome
Completato 2026-10-14. Bundle `.mw/runs/plan032-sp2-2026-10-14/bundle.json`
PASS 4/4. Smoke headed: click marker→open, mai toggle-off, X→focus return al
marker, shortcut `v` toggle, 0 console errors.
Evidence: `test-results/PLAN-032-SP2-2026-10-14.log`,
`test-results/village-stash-smoke-2026-10-14/`.

## Timestamp
Dispatched 2026-10-14T13:10:00Z — Completed 2026-10-14T14:50:00Z

## Executor
manual (Devin session)
