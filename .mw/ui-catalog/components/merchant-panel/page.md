# merchant-panel — Trader Rowen mock storefront

> PLAN-086. Modeless floating `HudPlaque` (`data-hud-panel="merchant"`,
> `shape="panel"`) anchored in the stage's free corridor: the village
> merchant's **mock** storefront (PLAN-032 SP-3, artifact r003). Nothing
> on this screen mutates game or persisted state.

## What it is / does

- **Header** (drag handle via `useHudPanelDrag`): display-caps title
  (`gameFrame.merchant.title`), italic serif restock note
  (`config.countdownLabelKey` — a static qualitative line, never a live
  countdown), an outlined `PREVIEW` badge
  (`gameFrame.merchant.previewBadge`) declaring the mock status in plain
  text, and a `data-skin="close"` X (`EngravedIcon cmd-close`).
- **Offers**: native `<ul>` of `config.offers`, scroll region inside the
  plaque (`maxHeight: 60vh`, `overscrollBehavior: contain` — list scroll
  never pans the map). Each `<li>`: `MerchantOfferIcon` glyph, name,
  tabular-nums price line (`price` + localized `currencyKey`), serif
  description, italic stock label, and a `MockBuyControl` — a natively
  disabled button with no callbacks.
- **Open affordances**: market building pin → pinned tooltip →
  `village-open-merchant` (the `S5_Merchant` surface path); the `m`
  shortcut or the Panels menu toggle the same flag
  (`hudPanelRegistry` — map marker only opens/focuses, PLAN-032 SP-3).
- Coexists with the quest window; modeless, `tabIndex={-1}` wrapper.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface `S5_Merchant` (village nav → market pin/registry row → pinned tooltip → `village-open-merchant`, input-reale) | `[data-hud-panel="merchant"]` visible |

State **passes** — status `documented` (V1).

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `5962f40186e948e7`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- `captureSelector`: `[data-hud-panel="merchant"]` → `iso-0`
  (whole plaque incl. frame).
- `deterministicSameBytes: false` — village surface behind the panel
  settles between the two ctx shots (village enter transition);
  recorded as data, not pass/fail.

## Links

- Source: `src/ui/idleVillage/components/gameFrame/MerchantPanel.tsx`,
  `MockBuyControl.tsx`, `merchantOfferIcons.tsx`.
- Config: `src/balancing/config/idleVillage/merchantConfig.ts`
  (`MerchantConfig`, offers list, `countdownLabelKey`).
- Contract: `.mw/contracts/components/merchant-panel.md`
  (fast check `tests/unit/idleVillage/merchantPanel.test.tsx`).
- Surface driver: `S5_Merchant` in
  `scripts/sentinel/gameSurfaceHarness.ts` `GAME_SURFACE_GRAPH` (L863).

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas plaque,
engraved offer glyphs, gold title-color price figures, preview badge
as outlined caps chip; disabled buy control is engraved, not greyed-flat.
