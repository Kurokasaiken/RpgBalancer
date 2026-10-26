# quest-stage-cluster — Quest stage cluster: run window + skill-check column/wings

> PLAN-086. The run regime's three-column body (`QuestStageCluster`): companion left, run window centre, skill-check column (`QuestSkillCheckColumn` + Destiny Astrolabe V62 kit) in the right wing, solved by `solveQuestClusterGeometry`.

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `armed` | surface `S10_QuestSkillCheckArmed` | `[data-testid="quest-check-column"], .da-tira` visible | **not reached** |
| `verdict` | surface `S11_QuestSkillCheckParked` | `[data-testid="quest-verdict-card"], [data-astro-idle="parked"]` visible | **not reached** |

No V1 shots. Status `documenting`. In a direct 276 s run of the S10 driver the check column never mounted and the expedition ran to a wipe — see `fixes.md`.


## Links

- `src/ui/idleVillage/components/gameFrame/QuestStageCluster.tsx`
- `src/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn.tsx`
- `src/ui/idleVillage/components/gameFrame/QuestSkillCheckOverlay.tsx`
- `src/ui/idleVillage/components/gameFrame/QuestVerdictCard.tsx`
- `src/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit.tsx`
- Surface drivers: `scripts/sentinel/gameSurfaceHarness.ts` (`GAME_SURFACE_GRAPH`).
