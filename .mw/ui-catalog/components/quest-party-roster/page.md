# quest-party-roster — Quest party in the field (run window companion plaque)

> PLAN-086 (R-282), added 2026-10-26 with the quest flow storyboard (`.mw/ui-catalog/flows/quest/`).

The running quest's party as a companion plaque left of the run window, opened from the header toggle «Assigned party». Third roster presentation of the game (global roster, planner slots, this).

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `open` | script `scripts/catalog/drivers/questPartyRoster.ts` | `[data-testid="quest-party-roster"]` visible | reached |

Status `documented`.

## Links

- `src/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel.tsx`
- `.mw/contracts/components/quest-party-roster-panel.md`
