# load-game-panel — Load game dialog («Carica partita»)

> PLAN-086 catalog entry. PLAN-076 T-3 (LOAD-1 A): a `GameMenuDialog`
> listing the save slots — autosave + three manual. Mounts from the
> title screen (Load pill, `inGame={false}`) and from the in-game HUD
> menu → session → Load game.

## What it is / does

- One row per slot: settlement, day, when it was saved, the heroes and
  expeditions it holds. A slot that is empty or damaged is shown but
  cannot be loaded.
- Loading over a game with unsaved progress asks first; deleting a
  save always asks. The panel restores the slot itself; `onLoaded`
  tells the host to reload the page so no stale state stays in memory.
- Same `GameMenuDialog` shell as settings: `role="dialog"` plaque over
  `game-menu-veil`, portal into `#game-modal-root`, Escape on the
  topmost screen, focus restore, single Close pill.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `in-game-menu` | script `drivers/hudMenuLoadGame.ts` — HUD menu trigger → session block, second `role="menuitem"` (Load game) | `[data-testid="load-game-panel"]` visible |
| `title` | script `drivers/titleLoadGame.ts` — `?title=1` → probes the middle title pills until `load-game-panel` mounts | `[data-testid="load-game-panel"]` visible |

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `eb4a943fa8e8fad3`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- In-context ctx-a/ctx-b + `iso-0` = `[data-testid="load-game-panel"]`
  per state (over the live map / over the title frontispiece).
- `deterministicSameBytes: true` for `title`, `false` for
  `in-game-menu`; recorded as data, not pass/fail.

## Caveats / fix history

- Driver hardened 2026-10-25 (see `fixes.md`): the menu trigger is
  awaited with `state:'visible'` before the click — the same
  boot/reveal race that flaked `memorial-panel` once (trigger mounted
  but not actionable for the whole click retry window). No failure
  observed on this component; preventive.

## Links

- Contract: `.mw/contracts/components/load-game-panel.md`
- Source: `src/ui/idleVillage/components/gameFrame/menu/LoadGamePanel.tsx`,
  `menu/GameMenuDialog.tsx`
- Drivers: `scripts/catalog/drivers/hudMenuLoadGame.ts`,
  `scripts/catalog/drivers/titleLoadGame.ts`
- Hosts: `GameEntry.tsx` (title mount), `HudGameMenu.tsx` session block
  (saveNow · loadGame · memorial · quit · settings order).

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas dialog
plaque over the veil; slot rows are readable ledger lines with
engraved affordances, not dashboard cards.
