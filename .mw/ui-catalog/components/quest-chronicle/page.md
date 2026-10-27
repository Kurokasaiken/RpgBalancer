# quest-chronicle — Quest chronicle / log (run window companion plaque)

> PLAN-086 (R-282), added 2026-10-26 with the quest flow storyboard (`.mw/ui-catalog/flows/quest/`).

The run's chronicle as a tall, narrow companion plaque left of the run window, opened from the header toggle «Chronicle».

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `open` | script `scripts/catalog/drivers/questChronicle.ts` | `[data-testid="quest-log-panel"]` visible | reached |

Status `documented`.

## Links

- `src/ui/idleVillage/components/gameFrame/QuestLogPanel.tsx`
- `.mw/contracts/components/quest-chronicle.md`
- `.mw/contracts/components/quest-log-panel.md`
