# quest-expedition-detail — «Dispatch Table» expedition planner

> PLAN-086 catalog entry. PLAN-043 WS-3 (artifact-r005): the POI's live
> planning surface as a `FloatingPanel` (minimise/close chrome,
> `data-hud-panel="quest-expedition-<poiId>"`, testid
> `quest-expedition-detail`). Opens from a revealed map POI while no
> run is active on it — the run window itself is a different surface.

## What it is / does

- Three-zone composition: **CENTER STAGE** — one draggable planner
  unit (hero letterbox with the engraved seals → marching-order rack
  TESTA→CODA → loadout/`quest-expedition-loadout` + bag count →
  Selection Tray → anchored footer with `quest-expedition-send`),
  under the shared anchor-only drag grammar (`useHudPanelDrag`
  persists only the user offset); **RIGHT WING** — the forecast
  plaque, pinned: never hides while the party is edited, keeps the
  live ±% deltas; **LEFT WING** — the companions roster, drags and
  keyboard drops land on the rack through the shared page DndContext.
- Pure presentation: numbers come from `resolved` (the frozen offer)
  and `estimate` (the chunked Monte Carlo); all strings i18n.
- Party slot medals carry `data-testid^="slot-medal-"`;
  `[data-extracting="true"]` marks the extraction animation hook.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface `S6_QuestPlanner` — canonical S-graph reach (`reachState`/`surfaceNode` in `gameSurfaceHarness.ts`) | `[data-testid="quest-expedition-detail"]` visible |

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `4321f96d4c3d381e`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- In-context ctx-a/ctx-b + isolated: `iso-0` = the
  `quest-expedition-detail` plaque (610×565), `iso-1` = the outer
  `data-hud-panel="quest-expedition-<poi>"` shell wrapper (634×587).
- `howStateReached` (shot sidecar): `planner:hook-assisted:openDetail`
  — a **declared hook-assisted seam**, not pure input-reale. The
  `expedition demoLaunch` hook is broken on this build (TDZ) but is
  irrelevant here: the planner opens from the POI offer, no run is
  launched. States that need a live run remain undocumented by design.
- `deterministicSameBytes: false` — live map + Monte Carlo estimate
  behind the panel; single frame does not prove motion (T-04).
  Recorded as data, not pass/fail.

## Links

- Contract: `.mw/contracts/components/quest-expedition-detail.md`
  (session contract: `use-quest-expedition-session.md`)
- Source: `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx`,
  `useQuestExpeditionSession.tsx`,
  `src/ui/idleVillage/components/FloatingPanel.tsx`
- Surface: `S6_QuestPlanner` in
  `scripts/sentinel/gameSurfaceHarness.ts` `GAME_SURFACE_GRAPH`
  (delegated by `documentComponent.mts` `reachSurface`).

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas planner
unit — engraved seals on the hero letterbox, marching-order rack,
pinned forecast plaque; slot medals and stash tiles keep the shared
materic grammar (R-270 stash-uniformity).
