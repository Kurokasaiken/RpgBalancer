# map-quest-poi — Quest POI sigilli on the continent map

> PLAN-086. Marker family (`marker`): `PoiMatericV3_5` sigilli anchored in
> world space on the Pixi map — the authored quest offers (`poi-goblin`,
> `poi-rovine`). The seal IS the quest's clock: progress ring, warn
> countdown in the window's last stretch, ghost-exit on expiry.

## What it is / does

- Each offer mounts inside a `data-map-quest-poi-target` wrapper
  (`role="button"`, `data-quest-poi-id`, `data-quest-status`) positioned by
  the `pixi-world-anchors` layer; the inner
  `data-testid="map-quest-poi"` is the materic sigillo itself.
- **Reveal is additive** (R-200): after the boot veil the offers auto-mount
  one at a time on a wall-clock stagger (`questReveal.initialDelayMs`
  1000 + `staggerMs` 5000), or all at once via the Director's «Mostra
  quest» / the `revealQuestPois` test hook. A live run always mounts its
  own POI.
- Click opens the expedition planner detail (no run) or resumes the live
  run window; the marker is also a **crew-assignment drop target**
  (`data-drop-state` valid/invalid while dragging a resident).
- `data-quest-status` / view states: available → in-progress → done /
  expired (fade+shrink ghost exit, `EXPIRE_FADE_MS`). Focus ring is a
  brass drop-shadow that follows the silhouette, not a browser outline;
  reduced-motion removes the grow-in.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S1_WorldMapIdle` | `[data-testid="map-quest-poi"]` visible | **failed — timing race, see `fixes.md`** |
| `planner-context` | surface `S6_QuestPlanner` (enter → `revealQuestPois` hook → `expedition openDetail`, hook-assisted) | `[data-quest-poi-id]` visible | **passed** |

Status: `documented_partial` (V1).

- `default` **failed honestly**: `checkAssertion`'s `locator.count()` is an
  instantaneous snapshot taken ~80 ms after the boot veil detaches, but the
  first offer mounts at `veilGone + 1000 ms` by config. Probe-verified:
  count 0 at +76 ms, mounted+visible at +1083 ms. The POI is **not**
  absent — the assertion never waits for it.
- `planner-context` passed: both sigilli mounted (goblin + rovine), planner
  detail open in context (`quest-expedition-detail`).

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `fb1b7135253e3fb2`,
  metal backend, 1440×900, reduced-motion `reduce`, 0 console errors /
  0 network failures.
- `planner-context-ctx-a/b.png` — full map with the two sigilli and the
  expedition detail panel; `planner-context-iso-0.png`
  (`[data-testid="map-quest-poi"]` — first sigillo) and `iso-1`
  (`[data-map-quest-poi-target]` wrapper incl. label).
- No `default` shots (state failed before capture).
- `deterministicSameBytes: false` — seal progress ring + entrance anim;
  recorded as data, not pass/fail.

## Links

- Contract: `.mw/contracts/components/map-quest-poi.md`
- Scope: `src/ui/idleVillage/components/gameFrame/MapQuestPoi.tsx`,
  `src/ui/idleVillage/components/poi/PoiMatericV3_5.tsx`
- Reveal timing: `src/ui/idleVillage/components/gameFrame/questRevealSchedule.ts`
  + `gameFrameConfig.questReveal` (`initialDelayMs: 1000, staggerMs: 5000`).
- `fixes.md` — suggested driver/assertion repair for `default`.

## Art-direction slice (rubric rev 3)

`marker` → ART-DIRECTION L1+L2 + pillar «stato sul mondo, non pannelli»:
sigillo inciso (materic POI v3.5), status carried by the seal's materia
(progress ring, ghost exit, drop halo), brass focus-follows-silhouette.
