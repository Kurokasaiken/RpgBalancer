# Village Upgrades on mappa2 — Pipeline + Runtime Plan (artifact r009)

> r007 amendments from fifth acceptance round:
> - Slot grammar made derivable: `axes.towers` declares `slots:2` + per-slot values; lab pickers derive from SHIPPED plate keys (not an axis cross-product), so the manifest-drives-lab invariant holds for per-slot states too.
> - W-14/19 stand answered (tripwires + eye).
> - W-15/16 follow-up (3 providers): the JSON example now encodes slot identity — plate keys are `growth|defence|slot1+slot2` 4-tuples; Zod validates the DECLARED key space (shipped subset + any future per-slot plates), so per-slot states are schema-legal today, not prose-only.
> - W-14 stands answered (tripwires + eye).
> - W-15: towers axis is per-slot in the SCHEMA (2 slots, each none|wood|stone) — per-slot independence is representable; v1 ships the symmetric subset, mixed combinations are same-pipeline expansion, not a contract change.
> - W-16: Gate B gains pairwise sibling checks — defended plates on the same axis must be within tolerance of EACH OTHER (defence: pal↔wall per tower-state; towers: wood↔stone per wall), not only vs parent/ancestor.
> - W-14 stands answered (tripwires + eye).
> - W-12: Gate B anchors are PAIRED annotations — the operator marks the corresponding structure on parent AND child; human-established correspondence is the oracle, not coordinate coincidence.
> - W-13: zero removal edits — wall|none comes from a swap-material edit on pal|none; tower states hang off each wall's none-state.
> - W-14 (standing, answered by design): no mechanical gate can fully bound Gemini's non-rigid drift. Accepted: gates are tripwires bounding what reaches the Director's eye — the eye is the arbiter (project invariant T-04).
> - W-08: Gate B redefined as per-anchor limits on explicit semantic anchors (not a single centroid).
> - W-09: defence chain extended to cover ALL 6 defended states (palisade and wall each with none/wood/stone towers).
> - W-10: Gate B is a tripwire, not a verdict — false-rejects go to explicit Director ruling, never a silent K-loop.
> - W-11: defended states are layout-locked against the SHARED ancestor (stone plate) so sibling runtime switches stay within tolerance.

## 1. Goal

- Deliver the Director's ladder on `/mappa2-lab` (and later `/game`): empty meadow → a few cottages → straw village → stone village → palisade XOR stone wall → wood/stone watchtowers — every state painted-in, always in the same spot.
- Kill the ghost-village / floating-ring failure class by removing its cause (element sprites extracted from a foreign layout), not by patching it.
- `village.json` = single source of truth for zone, stages, choices, and plates; runtime, builder, and lab UI all derive from it.

## 2. In Scope / NOT In Scope

**In:** canonical zone contract (Zod); offline two-gate registration + normalization in `scripts/build-village-layers.py`; regeneration of all stage plates in one anchored Gemini chat lineage (growth chain, then linear defence chain covering all defended states); manifest schema v2 (states matrix); runtime refactor to state-driven plates; lab UI derived from manifest; Director eye-check gate.

**NOT in:** animation (smoke already exists separately); construction transitions beyond cross-fade; depth sorting vs units; pixel-cumulativity between stages; independent RGBA element sprites as a shipping requirement; multi-zone generalization; magenta/flat-bg sprite pasting; diff-matting unregistered repaints; runtime color grading (CSS grade covers the whole canvas).

## 3. Decisions

### (a) Asset model: full-zone plates per state — no shipping element sprites

Every renderable state is ONE zone-sized plate drawn at the zone origin. The broken `el-*.png` model is deleted, not repaired: an element sprite is only correct relative to the exact house layout it was cut from; repaints are registered per-plate by different transforms, so an element cut from plate B misaligns on plate A by the difference of two residuals — the ghost-ring failure in a quieter form. Independent elements also force the cross-fade to simultaneously fade stage plate and toggle the element: any timing drift shows the ring hovering mid-transition.

Round-2 ruling (4/5 plates): plates ship v1. If per-slot tower independence is ever required, element overlays may only be same-plate-derived registered cutouts of their own host state — deferred, not built.

Combo space: 4 growth × 3 defence × per-slot towers (2 slots × {none,wood,stone} = 9 combos); shipped = 4 growth + 6 defended (palisade|none/wood2/stone2, wall|none/wood2/stone2) = ~10 plates. The SCHEMA represents per-slot independence (each slot independently none|wood|stone — e.g. wood+empty or wood+stone mixes are valid states); v1 generation produces the symmetric subset only, and mixed combinations reuse the identical pipeline — adding them later is same-method expansion, not a contract change. Whether v1 also ships the mixed tower plates is a Director-ruling item.

Plates are opaque with a shared feathered alpha edge (one mask in the manifest). Feather blends repaint-terrain to map-terrain; combined with border-band color normalization the seam is sub-visible at working zooms.

### (b) "Same spot": zone contract + TWO registration gates (frame + anchors)

- ONE zone rect `{x:1450, y:520, w:300, h:260}` map px, only in `village.json` (Zod). Plate (0,0) → `zone.x,zone.y` at 1:1; plate size == `zone.w×h` enforced by builder (hard fail) and validated at load. Stale zone literals in docs/lab text deleted → grep gate.
- **Gate A — frame registration.** Each raw Gemini crop (900×620 @ 750,380) → rigid translation+scale (MOTION_EUCLIDEAN) estimated on un-edited context, masked to exclude zone+margin; no non-rigid warp (paint tearing). ORB/SIFT+RANSAC init fallback; last resort: baked manual UV offset per stage in the manifest. Calibration: one null-edit control repaint ("repaint identical, change nothing") measures the drift noise floor; threshold set from it. Residual on a 40-80px band around the zone.
- **Gate B — semantic anchor lock (per-anchor, two baselines).** The manifest declares named semantic anchors per state family: `anchors.buildings` = per-cluster centroids (one per cottage cluster, ~2-4 points) and `anchors.defence` = ring perimeter samples (N/E/S/W = 4 points). Each anchor is an {x,y} in zone px, annotated once per state by the builder operator after eyeballing the plate (cheap: ~6-8 clicks/plate, offline). Anchors are declared as PAIRED correspondence sets: for each child plate the operator marks the same physical structure on the parent and on the child (cottage-cluster centroids + ring N/E/S/W samples). The human establishes the correspondence — coordinate coincidence across independently annotated plates is the trap W-12 named. A structure that genuinely moved or regrouped is the semantic finding itself, recorded in the report, not smoothed over.
For each child plate the builder measures **per-anchor displacement** vs BOTH:
  1. its generation parent (chain edge), and
  2. the shared ancestor for its family — defended states vs the `stone` plate, AND
  3. its axis siblings that are legitimate runtime switches (W-16): every `palisade|t` plate vs `wall|t` for each tower-state t, and every `d|wood` vs `d|stone` for each wall d. Displacements can stack along a chain (parent-edge + ancestor-edge sums exceed tolerance), so the pairwise sibling check is required — not implied by the two baselines.
  Reject condition: any anchor displacement > `layoutLockMaxPx` (manifest, ~2px at 1:1, calibrated by Director on one pair).
- **Gate B is a tripwire, not a verdict.** A plate failing Gate B is held, not auto-rejected into a K-loop: up to K=3 regenerations; if still failing AND the plate looks right to the operator, it goes to explicit Director ruling (logged in the build report). Never silent-accept, never silent-reject.
- `stage1.webp` (working 7-cottages) kept as visual baseline; NOT a chain parent.
- Border color normalization: per-channel mean/std match of the zone's border band to base map (band-limited Reinhard) before feathering.

### (c) Generation: ONE Gemini chat — growth chain, then linear defence chain (all 6 states)

- **Meadow first, fresh** from the 900×620 base crop ("repaint identical, keep meadow empty") — never backwards ("remove cottages" leaves residue). Register to base; becomes the chain anchor.
- **Growth chain:** meadow → few cottages → straw village → stone village, "repaint identical + add X" in one chat. stage1.webp stays as shipped visual reference/comparison; Director's eye decides if it can serve as the cottages state.
- **Defence chain — linear, all 6 defended states** (W-09 fix):
  `stone → +palisade (pal|none) → swap palisade→stone wall (wall|none)`; then two short tower branches, 2 edits each: `pal|none → +2 wood towers (pal|wood+wood) → swap towers material stone (pal|stone+stone)` and `wall|none → +2 wood towers (wall|wood+wood) → swap towers material stone (wall|stone+stone)` — symmetric pairs only; asymmetric slot states (`wood+none`, `wood+stone`) are schema-legal but generated only on Director ruling, via the same pattern.
  6 edits cover all 6 defended states with ZERO removal edits (removal is residue-prone — the pattern banned for meadow); every state is ≤2 edits from a shared accepted ancestor.
- **Fork reality:** Gemini cannot rewind — a "fork" = next step in the same chat (preferred) or a new chat with parent+base crops attached and "identical layout" instructed. Side-chat drift is larger; Gate B applies on every parent→child edge.
- Prompts + lineage in manifest (`gen.prompt`, `gen.parent`) for reproducibility.

### (d) Manifest schema v2: growth ladder + axes → states matrix

```json
{
  "version": 2,
  "zone": {"x":1450,"y":520,"w":300,"h":260, "feather":{"shape":"ellipse","px":24}},
  "growth": ["meadow","cottages","straw","stone"],
  "axes": {
    "defence": {"values":["none","palisade","wall"]},
    "towers":  {"slots":2, "each":["none","wood","stone"]}
  },
  "uiRules": {"towersRequireDefence": true},
  "registration": {"nullEditResidualPx": null, "layoutLockMaxPx": 2},
  "anchors": {"buildingClusters": "per-state list of {x,y}", "defenceRingSamples": 4},
  "plates": [
    {"key":"meadow|none|none+none","src":"fx/village/meadow.webp","shipped":true},
    {"key":"stone|wall|stone+stone","src":"fx/village/stone-wall-tstone2.webp","gen":{"parent":"stone|palisade|stone+stone","prompt":"..."},"shipped":true},
    {"key":"stone|palisade|wood+none","src":"fx/village/stone-palisade-twood1.webp","gen":{"parent":"stone|palisade|none+none","prompt":"..."},"shipped":false}
  ]
}
```

Zod: plate keys are `growth|defence|slot1+slot2` — slot identity is encoded, so per-slot states (`wood+none`, `wood+stone`) are schema-legal today. Validation runs over the DECLARED key space: no duplicate keys, no orphan plates, no undeclared axis values, plate size == zone, every defended-state plate declares its anchors. `shipped:false` marks schema-legal states not yet generated — the lab only surfaces shipped plates. `uiRules.towersRequireDefence` is lab-UI gating only (a Director rule change is not a data migration). Runtime resolves `key→src`. The lab derives pickers from the SHIPPED plate keys themselves (parse `growth|defence|slot1+slot2`), not from an axis cross-product — so per-slot states and future expansions surface with zero code change and no grammar ambiguity. Zero hardcoded lists.

## 4. Tasks

| id | description | output | depends |
|----|-------------|--------|---------|
| T1 | Manifest v2 schema + loader (Zod; anchors + uiRules) | schema + unit tests incl. ≥4 invalid fixtures | — |
| T2 | Zone reconciliation: delete stale zone literals (docs, lab footer) | grep gate: zero zone rects outside village.json | T1 |
| T3 | Builder Gate A: rigid registration to base + null-edit calibration + band residual + border color norm + feathered export | `build-village-layers.py` v2 + `reports/village-registration.json` | T1 |
| T4 | Builder Gate B: paired-anchor annotation + per-anchor displacement vs parent, shared ancestor, AND axis siblings (pal↔wall per tower-state; wood↔stone per wall) | `reports/village-layout-lock.json` | T3 |
| T5 | Runtime: state-driven `villageZoneOverlay.ts` — key resolve, cross-fade, element path removed, Canvas-safe | overlay + stub-manifest test | T1 |
| T6 | Lab UI derived from manifest (stage list, axis pickers, `uiRules` gating) | no hardcoded stage identifiers | T1,T5 |
| T7 | Meadow fresh → growth chain → stone (per-step Gate A+B + sign-off before chaining on) | 4 plates + reports | T3,T4 |
| T8 | Defence chain: pal|none → wall|none (swap) → 2 tower branches per wall (wood→stone), per-step sign-off | 6 defended plates (~10 total) | T7 |
| T9 | Director eye-check: all states + all sibling switches, zoom 0.5/1.0/1.6 + cross-fade pop-check at 0.18, desktop + 390×844 | signed-off checklist per state | T6,T8 |
| T10 | Remove `el-*.png`, `parts/` leftovers, dead element code | repo clean, tests green | T9 |

## 5. Acceptance Criteria

1. Exactly one zone rect in the repo (grep gate); builder, runtime, lab all read `village.json`.
2. Loader rejects: wrong-size plate, unreachable state, duplicate key, undeclared axis value, defended-state plate without anchors (≥5 failing tests).
3. **Gate A**: band residual below null-edit-calibrated threshold. **Gate B**: every anchor within `layoutLockMaxPx` of generation parent, shared ancestor (defended states), AND every runtime-adjacent shipped state — adjacency = pairs differing in exactly ONE axis value on a single slot (defence swap, per-slot tower swap, growth step), enumerated by the builder from the shipped key list so coverage cannot silently miss a switch. Tripwire semantics: failures hold for regeneration (K≤3) then explicit Director ruling — logged, never silent.
4. No ghost village, no off-centre ring, no floating tower — ANY state (eye-check, multiple zooms).
5. Cross-fade between consecutive states AND sibling defence switches reads as "same village grew/swapped" — no doubled houses mid-fade; stubborn pairs may ship with 300-400ms fade only by Director decision.
6. Lab selectors list exactly manifest growth/axes; adding a manifest value (with plate) appears with no code change.
7. Zone edge invisible at 0.5/1.0/1.6 zoom and 390×844 — Director eye-check required (0.18 covered by AC-5 pop-check).
8. `el-*.png` + element-toggle code removed; overlay sprite-only, Canvas-safe.
9. Reproducible build: builder reports sources, residuals, per-anchor drift, dimensions, failures; failed build cannot publish partial assets.
10. Production parity: `/game` shows the same approved compositions as `/mappa2-lab`.

## 6. Risks

| risk | mitigation |
|------|-----------|
| Anchors too weak on low-texture cottages | anchors are operator-annotated points (not auto-features): the human marks what the eye tracks; Gate B measures, doesn't discover |
| Gate B false-rejects valid plates | tripwire semantics: hold → K regenerations → Director ruling; calibrated on null-edit pair, not guessed |
| Sibling switches (palisade↔wall) drift apart | Gate B baseline 2: defended states locked to shared stone ancestor |
| Chain drift → layout jumps | linear chain; per-step sign-off; regenerate from nearest accepted predecessor |
| Cross-fade doubled houses | Gate B bounds drift; short-fade escape hatch by Director decision |
| Opaque plates hide animated layers beneath | zone overlaps static meadow only; re-check on /game |
| Pre-composited walls read "pasted" | same-chat lineage = same palette/light (proven on stage1) |
| Plate-count growth | v1 symmetric towers; expansion only by Director ruling |
| Authority drift returns | grep gate AC-1 + T2 |
| Meadow backwards leaves residue | meadow generated FRESH from base crop |
| Endless visual polish loop | acceptance gate upfront; conspicuous defects only |

## Final position

Keep the working runtime contract. Replace the broken compositing assumption.
Canonical placement + two-gate registration (frame + per-anchor layout vs parent AND shared ancestor) + complete opaque plates + validated manifest + manifest-driven lab + linear generation lineage covering all defended states. The Director's eye is the final arbiter; the gates bound what reaches it.
