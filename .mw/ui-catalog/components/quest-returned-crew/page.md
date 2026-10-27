# quest-returned-crew — Who came back — end-of-run crew niches

> PLAN-086 (R-282), added 2026-10-26 with the quest flow storyboard (`.mw/ui-catalog/flows/quest/`).

«Who came back»: one arched niche per party member, greyed portrait and «Fallen» for the dead. Seen in the storyboard inside the report popup.

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `ended` | script `scripts/catalog/drivers/questRunEnded.ts` | `[data-testid="quest-returned-crew"]` visible | **not reached** by the documenter |

Status `documenting`.

## Links

- `src/ui/idleVillage/components/gameFrame/QuestReturnedCrew.tsx`
- `.mw/contracts/components/quest-returned-crew.md`
