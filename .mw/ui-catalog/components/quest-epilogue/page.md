# quest-epilogue — Quest epilogue — end-of-run report inside the run window

> PLAN-086 (R-282), added 2026-10-26 with the quest flow storyboard (`.mw/ui-catalog/flows/quest/`).

The end-of-run report inside the run window. Seen in the storyboard (`flows/quest/frames/15-epilogue.png`) on screen **together with** the external report popup — two reports at once.

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `ended` | script `scripts/catalog/drivers/questRunEnded.ts` | `[data-testid="quest-epilogue"]` visible | **not reached** by the documenter |

Status `documenting`.

## Links

- `src/ui/idleVillage/components/gameFrame/QuestEpilogue.tsx`
- `.mw/contracts/components/quest-epilogue.md`
