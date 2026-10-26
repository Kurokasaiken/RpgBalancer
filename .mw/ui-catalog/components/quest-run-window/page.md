# quest-run-window — Quest run window (theatre, beats, choices, belt, log)

> PLAN-086. The expedition's run window: a floating `HudPlaque` over the map that narrates the quest in beats and asks for choices. Reached via `demoLaunch` (hook-assisted, as every quest surface).

## What it is / does (from the captures)

- **Header**: quest title in display caps («Goblin Extermination»), italic serif subtitle, six round header controls (party, bag, chronicle, spark, minimise, close).
- **Theatre**: a painted scene vignette full-width inside the frame (scene library art), with narrative prose **below** it on lacquer (never text on the painting, R-245) and an italic flavour line.
- **Choices** (`stage-choice`): numbered rows with the check's attribute(s) and odds chips («43% → 58%»), plus small round option toggles above them.
- **Journey strip**: day/phase progress bar («Day 1 of ~22», «Phase 1 of 7»), three legs (Outbound 2D · At the quest site ~22D · Returning 2D), belt slots («NOW», «?»), a flag control at the right.
- In `stage-choice` the top HUD bars are hidden behind the run cluster; in `default` they are visible.

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `default` | surface `S7_QuestJourneyOutbound` | `[data-testid="quest-window"]` visible | reached |
| `narrative-beat` | surface `S8_QuestStageNarrative` | `[data-testid="quest-window-beat"]` visible | **not reached** (see `fixes.md`) |
| `stage-choice` | surface `S9_QuestStageChoice` | `[data-testid="quest-window-choice"]:not([disabled])` visible | reached |

Status stays `documenting` (partial, honest: 2/3 states).

## Capture (V1)

- `shots/V1/meta.json` — frozen build (`vite build`, `vite preview` :5199), sourceSha `c6600bc1`, metal backend, 1440×900, reduced-motion, 0 console errors.

## Links

- `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`
- `src/ui/idleVillage/components/gameFrame/QuestBeltPlaque.tsx`
- `src/ui/idleVillage/components/gameFrame/QuestLogPanel.tsx`
- `src/ui/idleVillage/components/gameFrame/QuestCheckOptionsPanel.tsx`
- `src/ui/idleVillage/components/gameFrame/QuestEpilogue.tsx`
- `src/ui/idleVillage/components/gameFrame/QuestReturnedCrew.tsx`
- `src/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel.tsx`
- `src/ui/idleVillage/components/gameFrame/QuestJourneyPhaseStrip.tsx`
- `src/ui/idleVillage/components/gameFrame/AmanuensePage.tsx`
- Surface drivers: `scripts/sentinel/gameSurfaceHarness.ts` (`GAME_SURFACE_GRAPH`).
