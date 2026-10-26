# quest-reward-popup — Quest reward popup / expedition report

> PLAN-086. The expedition's return report as a non-modal floating plaque outside the run window (`QuestRewardPopup`, R-199 pt.14): staged aftermath reveal, cost before yield; every close path commits the settlement (R-260).

## What was seen (diagnostic capture, not V1)

`evidence/diag-2026-10-26-wipe-report.png`, from the S10 driver run that ended in a wipe: header «Expedition report» with close X, a painted vignette strip, a tombstone card for the fallen hero («fell on day 20»), a verdict chip «Wipe — everything is lost», «Who came back» with a greyed portrait labelled «Fallen», a «Spent and destroyed» line, and a «Close the report» action plate.

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `default` | surface `S13_QuestRewardPopup` | `[data-testid="quest-reward-popup"], [data-testid="quest-window-close-report"]` visible | **not reached** by the documenter |

Status `documenting`. The report exists and renders on this build (seen above); the S13 driver did not reach it within its budget — see `fixes.md`.


## Links

- `src/ui/idleVillage/components/gameFrame/QuestRewardPopup.tsx`
- Surface drivers: `scripts/sentinel/gameSurfaceHarness.ts` (`GAME_SURFACE_GRAPH`).
