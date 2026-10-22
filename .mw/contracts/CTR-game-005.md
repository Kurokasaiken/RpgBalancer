---
id: CTR-game-005
kind: integration
components:
  - game-frame-game-frame
  - game-frame-pixi
  - pixi-world-map
external_dependencies:
  - src/balancing/config/idleVillage/gameFrameConfig.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: CTR-game-005.INV-1
    source: director-bug
    source_ref: R-148
    statement: >-
      `INV-1` — La proiezione screen-space della terra protetta (`worldDressing.safeFit.landBounds`) è disgiunta dal
      chrome FISSO (placche top, plinto nav) a riposo e dopo recenter/refit, a DPR 1 e DPR 2. Pre-check anti-vacuous:
      `topPlaques ≥ 2`, `navPlinth === 1`, `__worldCam` presente e calibrato sul landmark world `4240×2828`
      (`manifest.coordinateSystem.canvas`).
    test_refs:
      - tests/e2e/idleVillage/gameGeometryT01.spec.ts
      - tests/helpers/mapFitContract.ts
  - id: CTR-game-005.INV-2
    source: director-bug
    source_ref: R-148
    statement: >-
      `INV-2` — Dopo wheel-zoom utente (`userMoved`) un resize mantiene il south-pin (bordo sud della terra sopra la
      banda chrome inferiore, tolleranza 6 px) e zero violazioni sul chrome fisso; idem con un pannello fluttuante
      aperto (gli inset cambiano → refit riprotegge la terra). I pannelli fluttuanti POSSONO coprire la terra
      (spostabili/chiudibili): riportati, non violazioni.
    test_refs:
      - tests/e2e/idleVillage/gameGeometryT01.spec.ts
      - tests/helpers/mapFitContract.ts
  - id: CTR-game-005.INV-3
    source: director-bug
    source_ref: R-148
    statement: >-
      `INV-3` — Ai bound di pan (`±seaMarginPx` / `seaMarginYPx`) e zoom frazionario il quad mare (`canvas + 2·(margin +
      SEA_QUAD_PAD)`) copre l'intero viewport; la scanline sullo screenshot trova zero pixel di stage-leak
      (`worldDressing.stageColor`) nella fascia di bordo 3 px e nessun gradino netto sostenuto (ΔL>48 su >50% dei
      campioni) lungo la giunzione `canvasEdge` — la «riga tra mare vecchio e nuovo» di R-148.
    test_refs:
      - tests/e2e/idleVillage/gameGeometryT01.spec.ts
      - tests/helpers/mapFitContract.ts
---
# CTR-game-005 — Map fit & sea continuity: terra protetta mai sotto il chrome fisso, nessuna riga di stage-leak ai bound di pan

**id:** `CTR-game-005`

**components:** `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`, `src/ui/idleVillage/pixiSpike/mapFitRuntime.ts`, `src/balancing/config/idleVillage/gameFrameConfig.ts`, `src/ui/idleVillage/components/gameFrame/GameFrame.tsx`, `src/pages/game-frame-pixi.tsx`

**state:** `/game` caricato (dev server `npm run dev` su `localhost:5173` oppure build `playwright` del preview server e2e) con boot completato — seam `window.__worldCam` / `window.__worldCamCtl` esposte (`isMapFitTestRuntime` in `mapFitRuntime.ts`).

**invariant:**
1. `INV-1` — La proiezione screen-space della terra protetta (`worldDressing.safeFit.landBounds`) è disgiunta dal chrome FISSO (placche top, plinto nav) a riposo e dopo recenter/refit, a DPR 1 e DPR 2. Pre-check anti-vacuous: `topPlaques ≥ 2`, `navPlinth === 1`, `__worldCam` presente e calibrato sul landmark world `4240×2828` (`manifest.coordinateSystem.canvas`).
2. `INV-2` — Dopo wheel-zoom utente (`userMoved`) un resize mantiene il south-pin (bordo sud della terra sopra la banda chrome inferiore, tolleranza 6 px) e zero violazioni sul chrome fisso; idem con un pannello fluttuante aperto (gli inset cambiano → refit riprotegge la terra). I pannelli fluttuanti POSSONO coprire la terra (spostabili/chiudibili): riportati, non violazioni.
3. `INV-3` — Ai bound di pan (`±seaMarginPx` / `seaMarginYPx`) e zoom frazionario il quad mare (`canvas + 2·(margin + SEA_QUAD_PAD)`) copre l'intero viewport; la scanline sullo screenshot trova zero pixel di stage-leak (`worldDressing.stageColor`) nella fascia di bordo 3 px e nessun gradino netto sostenuto (ΔL>48 su >50% dei campioni) lungo la giunzione `canvasEdge` — la «riga tra mare vecchio e nuovo» di R-148. Regola coverage-aware: un pixel di bordo conta come stage-leak solo se **non coperto** dal quad mare proiettato — dove il quad arriva il pixel rasterizzato appartiene alla texture (il mare profondo lontano dalla terra converge a un tono piatto entro ±2 dello stage color: osservato a 3440×1440, sarebbe falso positivo); `seaQuad` mancante dalla misura → tutto scoperto, fail-closed.

**Scaled-inset rule (R-225 ultrawide):** il browser auto HUD scale (`hudScale.cssZoom` da `useHudScale`, ≈1.30 a 3440×1440) ingrandisce il chrome fisso via CSS `zoom`; gli inset effettivi riservati dal fit sono quindi `safeFit.insets.{top,bottom} × cssZoom` (derivati in `game-frame-pixi.tsx`, refit al cambio via `safeFitKey`). I check `fixedChrome`/`southPin` usano gli inset effettivi; Tauri/native zoom non riapplica il fattore (cssZoom = 1).

**source:** `R-148` (map fit seams, REGRESSION log) | `src/docs/docs/design/game_map_fit_contract.md` | `PLAN-054` T-001 (pilot living contract) | recurring trap `T-01`

**check:**

- `tests/e2e/idleVillage/gameGeometryT01.spec.ts` — blocchi `// INV:CTR-game-005.INV-1..3` (matrice viewport `1440×900, 1280×800, 1920×800, 1600×760, 1024×700, 3440×1440` × DPR 1 + caso dedicato `3440×1440` HUD auto zoom + `1440×900` × DPR 2) sul preview build `mode playwright`.
- `scripts/probe-game-map-fit.cjs` — stesso modulo condiviso `tests/helpers/mapFitContract.ts`, CLI fail-closed (`exit 1` rosso / `exit 0` verde), screenshot + `probe-report.json` con verdict per viewport. `3440×1440` è nella matrice bloccante (R-225); diagnostico extra su `1512×982`, `480×700`.
- `window.__worldCamCtl.set({panX,panY,zoom})` guida deterministicamente la camera ai bound; `.refit()` ripristina il fit a riposo. Seam test-only, mai in produzione.

**status:** `active`

**evidence:** `.mw/runs/plan054-t001-mapfit-contract/` + `.mw/runs/r225-ultrawide-map-fit/` + `test-results/probe-game-map-fit/probe-report.json` + `test-results/plan-054/t001-red-green-cycle.log`
