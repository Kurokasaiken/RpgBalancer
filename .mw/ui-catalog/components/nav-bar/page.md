# nav-bar — Bottom navigation plinth

> PLAN-086. Bottom-center chrome of `/game` (region «where I can go»):
> one lacquer **plinth** (`HudPlaque shape="plinth"`) holding the
> `VILLAGE · MAP · ◉ · WORKSHOP · TAVERN` rail. It never leaves the
> screen edge — same bar over the world map and the village surface.

## What it is / does

- **Nav items** (`GameFrame.tsx` `navItemBtn`, desktop branch): vertical
  glyph+label `MatericButton`s, `data-nav-id` per item
  (`village`, `map`, `workshop`, `tavern` — config
  `DEFAULT_GAME_FRAME_CONFIG.navItems`).
- **Active item**: `aria-pressed="true"` + teal lacquer gradient fill,
  brass inset underline and a soft cyan glow. On `/game` the page owns
  the selection (`activeNavId={viewMode}`): VILLAGE swaps the surface to
  `VillageScreenView`, MAP back to the world map.
- **Locked items** (WORKSHOP, TAVERN — `locked: true` in config):
  disabled, engraved `cmd-lock` sigillo in the top-right corner, tooltip
  `gameFrame.nav.locked`.
- **Recenter coin** (`HudRecenterButton`, `recenterSlot`): a brass-ringed
  coin slotted *between MAP and WORKSHOP* (`index === 1 && recenterSlot`),
  `EngravedIcon cmd-recenter`; re-centres the map camera.
- **Mobile-fit branch** (PLAN-083): icon-only chips for
  `mcfg.navPrimaryIds` + «Altro» chip (`data-nav-more`) opening a
  `HudPlaque` sheet (`role="menu"`/`menuitem`) with the full list.
- **HUD-hidden**: the whole plinth slides below the edge
  (`slideChrome('down')`); only the corner hide-toggle pearl stays.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface `S1_WorldMapIdle` | `nav [data-nav-id]` visible |
| `village-active` | script `drivers/navVillage.ts` (real click) | `[data-nav-id="village"][aria-pressed="true"]` visible |
| `hud-hidden` | surface+key `h` | `hud-hide-toggle` pearl visible |

All three states **pass** — status `documented` (V1).

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `e061dab3`, metal
  backend, 1440×900, reduced-motion, 0 console errors.
- `captureSelector`: `div[data-skin="hud-plaque"]:has(nav)` (whole
  plinth, frame included) → `iso-0`; `nav` (bare rail) → `iso-1`.
- `hud-hidden` has **no iso shots by design**: the plinth is offscreen,
  only the ctx pair records the hidden chrome.
- `deterministicSameBytes`: `false` for live states (map/sea animation),
  `true` for `hud-hidden` (static frame) — recorded as data, not
  pass/fail.

## Links

- Source: `src/ui/idleVillage/components/gameFrame/GameFrame.tsx`
  (`navItemBtn` L333, desktop `<nav>` L492, plinth L680),
  `HudRecenterButton.tsx`, `skins/primitives/HudPlaque.tsx`.
- Config: `src/balancing/config/idleVillage/gameFrameConfig.ts`
  (`navItems` L802).
- Driver: `scripts/catalog/drivers/navVillage.ts`.

## Art-direction slice (rubric rev 1)

`hud_cluster` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas
plinth, engraved glyphs, brass coin, teal-lacquer active state,
materia not flat colour; no glassmorphism, no suspension hardware
(R: nav is a plinth seated on the bottom edge, not a hung plaque).
