# Contracts — INDEX

Protezione attiva (invariant + check + state). La storia dei difetti vive in
`.mw/regression/`; qui vive ciò che va rieseguito a ogni modifica dell'area.

| id | titolo | components | status |
|---|---|---|---|
| CTR-game-001 | Ticker Pixi vivo >10s dopo boot e wonder spawnabile via bump su `/game` | `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`, `src/pages/game-frame-pixi.tsx` | active |
| CTR-game-002 | Clock freeze durante event theatre + ripristino esatto dello stato pre-trigger | `src/pages/game-frame-pixi.tsx`, `src/pages/game-frame.tsx`, `src/ui/idleVillage/hooks/useTimeEngineLoop.ts` | active |
| CTR-game-003 | HUD idle auto-hide / wake-on-input / wake-on-event, manuale resta fino a toggle | `src/ui/idleVillage/components/gameFrame/GameFrame.tsx`, `src/ui/idleVillage/components/gameFrame/HudHideToggle.tsx`, `src/balancing/config/idleVillage/gameFrameConfig.ts` | active |

## Note

- Baseline BV per glob su `components`, un salto sugli import — non per
  call-graph (nessun grafo di dipendenze disponibile in questo repo).
- `scripts/contracts-check.py` non esiste in questo repo: la ri-esecuzione dei
  check è procedurale (BV), non enforced.
