# PLAN-052: Quest scene depth-staging authoring contract

**Status:** `draft` — v2, accepted as draft artifact by the 5-provider web
planner debate (run `mind-weaver/.mw/runs/20261022-plan052-v2-planner/`,
artifact-r007, sha256 `9b574c68…1d5`, converged 2026-10-22). **Not
baptized:** T-007 open pending Director raster ratification; v33/v34 intent
review outstanding.
**Desiderata:** v34 FROZEN (slice hash `e976ade0c1494f455b7d446e001f971a762b5d1f9b5d529c8d12d9948f44ce1d`)
**Richiesta:** R-222; extension of R-213 / PLAN-046, complementary to PLAN-050;
research intake R-263 / R-267
**Parent:** PLAN-046 (depth-parallax engine); PLAN-050 (Goblin showcase and juice)

**Version axes:** "v2" = this plan's revision; "v34" = the FROZEN desiderata
slice it maps to. "T-04" cited below is the recurring-trap id (Director
eye-check witness rule), not a plan task.

## Changelog

- **v2 (2026-10-22):** rewritten from the five-provider research bundle
  (`context/research/2026-10-22-animatable-scene-prompts/`, `synthesis.md`),
  then refined through a 7-round adversarial web planner debate
  (clarification → 5 debate/acceptance rounds → unanimous ACCEPT on
  artifact-r007). v1 contract items preserved and extended; v1 tasks
  T-001…T-005 carry forward with revised acceptance.
- **Debate deltas folded in:** calm zones bound per-overlay to the real
  `questAtmosphereFx` registry bands (universal percentages deleted — fog
  covers the lower half, not a strip); occluder demoted to heuristic with
  behavioral bake acceptance; life plan split (brief=intent, config=
  coordinates); ablation downgraded to pre-registered pilot with honest
  labels; validator scoped to field-presence; staged acceptance chain
  ending in overlay-enabled preview + Director eye; operational predicates
  where operation is claimed, honest Director-judgment where not.
- **Post-acceptance folds (pre-baptism hygiene, journaled):**
  disposition-footer wording, the T-005a calibration task, existential
  wording in the anchor predicate, FoR-T2I inline citation, calibration
  flag-rate note.
- **2026-10-23 (PLAN-080/R-272, pre-baptism hygiene):** new contract item
  10 — the fenced prompt block is a painterly kernel written per the R9
  rules in `scene_prompt_authoring_guide.md` (medium-first, register ban
  REG-CAM/REG-NUM, style floor, negation-bulk warn, no `<!-- AUTHOR:`
  markers); items 1–8 stay engineering, the prompt translates them into
  visual terms. Root cause: `f3-accampamento-dusk` v1 wrote §7 in brief
  register and lost the impasto style.
- **2026-10-23 (T-005a first empirical candidate):** `f3-accampamento-dusk`
  generated candidate scored against the bound rubric → three contract
  gaps found: (a) no scorecard criterion covered **generator artifacts**
  — a visible app-applied watermark survived every clause (`NO
  watermarks` in the prompt cannot remove a post-processing overlay);
  (b) staging clauses named zones but not **composition dynamics** —
  the candidate passed planes/anchors yet read flat: near-mirror
  symmetry despite `NO symmetry`, a single-shelf midground of same-size
  tents, no diagonal lead, no declared value ladder; (c) edge masses
  framed from outside instead of intruding into the frame. Amendments
  folded into clause 2 (composition dynamics sub-clauses) and clause 8
  (artifact veto, scored before all criteria). Flagship candidacy moved
  to `f3-gola-dusk`; accampamento-dusk retained as calibration record.
  Second empirical pass on the `gola-dusk` candidate (bake stage 2):
  funnel geometry confirmed in the map but walls bake as smooth
  gradients, not plateaus — parallax present yet soft; painted light
  shaft found (kill-list gap, folded into item 8); Director raised the
  missing **shot-grammar declaration** → new item 11, composition must
  declare the camera grammar it serves.

## Intent

Make every newly authored quest-phase image deliberately usable by the
existing single-image depth-map parallax renderer **and** by its
ambient-animation stack. Before generation, its art brief must name the
near/focal/far staging, one edge-anchored occluder — or an explicit
"no occluder" line with its reason — the FX anchors (sources for runtime
smoke / glow / embers / dust / fog), and the overlay-aware calm zones —
**with the reason for each choice**, so the brief survives future edits.

One coherent painted image; no separate generated layers, no depth-colored
image, no N-layer pipeline. Depth map derived from the image; motion stays
in-place pixel deformation (v34).

## Research grounding

Bundle: `context/research/2026-10-22-animatable-scene-prompts/` — five
reports (deepseek, grok, claude, gemini, chatgpt), verbatim, plus
`synthesis.md` (§numbers below refer to it). Labels: [V] verified ·
[V bench] external academic benchmark · [I] inference · [A] anecdotal ·
[H] hypothesis pending pilot.

- Depth estimators emit transition ramps at edges; thin objects crossing
  depth boundaries smear (synthesis §1; observed production failure R-213).
  **[V]**
- Named camera-space placement beats object-relative and abstract "depth"
  wording — external benchmark: "Can T2I Models Draw from the Right Frame
  of Reference?" (frame-of-reference T2I study, synthesis §5.1).
  **[V bench, external]**
- Negative syntax is generator-specific and global, not regional
  (synthesis §4). **[V docs]**
- Token order likely biases placement → layout clauses early. **[I]** —
  contract field order is a working convention, not a rule; the pilot may
  test it.
- Lens language is a look cue, not geometry control (synthesis §5). **[H]**
- Overlay registry bands (`questAtmosphereFx.ts`): fog-low [0.50,0.95],
  cloud-shadow [0.25,0.90] `blend:'multiply'`, cloud-sky [0.00,0.30],
  birds-far [0.05,0.22]. **[V repo]**

## Authoring contract (v2)

Clause order is a convention (token-order is an [I] hypothesis). Each brief
names:

1. **Beat and focal subject** — one focal feature; what the player reads
   first.
2. **Depth staging** — near / focal / far zones as *named visible masses*
   with scale + overlap + contrast cues (synthesis §2.1). Composition
   dynamics (T-005a calibration — accampamento-dusk passed staging yet
   read flat): the brief declares (a) one **diagonal lead** — a named
   path, stream, or edge entering from a frame edge and receding toward
   the focal subject; (b) a **staggered midground** — at least three
   distinct depth steps inside the focal zone, never a single parallel
   shelf of same-size elements; (c) a **value ladder** — declared tonal
   steps near→far; (d) **asymmetric balance** stated positively (which
   side carries the mass), not only a `NO symmetry` negation.
3. **Edge occluder (heuristic)** — one broad convex mass cropped by a frame
   edge, **or** an explicit "no occluder" line with the scene's reason
   (e.g. open vista). When present, for a left/right edge occluder:
   projected silhouette ~15–20% of frame width at its widest row
   *measured on the painted image* (T-005 stage 0), so that ≥7% of source
   width remains visible inside the 2.05-aspect safe window. Crop math:
   the 2.05 window inside a 2.4 raster trims ≈7.3% of source width per
   side, so a raw occluder keeps (raw − 7.3%) inside the window —
   15% → ≈7.7% (passes), 10% → ≈2.7% (fails); hence the 15% floor.
   Assumes a centered 2.05 crop and the occluder on the trimmed side;
   asymmetric routes recompute per side. For top/bottom edge occluders the
   analogous rule is declared in the template. On one depth plateau; clear
   of the focal opening. Do not rely on fences, poles, lattices, or twig
   networks as the sole occluder. Acceptance is behavioral at the bake
   (T-005 stages 2–3), not geometric at the brief.
4. **FX anchors (sources only)** — 1–2 small painted sources (legible at
   thumbnail; <5% height is guidance), each on a single depth plateau —
   not straddling a silhouette edge or depth boundary (the actual
   ramp-smear mechanism, synthesis §3). "Against solid backing" is a
   legibility aid, not a runtime constraint. Plateau membership is
   verified on the baked map at T-005 stage 2.
5. **Overlay-aware calm zones (per enabled overlay)** — for each overlay
   enabled on this scene, the brief marks its registry band; the exclusion
   column of that row applies to the painted region under it. A calm zone
   is **not** empty: recognizable broad masses are fine. Disabled overlays
   impose no constraint. Exclusions are per-overlay, never global. The
   table is normative for *what* is excluded; review-time predicates are
   Director judgments scored in the T-005 rubric — the lint does not check
   them (field-presence only).

   | Overlay | Band (y) | Excluded painted content inside band |
   |---|---|---|
   | fog-low | [0.50, 0.95] | focal subject, FX anchors, hard directional edges, fine high-frequency relief |
   | cloud-shadow | [0.25, 0.90] | thin hard-edged objects; near-black areas — blend is `multiply` (verified `questAtmosphereFx.ts`); Director judgment: band-region mean luminance above the scene's midtone |
   | cloud-sky | [0.00, 0.30] | painted cloud shapes, hard edges |
   | birds-far | [0.05, 0.22] | bird-like marks, branch tips entering the band |

   Focal-subject exception for fog-low only: a named, reasoned exception
   recorded in the brief and accepted by the Director. A per-scene fog
   opacity cap is a runtime option **only if** T-001 verifies the registry
   supports it; otherwise out of scope (v34.item-4).
6. **Life plan** — per-scene authored table in the brief: painted source →
   declared effect id → target region (quadrant/third) → why. Effect ids
   are declared in the brief and must exist in the FX registry
   (lint-checkable); config references declared ids only; measured
   coordinates are written to config at bake review and config stays
   authoritative for them. The brief is never **silently** edited to match
   measured output — *material* changes to approved intent (any change to
   effect id, anchor position, focal subject, or enabled overlays; other
   edits are immaterial by definition; disputes resolved by Director)
   require a reviewed brief revision; config values are checked against
   the currently approved brief. At T-003 wiring, the validator may
   extract a per-quest manifest mechanically.
7. **Value and atmosphere plan** — applies when the scene names ≥1
   atmospheric element (haze, ray, dust column); then atmospheric
   perspective is painted only on the far plane. No universal
   near-dark/far-blue rule (OB-3).
8. **Risk notes / what not to paint** — thin cross-depth geometry (>3
   depth levels), painted dynamic FX **including light shafts / god rays
   / visible light beams** (runtime owns `shaft` since R-271 — the
   gola-dusk candidate painted the beam and it will smear where it
   crosses the wall/sky depth boundary; kill list must name it), per-row
   band exclusions per item 5,
   multiple competing light sources (synthesis §7). **Artifact veto
   (T-005a):** any visible generator artifact — watermark, logo, text,
   UI remnant — anywhere in the frame is a scorecard veto scored before
   all other criteria; app-applied marks cannot be prompted away, so each
   candidate declares its remedy (regenerate via a watermark-free route,
   or post-removal) as part of stage-1 review.
9. **Generator routing** — production path: Gemini/Nano Banana web UI
   (positive restatement for exclusions; no negative field). Other
   generators get a routing entry when adopted (synthesis §4); one
   negative string is never reused across generators.
10. **Full prompt = painterly kernel (R-272/PLAN-080)** — the fenced prompt
    block of each brief's `prompt.md` is written in painterly register,
    never in engineering register: items 1–8 carry the engineering
    (depth planes, FX anchors, calm zones, coordinates, percentages);
    inside the prompt every technical constraint is translated into visual
    terms per the translation table in
    `art-direction/scene_prompt_authoring_guide.md` R9 (edge occluder →
    "broad saturated mass in <bible pigment> anchored at the frame edge";
    calm zone → "low-frequency painted area"; FX anchor → painted light
    source only, particles never painted). The block MUST pass
    `lint-scene-prompts.py` checks Q13–Q17 (medium-first, register ban
    REG-CAM/REG-NUM, style floor, negation bulk warn, no leftover
    `<!-- AUTHOR:` markers). Pipeline logistics live in the brief fields
    and generation notes — never inside the prompt text.
11. **Shot grammar (T-005a, Director 2026-10-23)** — the brief declares
    the camera grammar the composition is authored for: `camera`
    (primary shot for the beat), `entrance` (arrival personality),
    `pose` (hold stance), and the narrative focal point as a target
    region — ids must exist in `CameraShotIdSchema`
    (`questTheatreFx.ts`), lint-checkable by name. The declaration
    states *how the composition serves each declared shot* (funnel +
    central target for `push-in`/`enter-creep`; edge occluder on the
    swept side for `pan-lateral`; focal that survives the entrance
    offset for `enter-*`), and names shots the composition does *not*
    serve. A composition that contradicts its declared grammar is a
    scorecard criterion at stage 1. Measured focal coordinates land in
    `sceneManifest` config at wiring and stay authoritative there —
    same intent/authority split as item 6.

## Production raster

Canonical production raster: **3168×1320 (2.4:1)**, pending Director
ratification — T-007 stays open until ratified. Prompts request 2.4:1 or
the nearest generator-supported ratio and declare the intended route
(center-crop vs regenerate) so safe-area is evaluated on the final frame;
"21:9" is retired from prompts and docs (informal descriptor only).
Runtime `viewAspectRange [2.05, 2.45]` is a compatibility bound, not the
authoring target. Safe-area rule: focal subject and FX anchors sit inside
the central 2.05-aspect window; the edge occluder is exempt (cropped by
the frame edge by design) but must retain ≥7% visible width inside the
window.

## Enforcement

Contract is enforced at the brief-doc gate by the validator. T-001's audit
chooses the *mechanism* (existing entry point vs new brief path + lint);
it cannot dissolve the obligation. The validator checks **field presence,
schema completeness, and registry-id existence only** — every semantic
claim in this contract is a Director-review point at the named T-005
stage, not a lint target.

## Tasks

| ID | Task | Acceptance |
|---|---|---|
| T-001 | Audit authoring/generation paths; choose enforcement mechanism; verify whether the registry supports per-scene fog opacity (cloud-shadow blend already verified `multiply` in `questAtmosphereFx.ts`). | Workflow map + chosen gate; registry facts recorded; OB-4 stands regardless. |
| T-002 | Publish the v2 brief template (fields 1–9, life-plan table, calm-zone table, bound scorecard rubric). | All 9 fields present; scorecard rubric written with "bands" and "parallax risk" criteria rebased on the per-overlay table (no criterion counted twice); clause library references synthesis.md. T-002 may publish before T-001 closes — the fog-opacity option stays unavailable until T-001 records support. |
| T-003 | Wire the contract at the chosen gate; deterministic field-presence lint + registry-id checks; mechanical manifest extraction from briefs. | Missing anchor/staging/zones/life-plan rejected; non-quest paths unchanged; lint claims no semantic checks. |
| T-004 | Text-only examples across distinct dramatic functions using the v2 brief. | ≥3 examples, different diegetic anchors and life plans; validator positive/missing-field tests pass. |
| T-005 | Bake-review staged acceptance chain: **stage 0** raster/crop + safe-area check on the 2.05 window (geometric); **stage 1** scorecard ≥15/20, veto-first on bound rubric; **stage 2** depth-bake *measurements* — every measurement recorded with its value: (a) occluder boundary: record ramp width and depth step on the baked map (measurement only — the smear verdict is stage 3); (b) anchor plateau: anchor footprint = the anchor's painted region mapped onto the baked map; depth range = max−min over valid pixels in the footprint, normalized to the map's observed dynamic range; gradient = Sobel-magnitude percentile over all map pixels; provisional screening rule: flag for Director reject-review if depth range in the footprint exceeds 10% of dynamic range, or if **there exists** any valid pixel inside the footprint whose 3×3 neighborhood **mean** Sobel magnitude exceeds the global 90th-percentile Sobel magnitude (border pixels use interior neighborhoods; invalid/masked pixels excluded from both populations; aggregation amendable by the T-005a calibration, which records what it used — until then a flag-for-review heuristic, not an auto-reject); **stage 3** max-amplitude parallax preview (≤1.2% width): no visible tear/leakage/focal obstruction, **and** the occluder smear verdict — measured as visible smear width (px at source resolution) along the occluder boundary in the preview capture; Director judgment against the T-005a calibration, provisional yardstick ≈2× effective bake blur at source res, where effective blur = `bake.blurRadius` × (upscale 2 when `bake.half`) = 1.5 × 2 = 3 px → yardstick ≈6 px at 3168 wide (recompute if constants change; overscan is not a smear criterion; displacement beyond the blur kernel is where a ramp reads as visible smear); **stage 4** overlay-enabled preview with the scene's actual overlays: calm-zone rubric applied; **stage 5** Director eye-check (trap T-04). Record first failing stage + reason. A veto waived only with a written reason in the review record. | Chain implemented; predicates recorded per stage; failed candidate names its stage. |
| T-005a | **Pre-pilot calibration:** run T-005 stage-2 measurements + stage-3 preview captures on a small set of already-approved quest scenes; record occluder smear widths, anchor depth-range values, and the stage-2(b) flag rate (a flag on nearly every candidate means the predicate does not discriminate — loosen, e.g. to a footprint-pixel fraction); set the provisional thresholds from the observed distribution; record the aggregation choice used. | Calibration record in `context/research/2026-10-22-animatable-scene-prompts/`; T-006 blocked until this record exists. |
| T-006 | **Pilot ablation** (pre-registered): 3 arms (A abstract / B named planes / C named + scale/contrast/overlay-interaction), N_min=5, N_max=8 candidates per arm on one scene (forest ambush). Pairing = same brief, only the arm clause set differs; no seed pairing claimed. Not blinded — Director knows arms; expectancy bias mitigated by second-scene replication and failure taxonomy. A candidate "passes" iff it clears the full T-005 chain — no weaker proxy; if full-chain scoring is infeasible at N=15, the pilot is *blocked*, not weakened. Per-output fields: arm, prompt text, raster, scorecard subscores, occluder smear width, anchor depth range, luminance variance per enabled band, failure class (brief / generation / bake / runtime-interaction / Director-reject). | Results logged in the research bundle; labels capped at `pilot-supported`/`pilot-contradicted`; promotion requires same-direction replication on a second scene. |
| T-007 | Raster ratification: Director confirms 3168×1320 (2.4:1) canonical; template records the declared route (center-crop vs regenerate); purge "21:9" from prompt defaults; adjust `check:quest-art` raster expectation if present. | Contract, template, and review frame agree; runtime viewAspectRange untouched. |

## Closure contract

- **OB-1** Brief requires all 9 contract fields incl. life plan with
  reasons.
- **OB-2** Single coherent painting; rejects layered generation,
  depth-color encoding, painted dynamic FX, occluders failing the T-005
  stage-2/3 predicates, and — per enabled overlay — content listed as
  excluded in that overlay's §5 row.
- **OB-3** Conditional value guidance; no fixed RGB / universal near-far
  rule.
- **OB-4** Pre-generation gate rejects incomplete briefs; mechanism chosen
  by T-001, obligation unconditional.
- **OB-5** Examples cover distinct functions and life plans; validator
  tests pass.
- **OB-6** Image acceptance = the full T-005 chain (raster/safe-area →
  scorecard veto-first → bake predicates → parallax preview →
  overlay-enabled preview → Director eye). Metrics alone cannot close a
  visual claim (trap T-04).
- **OB-7** Beat-camera ownership (`questTheatreFx`) and cutout policy
  (Director-selected manual exception) unchanged.
- **OB-8** Pilot results recorded; [H] labels become at most
  `pilot-supported`/`pilot-contradicted` — never silently promoted.
- **Expected checks:** governance-docs surface; validator tests; scoped
  lint; `npm run build:check`; `npm run closure:lint`.

## Plan disposition draft (v34)

| Slice item | Proposed disposition | Obligation |
|---|---|---|
| v34.item-1 — systematic cinematic quality | task | OB-1 |
| v34.item-2 — depth-map parallax in-place | task | OB-1, OB-6 |
| v34.item-3 — beat-directed camera | gate: preserve `questTheatreFx` ownership | OB-7 |
| v34.item-4 — separable atmospheric overlays | task: painting reserves low-frequency-safe space where overlays run; overlays never painted | OB-2 |
| v34.item-5 — Director-selected manual hero cutouts | gate: not promoted to a generation path | OB-7 |
| v34.item-6 — exclusions (N-layer / layered-by-prompt / video) | gate | OB-2 |

Provisional mapping. Accepted as draft artifact by the planner debate
(5/5); **not baptized** — T-007 open (Director raster ratification),
v33/v34 intent review outstanding.

## Run-journal pointer

Planner debate run: `mind-weaver/.mw/runs/20261022-plan052-v2-planner/` —
rounds, objections, dispositions, self-check, and the five acceptances are
journaled in `events.jsonl`; accepted artifact text:
`artifact-r007.md` (sha256 `9b574c68e66794d9f4d0208ac8021d30b4f0506444e793e48f6f8f378e8301d5`).
Provenance only; all rulings live in the body above.

## Amendment 2026-10-24 — archetype vocabulary (broadcast research)

Il contratto descrive la MECCANICA del parallasse, non la FORMULA
compositiva: la convergenza spontanea verso un solo scheletro
(coulisse-pair + lead diagonale) è il "Default Framing Trap"
(gemini). Ogni brief dichiara ora:

- **`archetype`**: id dalla tassonomia a 12 voci in
  `context/research/2026-10-24-composition-archetypes/synthesis.md`
  (COULISSE, SHOULDER, VISTA, CANOPY, ARCH, MONOLITH, CASCADE,
  ISLAND, VOID, CHOKE, GRID, TABLEAUX) — con geometric rule, mood,
  knobs, shot servito e rischi parallax per archetipo.
- **Sequencing**: le 8 regole anti-monotonia (nessun adiacente uguale,
  ritmo chiuso/aperto, rotazione bordo/occluder/orizzonte/mossa,
  escalation far-zone, flag lattice al brief) valgono a livello
  indice scene — la mappa archetipi per quest si tiene in
  `scenes.md` della spec.
- Provenienza media documentata: repoussoir/coulisse (pittura),
  dirty foreground (cinema), vue sur l'angle Bibiena, Cullen serial
  vision, manga splash/tight, scenografia (wing flats), Hudson River
  detail-islands, poster negative space.

### item 12 — interaction hooks (2026-10-24, PLAN-084)

Ogni brief dichiara anche gli `interaction hooks` della scena (catalogo
`src/docs/docs/art-direction/scene_interaction_affordances.md`): cosa il
player può cliccare/scoprire e cosa il prompt deve dipingere per
supportarlo (segreto leggibile-ma-camuffato; mai hotspot su vuoto).
