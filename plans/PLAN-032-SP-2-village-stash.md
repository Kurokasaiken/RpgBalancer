---
title: 'PLAN-032 SP-2 — Magazzino del villaggio (schermata mock) + MapBuildingPoi'
status: completed
created: 2026-10-14
completed: 2026-10-14 — Devin; bundle `.mw/runs/plan032-sp2-2026-10-14/bundle.json`
  (4/4 PASS), evidence `test-results/PLAN-032-SP2-2026-10-14.log` +
  `plan-032-sp2-smoke-2026-10-14/` (headed Chromium, eye-check T-04)
parent: PLAN-032
debate: mw-web-debate `20261012-plan-032-sp2-village-stash` — artifact r003
  converged 4/4 (chatgpt, claude, deepseek, gemini ACCEPT)
artifact_sha256: c0432832a95b887578e6cfdfb27984106ed20e3f7e089abd123115597922a9c8
depends_on: none
dispatch: 2026-10-14 — T-011 PLAN-034; executor manual (Devin session)
---

# SP-2 Artifact r003 — VillageStashPanel + MapBuildingPoi (final)

Revisions absorbed from round-2 critiques (chatgpt, claude, deepseek,
gemini) with findings verified against the codebase. Non-goals unchanged:
mock presentation only — no inventory system, no persistence, no economy,
no transfer/sync, no quest-loadout coupling. The quest loadout picker stays
in quest detail.

## Verified codebase facts (grounding corrections)

- Map markers are **DOM nodes in the `anchors` list** (`game-frame-pixi.tsx`:
  `{id, x, y, node: <MapQuestPoi/>}`). There is no anchor registry — x/y are
  world coords on the 4240×2828 map. `anchorGhosts` gives the exit animation
  for free to any node that accepts an `exiting` prop.
- `MapQuestPoi` is a **focusable DOM element** (`role="button"`,
  `tabIndex={0}`, Enter/Space `onKeyDown`) — not canvas-only. The marker's
  a11y contract copies this exactly.
- `useHudPanels` exposes `toggle(id)`; menu entries and shortcuts **toggle**.
- `questItems.ts` is a **leaf config module** (imports only its own schema)
  — validating against it from `villageStashConfig` creates no cycle.
- No equivalent HUD panel telemeters open events → **`stash_open` dropped**.
- No `STRICT_FILES` mandate exists → **dropped**; the locked path below is
  recorded regardless.

## Config `villageStashConfig.ts` (Zod, `src/balancing/config/idleVillage/`)

```ts
villageStashSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    qty:    z.number().int().positive(),
  })).min(3).max(6),
  capacityMax: z.number().int().positive(),   // display-only "n/max" label
  marker: z.object({
    buildingId: z.literal('stash'),
    worldX: z.number().min(0).max(4240),      // anchored on a painted
    worldY: z.number().min(0).max(2828),      // building, not the village centre
    iconKey: z.enum(['warehouse']),           // keys of the building-icon map
    panelId: z.literal('villageStash'),
  }),
})
.superRefine((cfg, ctx) => {
  // itemIds unique; each itemId ∈ consumable keys of questItems (leaf import,
  // no cycle); sum(qty) <= capacityMax; path-specific issue per failure.
})
```

- **Displayed count derived**: footer `t('gameFrame.stash.capacity',
  {count: sum(qty), max: capacityMax})` — ICU interpolation, never
  concatenation, never independently settable. `capacityMax` is a deliberate
  display-only label (product choice, recorded).
- **Placement**: `worldX/worldY` sit on a specific painted structure in the
  village zone (~2061,1567 is the village *centre* — the marker anchors on a
  named building). A unit test asserts a minimum world-unit distance from
  every other anchor in the same list — not a dev-only console warn.
- Curated items ⊆ the picker's offerable consumable set (kind-gated) — unit
  test, so the mock can never contradict the loadout surface.
- i18n: `gameFrame.stash.title`, `gameFrame.stash.capacity` (ICU),
  `gameFrame.buildings.stash.name` (marker aria-label + tooltip). EN + IT.

## `VillageStashPanel` — `src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx`

- `HudPlaque shape="panel"`, `useHudPanelDrag`, `SkinScope`,
  `data-hud-controls` on root, X + Panels-menu entry + shortcut via
  `useHudPanels` (id `villageStash`), modeless, draggable, coexists with
  quest detail. Standard **toggle** convention for menu/shortcut.
- **Body = `role="list"` rows**: item icon (building/item icon mapper for
  questItems `icon` — module lives next to the panel, named in the
  locked-path list) + `t(labelKey)` + visible wrapped `t(descKey)` line +
  inline `×{qty}` — all text ≥12px, no focusable cells, no truncation (wrap;
  min/max panel width; verified at smallest viewport + `it` locale). Panel
  `aria-labelledby` the title.
- Footer: capacity label as plain text ≥12px.
- Zero use/move/discard affordances; no buttons that do nothing.

## `MapBuildingPoi` — `src/ui/idleVillage/components/gameFrame/MapBuildingPoi.tsx`

- **Binding decision**: composes `PoiMatericV3_5` exactly like `MapDemoPoi`
  (state `assigned`, progress 0, grounded, building `iconUrl`) — the shared
  primitive already exists; enter/exit uses the same `ENTER_MS`/`exiting`
  transition pattern so `anchorGhosts` animates removal. No third copy of
  anchor logic: it lives in the anchors list, not the marker.
- **Interaction contract = MapQuestPoi's**: `role="button"`, `tabIndex={0}`,
  `aria-label={t(nameKey)}`, Enter/Space `onKeyDown` → activate. The marker
  IS keyboard-reachable (fact, not hedge).
- **Click**: pointer-delta <5px gate (suppress during map pans), and hover/
  tooltip suppressed on coarse pointers (`pointerType`/`matchMedia
  (pointer: coarse)`) so first-tap opens cleanly with no hover/tap
  double-fire. DOM tooltip with `t(nameKey)` on hover/focus for fine
  pointers.
- **Activation**: `openOrFocus('villageStash')` — opens if closed, brings to
  front if open; never closes (menu/shortcut own toggling).
- **Focus on close (X)**: returns to the marker element when it opened the
  panel, to the Panels-menu trigger otherwise; never `body`. Tested via
  `document.activeElement` assertion.
- Reduced-motion: enter/exit/hover transitions honor
  `prefers-reduced-motion` like MapQuestPoi — the only motion surface here.
- Marker icon readability on touch (unlabeled until tapped) is an art call —
  flagged for the Director, not a spec blocker.

## POI→panel wiring

`game-frame-pixi` holds `poiToPanel: Record<BuildingId, HudPanelId>` where
`BuildingId` is the config's literal union — single entry
`{ stash: 'villageStash' }`. The anchors memo appends
`{id: 'building-stash', x, y, node: <MapBuildingPoi …/>}`; a config typo fails
at parse or type-check, never silently.

## Verification

- Unit: itemIds unique ∧ ⊆ picker-offerable consumables; `sum(qty) ≤
  capacityMax`; marker in-bounds; min world-unit distance to other anchors;
  `panelId` registered in `useHudPanels`.
- RTL: list rows render name/desc/qty; no interactive controls in rows;
  token-based style assertions (no raw px — jsdom can't resolve `--skin-*`;
  real ≥12px left to headed).
- Headed browser (T-04): marker sits on the painted building; pan doesn't
  open; marker/menu/shortcut honor openOrFocus/toggle split; X returns focus;
  `it` locale, smallest viewport, no overflow, drag clamped.
- Telemetry: none (verified — no equivalent panel telemeters opens).

## Out of scope (unchanged)

Real inventory, quantity mutation, buy/sell, quest-bag coupling, item usage,
empty-slot rendering, merchant (SP-3 reuses this `MapBuildingPoi` +
`poiToPanel` registry).
