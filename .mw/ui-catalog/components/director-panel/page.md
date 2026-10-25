# director-panel — Director panel (staging actions)

> PLAN-086 catalog entry. Floating HUD panel, dev builds only — a test /
> trailer instrument, not product UI. The page mounts it via
> `gameFrameConfig debug.directorPanel=true`; shortcut `d`, also listed
> in the Panels menu (and the HUD game menu dev rows).

## What it is / does

- One button per `DirectorAction` (`id`, pre-translated `label`,
  `active` — rendered pressed while its scripted thing is on screen,
  `onTrigger`). Each click fires one scripted beat on the live screen —
  an invasion announcement, a quest appearing on the map — so a take
  can be staged on demand.
- `onReset` resets the staging; the panel drags by its handle like
  every HUD panel and collapses to its title bar; the close (X) hides
  it — the Panels menu brings it back.
- Its own chrome is i18n; action labels arrive already translated from
  the caller.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface+key `d` on `S1_WorldMapIdle` | `[data-testid="director-panel"]` visible |

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `e14a3edd5b172257`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- In-context full-surface shots (ctx-a/ctx-b) + `iso-0` =
  `[data-testid="director-panel"]` (the floating plaque).
- `deterministicSameBytes: false` — live map render behind the panel;
  byte-compare recorded as data, not pass/fail.

## Links

- Contract: `.mw/contracts/components/director-panel.md`
- Source: `src/ui/idleVillage/components/gameFrame/DirectorPanel.tsx`
- Reach: keyboard `d` (`surface+key` driver); Panels menu
  (`HudPanelsMenu`) and HUD menu PANELS rows in dev builds
  (`HudGameMenu includeDev`, `HUD_PANEL_DEV_ONLY`).

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas floating
plaque and engraved glyphs — a dev instrument wearing the standard HUD
chrome, no bespoke skin.
