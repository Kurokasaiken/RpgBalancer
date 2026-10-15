---
title: 'PLAN-032 SP-3 — Mercante (schermata mock) + marker gated Director'
status: completed
created: 2026-10-14
parent: PLAN-032
debate: mw-web-debate `20261012-plan-032-sp3-merchant-panel` — artifact r003
  converged 4/4 (chatgpt, claude, deepseek, gemini ACCEPT)
artifact_sha256: 7497a638f6e469742adf296ecaea1ae5d47a466c9c58904ff87dd19986b29a65
depends_on: PLAN-032-SP-2 (MapBuildingPoi + poiToPanel registry)
dispatch: 2026-10-14 — T-011 PLAN-034; executor manual (Devin session)
---

# SP-3 Artifact r003 — MerchantPanel (mock merchant screen)

Invariant: **no interaction in the merchant screen can change game state or
persisted state.** Open/close/drag are real interactions; nothing may
mutate data.

## Verified codebase facts (round-2 findings, binding)

- The `poiDemo`-style staging mechanism is a **Director-menu toggle**:
  `useState(false)` in `game-frame-pixi` + entry in the director actions
  list (`gameFrame.director.*`). It is UI staging, not config. The merchant
  marker uses the same mechanism: `useState(false)` + director action
  `merchantmarker`; the anchors memo gates on it. Default OFF (poiDemo
  convention); the Director flips it for staging.
- `useHudPanelDrag`/`useHudPanels` persist **nothing** — no
  PersistenceService/storage call in either. The isolation boundary below
  needs no shell-persistence exception.
- Esc is **not** a `HudPlaque`-panel convention (only menus and the quest
  run window handle Escape) → Esc-to-close is out of scope for SP-3.

## Config `merchantConfig.ts` (`src/balancing/config/idleVillage/`) — screen content only

```ts
const I18N_KEY = /^[a-zA-Z0-9_.]+$/;

merchantSchema = z.object({
  countdownLabelKey: z.string().regex(I18N_KEY),
  offers: z.array(z.object({
    offerId:   z.string().trim().min(1),
    nameKey:   z.string().regex(I18N_KEY),
    descKey:   z.string().regex(I18N_KEY),
    iconKey:   z.string(),               // membership in offer-icon map —
                                         // enum if the map is a real module,
                                         // else asserted by the resolve test
    price:     z.number().int().positive(),
    currencyKey: z.string().regex(I18N_KEY),
    stockLabelKey: z.string().regex(I18N_KEY),
  })).min(3).max(4),
  marker: z.object({                     // passive placement data for the
    worldX:  z.number().min(0).max(4240),// anchors wiring — read by
    worldY:  z.number().min(0).max(2828),// game-frame-pixi, NOT by the panel
    iconKey: z.string(),                 // ∈ MapBuildingPoi building-icon map
  }),
}).readonly().superRefine(/* unique offerIds — plain Set check */)
// parsed via schema.parse(raw) at module load, villageStashConfig convention;
// nested levels readonly/frozen too — verify installed Zod .readonly() depth,
// else deep-freeze helper; Object.isFrozen(offers[0]) asserted in test.
```

- `countdownLabelKey` is an i18n key resolving to a **static qualitative
  phrase** (Director-approved copy that does not promise real restock
  behavior). A resolve-test asserts a non-empty value in both locales and —
  as a targeted regression guard only, not a semantic guarantee — rejects
  `\d{1,2}:\d{2}` clock patterns. One line per merchant (panel header),
  never per offer. Zero timers/`Date.now()`/day-tick wiring.
- The `marker` block holds passive data only; the visibility decision lives
  in the Director toggle above. `panelId` is deliberately absent —
  `poiToPanel` is the single mapping.
- `worldX/worldY` are an implementer-documented default placed on a painted
  building (village zone, not the centre) — flagged Director art call like
  the icon readability.
- All copy under ONE namespace `gameFrame.merchant.*` (panel +
  `gameFrame.merchant.markerName`), EN + IT, en/it key-parity tested.

## Marker wiring

- Director action `merchantmarker` toggles the `useState(false)` flag;
  anchors memo appends `{id: 'building-merchant', x, y, node:
  <MapBuildingPoi …/>}` gated on it. Marker id derived as
  `building-<buildingId>` per SP-2 convention.
- `poiToPanel` gains `{ merchant: 'merchant' }`; `BuildingId` union gets
  `'merchant'` — an **explicit implementation step** (type error otherwise).
  **Binding dependency: SP-3 requires SP-2 merged (MapBuildingPoi +
  poiToPanel); if not merged, SP-3 waits — no fork.**
- Marker contract = SP-2/MapQuestPoi exactly: `role="button"`,
  `tabIndex=0`, `aria-label={t(gameFrame.merchant.markerName)}`, Enter/
  Space, <5px delta gate, coarse-pointer hover suppression, `openOrFocus`,
  `exiting` for anchorGhosts.
- Marker `iconKey` resolves against the `MapBuildingPoi`/PoiMatericV3_5
  building-icon map — a missing variant is a flagged shared-map extension,
  never a fork, never an offer-icon reuse.
- Min-distance-to-other-anchors unit test (SP-2 r003 defines the same
  contract for the stash anchor; reuse its helper if merged, else SP-3
  adds the first definition).

## `MerchantPanel` — `src/ui/idleVillage/components/gameFrame/MerchantPanel.tsx`

- `HudPlaque shape="panel"`, `useHudPanelDrag`, `SkinScope`,
  `data-hud-controls`, X + menu entry + shortcut via `useHudPanels`, id
  `merchant`. Singleton, modeless, draggable; registration independent of
  marker visibility.
- Body: native `<ul>/<li>`. Per row: offer icon, `t(nameKey)`, wrapped
  `t(descKey)`, one interpolated `t('gameFrame.merchant.priceLine',
  { price, currency: t(currencyKey) })` (resolve-test asserts non-empty
  resolved values in both locales; nested `t()` usage confirmed against the
  project's i18n lint at implementation), `t(stockLabelKey)`. ≥12px,
  `--skin-*` only, wrap never truncate.
- Overflow: max panel height — prefer an existing `--skin-*` token, else a
  relative-unit (vh) expression; the offer list scrolls inside the body;
  header + Preview badge + X always visible. Scroll region excluded from
  the plaque drag handle and covered by `data-hud-controls` (no map pan);
  both on the headed checklist.
- Preview badge: static visible text in the header (outside drag handle and
  X hit region). Real text — announced to screen readers, not only styled.
- **"Buy" affordance — `MockBuyControl`**: `<button type="button" disabled>`
  (natively inert — supersedes the `aria-disabled`-only formulation of the
  orchestrator digest; deviation recorded, it matches the Director's
  "disabled/decorative" wording better), `aria-label` containing the
  visible button text (label-in-name), `title`/tooltip text per
  `t(gameFrame.merchant.buy.previewTooltip)`, plus a persistent visible
  caption `t(gameFrame.merchant.buy.previewLabel)` linked by
  `aria-describedby`. The component accepts **no callback props**; a
  source/AST test asserts no `on*` attributes. "No handlers" is scoped to
  this element — plaque drag is shell code.

## Focus return — one generic rule

On open, capture `document.activeElement`. On close: restore it if still
connected **and not mid-exiting**; else the Panels-menu trigger; else a
stable focusable HUD container — never `body`. If the captured element is
`body`/`null` (typical for shortcut opens), skip to the menu trigger.
Covers all entry paths without marker node references. First check whether
the SP-2 stash panel already defines this convention — follow it; if a
shared helper is needed it is a flagged shared-hook change; SP-3 adds no
second focus manager.

## Mock-state isolation — allowlist, transitive, fail-closed

- Boundary: merchant-owned modules (`MerchantPanel`, `merchantConfig`,
  `MockBuyControl`) have no path to game state, persistence, or backend.
  Shared HUD chrome is outside the boundary — **verified**: it persists
  nothing.
- `MerchantPanel.isolation.test.ts` (standard runner): direct imports of
  merchant-owned files ⊆ allowlist {react, react-i18next, zod, named HUD
  primitives, named icon maps, `merchantConfig`}; allowlisted modules are
  leaves (no descent); covers `import`, `import type`, `export … from`,
  `require`; fails on `import()`; **unresolved import = failure**; path
  aliases resolved per tsconfig. `merchantConfig` direct importers ⊆
  {`MerchantPanel`, `game-frame-pixi` (marker subtree only),
  `*.test.ts`}; **no barrel re-export**. The test proves direct-import
  isolation within the declared boundary — nothing more.

## Wiring

- `useHudPanels`: one union member `merchant` + one registry entry; menu
  derived. Shortcut: first unused key from the real shortcut map; **if none
  is free, menu-only registration — no inert binding.**
- Open paths: menu/shortcut `toggle('merchant')`; marker `openOrFocus`
  (never toggles; never required for registration).
- Named test: with the staging flag off (marker hidden), menu/shortcut
  still opens the panel; with it on, marker openOrFocus works.

## Verification

- Unit: schema parse; unique offerIds; nonempty keys; `countdownLabelKey`
  resolves non-empty in both locales + no clock pattern; every `*Key`
  resolves both locales + en/it parity; iconKey membership; deep-frozen
  export; import-graph isolation; min-distance anchors; marker-hidden →
  menu still opens.
- RTL: ul/li offers render fully; MockBuyControl has no handlers and
  synthetic activation is a no-op (distinguishing shell event handling);
  Preview badge present.
- Source/AST check for ≥12px + token-only styling (jsdom can't resolve
  `--skin-*`); no `on*` on Buy.
- Headed (T-04) at the project's smallest supported viewport (the value
  used by existing headed checks): staging toggle gates marker only;
  menu/shortcut toggle; marker openOrFocus; focus return per rule; `it`
  locale — header/badge/X always visible, list scrolls, no map pan on list
  scroll, drag clamped.

## Out of scope (unchanged)

MarketEngine, economy, purchases, stock decrement, persistence, currency
system, live countdown/day-tick, sell/trade UI, backend, Esc handling.
Director-flagged (non-blocking): marker icon readability on touch; marker
placement on a painted building.
