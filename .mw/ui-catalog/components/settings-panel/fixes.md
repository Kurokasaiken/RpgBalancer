# settings-panel — documenter fixes (PLAN-086 worker)

## `in-game-menu` — crashed after the `title` state: no game under the title screen

**Observed.** Run 1: `title` passed (dialog shots captured), then
`in-game-menu`'s driver died on
`getByTestId('hud-menu-trigger').getAttribute()` — TimeoutError 30 s —
which propagated out of `documentComponent.mts` (`runDriver` has no
try/catch for `script` drivers) and killed the run **without writing
`meta.json` or updating the manifest**. `title` shots survived on disk.

**Cause.** `titleSettings` ends on `?title=1`. `GameEntry.tsx:57,108`
mounts `phase:'title'` → `return <TitleScreen …/>` — the game children
are **not mounted at all** under the title screen, so
`hud-menu-trigger` never exists. `HudGameMenu` only lives inside the
game tree.

**Fix applied (driver-side, `scripts/catalog/drivers/hudMenuSettings.ts`).**
The driver now detects `title-screen` and performs the real user path:
close any open `role="dialog"` (Escape, then the dialog's first button
as fallback) → click the first title pill (Continue when a save exists,
otherwise Nuova partita — `openGame`'s own `input-reale:title-continue`
convention) → confirm `new-game-confirm` if it appears →
`waitBootCleared` → `hud-menu-trigger.waitFor({state:'visible',30s})` →
the original menu flow. Rerun: both states `ok`.

**Alternative repair (not applied — needs a manifest edit).** Reorder
the states to `in-game-menu` first, `title` last, matching
`load-game-panel` — the destructive `page.goto('?title=1')` then runs
after all in-game states.

**Harness-side hardening worth considering.** `documentComponent.mts`
`runDriver` should wrap `mod.drive(ctx)` in try/catch and record
`'driver threw'` as the state result — one thrown driver currently
discards the whole run's meta.json (the `title` state's evidence
included).
