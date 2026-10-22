# PLAN-072: /game first-interaction — medaglione drag tardivo + hit-area select roster (R-238)

**Status:** `completed` — fix verificati verdi su suite `/game` (Desktop Chrome), red-first lockato.
**Richiesta:** `R-238` (2026-10-21). Verbatim in `.mw/bugs/20261021-game-first-interaction/bug.md`.
**Desiderata:** v36 FROZEN (contratti vivi per-componente), v35 FROZEN (visual fork gate).
**Bug record:** `.mw/bugs/20261021-game-first-interaction/bug.md` — riproduzione, cause radice,
misure, evidenze red/green.
**Documentation Impact:** REQUIRED — `.mw/bugs/20261021-game-first-interaction/bug.md` (unico target;
nessun doc di prodotto toccato).

## Scope

Due bug riprodotti e fixati su `/game`:

1. **Medaglione drag PgCard tardivo al primo hold** — il subtree `DragOverlay` →
   `WanderlustMedalOverlay` montava a freddo alla prima attivazione dnd-kit (penalità
   misurata ~400-490 ms oltre l'hold caldo). Fix: warm-mount nascosto del medaglione nel
   portal `CustomDragOverlay` (elemento già esistente, identico render, `visibility:hidden`)
   + guard del loop rAF su `WanderlustMedalOverlay` quando non dragging.
2. **Dropdown filtro/sort roster non apriva su ~70% del pill** — il `<select>` nativo
   occupava solo ~24 px a destra della label pill (~82 px); il click su icona/label produceva
   solo focus, non il picker (comportamento nativo Chrome, calibrato su select vanilla).
   Fix: select nativo esteso (trasparente) sull'intero pill + replica non-interattiva del
   valore corrente; composizione visiva invariata (icona + valore + chevron).

## File toccati

- `src/ui/idleVillage/components/CustomDragOverlay.tsx` — warm-mount medaglione.
- `src/ui/idleVillage/components/WanderlustMedalOverlay.tsx` — guard rAF in stato non-dragging.
- `src/ui/idleVillage/rosterV2/DragTestContainerV2.tsx` — repliche valore per pill filtro/sort.
- `src/ui/idleVillage/skins/skinScope.css` — select esteso sull'intero pill `[data-hud-controls]`.
- `src/ui/idleVillage/config/gamePerfBudgets.ts` — `dragOverlayColdDeltaMaxMs` + slack automazione.
- `tests/e2e/idleVillage/gameFirstInteraction.spec.ts` — nuovo spec regressione (INV tags).
- `.mw/contracts/components/custom-drag-overlay.md` — `custom-drag-overlay.INV-1` (sync:bug).
- `.mw/contracts/components/drag-test-container-v2.md` — `drag-test-container-v2.INV-1` (sync:bug).

## Visual fork

`visual-fork: skipped — bugfix R-238, nessuna nuova rappresentazione: il pill filtro/sort conserva composizione e grammatica esistenti (icona+valore+chevron, solo hit-area allargata) e il medaglione warm-mount è un'istanza hidden del medesimo elemento — puntatore: .mw/bugs/20261021-game-first-interaction/bug.md`

## Verifica

- Red-first: `redfirst:record` su `gameFirstInteraction.spec.ts` — log rossi in `.mw/red-first/`
  (Bug B hit-test null sul pill; Bug A delta cold 421 ms nella run iniziale).
- Green: `npx playwright test tests/e2e/idleVillage/gameFirstInteraction.spec.ts --project="Desktop Chrome"`
  → 2 passed, due run consecutive; `first≈376-431 ms`, `warmBest≈302-332 ms`, delta ≤129 ms.
- `npm run build:check` ✅; `npm run redfirst:check` ✅.
- Nota metrica: la penalità cold del Bug A è **intermittente** (dipende da JIT/carico
  macchina): in una run pre-fix il delta non si è manifestato (111 ms). La signature di
  regressione registrata resta 400-490 ms; il budget delta=250 ms la cattura con margine.
- T-04: Bug B testimoniato a occhio in Chrome headed autorizzato (picker nativo che si
  apre/non si apre per punto di click). Post-fix il comportamento è misurato via hit-test
  DOM + metriche E2E; un signoff visivo headed post-fix non è stato rifatto — segnalato.
