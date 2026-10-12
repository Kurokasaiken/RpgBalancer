# CTR-game-003 — HUD idle auto-hide / wake-on-input / wake-on-event

**id:** `CTR-game-003`

**components:** `src/ui/idleVillage/components/gameFrame/GameFrame.tsx`, `src/ui/idleVillage/components/gameFrame/HudHideToggle.tsx`, `src/balancing/config/idleVillage/gameFrameConfig.ts`, `src/pages/game-frame.tsx`, `src/pages/game-frame-pixi.tsx`

**state:** chrome HUD montato (`.game-frame`); `hudHide.idleHideMs > 0`
(default 30000 in config Zod — mai magic number nel componente).

**invariant:**
1. Dopo `idleHideMs` di inattività (`pointerdown/pointermove/keydown/wheel`)
   il chrome scivola via: `[data-hud-hidden]` presente, `hiddenBy='idle'`,
   telemetry `game_hud_toggle {reason:'idle'}`.
2. Nascosto **da idle**: qualunque input reale lo richiama
   (`reason:'input'`) — eccetto un hit sulla perla/toggle
   (`[data-hud-hide-toggle]`), che resta gesto deliberato. L'effetto stesso
   non conta come wake (niente self-wake al commit dell'hide).
3. Nascosto **a mano** (`h` o perla, `hiddenBy='manual'`): nessun input lo
   risveglia; torna solo col toggle o con `hudWakeSignal`.
4. `hudWakeSignal` bump (rising edge `shroudCovered` + `events.length` ledger)
   richiama il chrome in ogni caso (`reason:'event'`), anche da manuale.
5. `onHudHiddenChange(hidden, cause)` riporta ogni transizione con la causa
   (`'idle'`/`'manual'`); `wonderOnHide` (config) bumpa `wonderRequest` **solo**
   su `cause === 'idle'` — il wonder è il premio della contemplazione, un hide
   manuale è una vista pulita deliberata (decisione Director 2026-10-12,
   BV F-2). CTR-game-001 copre lo spawn.
6. `idleHideMs <= 0` disabilita l'auto-hide; `prefers-reduced-motion` azzera
   `slideMs`.

**source:** `RICHIESTE.md` R-169 (direzione ratificata explorer→Director)

**check:** `npx vitest run tests/unit/idleVillage/gameHudIdle.test.tsx` (5/5,
fake timers) + porzione idle dello snippet Playwright di CTR-game-001
(31s reali → `[data-hud-hidden]` → `mouse.move` → visibile).

**status:** `active`

**evidence:** `.mw/runs/bv-r169-2026-10-12/bv/vitest-gameHudIdle.log`,
`.mw/runs/bv-r169-2026-10-12/bv/pw-ticker-wonder-idle.json`
