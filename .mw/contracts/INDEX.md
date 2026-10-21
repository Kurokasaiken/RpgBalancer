# Contracts — INDEX

Protezione attiva (invariant + check + state). La storia dei difetti vive in
`.mw/regression/`; qui vive ciò che va rieseguito a ogni modifica dell'area.

| id | titolo | components | status |
|---|---|---|---|
| CTR-game-001 | Ticker Pixi vivo >10s dopo boot e wonder spawnabile via bump su `/game` | `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`, `src/pages/game-frame-pixi.tsx` | active |
| CTR-game-002 | Clock freeze durante event theatre + ripristino esatto dello stato pre-trigger | `src/pages/game-frame-pixi.tsx`, `src/pages/game-frame.tsx`, `src/ui/idleVillage/hooks/useTimeEngineLoop.ts` | active |
| CTR-game-003 | HUD idle auto-hide / wake-on-input / wake-on-event, manuale resta fino a toggle | `src/ui/idleVillage/components/gameFrame/GameFrame.tsx`, `src/ui/idleVillage/components/gameFrame/HudHideToggle.tsx`, `src/balancing/config/idleVillage/gameFrameConfig.ts` | active |
| CTR-game-004 | Coreografia evento invasione: un goblin alla volta, peel→marker, card ripiegata nel registro, camera ferma | `WorldSurfaceEventCard.tsx`, `GoblinInvasionWindow.tsx`, `gameFrame/HudEventLedger.tsx`, `game-frame-pixi.tsx`, `game-frame.tsx` | active |
| CTR-game-005 | Map fit & sea continuity: terra protetta disgiunta dal chrome fisso (DPR 1/2), south-pin dopo user-zoom+resize+pannello, quad mare + scanline anti stage-leak ai bound di pan | `PixiWorldMap.tsx`, `mapFitRuntime.ts`, `gameFrameConfig.ts`, `GameFrame.tsx`, `game-frame-pixi.tsx` | active |
| CTR-game-006 | 3-Zone Stage ↔ Panels/Planner/Theatre + `heroSheet`: zero overlap/chrome-clear sui viewport contrattuali, heroSheet dentro i bounds liberi, planner/layout integrato | `stageZones*`, `heroSheet*`, `game-frame-pixi`, panels (roster/stash/questDetail/events/merchant) | active |
| CTR-game-007 | RosterV2 ↔ ResidentSlotRack `hud64` ↔ QuestExpeditionDetail: eleggibilità/assegnazione slot, visibilità roster, seguimento roster↔detail | `rosterV2`, `ResidentSlotRack`, `QuestExpeditionDetail` | active |
| CTR-game-008 | MapQuestPoi Sigillo ↔ QuestExpeditionDetail ↔ TimeEngine: click marker→detail+gating send, forecast, pause/resume/speed, maturazione frontiera, settle idempotente + POI repeatable | `MapQuestPoi`, `QuestExpeditionDetail`, `TimeEngine`/clock HUD | active |
| CTR-game-009 | QuestRunWindow ↔ DestinyAstrolabeV62 ↔ QuestRewardPopup ↔ Settlement/HUD: lancio→run window, guida sfera astrolabio, settlement una-volta, popup esito non-modale staged | `QuestRunWindow`, `DestinyAstrolabeV62`, `QuestRewardPopup`, settlement | active |

## Note

- Baseline BV per glob su `components`, un salto sugli import — non per
  call-graph (nessun grafo di dipendenze disponibile in questo repo).
- La ri-esecuzione dei check è enforced da `scripts/verification/contractsCheck.ts`
  (`contracts:check`): inventario, schema, tag `// INV:<id>`, ratchet su `BASE`.
