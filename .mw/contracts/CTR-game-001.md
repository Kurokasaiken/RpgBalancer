# CTR-game-001 — Ticker Pixi vivo >10s dopo boot e wonder spawnabile via bump su `/game`

**id:** `CTR-game-001`

**components:** `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`, `src/pages/game-frame-pixi.tsx`

**state:** `/game` caricato in dev server (`npm run dev`, vite) con boot completato
(`window.__wonders` e `window.__pixiApp` esposti — seam DEV-only); vale sia su
renderer WebGL sia su fallback Canvas (`'mesh' in app.renderer.renderPipes` è la
capability discriminante).

**invariant:**
1. `app.ticker.lastTime` avanza ancora oltre 10s dopo il boot (ticker vivo: il
   RAF è ri-schedulato; un throw dentro `Ticker.update` lo uccide per sempre).
2. Zero `pageerror` nella finestra osservata.
3. `setWonderRequest` bump (bottone Director `data-action-id="wonder"`, F10)
   produce `__wonders() === 1` entro ~2s su qualunque renderer.
4. Nessun renderable con `renderPipeId` assente nel renderer attivo viene
   montato: ogni blocco mesh (`Mesh`/`MeshPlane`/shader-mesh) sta dietro
   `meshOk` o equivalente capability-guard (REG-001).

**source:** `REG-001` | `RICHIESTE.md` R-169 (wonder on hide via `wonderRequest`)

**check:** snippet Playwright (evidenza in `.mw/runs/bv-r169-2026-10-12/bv/`):

```ts
await page.goto('/game');
await page.waitForFunction(() => window.__wonders && window.__pixiApp, { timeout: 60_000 });
// ticker vivo: lastTime avanza tra due letture a >10s di distanza dal boot
// zero pageerror raccolti
// F10 → click [data-action-id="wonder"] → __wonders() === 1 entro ~2s
```

**status:** `active`

**evidence:** `.mw/runs/bv-r169-2026-10-12/bv/pw-ticker-wonder-idle.json`
