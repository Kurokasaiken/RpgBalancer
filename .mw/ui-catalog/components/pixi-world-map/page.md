# pixi-world-map — Pixi world map canvas + anchors layer

> PLAN-086. The `/game` world surface (`S1_WorldMapIdle`): a PixiJS-rendered
> painted continent — sea, coasts, creatures, cloud shadows, day/night —
> plus the DOM overlay/anchors layers that pin HTML UI (quest POI sigilli,
> invasion marker, region plates) onto world coordinates.

## What it is / does

- **`[data-testid="world-map-layer"]`** wraps the Pixi canvas
  (`[data-testid="pixi-world-canvas"]`, `app.canvas`) — WebGL paint of the
  continent map (metal backend on this capture).
- **`[data-testid="pixi-world-overlay"]`** +
  `pixi-world-overlay-world-box` + **`pixi-world-anchors`**: DOM layers
  above the canvas. `anchors` are world-space mount points re-laid out on
  camera moves — where `MapQuestPoi` sigilli, the goblin invasion marker
  and other map UI actually live (screen-space `uiAnchors` also exist).
- Camera: pan/zoom with clamped bounds; `nav` «map» / recenter focus it.
  Anchors are positioned *before* paint so markers never lag a frame.
- Quest POIs auto-mount on a wall-clock stagger after the boot veil
  (`questReveal`: 1 s initial + 5 s stagger, R-200).

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S1_WorldMapIdle` (boot veil cleared + 2 ticks) | `[data-testid="world-map-layer"] canvas` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `d86832c7e6141dd0`,
  metal backend, 1440×900, reduced-motion `reduce`, 0 console errors /
  0 network failures.
- `default-ctx-a/b.png` — in-context full surface; `default-iso-0.png`
  (world-map-layer) and `default-iso-1.png` (pixi-world-canvas) are
  **full-viewport crops by contract** (view-level entry — the iso shot IS
  the viewport). Visible sub-elements to read in the iso: continent +
  water field, coastline foam/river glints, ambient creatures, cloud
  shadows, and the anchors layer carrying quest POI sigilli when revealed.
- `deterministicSameBytes: false` — expected: the map is animated
  (water/creatures/clouds) even under reduced-motion; byte-compare is
  recorded as data, not pass/fail.

## Links

- Contract: `.mw/contracts/components/pixi-world-map.md`
- Scope: `src/pages/game-frame-pixi.tsx`,
  `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`
- Surface driver: `S1_WorldMapIdle` in
  `scripts/sentinel/gameSurfaceHarness.ts` `GAME_SURFACE_GRAPH` (L829).

## Art-direction slice (rubric rev 3)

`view` → full ART-DIRECTION rubric + composition notes: painted
cartography (china+acquerello), dramatic warm light, the DOM overlay must
stay materia-on-map (anchors sigilli incisi), never flat dashboard chrome
floating over the painting.
