# memorial-panel — Memoriale (fallen residents)

> PLAN-086 catalog entry. PLAN-067 T-C5 (R-234, DEATH-1 = B): a
> `HudPlaque shape="panel"` listing the fallen — one line per dead
> resident, oldest first. Read-only: the log is written by the
> settlement (`memorial` on the gameplay store), never edited here.
> In-game only — HUD menu → session → Memorial.

## What it is / does

- `useMinimalGameplayStore((s) => s.memorial)` renders one row per
  entry, oldest first; the panel owns no editing affordance.
- Reached via the HUD game menu session block (Load game · **Memorial**
  · Quit · Settings order — memorial is the third `role="menuitem"`).
- `onClose` hides it; the menu remains the way back.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | script `drivers/hudMenuMemorial.ts` — HUD menu trigger → session block, third `role="menuitem"` | `[data-testid="memorial-panel"]` visible |

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `a5cbd31682ae8e28`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- In-context ctx-a/ctx-b + `iso-0` = `[data-testid="memorial-panel"]`.
- `deterministicSameBytes: false` — live map behind the panel;
  recorded as data, not pass/fail.
- Note on content: the fresh-boot settlement may hold no fallen yet —
  the assertion covers the panel frame; a populated-log state would
  need a seeded death (no such seam declared).

## Caveats / fix history

- **Flaked once, passed on retry (see `fixes.md`).** First run: the
  driver found `hud-menu-trigger` mounted but Playwright reported it
  not-visible for the full 30 s click retry — a boot/reveal race
  (script drivers run before `waitBootCleared`). The driver now waits
  `state:'visible'` on the trigger before clicking; rerun passed and
  the panel asserted. Transient reachability, not a product bug.

## Links

- Contract: `.mw/contracts/components/memorial-panel.md`
  (`memorial-hall.md` covers the full hall surface)
- Source: `src/ui/idleVillage/components/gameFrame/menu/MemorialPanel.tsx`
- Driver: `scripts/catalog/drivers/hudMenuMemorial.ts`
- Host: `HudGameMenu.tsx` session block (`onOpenMemorial`).

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas panel
plaque; memorial rows read as an engraved ledger of names, not as
list cards.
