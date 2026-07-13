# Interaction Core — Drag Outcome, Flight, Extraction & Bloom — Integration Spec

> **Purpose**: Architectural reference for the shared interaction layer that governs every
> PgCard ↔ Slot ↔ SlotRack ↔ POI exchange: drag outcome state machine, magnetic flight,
> press-and-hold extraction, drop-target bloom, and the Away/locked resident state.
> These behaviors exist in ONE implementation each; pages and kits only make *decisions*
> (which slot accepts which pg) and inherit everything else.
>
> **Related**:
> - [Roster + PgCard + Slot + SlotRack — Integration Spec](./roster_slot_integration_spec.md) (the `/test` Slot Lab chain)
> - [Roster Slot POI Integration](../plans/roster_slot_poi_integration.md) (POI behavior & rewards)
> - `src/docs/docs/minimal_slice/04_drag_interactions.md` (canonical drag spec, Phase 4)

**Certified reference pages** (behavior contract, in bottom-up order):

| Level | Route | Certifies |
|---|---|---|
| L0 | `/slot` | PgCard + single Slot: incastonamento, spring-back, click-to-assign, estrazione |
| L1 | `/minimal-roster`, `/minimal-slotRack` | Containers delegate to L0 (no re-implementation) |
| L2 | `/minimal-roster-slot-integration` | Roster + SlotRack, config-driven slots, infinite slots, scroll |
| L4 | `/minimal-job-poi-roster-integration` | POI medallion as proxy of its slot |

---

## 1. Shared Modules (single source of truth)

All live in `src/ui/idleVillage/interaction/`.

### 1.1 `useDragOutcome` — the drag outcome state machine

```
idle → dragging → flight    (valid drop: token flies into the slot)
                → returning (invalid drop: spring-back to origin)
flight/returning → idle     (automatic)
```

| API | Behavior |
|---|---|
| `startDrag(residentId)` | mode `dragging`; clears the `__dragFlightActive` flag |
| `startFlight({residentId, slotId, isInset, toX, toY, fromX?, fromY?})` | mode `flight`. **Origin auto-resolved** from the real pointer release position (`__lastDragPosition`, written by CustomDragOverlay) when `fromX/fromY` are omitted. Sets `window.__dragFlightActive = true` so dnd-kit's drop-animation clone is suppressed (otherwise the token doubles). |
| `springBack(residentId)` | mode `returning`, auto-reset to `idle` after `SPRING_BACK_MS` (600ms = PgCard's `animate-bounce-spring` duration). **Never write state here** — see §4. |
| `settle()` | back to `idle`, clears the flight flag |

**Rule**: the state machine owns only the *transient visual*. The pg's real status
(available / away / injured / tired) is always **derived from resident data** at re-render
(`describeStatus`, `isResidentInteractive`); the drag flow never writes it.

### 1.2 `DragOutcomeFlight` — the one flight renderer

Renders `FlightProxy` from a `useDragOutcome` state. Every page/kit that shows the
magnetic flight uses this component, so easing/duration/doubling-suppression are
identical everywhere. `onComplete(residentId, slotId, isInset)` fires on landing:
apply the assignment (isInset=true) or the unlock (extraction return) there, then `settle()`.

Flight feel: `FLIGHT_DURATION_MS = 280`, ease-in curve `[0.55, 0.06, 0.85, 0.4]`
(starts slow, accelerates into the slot — "magnetic"). Defined once in `FlightProxy.tsx`.

### 1.3 `useExtractionSequence` — press-and-hold extraction choreography

Certified on `/slot`; the rack (`ResidentSlotRack`) delegates to the same hook.

```
hold      : progress 0→1 in 560ms  (drives SlotV12Renderer: TEETH RETRACT FIRST,
                                    then the bezel counter-rotates — see §1.5)
bezelWait : 560ms (bezel CSS transition completes)
overshoot : progress 1.2, held 300ms (spring flare; onOvershoot → medal spring/sounds)
extracted : progress 1.0 + onExtracted() → remove occupant + start the return flight
cancel()  : released early → progress eases back to 0 in 300ms
reset()   : call when the return flight lands
```

### 1.4 `bloomEffect` — AAA drop-target bloom

`getBloomStyle(state, sizePx)` where state ∈ `idle | valid | invalid`.

- **valid** → 4-layer `filter: drop-shadow()` (hot white-gold rim → amber corona →
  mid falloff → warm atmosphere) + slow 1.8s intensity pulse. Drop-shadow follows the
  element's **alpha channel**: round medallions get round halos. Never use `box-shadow`
  for this — it paints the element's rectangle (the historical "white square" bug).
- **invalid** → dimmed to alpha (opacity 0.3, desaturated).
- Radii scale with `sizePx` via the `--bloom-unit` CSS var: a 60px slot and a 160px
  medallion glow with the same relative weight.

**Rule**: when a token is in hand, EVERY element that can receive it (slots and POIs)
must show this bloom, computed per-target from its own requirement.

### 1.5 `SlotV12Renderer` teeth/bezel sequencing (component-owned)

- Teeth are extruded **only when the bezel is closed** (`bezelRotateDeg === 0`);
  empty/open slots keep them retracted.
- Insertion: bezel closes (560ms) → teeth extrude (240ms, delayed 560ms).
- Extraction: phase 1 (0→35% of progress) teeth retract, phase 2 (35→100%) bezel
  counter-rotates. Constant: `TEETH_PHASE = 0.35`.

---

## 2. Protocols between pages and kits

### 2.1 `RosterDropVerdict` (rosterKit)

The page's `onDragEnd(event)` returns the *decision*; the kit executes the outcome:

| Return | Kit behavior |
|---|---|
| `false` | invalid drop → spring-back (card returns available via auto-reset) |
| `{ flightToSlot: { slotId, element } }` | magnetic flight from release point into the slot, then `onFlightComplete(residentId, slotId)` — apply the assignment THERE, not in onDragEnd |
| `element: null` (slot not rendered, e.g. closed POI detail) | no animation, `onFlightComplete` fires immediately |
| `true` / `void` | nothing special, settle |

### 2.2 Away / locked residents (`lockedResidentIds`)

Plumbed through `RosterDraggable → VillageRosterSection → ResidentRosterPanel → DragTestContainer`.
Locked residents get effective status `away`: label from `lockedStatusLabel`
(pass `"Away"`), opacity 0.35 + grayscale + `pointer-events: none` (both PgCard and
WanderlustRosterCard). Pages pass `[...assignedIds, flyingResidentId]` — a pg is locked
from the moment it flies until it is extracted AND its return flight lands.

### 2.3 Click-to-assign

Card click → `onResidentSelect(residentId)` (canonical roster channel). The page finds
the **first free slot whose requirement the pg satisfies** (only slots — POIs are never
click targets), then flies it there (`isInset: true`) and assigns on landing.
Guards: no-op if the pg fails every requirement, is already assigned, or a flight is in progress.

### 2.4 POI as slot proxy (L4)

Dropping on the POI medallion runs the SAME check as its slot (the slot "lives" in the
POI detail). The POI's own highlight (`JobPOI`) reads the dragged pg's stats from the
drag payload — PgCard/WanderlustRosterCard put `resident: { stats: { hp }, fatigue }`
in `useDraggable().data`. Valid → shared bloom; invalid → alpha.

> **Interaction design note (L3 reference page):** in `/minimal-job-poi-roster-integration`
> clicking the POI toggles the **POI detail only**; the slot rack is rendered inside the
> detail and is never opened as a standalone panel. This page is an example interaction
> surface, not a real production screen, so the POI must never expose the slot rack
> directly without the detail.

### 2.5 Config-driven slots (L2)

Slots come from an `ActivityDefinition` in `DEFAULT_IDLE_VILLAGE_CONFIG.activities`
(reference: `slot_rack_lab`), consumed via `useResidentSlotController`:

- `metadata.slotBlueprints` — per-slot `requirement` overrides (e.g. HP > 200 via the
  typed `NumericStatRequirement`: `{ stat: 'hp', operator: '>', value: 200 }`,
  evaluated by `statMatching.evaluateStatRequirement`).
  Slot blueprints also carry **semantic role** (`role`), an optional human-readable
  `roleLabel`, and the `required` flag. For quests, two additional modifiers are
  recognized:
  - `emptyPenalty` — party-level malus applied when a `required` slot is left empty
    (`partyPowerMult` and flat `extraDeathChance`/`extraInjuryChance` percentage points).
  - `residentRiskModifiers` — per-slot flat risk deltas (`deathChanceDelta` / `injuryChanceDelta`)
    applied to the resident occupying that slot.
  These fields are config-only; the controller forwards them into `ResidentSlotViewModel`
  and `ActivityDetailSlotData` without interpretation.
- `maxSlots: 'infinite'` — the controller always keeps ≥1 empty virtual slot: fill the
  last free slot and a new one appears. This IS the "infinite slots" mechanic.
- Rack `overflowBehavior="scroll"` past N slots → themed thin gold scrollbar
  (`RackScroll.module.css`).

### 2.5.1 Quest Assignment deterministic preview

Quest pages use `useQuestAssignmentPreview` for a **live, RNG-free preview** of the
outcome distribution. The hook consumes:

- `ActivityDefinition` (level, `dangerRating`, `metadata.slotBlueprints`)
- `ResidentSlotViewModel[]` (assignments, `emptyPenalty`, `residentRiskModifiers`)
- `QuestPowerRules` (from `DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.questPowerRules`)
- `QuestItemMock[]` (optional toggle items)

It returns the expected `projectedDeathChance`, `projectedInjuryChance`,
`projectedRewardMultiplier`, and `canEmbark` (false if any required slot is empty).
The hook uses only the **pure** functions from `QuestPowerEngine` (`calculatePartyPower`,
`calculateQuestDifficulty`, `calculatePowerRatio`, `getOutcomeDistribution`). `resolveQuestPower`
and any other RNG-consuming function must be called only once, by the `onClick` handler
of the **Embark** CTA.

---

## 3. Event flows (end-to-end)

### 3.1 Drag → valid drop
```
pointerdown on card → dnd-kit activation (8px)
  → kit RosterDragMonitor.onDragStart → useDragOutcome.startDrag
  → card stays MOUNTED, alpha 0.5, label "Away", pointer-events none
  → all receivers evaluate the pg → bloom valid / alpha invalid
pointerup over slot/POI → page onDragEnd returns { flightToSlot }
  → kit startFlight (origin = release point) → dnd clone suppressed
  → DragOutcomeFlight lands → onFlightComplete → page assigns → resident locked (Away)
```

### 3.2 Drag → invalid drop
```
pointerup (requirement failed / occupied / outside) → verdict false or over=null
  → springBack → bounce animation → auto-reset 600ms → card available again
  → status re-derived from data (injured pg shows "Ferito", not "available")
```

### 3.3 Extraction
```
press-and-hold on occupied slot → useExtractionSequence.start
  → teeth retract → bezel opens → overshoot 1.2 → onExtracted
  → page clears assignment + return flight slot→card (isInset false)
  → landing → unlock → card re-derives its real status
(early release → cancel(): bezel eases closed, nothing changes)
```

---

## 4. Common Problems (all hit and fixed during development — do not reintroduce)

| # | Symptom | Root cause | Rule |
|---|---|---|---|
| P1 | Card stuck in alpha/non-interactive after spring-back | `returning` state never reset (or reset ≠ animation duration: 300 vs 600ms) | never hand-roll spring-back: use `useDragOutcome.springBack` |
| P2 | Token doubles at drop (two medallions) | dnd-kit drop-animation clone + FlightProxy both playing | `startFlight` sets `__dragFlightActive`; CustomDragOverlay skips the clone |
| P3 | Flight always starts from screen center | hardcoded "fallback" origin | omit `fromX/fromY`: the hook resolves the real release point |
| P4 | Drag overlay/spring-back dead with `useExternalDndContext` | kit handlers were wired only to its internal DndContext | `RosterDragMonitor` (useDndMonitor) bridges whichever context is above |
| P5 | Empty medallion (black center) at drag start | 7MB, 2816px portrait PNGs decoded on first SVG paint | portraits ≤512px (originals in `assets_originals/`); roster preloads+decodes on mount; medal gated on `Image.onload` |
| P6 | White SQUARE halo around round POI | glow via `box-shadow` (paints the box) | bloom is `drop-shadow`-based only (`bloomEffect.ts`) |
| P7 | POI never blooms valid | dragged card's `useDraggable().data` lacked stats | keep `resident: { stats: { hp }, fatigue }` in the drag payload of every card |
| P8 | Card unmounts during drag ("empty socket") | isLifted swapped the card for CardSocket | card stays mounted: alpha + Away + non-interactive |
| P9 | Slot shifts layout when occupied; portrait vanishes mid-extraction | rack-only "Clear"/"×" buttons; chip unmounted at overshoot | press-and-hold is the ONLY extraction affordance; chip lives until `onExtracted` |
| P9b | Portrait "moves and comes back" before extraction | rack applied `animate-bounce-spring` to the in-slot chip on overshoot (old impl leftover) | the in-slot token NEVER animates in place — it moves only via the shared FlightProxy; `onOvershoot` handles sound/medal only |
| P10 | Away pg still draggable/full-opacity | `lockedResidentIds` not plumbed; Wanderlust card showed `subtitle`, not `statusLabel` | pass locked ids + label through the kit; unavailable = alpha + pointer-events none |
| P11 | Skin looks washed out / ugly | POI medallion rendered on a white panel | the skin (extracted from `poi3.html`) is designed for dark backgrounds |

**Testing gotcha**: extraction/flight animations are rAF-driven; Chrome suspends rAF in
occluded tabs (headless previews). Interaction tests must run with a visible viewport
(Playwright) — the first synthetic drag after a reload may also miss the droppable.

---

## 5. Aesthetic profile of the L2 reference page

The `/minimal-roster-slot-integration` route is the visual reference for the
**Roster + SlotRack** interaction. It adopts the *DNA Prismatic Wanderlust*
art direction described in
[`../plans/art_direction_plan.md`](../plans/art_direction_plan.md): anti-flat,
anti-grim, material-first surfaces with warm amber/gold accents over a dark
slate canvas.

### Concrete tokens on the page

- **Page canvas**: `min-h-screen bg-slate-950 p-8 text-ivory` with a centered
  `max-w-6xl` grid.
- **Header**: small label in `text-amber-200/70` uppercase with wide tracking;
  title in `text-2xl font-semibold text-amber-100`.
- **Card panels**: `bg-slate-900/30 border border-slate-700/50 rounded-lg p-6`.
- **Roster kit**: `<RosterDraggable useWanderlustSkin={true} ... />` renders
  `VillageRosterSection` through the certified `rosterKit`, with
  `lockedResidentIds` shown as `Away` (alpha 0.35 + grayscale +
  pointer-events none).
- **Slot rack surface**: the rack is wrapped in
  `<WanderlustSurface shape="panel" material="bronze" interactive={false}>`
  (see [`WanderlustSurface.tsx`][ws] and [`materialPresets.ts`][mp]). The
  `bronze` material preset provides a warm copper-to-brown field with gold
  rim gradients.
- **Slot rack config**: `ResidentSlotRack` is rendered with `layout="detail"`,
  `overflowBehavior="scroll"` and `slotSize={140}`; themed overflow indicators
  are handled by `RackScroll.module.css`.

### Why it matters

These style choices are not decoration: the `WanderlustSurface` bronze panel is
the drop target for the `WanderlustMedalOverlay` drag preview, and the dark
slate background keeps the glowing bloom (`bloomEffect.ts`) and drag flight
visible. Any page replicating the L2 behavior should reuse the same certified
kits and material tokens rather than inventing new chrome.

[ws]: ../../../ui/wanderlust-surface/WanderlustSurface.tsx
[mp]: ../../../ui/wanderlust-surface/materialPresets.ts

---

## 6. Extension checklist (new page or new receiver)

1. Compose kits only: `RosterDraggable` / `ResidentSlotRack` / `JobPOI` (one-line imports from `frozen/kits/*`).
2. Slots from config: an `ActivityDefinition` (+ `metadata.slotBlueprints`) consumed by `useResidentSlotController` — never hardcode slot lists in page code.
3. `onDragEnd` returns a `RosterDropVerdict`; assignment only in `onFlightComplete`.
4. `onResidentSelect` → click-to-assign toward the first accepting slot.
5. `lockedResidentIds` = assigned + flying, `lockedStatusLabel="Away"`.
6. Any new receiver applies `getBloomStyle(state, sizePx)` — nothing else.
7. Never write pg status from drag/extraction code: change the store, let the roster re-derive.
