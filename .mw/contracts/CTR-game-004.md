# CTR-game-004 — Coreografia evento invasione: un goblin alla volta, peel→marker, card ripiegata nel registro, camera ferma

**id:** `CTR-game-004`

**components:** `src/ui/idleVillage/components/WorldSurfaceEventCard.tsx`, `src/ui/idleVillage/components/GoblinInvasionWindow.tsx`, `src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx`, `src/pages/game-frame-pixi.tsx`, `src/pages/game-frame.tsx`

**state:** `/game` con `__idleVillageTestHooks.startInvasion`/`getInvasion`; scena attiva dalla conferma della card (`[data-testid="world-event-card-body"] button`) fino alla piega nel registro.

**invariant:**
1. Un solo goblin visibile alla volta in ogni istante della sequenza (case → sticker in volo → marker sulla mappa).
2. Il marker `[data-testid="invasion-goblin-marker"]` resta nascosto finché lo sticker non atterra; diventa visibile dopo.
3. Lo sticker `goblin-window-sticker` parte dalla posizione del goblin nella card e vola verso il marker.
4. Mappa/camera stabili durante la sequenza, all'interno dello stesso game day.
5. La riga del registro `[data-event-id="invasion"]` esiste e resta visibile dopo la scena; la card si ripiega verso la riga (<90px di altezza) prima di svanire.
6. Il ledger resta aperto dopo l'evento.

**source:** `RICHIESTE.md` R-185 (verbatim Director, video 2026-10-14, 5 difetti) | `.mw/bugs/20261014-game-invasion-event-choreography/bug.md` | PLAN-033 (marcia goblin)

**check:** `npx playwright test tests/e2e/idleVillage/gameInvasionScene.spec.ts tests/e2e/idleVillage/gameInvasionMarch.spec.ts tests/e2e/idleVillage/gameInvasionSequence.spec.ts tests/e2e/idleVillage/gameEventFreeze.spec.ts` (12 test). Per prove visive complete: `npx tsx scripts/verification/captureInvasion.ts <runDir>` (frame + metrics + attestazione ambiente).

**status:** `active`

**evidence:** `.mw/runs/r185-closure/` (bundle PASS: 12/12 E2E + 34 frame + metrics + verificatore indipendente CONFIRMED×2, 2026-10-14)
