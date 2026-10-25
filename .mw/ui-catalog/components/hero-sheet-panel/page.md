# hero-sheet-panel — Hero sheet (resident detail)

> PLAN-086 catalog entry. PLAN-032 SP-1 (artifact r003): the read-only
> hero sheet — a `HudPlaque` singleton the controller (`useHeroSheet`)
> anchors rail-adjacent to the roster card under the pointer. Dumb by
> contract: every value on screen arrives pre-derived through `vm`
> (`HeroSheetViewModel`), so a retarget swaps a prop and never re-runs
> domain logic.

## What it is / does

- `vm` carries `name`/`initials`, `statusLabel`+`status`,
  `archetypeLabel`/`archetypeCategory`, `portraitUrl`, `vitals` bars,
  stat `stats` categories, `equipment` slots and `inventory` rows —
  raw storage ids are humanized upstream (`longbow_oak` → Longbow Oak),
  never leaked to the player.
- `pinned` + `canPrev`/`canNext` + `onPrev`/`onNext` — step through
  residents without re-hovering the rail.
- Draggable by the title row (`useHudPanelDrag`); the machine
  (`heroSheetMachine`), not the component, decides open/close/pin.
  Open is a hover INTENT over a roster card — clicks cancel the intent
  (pointerDownCapture) and the `p` shortcut needs a mounted rail.
- Selector is the element id `#hero-sheet`, **not** a testid.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | script `drivers/heroSheetOpen.ts` — opens the roster stage (`r`), hovers the first `[data-resident-id]` card, waits out the config intent delay | `#hero-sheet` visible |

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `7a9ae13f75ecb01e`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- In-context full-surface shots (ctx-a/ctx-b) + `iso-0` = `#hero-sheet`
  (the anchored sheet).
- `deterministicSameBytes: false` — live map + roster behind the sheet;
  byte-compare recorded as data, not pass/fail.

## Links

- Contract: `.mw/contracts/components/hero-sheet-panel.md`
  (controller contract: `use-hero-sheet.md`)
- Source: `src/ui/idleVillage/components/gameFrame/HeroSheetPanel.tsx`,
  `useHeroSheet.tsx`, `heroSheetMachine.ts`, `heroSheetViewModel.ts`
- Driver: `scripts/catalog/drivers/heroSheetOpen.ts`

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas plaque,
portrait with vitals bars, engraved prev/next glyphs — sheet reads as
an object pinned next to its card, not a detached window.
