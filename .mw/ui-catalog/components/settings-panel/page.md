# settings-panel — Settings dialog («Impostazioni»)

> PLAN-086 catalog entry. PLAN-076 T-4 (SET-1 A): one `GameMenuDialog`
> plaque, sections in a column — every row a real setting that acts
> immediately. The same dialog mounts from the title screen (Settings
> pill) and from the in-game HUD menu → session/options → All settings.

## What it is / does

- `GameMenuDialog` shell (`GameMenuDialog.tsx`): `role="dialog"`
  `HudPlaque shape="panel"` over the `game-menu-veil`, portaled into
  `#game-modal-root` (T-16), Escape closes the topmost screen only,
  focus returns to the invoker on close, title row carries the single
  Close pill.
- Rows: **Language** radiogroup (en / it-IT), **Interface size**
  radiogroup (desktop app only — passed via the `scale` prop, row
  omitted without it), **Reduced motion** `role="switch"`.
- The music level exists in the model but has no source on `/game`
  yet, so it has no row.
- All strings via `idleVillage` i18n; buttons are neutral HUD pills
  (`data-hud-controls`) — no CTA plaque while BTN-1 is open.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `title` | script `drivers/titleSettings.ts` — `?title=1` → probes the last title pills until `settings-panel` mounts | `[data-testid="settings-panel"]` visible |
| `in-game-menu` | script `drivers/hudMenuSettings.ts` — HUD menu trigger → last `role="menuitem"` (Settings) | `[data-testid="settings-panel"]` visible |

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `ea8a40e50c07da51`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- In-context ctx-a/ctx-b + `iso-0` = `[data-testid="settings-panel"]`
  per state: `title` shows the dialog over the title frontispiece,
  `in-game-menu` over the live map.
- `deterministicSameBytes: true` for `title` (static title screen —
  byte-identical double capture), `false` for `in-game-menu` (live map
  behind the veil); recorded as data, not pass/fail.

## Caveats / fix history

- **State ordering hazard (fixed 2026-10-25, see `fixes.md`).**
  `title` runs first and leaves the page on `?title=1`, where
  `GameEntry` mounts **no game at all** — `hud-menu-trigger` does not
  exist and the original `hudMenuSettings` threw a 30 s `getAttribute`
  timeout, killing the run. The driver now detects the title screen,
  closes the open dialog, enters via the first title pill
  (Continue/Nuova partita → optional `new-game-confirm`), waits the
  boot screen, then opens the menu — input-reale throughout.

## Links

- Contract: `.mw/contracts/components/settings-panel.md`
- Source: `src/ui/idleVillage/components/gameFrame/menu/SettingsPanel.tsx`,
  `menu/GameMenuDialog.tsx`
- Drivers: `scripts/catalog/drivers/titleSettings.ts`,
  `scripts/catalog/drivers/hudMenuSettings.ts`
- Hosts: `GameEntry.tsx` (title mount, `inGame` context absent),
  `HudGameMenu.tsx` (in-game menu → last session/options menuitem).

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas dialog
plaque over the darkened veil, radio pills and engraved close —
section rows read as settings, not as dashboard cards.
