# quest-belt — Quest bag / belt (run window companion plaque)

> PLAN-086 (R-282), added 2026-10-26 with the quest flow storyboard (`.mw/ui-catalog/flows/quest/`).

The packed consumables as a companion plaque left of the run window, opened from the header toggle «Bag». Second inventory presentation (planner loadout, this), plus the 24 px micro-belt above the choices.

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `open` | script `scripts/catalog/drivers/questBelt.ts` | `[data-testid="quest-belt"]` visible | reached |

Status `documented`.

## Links

- `src/ui/idleVillage/components/gameFrame/QuestBeltPlaque.tsx`
- `.mw/contracts/components/quest-belt-plaque.md`
