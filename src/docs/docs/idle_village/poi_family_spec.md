---
title: POI Family Spec
status: superseded
updated: 2026-10-19
type: component-spec
superseded-by: CTR-game-008 (`.mw/contracts/CTR-game-008.md`) — PLAN-054 T-003 triage: su `/game` esiste solo la famiglia `quest` (MapQuestPoi Sigillo); i figli `job`/`training`/`maintenance`/`cooldown` sono `deprecated` (mai rilasciati fuori dal vecchio harness)
---

# POI Family Spec

## Goal

Define the shared contract for every **Point of Interest (POI)** in the Idle Village: a map capsule that exposes an `ActivityDefinition`, accepts resident cards in slots, progresses with the canonical time engine, and resolves into rewards or state changes. This root covers behavior that is **identical** for all POI kinds (`job`, `quest`, `training`, `maintenance`, `cooldown`). Specializations live in the child specs.

## Canonical sources

- Config schema: `src/balancing/config/idleVillage/types.ts` (`ActivityDefinition`, `ActivityCardKind`, `ActivitySlotModifier`, `ActivityFatigueProfile`)
- Default config: `src/balancing/config/idleVillage/defaultConfig.ts`
- Map capsule: `src/ui/idleVillage/components/ActivityCapsule.tsx` (see `poi_standard_trusted.md`)
- POI detail: `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx`
- Interaction layer: `src/ui/idleVillage/interaction/` — `useDragOutcome`, `DragOutcomeFlight`, `useExtractionSequence`, `bloomEffect.ts`
- Master index: `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`

## Data flow

```text
IdleVillageConfig.activities[id]
        │
        ▼
ActivityCapsule (map)  ◄──── click ── POI detail opens
        │
        ▼
ActivityCapsuleDetailSkinAware
        │
        ├── ResidentSlotRack (assign / extract)
        │   │
        │   ▼
        │   RosterDraggable ── drag / click-to-assign
        │
        ├── CTA (Start / Embark / Cancel / Collect)
        │
        ▼
Resolution engine (job / quest_dispatch / quest_combat / ...)
        │
        ▼
TimeEngine ── canonical time / day-night
        │
        ▼
Outcome (rewards, fatigue, injury, death, expiration)
        │
        ▼
Resource HUD + Roster + Chronicle
```

| Step | Source | Data | Consumer | Effect |
|------|--------|------|----------|--------|
| 1 | `IdleVillageConfig.activities[id]` | `ActivityDefinition` | `ActivityCapsule` / `ActivityCapsuleDetailSkinAware` | Renders capsule and detail |
| 2 | `ResidentSlotRack` | slot blueprint + assigned resident | `useResidentDropValidation` | Validates drop/click-to-assign |
| 3 | `onDragEnd` / click | `RosterDropVerdict` | `DragOutcomeFlight` | Magnetic flight into slot |
| 4 | `onFlightComplete` | resident + slot | slot rack controller | Assignment written |
| 5 | `onStart` / `onEmbark` | full slots | resolution engine | Transition `ready → in-progress` |
| 6 | `TimeEngine` | elapsed time | resolution engine | Phase/tick progress |
| 7 | Resolution engine | rewards, fatigue | store + HUD | Apply outcome, update roster |

## State machine

```text
[m]        idle
 idle ──(assign slot)──► ready
 ready ──(start/embark)──► in-progress
 in-progress ──(tick/phase)──► in-progress
 in-progress ──(complete)──► completed
 completed ──(collect)──► idle
 idle ──(expire)──► gone
```

**Notes:**
- The POI detail does **not** pause time automatically.
- `Start` / `Embark` commits immediately when the CTA is clicked while time is running and all required slots are filled; if the game is paused, the activity does not begin until `resumeGame` is called and `tick()` advances.
- Removing a resident or changing a consumable after starting does not cancel the already-started activity.

## Scenarios

### S-001 — Open POI detail

**GIVEN** a POI on the map in `idle` state

**WHEN** the user clicks the capsule

**THEN** `ActivityCapsuleDetailSkinAware` opens as a draggable panel, centered in the map viewport; the page behind remains interactive; the panel shows POI info, slot rack, CTA, and progress

**Visual contract:** no backdrop, header has `cursor: move`, panel clamped to viewport bounds

**Test:** `poiQuestDetailRosterTimeClock.spec.ts` — `should open the Quest POI detail and show the ResidentSlotRack`

### S-002 — Assign resident from roster

**GIVEN** the POI detail is open and a slot blueprint accepts the dragged resident

**WHEN** the user drops the resident onto a slot or the POI medallion

**THEN** the resident flies into the slot, `onFlightComplete` writes the assignment, the slot shows the resident, and the CTA enables when all required slots are filled

**Visual contract:** `bloomEffect` highlights valid targets; in-slot token appears only after flight lands; locked residents are `Away` (alpha 0.35, grayscale, `pointer-events: none`)

**Test:** `poiQuestRegressions.spec.ts` — `should assign a compatible resident via the API and reflect it in the detail`

### S-003 — Extraction

**GIVEN** an occupied slot

**WHEN** the user press-and-holds the slot (560ms) until overshoot

**THEN** teeth retract, bezel opens, on `onExtracted` the assignment is cleared, the resident returns to the roster

**Visual contract:** no `×` button; extraction is the only removal affordance; return flight is `isInset: false`

**Test:** `interaction_core_spec.md` verification on `/slot`

### S-004 — Start / Embark while time runs

**GIVEN** all required slots are filled and the user clicks Start/Embark

**WHEN** `isPaused === false` and all required slots are still valid

**THEN** the POI transitions to `in-progress`, the activity is scheduled, and time progression begins

**Visual contract:** CTA becomes a progress/speed control; the POI halo starts filling

**Test:** `poiQuestRegressions.spec.ts` — `should start a quest only when time resumes`

### S-005 — Time progression

**GIVEN** the POI is `in-progress`

**WHEN** the canonical `TimeEngine` advances

**THEN** the POI progress is derived from `TimeEngine` elapsed time, not from a local timer; `DayNightPOI` and halo reflect the same canonical state

**Visual contract:** no local `setTimeout` or `setInterval`; halo fills/drains from canonical `progressFraction`

**Test:** `time_engine_day_night_poi_interaction_spec.md`

### S-006 — Completion and collection

**GIVEN** the POI is `completed`

**WHEN** the user clicks Collect (non-continuous) or time ticks (continuous)

**THEN** rewards are applied, fatigue is consumed, residents are released or remain depending on `continuousJob`

**Visual contract:** non-continuous shows a Collect CTA / reward screen; continuous shows a small `+` delta on the resource HUD

**Test:** child specs (`poi_job_spec.md`, `poi_quest_spec.md`)

## Visual / runtime contract

- **Capsule** is a map marker, not a detail view (`poi_standard_trusted.md`).
- **Detail** is a draggable, minimizable, closeable floating panel with no backdrop (`detail_spec.md`, `floating_panel_spec.md`).
- **Slot rack** is config-driven from `ActivityDefinition.metadata.slotBlueprints` (`interaction_core_spec.md`).
- **Drag** uses `dnd-kit` with `DragOutcomeFlight`; token remains mounted and becomes `Away` during drag (`interaction_core_spec.md`).
- **Halo / progress** is derived from `TimeEngine`; color and fill direction are skin/preset driven (`day_night_poi_spec.md`).
- **Rewards / costs / fatigue** are config-driven (`ActivityDefinition.rewards`, `costs`, `fatigueProfile`, `dailyRewardProfile`, `dailyFatigueCost`).

## Map marker visual contract — the Sigillo (PLAN-058 T4.1)

**Status:** schema 2026-10-13 (T4.1); implemented 2026-10-14 (T4.2) behind the `sigillo` prop of `PoiMatericV3_5` (only `MapQuestPoi`/`MapDemoPoi` turn it on). Pending: veiled state (no data source), painted glyphs for job/threat (they still show the cross), ring colour (waits for the Director's eye).
**Scope:** the POI marker on the `/game` map (`MapQuestPoi`, `MapDemoPoi` → `PoiMatericV3_5` or a new variant). The detail panel is out of scope.
**Why:** measured on `/game` (R-177 review): the current rims get lost on the biomes (quest rim hue 39° ≈ sand 40°, contrast 1.5:1; event rim 1.1:1 on sea and ochre; job rim = sea hue) and in grayscale every POI looks the same. The Sigillo separates the four jobs a marker does — **border = being seen, silhouette = family, glyph = place, halo = time** — so none of them depends on colour.
**Mother rule:** the marker must look like the Roster V2: same lacquer (`--skin-hud-lacquer-*`), same bronze, no gloss.

### Anatomy (outside → in; the halo is the exception, it rides outside the border)

| Layer | Contract | Notes |
|---|---|---|
| 1. Border | Double, identical for every family and state: outer dark `#0b0a08` **2 px** + inner ivory `#efe3c6` **1.5 px**. Screen px, does not scale with S/M/L (`vector-effect: non-scaling-stroke`). | The only layer that guarantees readability on any biome (≥ 4.3:1 measured on all of them). It never carries valence colour. |
| 2. Silhouette | The family: **round with a tail** = enterprise (`PoiType` `quest`, both normal and main quests); **tile** (square, rounded corners) = work (`job`); **diamond** = threat / event (`event`). A **main quest** is the enterprise silhouette at size **L** with its halo visible from the start (see "Quest tier"). | Implemented as a bronze plate behind the round medallion: tail = a pointed pin under the circle (replaces the gem); tile = rounded square (medallion scaled to 0.785); diamond (medallion scaled to 0.7). Every shape stays inside the seal's inner rail. | The tail points down; its tip is the map anchor and replaces the gem. The three silhouettes must be distinguishable in grayscale at 32 px. Symmetric and centred (D2). |
| 3. Field | Roster lacquer: `--skin-hud-lacquer-base` → `--skin-hud-lacquer-deep`, light from top-left. Bronze wear lives here (D2: asymmetry lives in the material). | No specular, no glass, no reflection (D5). |
| 4. Halo (the seal) | **Written around the marker, outside the border** (rails at r 45–54 around a 43-unit marker), as in desiderata v3 («attorno al POI si scrive un cerchio magico»). It is **time**, and only time (D4). Neutral colours: ivory for the deadline, verdigris for work. **Vermilion = urgency only.** | Correction to the T4.1 draft, which placed it inside the border: that would have shrunk the glyph field and contradicted desiderata v3. See "Halo grammar". |
| 5. Incised letters | They stay **as they are today** (D5 + Director 2026-10-13): rim letters (`RIM_LETTER_COUNT` 24) and seal letters keep count, layout and behaviour. T4.2 only feeds their colours from the `--skin-poi-*` tokens. | Supersedes "reduce to 12–16, tied to the timer" in PLAN-058 T4.2. |
| 6. Glyph | The **place** (D1), not the verb. A painted icon from the icon registry (Phase 3), ~55–60% of the inner field. Until it is `approved`: an incised vector placeholder, **never the cross** (`CROSS_ARM`). | No skulls (D3). |

**Removed (D5):** gem and gem bed (`poiv3_5__gem`), glass sheet and specular (`poiv3_5__specular`), coloured family coronas.

### Size = threat magnitude

| Size | Factor | px at today's base (55) | Who |
|---|---|---|---|
| S | 0.8 | 44 | minor threat |
| M | 1.0 | 55 | **every normal quest and every work**, standard threat |
| L | 1.25 | 69 | major threat (e.g. Goblin King), **main quest** |

Size = weight of the stake: only threats and main quests change size. The border stays 2 + 1.5 px at every size.

### Quest tier (Director 2026-10-13)

Three kinds of map offer must read apart: **normal quest**, **main quest**, **event/threat**.

| Kind | Silhouette | Size | Offer halo (before embark) |
|---|---|---|---|
| Normal quest | round with tail | M | as today: none until the last 25% of the window, then it appears full and drains |
| **Main quest** | round with tail | L | **full from the moment it appears**, drains counter-clockwise over the **whole** window (ivory); vermilion snap below 25% |
| Event / threat | diamond | S/M/L by magnitude | same deadline grammar as a normal quest |

- **Interpretation to confirm:** "durata molto più lunga" is read as a much longer offer window (`availableDays`), and "halo pieno fin dall'inizio" as the deadline halo being full on appearance. Once embarked, a main quest uses the normal work mode (fills clockwise, verdigris), like every quest (D4: filling = work).
- **Data source (implemented):** `tier: 'normal' | 'main'` (optional, absent = `normal`) in `QuestPoiSchema` (`balancing/config/idleVillage/quests/questPois.ts`) — the real quest definition, not the demo `questPois` of `gameFrameConfig`. `MapQuestPoi` reads `questPoiById(activity.id)?.tier` (a `tier` prop overrides it) and passes it to `mapQuestPoiView(…, tier)`, which for `main` + an open offer returns `progress: availability.progress` (not renormalised), `direction: 'counterclockwise'`, ivory until `expiring`. Still the only source (T-07). **Today no quest is authored as `main` and the slice offers never expire** (`SLICE_OFFER_WINDOW_DAYS` = 10 000), so this path is covered by unit tests, not yet visible on `/game`.

### Offer lifecycle — consumption and reveal (R-200)

- **Consumption:** an offer is **one-shot by default** — dismissing the report of an ended+settled run writes the POI into `consumedPoiIds` (persisted) and it never comes back. `repeatable: true` on the POI disables consumption: the cleared run returns the marker to `available` while the window stays open, and a stale consumed record is ignored. `poi-goblin` is the authored repeatable offer; `poi-rovine` stays one-shot. Predicates: `poiConsumesOnReportClose` / `isPoiConsumed` in `questPois.ts`.
- **Reveal:** on `/game` the offers mount on their own, staggered on wall clock (`gameFrameConfig.questReveal` — 1s after the veil, then 5s apart, authored order). The reveal only adds: a marker never un-reveals (exits still come from expiry/consumption, through the ghost fade). The Director «Show quest» action is a one-way «reveal now»; a live run always mounts its POI without waiting for a stagger slot.

### Halo grammar (D4: one thing, time, in two modes)

| Mode | When | Direction | Colour |
|---|---|---|---|
| **Deadline** — it drains | open offer (`questStatus: 'available'`): normal quest / event only in its last stretch, **main quest over the whole window** | counter-clockwise from twelve | ivory → **vermilion** when it enters `expiring` |
| **Work** — it fills | run in progress (`questStatus: 'in_progress'`) | clockwise from twelve | verdigris |

- **Single source (T-07):** state, progress, direction and warn come **only** from `mapQuestPoiView` (`MapQuestPoi.tsx`). The marker never computes time. The only tween allowed on progress is the existing write-in (`SEAL_WRITE_IN_MS`, born empty), which multiplies the view's progress and does not replace it.
- **Arc from zero (T-02):** no `strokeLinecap="round"` on the halo arc or on the letter arcs; at progress 0 **nothing** is drawn (no dot at twelve). Test at 0, 0.25 and 1.
- **Expiring threshold:** the existing one, `EXPIRING_BELOW = 0.25` in `questAvailability.ts`. No new thresholds.

### States

| State | View-model trigger (`mapQuestPoiView`) | Halo | Letters | Motion | `prefers-reduced-motion` |
|---|---|---|---|---|---|
| **Available** (normal / event) | `available` + no deadline or `availability.state === 'available'` → `state: 'assigned'`, `progress: 0` | none (bare marker) | as today | none | — |
| **Available** (main) | `tier: 'main'` + `availability.state === 'available'` → `progress: availability.progress`, CCW | ivory, full on appearance, drains over the whole window | as today | write-in on mount, nothing else | lands on the real value |
| **Expiring** | `availability.state === 'expiring'` (< 25% of the window left) → `state: 'expiring'`, CCW; normal/event: progress renormalised over the last stretch; main: keeps draining the whole window (no jump) | vermilion, drains to 0 at the deadline | as today | **one single snap** on entry (≤ 400 ms: brief scale 1→1.06→1 and light). Never repeated. | colour changes with no scale |
| **Working** | `in_progress` → `progress: activityProgress`, CW | verdigris, fills | as today | write-in on mount, nothing else | lands on the real value |
| **Done** | `completed` / `failed` → `progress: 1` | full, verdigris | as today | **slow pulse, ~2 s period**, until the player acts (opens the card / collects) | steady light, no pulse |
| **Expired** | `availability.state === 'expired'` → `state: 'expired'` | — | — | the existing exit (fade + shrink, `EXPIRE_FADE_MS` 700). **No pulse** before vanishing (decided 2026-10-13, see below). | instant exit |
| **Veiled** | "not yet" POI (DESIGN_PILLARS R4.2, "veiled with a subtle *not yet*") | none | off | none | — |

- **Expired, no pulse:** in this grammar the pulse means "act now" (done state). On an expired offer there is nothing left to do, so a pulse would be a false call to action. The warning was the vermilion snap at 25%. If the loss must be noticed, it belongs in the event ledger, not on the marker.
- **Veiled:** border drawn in full (the marker must still read on the map), field and glyph at 45% opacity with no saturation, no halo. There is **no data source today**: it arrives with the "map clickable from the start" TODO (outside PLAN-058). T4.2 only defines the visual.
- **Decision waiting** (D-H-4, `decisionWaiting`): stays a badge separate from the halo (D-J). Since it is a "you have to act" signal, it reads `--skin-poi-urgent` instead of `--skin-status-unmet`.
- **Drag:** valid drop → the inner ivory border lights up; invalid drop → opacity 0.55 (current behaviour). The border is never removed.

### Tokens `--skin-poi-*` (added in `BASE_SKIN_CSS_VARS`, `skinCssVariables.ts`)

| Token | Value | Use |
|---|---|---|
| `--skin-poi-border-outer` | `#0b0a08` | outer border |
| `--skin-poi-border-outer-width` | `2px` | |
| `--skin-poi-border-inner` | `#efe3c6` | inner border |
| `--skin-poi-border-inner-width` | `1.5px` | |
| `--skin-poi-halo-deadline` | `#ead9b0` | deadline halo, ivory |
| `--skin-poi-halo-work` | `#9fb3c4` | work halo, moonlit silver (was verdigris `#6fc4a4`, read as neon cyan; Director 2026-10-20) |
| `--skin-poi-urgent` | `#e8553a` | vermilion: expiring + decision badge, nothing else |
| `--skin-poi-veiled-opacity` | `0.45` | veiled |
| `--skin-poi-pulse-period` | `2s` | done pulse |
| `--skin-poi-size-s` / `-m` / `-l` | `44px` / `55px` / `69px` | threat magnitude; L also for main quests |

The field uses the existing `--skin-hud-lacquer-*` tokens (T0.2); no new lacquer.
`poiColorConfig.ts` is **not touched**: with `sigillo` the component uses its own neutral `SIGILLO_COLORS` (rim/field) and reads the halo tones from the tokens above, so the per-type entries keep serving the lab pages that mount `PoiMatericV3_5` without `sigillo` (`ReminderComponentV2/V3`, `PoiBronzeComparePage`, `PoiMarkerLabPage`). The ring colour itself is still the Director's call after seeing it on the map.

### Invariants (Sigillo)

- [ ] Border present in every state, every family, every size; colours and widths from the `--skin-poi-border-*` tokens.
- [ ] Family recognisable by silhouette alone in grayscale at 32 px.
- [ ] Vermilion appears only in `expiring` and on the decision badge.
- [ ] Normal quest, main quest and event/threat distinguishable on the map at a glance (silhouette + size + halo).
- [ ] Incised letters unchanged from today (count, layout, behaviour).
- [ ] Halo, letters and warn read from `mapQuestPoiView` only; no `setInterval`/`setTimeout`/rAF of its own on progress (T-07).
- [ ] No round cap on arcs that can be 0; at progress 0 no pixels of halo (T-02).
- [ ] No gem, no specular, no cross as the glyph.
- [ ] `prefers-reduced-motion`: no snap, no pulse, steady light.

### T4.2 acceptance (from the plan)

`poi-terrain-gate` green on every biome; halo test at progress 0, 25% and 100% (T-02); screenshots on 6 biomes in colour and in grayscale. Gate F4: the Director's yes.

**Result 2026-10-14:** `poi-terrain-gate` green (border min 4.12:1 on all 8 crops; families distinct in grayscale); halo test at progress 0 / 25% / 100% in `tests/unit/idleVillage/poiSigillo.test.tsx`; live `/game`: silhouettes and borders checked by eye at 4×, work tone read from the DOM. **Not witnessed live:** urgent snap, done pulse, main quest (no authored `main` quest, offers never expire) — unit-tested only. 6-biome colour/gray screenshots still to do.

### Director answers (2026-10-13)

- **Q1 — Offer halo:** split by tier. Normal quests and events: as today (halo only in the last 25%). Main quests: full from the start, draining over the whole window (see "Quest tier").
- **Q2 — Expired:** it disappears without asking the player for anything; whether it pulses first was left to the schema → **no pulse** (see States).
- **Q3 — `DESIGN_PILLARS.md` R2.3** ("red pulsing" fresh quest, "yellow filling" work, "green flash" done, and the line "Halo (red → yellow)"): the Director does not recall the origin. The schema follows D4 (explicit, 2026-10-13). The pillar text is still out of line and stays open for the Director, with the other PLAN-058 pillar items.
- **Q4 — Letters:** leave them as they are.

## Invariants

- [ ] Every POI is an `ActivityDefinition` from `IdleVillageConfig`; no hardcoded lists in pages.
- [ ] No local timers; `TimeEngine` is the single source of time.
- [ ] Drag flow never writes resident status; it changes the assignment store, and the roster re-derives.
- [ ] Start/Embark begins the activity only when time is running and all required slots are valid.
- [ ] `ActivitySlotModifier` (per slot index) and `residentRiskModifiers` (per slot blueprint) compose: environment multiplier + resident delta.
- [ ] Every specialized POI behavior (quest, job, training, cooldown) is documented in a child spec and linked from this root.
- [ ] Every spec links to its test command and evidence log.
- [ ] All user-facing strings go through i18n (`idleVillage` namespace).
- [ ] No standalone `.css` files; skin through `skinConfigRegistry`.
- [ ] Persistence via `PersistenceService` only.

## Slot modifiers mapping

| Concept | Source | Scope | Meaning |
|---------|--------|-------|---------|
| `ActivitySlotModifier` | `ActivityDefinition.slotModifiers[index]` | slot environment | `fatigueMult`, `riskMult`, `yieldMult` applied to calculations that touch this slot |
| `residentRiskModifiers` | slot blueprint (`metadata.residentRiskModifiers`) | resident occupying the slot | flat `deathChanceDelta` / `injuryChanceDelta` added to the resident's risk |
| `emptyPenalty` | slot blueprint (`metadata.emptyPenalty`) | party level | malus applied to party power / risk when a `required` slot is left empty |

## Test commands

```bash
# POI quest focused
npx playwright test tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts --project="Desktop Chrome"

# POI regressions (will be extended to family)
npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts --project="Desktop Chrome"

# Build + lint
npm run build:check
npm run kanban:lint
```

## Evidence

- Template: `.mw/templates/ai-friendly-spec.md`
- Plan: `plans/PLAN-005-poi-family-ai-friendly.md`
- Existing quest evidence: `test-results/poi-quest-detail-roster-time-clock-err-028-030-2026-08-15.md`
- Doc alignment evidence: `test-results/poi-family-docs-alignment-2026-08-15.md`
- Build log: `test-results/build-check-2026-08-15.log` (passed)

## Child specs

- `poi_job_spec.md` — one-shot and continuous jobs, stamina, auto-collect, resource HUD
- `quest_spec.md` — quest lifecycle, milestones, skill check, `trialOfFire`, chronicle
- `poi_training_spec.md` — stat/XP focus, low risk
- `poi_maintenance_spec.md` — upkeep / building POIs
- `poi_cooldown_spec.md` — time-limited POIs with countdown and expiration

## References

- Trusted: `trusted/poi_standard_trusted.md`
- Plan: `../plans/PLAN-058_hud_roster_unification.md` (Sigillo, T4.1/T4.2)
- Related: `poi_spec.md`, `detail_spec.md`, `interaction_core_spec.md`, `time_engine_spec.md`, `day_night_poi_spec.md`, `roster_slot_rack_interaction_spec.md`
- Master index: `COMPONENT_MASTER_INDEX.md`
