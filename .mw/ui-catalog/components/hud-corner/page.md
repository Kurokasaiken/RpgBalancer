# hud-corner — Bottom-right control cluster

> PLAN-086 catalog entry. Region `HUD-3` (R-234): three 40px lacquer
> discs — game menu · panels menu · hide toggle — anchored to the
> bottom-right corner of `/game`. The cluster owns utility chrome only:
> navigation lives in the bottom-center plinth (nav-bar), status in the
> top tabs (hud-top-tabs).

## What it is / does

- **Game menu** (`data-testid="hud-menu-trigger"`, `HudGameMenu`):
  opens a tall `role="menu"` plaque with three sections — PANELS
  (checkbox rows for every closeable panel, shared with the panels
  menu; dev panels Director/Tuning listed in dev builds), SESSION
  (Save now with saving→saved flash; Load game / Memorial / Quit to
  title — enabled only when the parent passes a handler, otherwise
  dimmed at 0.45 opacity) and OPTIONS (Language en/it-IT radiogroup,
  Interface size auto/100–200% — desktop only, All settings).
  Opens on click **and on Esc** (HUD-3 = P1); click-outside and Esc
  close it. Telemetry `game_menu_*`.
- **Panels menu** (`data-hud-panels-trigger`, `HudPanelsMenu`): the
  short way back for closed floating panels — one `role="menu"` plaque
  listing each panel with its shortcut glyph (R/E/V/M + D/T in dev).
  Closes on click-outside and Esc.
- **Hide toggle** (`data-testid="hud-hide-toggle"`, `HudHideToggle`):
  the "pearl that outlives the HUD" — sends all chrome off its edges
  (glyph flips eye → eye-off, `aria-pressed` true) and stays visible so
  the chrome can be called back. The `h` key does the same
  (`DEFAULT_GAME_FRAME_CONFIG.hudHide.shortcut`).

All three triggers are plain 40×40 round buttons with an engraved
glyph (`EngravedIcon` cmd-menu / cmd-panels / cmd-eye[-off]) and a
`HudTooltip` on side `top`; dropdowns are `HudPlaque shape="panel"`.
`data-hud-controls` sits on each component root so dropdown rows get
the pill treatment, not the bronze-CTA default (T-03 trap, R-138).

Note: `HudRecenterButton.tsx` is in `scopeFiles` for historical
reasons, but the recenter disc renders inside the bottom-center nav
plinth (`recenterSlot`), **not** in this cluster.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface `S1_WorldMapIdle` | `hud-hide-toggle` / `hud-menu-trigger` visible |
| `menu-open` | surface + key `Escape` | `hud-menu-trigger[aria-expanded="true"]` |
| `panels-open` | script `drivers/hudPanelsOpen.ts` (clicks the real trigger) | `[data-hud-panels-trigger][aria-expanded="true"]` |
| `hud-hidden` | surface + key `h` | `hud-hide-toggle[aria-pressed="true"]` — pearl survives |

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `e061dab3`, sourceHash
  `8cfa6f76`, metal backend, 1440×900, reduced-motion, 0 console
  errors / 0 network failures.
- In-context full-surface shots (ctx-a/ctx-b) + isolated shots:
  `iso-0` = `[data-hud-corner]` (the three discs; in `hud-hidden` the
  lone pearl), `iso-1` = the open `[role="menu"]` plaque for
  `menu-open` / `panels-open`.
- `deterministicSameBytes: false` — byte diff expected (map render);
  perceptual ε calibration is a T-009 metric, byte-compare recorded as
  data, not pass/fail.
- Dev build: the dropdowns list the dev-only DIRECTOR/TUNING rows
  (`includeDev`); a production build would show four panel rows.

## Links

- `COMPONENT_MASTER_INDEX.md` rows: `hud-game-menu`,
  `hud-panels-menu`, `hud-hide-toggle`
- Contracts: `.mw/contracts/components/hud-game-menu.md`,
  `hud-panels-menu.md`, `hud-hide-toggle.md`
- Driver: `scripts/catalog/drivers/hudPanelsOpen.ts`
- Scope: `GameFrame.tsx:710` (`[data-hud-corner]` — last in DOM so Tab
  reaches the corner after the top bar and the nav, R-234 T-A14)

## Art-direction slice (rubric rev 1)

`hud_cluster` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas
plaques, engraved glyphs, bronze/teal materia, `data-tone` semantic
tones, no flat/glassmorphism.
