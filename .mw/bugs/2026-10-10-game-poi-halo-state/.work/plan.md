# Piano — POI reveal + semantica halo su /game

1. `MapQuestPoi.mapQuestPoiView` → view model `{state, progress, deadlineWarn, direction}`:
   - available sano → `assigned` + progress 0 + clockwise (sigillo vuoto)
   - in_progress → `assigned` + activityProgress + clockwise
   - available + `expiring` → state `expiring`, progress = availability/EXPIRING_BELOW, counterclockwise
   - expired → `expired` (fade)
   - rimosso `LiquidHalo` separato
2. `PoiMatericV3_5`: `expiring` → warn palette (`--skin-status-unmet`), classe `poiv3_5--expiring` con breath lento (C-004)
3. `MapDemoPoi`: `assigned`+0+clockwise + entrata ease-in
4. `game-frame-pixi.tsx`: offerte reali montate solo se `questShown` (toggle Director «Mostra quest») o run attiva; mock city-rats fuori dalla mappa; extraEvents sul goblin; hook `revealQuestPois` per `?capture=1`
5. Test: unit `mapQuestPoi.test.ts` (direction, soglia, ccw); E2E lifecycle/expedition/steam aggiornati al reveal; boot test → «nessun POI finché la Regia non li rivela»
6. Safeguards: lint scope, vitest scope, build:check, kanban:lint
