---
title: 'PLAN-032 SP-4 — BagStrip: consumabili visibili durante viaggio/beat'
status: completed — 2026-10-14: BagStrip + questBag.ts + slot riservato
  QuestRunWindow; bundle `.mw/runs/plan032-sp4-2026-10-14/bundle.json` PASS 4/4;
  evidence `test-results/PLAN-032-SP4-2026-10-14.log` + smoke
  `plan-032-sp4-smoke-2026-10-14/` (en+it @900×640). Divergenza documentata:
  chipName in sintassi ICU `{label}`/`{qualifier}` (la spec citava `{{…}}`,
  letterale sotto i18next-icu)
created: 2026-10-14
parent: PLAN-032
debate: mw-web-debate `20261012-plan-032-sp4-bag-strip` — artifact r004
  converged 3/3 eligible (chatgpt, deepseek, gemini ACCEPT; claude provider_dead)
artifact_sha256: 770bc22471ec887570bca0509c5828aa467ca945206039af144aa71e27ba3c82
depends_on: none
dispatch: 2026-10-14 — T-011 PLAN-034; executor manual (Devin session)
---

# SP-4 — BagStrip (consumabili durante viaggio/beat) — artifact r004

Round-2 residuals absorbed. Decision (d) from r002 is REVERTED (see Surface
contract): the belt's null on passive-only bags is deliberate design, and the
strip never appears at a decision node.

## Verified facts (code)

- `questArmed` is a **player stance**: one boolean, `useState` in
  `game-frame-pixi.tsx`, toggled only by `onToggleArmed`. Every check-item
  button shows `aria-pressed={armed}` and calls the same toggle; `choose()`
  receives `{ useConsumable: questArmed }`. Not reset on resolution, not
  per-item.
- `ConsumableBelt` returns `null` when the bag holds only passive items —
  deliberate: "passive: packed = armed; the belt never renders it clickable"
  (questStash.ts). A decision node with a passive-only bag is *meant* to show
  no bag UI.
- `consumeFlag(state, flag)` removes the flag AND appends to
  `state.consumablesUsed` (epilogue ledger). Every spend path goes through
  `consumeFlag` → `flags ∪ consumablesUsed` = the packed loadout.
- Flags are post-resolution during `presenting`; `run.ended` is likewise
  already true during the final beat replay. `QuestRunWindow` mounts
  `QuestEpilogue` only at `run.ended && !presenting` — until then the stage
  area still shows BeatStage.
- Single `idleVillage` i18n namespace; `labelKey`/`descKey` are paths inside
  it (`questS1Lab.item.*`, `questS1Lab.stash.desc.*`, `missionPlanner.items.*`).
- Belt short label = inline `t(i.labelKey).split('—')[0].trim()`; popover
  shows the full `t(item.labelKey)`.
- `QUEST_STASH.bagSlots = 3` → at most 3 chips. `StashItem` exported;
  `getStatIconComponent` in `@/ui/shared/statIconUtils`; no import cycle.

## Goal

A persistent, read-only glance at the packed consumables during non-decision
states — transit/pending and beat playback, including the final replay. The
interactive `ConsumableBelt` stays the sole bag UI at decision nodes.

## Design

### Shared helpers — `src/ui/idleVillage/components/gameFrame/questBag.ts`

- `questBagItems(flags: string[], stash = QUEST_STASH): StashItem[]` —
  `stash.items.filter(i => flags.includes(i.flag))`. Single derivation for
  strip AND the title-row popover (refactored onto it, same output).
- `bagItemShortLabel(t, item): string` — the `split('—')[0].trim()` idiom
  extracted for the strip. The belt keeps its inline form (untouched); a unit
  test asserts the helper equals the inline expression over every real
  `QUEST_STASH` label, so drift is caught, not hoped away. The belt may adopt
  the helper in a later SP.
- `bagEverPacked(run): boolean` — `items.length > 0 ||
  (run.consumablesUsed?.length ?? 0) > 0`. `consumablesUsed` is read ONLY for
  slot retention, never displayed. Correct because every spend funnels
  through `consumeFlag`.
- `bagStripVisible({ bagEmpty, ended, waiting, presenting }): boolean` — pure
  predicate over precomputed dims (single canonical collection: the caller
  derives `items` once and passes `bagEmpty = items.length === 0`):

  ```
  strip iff !bagEmpty && (presenting || (!waiting && !ended))
  ```

  Positive enumeration of exactly the non-decision states:
  - `presenting` (beat playback, incl. `ended && presenting` final replay) → strip
  - `!waiting && !presenting && !ended` (transit/frontier pending) → strip
  - `waiting && !presenting` (decision) → NEVER strip — belt's own render
    logic rules there, including its deliberate null on passive-only bags
  - `ended && !presenting` (epilogue owns the stage) → never strip

  Mutual exclusion with the belt is structural: the strip gate is the
  negation of the decision zone evaluated in the same render over the same
  values.

### `BagStrip` — presentational component in `gameFrame/`

Props: `items: StashItem[]`, `armed: boolean`. Renders `null` on empty input
(defense-in-depth).

- `role="list"`, `aria-label={t('gameFrame.questWindow.bagStrip.label')}`,
  `data-hud-controls` on the container — the attribute marks the HUD pointer
  region, consistent with the belt and window usage; `cursor: default`.
- Chips `role="listitem"`, `aria-hidden` icon via `getStatIconComponent`,
  single row, `flex-nowrap`; per-chip label truncates with ellipsis.
- Visible text: `bagItemShortLabel(t, item)`.
- Accessible name: composed from the FULL label (detail for AT, since the
  strip is a presence readout) plus a qualifier, via ONE i18n template:

  ```
  bagStrip.chipName = "{{label}} ({{qualifier}})"
  ```

  Parentheses — NOT an em-dash — so the composed name can never collide with
  or be mangled by the `split('—')` idiom. `bagItemShortLabel` is forbidden
  on composed strings; composition order is label → qualify, never the
  reverse.
- Qualifier per kind, resolved through `bagStrip.armed` / `bagStrip.held`:
  - `kind === 'check'` && `armed` → armed qualifier (bag-level stance; all
    check chips marked, matching the belt's `aria-pressed` semantics — never
    presented as per-item selection).
  - `kind === 'action'` → held qualifier ("carried, usable at decisions") —
    wired into the accessible name, not just visual.
  - `kind === 'passive'` → no qualifier.
- Visual state: check chips get a marker (dot/badge, `aria-hidden`) when
  armed — NOT the belt's pressed-button rim; action chips get a muted variant
  (still ≥12px, `--skin-*` tokens, must not read as disabled); passive chips
  plain.
- `title={t(item.descKey)}` kept as mouse-only decoration, explicitly
  subordinate to the popover (the canonical accessible home of full labels +
  descriptions). Chips never focusable, zero `on*` handlers.

### Placement — persistent reserved slot in `QuestRunWindow`

ONE bag-slot wrapper in the belt's existing position above the
choices/stage region. It renders whenever

```
slotVisible = bagEverPacked(run) && !(run.ended && !presenting)
```

i.e. for the whole run once a loadout was packed, until the epilogue takes
the stage. Inside it, per the predicate: `ConsumableBelt` in the decision
zone, `BagStrip` in non-decision states, nothing when the bag is empty.

Why retention: spends commit before replay, so the bag can empty during
`presenting` or exactly at the decision→presenting transition; unmounting
the slot then would yank BeatStage upward mid-narrative. Keeping the slot
while `bagEverPacked` makes "one consistent bag location" a layout fact.
The epilogue transition (`ended && !presenting`) is a major content change
where the slot correctly retires.

### Geometry contract — the ONE rule

- Strip is STRICTLY single-row: `flex-nowrap`, ellipsis truncation, height =
  exactly one chip row.
- The wrapper reserves `min-height` = one chip row whenever visible — the
  value comes from the same layout constant/token the belt row derives its
  height from (named at implementation from existing skin/type metrics —
  `PRES.type.*`/skin tokens — not a magic number, not a runtime measurement).
- Therefore: strip height = 1 row ≤ belt height ≥ 1 row → the decision↔
  presenting transition NEVER moves BeatStage below the 1-row baseline.
- If the belt itself wraps to 2 rows inside a decision node, growth happens
  within that state (pre-existing belt behavior, unchanged); the headed test
  asserts BeatStage top-y stable across decision↔presenting with the
  canonical 3-item loadout at the smallest supported viewport in en AND it,
  including a long it label. If belt wrapping is found at min viewport, that
  is a belt fact surfaced by the test — not a strip defect to paper over.
- **Empty retained slot**: when `slotVisible && bagEmpty` (bag spent), the
  wrapper still renders as an EMPTY container carrying the same 1-row
  `min-height` — the retention guarantee applies to the wrapper itself, not
  to any surface inside it. BeatStage top-y is therefore identical in the
  empty-slot state; the headed test explicitly covers spend-to-empty during
  presenting and asserts the empty slot holds the reserved height with no
  residual chrome (no border/backdrop — it is dead space, inert).

### Popover relationship — explicit

The title-row bag popover is KEPT unchanged in behavior (refactored onto
`questBagItems` only): popover = on-demand detail (full labels, descKey,
empty-state message); strip = persistent glanceable presence. Same helper
output → zero drift.

## Data flow

`QUEST_STASH` → `questBagItems(run.flags)` → strip + popover.
`questArmed` → read-only `armed` prop → marker+qualifier on check chips.
`consumeFlag` → flag removal → item leaves both views next render.
`run.consumablesUsed` → `bagEverPacked` only (slot retention, never shown).

## i18n (en + it, single `idleVillage` namespace)

- `gameFrame.questWindow.bagStrip.label` — container name.
- `gameFrame.questWindow.bagStrip.chipName` — `"{{label}} ({{qualifier}})"`.
- `gameFrame.questWindow.bagStrip.armed` / `bagStrip.held` — qualifier texts.
- Item `labelKey`/`descKey` reused via the same `t()`.

## Styling

`--skin-*` tokens only, ≥12px text, no new CSS file, `flex-nowrap` + ellipsis,
`cursor: default`, no pressed-button affordance.

## Verification

- **Predicate truth table** (pure, exhaustive over ended × presenting ×
  waiting × bagEmpty): decision → no strip; transit → strip; presenting →
  strip; `ended && presenting` → strip; `ended && !presenting` → no strip;
  empty bag → no strip. Assert strip and belt never co-render (structural
  check in the same render).
- **Slot retention**: bag non-empty→empty across decision→presenting and
  mid-presenting spend → wrapper stays mounted holding the 1-row
  `min-height` with no residual chrome, BeatStage top-y unchanged.
- **Derivation**: `questBagItems` vs canonical filter — identity AND order,
  all kinds, incl. a non-default stash threaded consistently.
- **Spend lifecycle**: real consume path (`choose` with consumable,
  `drinkPotion`) → item disappears from strip AND popover. Gate test.
- **Committed-state contract** (positive assertion, not a comment): during
  `presenting` of a beat that consumed an item, the strip does NOT show that
  item — this pins decision (a), catches regressions toward snapshots.
- **Shorten equivalence**: `bagItemShortLabel` === belt's inline expression
  for every `QUEST_STASH` label.
- **Armed**: two-check bag + `armed` → both chips marked + qualified; stance
  persists after a spend; `!armed` → none. Action chips carry the held
  qualifier in name AND visual.
- **a11y**: composed names from full label + qualifier, container named,
  chips non-focusable, marker `aria-hidden`, no em-dash in composed strings.
- **Layout (headed, T-04)**: BeatStage top-y + no clip/overlap/panel
  overflow across decision↔presenting, 3-item max load, min viewport, en+it.
- **Boundary**: `BagStrip` imports only `questBag.ts`, `QUEST_STASH`,
  `statIconUtils`, i18n. Belt untouched.

## Explicitly out of scope

Interactive strip; per-item arm state; replay-cursor snapshots; passive-only
decision-node display (belt's deliberate null stands); suppressing the
popover; displaying `consumablesUsed`; second inventory model; belt changes;
new config knobs; multi-row strip.
