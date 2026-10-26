# quest-journey-route — On-map expedition route with progress glint

> PLAN-086. The expedition's route drawn on the Pixi map while a run travels (`QuestJourneyRoute`, world overlay of `PixiWorldMap`).

## What it is / does

- A world-space polyline from the village to the quest site (and reversed on the way back), with a progress glint and an engraved marker (`EngravedIcon`), positioned with `pointAt` / `faseAt` from `questJourney`.
- Config: `src/ui/idleVillage/config/questJourneyRouteConfig.ts`.

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `default` | surface `S7_QuestJourneyOutbound` | `[data-testid="quest-journey-route"]` visible | reached |

Status `documented`. **Caveat:** the `iso-0` crop is dominated by the run window that covers the route — the route itself is not legible in V1 (see `fixes.md`).

## Capture (V1)

- `shots/V1/meta.json` — frozen build (`vite build`, `vite preview` :5199), sourceSha `c6600bc1`, metal backend, 1440×900, reduced-motion, 0 console errors.

## Links

- `src/ui/idleVillage/components/gameFrame/QuestJourneyRoute.tsx`
- Surface drivers: `scripts/sentinel/gameSurfaceHarness.ts` (`GAME_SURFACE_GRAPH`).
