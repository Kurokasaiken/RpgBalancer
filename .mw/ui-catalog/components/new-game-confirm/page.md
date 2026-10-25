# new-game-confirm — New-game confirm dialog (title screen)

> PLAN-086. `overlay`: the guard dialog on the title screen — "starting a
> new game discards day-N progress". Mounts only when
> `info.hasProgress`; a fresh profile goes straight into a new game with
> no prompt.

## What it is / does

- `data-testid="new-game-confirm"` — a `GameMenuConfirm` inside a 500 px
  `GameMenuDialog` (`hideClose` — the only exits are the two buttons).
- Body: `gameFrame.menu.newGame.body` with the current `info.day`
  interpolated; title `gameFrame.menu.newGame.title`.
- Actions: **Cancel** (`cancelLabel`, closes to the title) and the single
  confirm action `gameFrame.menu.newGame.confirm` (disabled while `busy`)
  → `onNewGameConfirmed()` → save reset → `enterGame()`.
- Rendered by `GameEntry` next to `LoadGamePanel`/`SettingsPanel` in the
  same `panel` slot — at most one is up.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | script `drivers/newGameConfirm.ts` (title via `?title=1` → New Game pill; when the fresh profile skips the dialog it first writes a real save through HUD menu → Save Now, re-stages title, clicks New Game again) | `[data-testid="new-game-confirm"]` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `af7b1f7d5ff39be8`,
  metal backend, 1440×900, reduced-motion `reduce`, 0 console errors /
  0 network failures.
- `default-ctx-a/b.png` — dialog over the title screen (title still
  behind it); `default-iso-0.png` — the dialog element crop.
- `deterministicSameBytes: true` — static dialog on a static title.
- Reach note: the driver's save-first path ran for real (fresh profile →
  Save Now via HUD menu → `?title=1` → New Game → confirm), so the shot
  shows the genuine `hasProgress` branch, not a mock.

## Links

- Contract: `.mw/contracts/components/game-menu-confirm.md`
- Scope: `src/ui/idleVillage/components/gameFrame/menu/GameEntry.tsx`
  (`panel === 'newgame'` branch, ~L124), `GameMenuConfirm.tsx` +
  `GameMenuDialog`.
- Driver: `scripts/catalog/drivers/newGameConfirm.ts`.

## Art-direction slice (rubric rev 3)

`overlay` → ART-DIRECTION L1+L2 + z-index/portaling: modal materic dialog
over the title frontispiece; destructive intent carried by copy + CTA
materia, focus trapped in the dialog, no backdrop-dismiss ambiguity.
