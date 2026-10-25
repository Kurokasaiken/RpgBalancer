# village-stash-panel — Village stash / warehouse shelf

> PLAN-086. Modeless floating `HudPlaque` (`data-hud-panel="villageStash"`)
> anchored in the stage's free corridor: the village warehouse shelf
> (PLAN-032 SP-2, PLAN-073). The ledger (`useVillageStashStore`) is the
> single source of truth — the panel never owns item state.

## What it is / does

- **Dual-mode by contract** (Director ruling, artifact-r003; R-246
  click-only):
  - *Planner-bound* (`activeStashOwner` set): rows are real `<button>`s —
    a click assigns the item to that planner's first free bag slot; focus
    lands on the filled slot after assign. Rows fully reserved elsewhere
    leave the shelf and return when released.
  - *Read-only* (no bound planner / `hydration !== 'ready'`): plain
    `role="list"` + `listitem` rows — no buttons, no mutation affordances;
    a «N elsewhere» counter (`stash-elsewhere`) explains the global pool.
- **Open affordances**: warehouse building pin → pinned tooltip →
  `village-open-stash` (the `S4_VillageStash` surface path); the `v`
  shortcut or the Panels menu toggle the same flag
  (`hudPanelRegistry` — the map marker only opens/focuses, PLAN-032 SP-2).
- **Row face** (`StashItemTile`, `stash-item-<id>`): lacquer tile +
  corner ×N badge + name + description — identical in both modes so the
  surfaces never diverge (R-270, contract INV-1). Radix tooltip
  (`StashItemTooltipBody`): name · desc · covers · stock.
- **Chrome**: draggable by its title row via `useHudPanelDrag`; minimise
  collapses to a `stash-minimised` chip (count + `stash-restore`); close
  via `data-skin="close"` X. Height is capped by the stage zone
  (`maxHeightPx`) — list scrolls inside, title and capacity footer stay
  (R-234).
- Coexists with the quest window / planner without modality.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface `S4_VillageStash` (village nav → warehouse pin/registry row → pinned tooltip → `village-open-stash`, input-reale) | `[data-hud-panel="villageStash"]` visible |

State **passes** — status `documented` (V1). The captured default is the
**read-only** mode (no planner bound on a fresh map).

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `23500fe00fe93d9c`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- `captureSelector`: `[data-hud-panel="villageStash"]` → `iso-0`
  (whole plaque incl. frame).
- `deterministicSameBytes: false` — live surface behind the panel;
  recorded as data, not pass/fail.
- Not exercised: planner-bound mode (needs a quest planner with
  `activeStashOwner`; `expedition demoLaunch` is broken on this build —
  TDZ), `stash-minimised` chip.

## Links

- Source: `src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx`,
  `villageStashViewModel.ts`, `stashItemFace.tsx`,
  `villageStashItemIcons.tsx`.
- Store: `src/ui/idleVillage/store/useVillageStashStore.ts`.
- Config: `src/balancing/config/idleVillage/villageStashConfig.ts`,
  `quests/questItems.ts` (`defaultQuestItems`).
- Contract: `.mw/contracts/components/village-stash-panel.md`
  (INV: dual-mode read-only iff no owner; fast checks
  `villageStash.test.tsx`, `villageStashLedger.test.ts`,
  `villageStash.itemFace.test.tsx`).
- Surface driver: `S4_VillageStash` in
  `scripts/sentinel/gameSurfaceHarness.ts` `GAME_SURFACE_GRAPH` (L854).

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas plaque,
lacquer item tiles with ×N badges, engraved close/minimise glyphs;
shelf rows are listitems, not dashboard cards.
