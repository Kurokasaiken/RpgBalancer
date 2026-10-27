# amanuense-page — Amanuense folio — extended phase description

> PLAN-086 (R-282), added 2026-10-26 with the quest flow storyboard (`.mw/ui-catalog/flows/quest/`).

The scribal folio with the long-form page of a phase (PLAN-085), opened by an emoji 📖 button in the run window. **Not reachable on the goblin quest launched by `demoLaunch`: none of its nodes has a `longForm`** (it lives on the S1-lab scenario and on quest blueprints).

## Declared states

| id | driver | observable assertion | V1 |
|---|---|---|---|
| `open` | script `scripts/catalog/drivers/questAmanuense.ts` | `[data-testid="amanuense-page"]` visible | **not reached** by the documenter |

Status `documenting`.

## Links

- `src/ui/idleVillage/components/gameFrame/AmanuensePage.tsx`
- `.mw/contracts/components/amanuense-page.md`
