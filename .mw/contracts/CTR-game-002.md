---
id: CTR-game-002
kind: integration
components:
  - game-frame
  - game-frame-pixi
external_dependencies:
  - src/ui/idleVillage/hooks/useTimeEngineLoop.ts
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: CTR-game-002.INV-1
    source: director-bug
    source_ref: R-169
    statement: >-
      Dal rising edge di `shroudCovered` fino a ~1s dopo il falling edge: `isPaused === true` e `currentTick` non avanza
      (clock frozen).
    test_refs:
      - tests/e2e/idleVillage/gameEventFreeze.spec.ts
  - id: CTR-game-002.INV-2
    source: director-bug
    source_ref: R-169
    statement: >-
      Ripristino esatto dello stato pre-trigger: pre-trigger paused → post paused; pre-trigger running a Nx → post
      running a Nx. `speedMultiplier` non viene mai toccato dal freeze.
    test_refs:
      - tests/e2e/idleVillage/gameEventFreeze.spec.ts
  - id: CTR-game-002.INV-3
    source: director-bug
    source_ref: R-169
    statement: >-
      Input tempo muti durante il freeze: `Space`/`1-9`/`onTogglePause`/ `onSpeedChange` inerti (`timeInputLocked` →
      `useTimeEngineLoop({inputLocked})`).
    test_refs:
      - tests/e2e/idleVillage/gameEventFreeze.spec.ts
  - id: CTR-game-002.INV-4
    source: director-bug
    source_ref: R-169
    statement: 'Il theatre sveglia l''HUD: `hudWakeSignal` bump su rising edge → chrome visibile anche se nascosto a mano.'
    test_refs:
      - tests/e2e/idleVillage/gameEventFreeze.spec.ts
  - id: CTR-game-002.INV-5
    source: director-bug
    source_ref: R-169
    statement: >-
      La marcia del goblin post-teatro NON è coperta dal freeze (evento di mondo a tende aperte): il clock è già
      ripristinato quando cammina.
    test_refs:
      - tests/e2e/idleVillage/gameEventFreeze.spec.ts
---
# CTR-game-002 — Clock freeze durante event theatre + ripristino esatto dello stato pre-trigger

**id:** `CTR-game-002`

**components:** `src/pages/game-frame-pixi.tsx`, `src/pages/game-frame.tsx`, `src/ui/idleVillage/hooks/useTimeEngineLoop.ts`

**state:** `/game?capture=1` con `__idleVillageTestHooks.startInvasion` +
`getClock` esposti; sequenza nominata: `shroudCovered` rising edge → card →
click → `shroudCovered` falling edge → release ~1s dopo la riapertura delle
tende (~900ms).

**invariant:**
1. Dal rising edge di `shroudCovered` fino a ~1s dopo il falling edge:
   `isPaused === true` e `currentTick` non avanza (clock frozen).
2. Ripristino esatto dello stato pre-trigger: pre-trigger paused → post paused;
   pre-trigger running a Nx → post running a Nx. `speedMultiplier` non viene
   mai toccato dal freeze.
3. Input tempo muti durante il freeze: `Space`/`1-9`/`onTogglePause`/
   `onSpeedChange` inerti (`timeInputLocked` → `useTimeEngineLoop({inputLocked})`).
4. Il theatre sveglia l'HUD: `hudWakeSignal` bump su rising edge → chrome
   visibile anche se nascosto a mano.
5. La marcia del goblin post-teatro NON è coperta dal freeze (evento di mondo a
   tende aperte): il clock è già ripristinato quando cammina.

**source:** `RICHIESTE.md` R-169 (verbatim Director) | `plans/PLAN-033-game-event-shroud-goblin-march.md` T-009

**check:** `npx playwright test tests/e2e/idleVillage/gameEventFreeze.spec.ts`
(3 test: running→freeze→resume a 2x, paused→paused, HUD hidden→wake su invasione).

**status:** `active`

**evidence:** `.mw/runs/bv-r169-2026-10-12/bv/playwright-gameEventFreeze.log`
