# quest-outcome-toast — Post-check outcome toast

> PLAN-086. The post-check outcome as a small external popup (`QuestOutcomeToast`, PLAN-040 T-005): verdict chip + check title + flavour + harm lines + consequence, all at once; dismissed by click, Escape or X. Triggered by a store predicate (`checkSeq > dismissedUpTo` and the check overlay unmounted).

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `default` | surface `S11_QuestSkillCheckParked` | `[data-testid="quest-outcome-toast"]` visible | **not reached** |

No V1 shots. Status `documenting`. Depends on the same check path as `quest-stage-cluster` — see `fixes.md`.


## Links

- `src/ui/idleVillage/components/gameFrame/QuestOutcomeToast.tsx`
- `src/ui/idleVillage/components/gameFrame/questOverlays.tsx`
- Surface drivers: `scripts/sentinel/gameSurfaceHarness.ts` (`GAME_SURFACE_GRAPH`).
