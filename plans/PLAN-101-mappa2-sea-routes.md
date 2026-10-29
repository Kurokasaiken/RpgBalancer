---
title: PLAN-101 — `mappa2` Sea Routes & Ambient Sea-Life (ships+wakes, slice 2)
status: candidate — da battezzare Director (dibattito chiuso in decision_memo per cap round; consenso sostanziale sull'artifact)
owner: agente locale
created: 2026-10-29
source_request: R-291 (vettore sea-routes via dibattito multi-AI web, richiesta Director 2026-10-29)
parent: PLAN-089 (T-009); sibling PLAN-094 (AmbientDirector+shoal, schema rotte v0 consumato)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (vettore avanzamento/esito)
  - test-results/plan-101-mappa2-sea-routes/ (evidence)
---

# PLAN-101 — Sea Routes & Ambient Sea-Life su `/mappa2-lab`

## Provenance

Dibattito multi-AI web `mind-weaver/.mw/runs/20261029-mappa2-sea-routes/`:
chiuso come **DECISION_MEMO** — cap meccanico MAX_ROUNDS=10 raggiunto prima
della ri-acceptance su artifact-r010. Consenso sostanziale: ACCEPT lineage
r005–r009 da claude/gemini/deepseek; chatgpt ha condotto audit seriale
(8 OBJECT, tutti gap reali, tutti emendati in r010); grok escluso
(provider_dead, come run precedenti). Artifact finale:
`artifact-r010.md`, sha256 `e3d8f6cfb7b0e2bc…` (vedi state.json per hash
completo); `decision_memo.md` nella run per status provider e dissenso.
Handoff originale: `.mw/runs/handoff-mappa2-sea-routes-ambient-sea-life-20261028.md`
(si autointitolava «PLAN-094» — numero poi preso dall'AmbientDirector).
Nota numerazione: fish/flecks dettagliati restano tagliati con gate di
riammissione falsificabile (come da dibattito AmbientDirector).

## Testo del piano (artifact-r010, verbatim)

# Artifact r010 — `mappa2` Sea Routes & Ambient Sea-Life (slice 2, PLAN-089 T-009)

Implementation plan for persistent ships on authored sea routes + wakes in
`/mappa2-lab` (PixiJS v8.22, WebGL + Canvas fallback). Mediated synthesis
of R1 proposals, amended by R2 adversarial findings (W-01..W-20).
Falsifiers kept per decision.

## Canonical answers to R2 witnesses (orchestrator, repo-verified)

- **W1 confluences:** `secondary-water.json` confluences `central_bend_lower`
  (1384,862) and `estuary` (1472,970) are INSIDE sea_mask (coast dist 7/25px).
  "Confluences are inland" = FALSE → explicit gate adopted.
- **W2 foam extent:** foam_mask pixels all live within 31px of coast
  (max coast_distance=31). With v0 clearance ≥40px default, corridor never
  reaches outermost foam; 8px dilation is conservative, not weak.
- **W3 sea anchors:** the 14 `sea` points are auto-scattered sampling hints
  (confidence 0.004, source auto) BUT they coincide with the `wonder`
  placements — active FX points on water → disc gate adopted on wonders,
  not on anchors.
- **W4 Canvas:** pixi.js@8.22.0 ships `renderers/canvas` in dist → boot is
  expected to work; must still be verified at implementation, with static
  Canvas-safety fallback if not.
- **W5 feasibility:** feasible mask (sea ∧ coast≥62) has one dominant
  connected component of 1.09M px covering the open sea + west archipelago
  channel → 3-route inventory is credible; exact corridors remain a
  step-1 output.

## D1 — Ships = controlled persistent family, OUTSIDE the director

New module `ambient/seaTraffic.ts`. Zero edits to `ambientDirector.ts`,
`occupancyRegistry`, Admission log. (unanimous)

## D2 — Stateless pure function + explicit time discipline

`shipState(seed, routeId, slotIndex, simMs) → {s, dir, alpha, headingBin,
tangentDeg, bobPhase, rollPhase}` — the reference pure implementation for
tests. Production path writes into preallocated per-ship records (zero
alloc contract is real, not aspirational — W-24).

Time domain: own `simMs` accumulator fed by the same ticker deltaMs —
NOT `simT*100` (director discards ticks under load). Discipline (W-01):
per-frame delta CLAMPED to ≤100ms (a hiccup slows ships, never teleports
them); accumulator halts with lab pause; `reset()`/`setSimMs(t)` exist and
are called from the same lab path that drives director replay/seed change.
Replay claim, stated honestly (W-21): identical ship state given same
seed + same scripted delta sequence. CANONICAL REPLAY: benchmark
scenarios drive a fixed 100ms/frame delta stream — under it ships and
the scheduler replay identically and jointly, satisfying the
replayable-scenario contract. Live runs with arbitrary deltas are
deterministic per-sequence (scripted-delta test) — the same guarantee
class as every uTime-driven effect on the map (water, clouds), stated
explicitly instead of claimed as scheduler-equivalent. Tick-driven
authoritative motion was rejected: the director DISCARDS ticks under
load, so tick·100 would make ships run slow — a worse defect than the
documented exception.

Position math: linear unclamped cycle coordinate `p` (arc px traveled);
ship drawn at `fold(p)` (clamp for oneWay, reflect for outAndBack). All
hashed-path values are integer/exact ops — trig allowed only for cosmetic
bob/roll, whose phases are QUANTIZED to integer degrees from
`hash01(seed,route,ship,k)` (W-03, W-25) — deterministic to the ulp.

## D3 — Replay evidence, actually proven (W-15)

- PBT scrub-order: `shipState(t2 after t1) ≡ shipState(t2 fresh)` for
  10⁴ random pairs/route, all fields.
- Frame-strip hash: full float state hashed every 100ms simMs across the
  shortest route period — not 4 quantized checkpoints.
- Mutation test: inject a mutable field → the property test MUST fail.
- Runtime-layer test: scripted deltas (16ms, 33ms, 400ms spike, reset
  mid-run) → rendered sprite-pool state ≡ pure function at same simMs.
- e2e: `__seaTraffic.snapshot()` + `setSimMs` probe.

## D4 — Route data: v0 frozen, behavior sidecar

Baked polylines → `ambient-director.json` `routes[]` (sibling's reserved
slot; leaf `routes.max(0)` bumped — sibling suite re-run, W-09).
Behavior → new `sea-traffic.json`, strict Zod, keyed by routeId:

```
{routeId, mode:"outAndBack"|"oneWay" (no "loop" v1), ships:1..3 def 1,
 kind:"sloop"|"skiff", speedPxPerS:8..24 def 14,
 speedJitter:0..0.15 def 0 (forced 0 if ships>1),
 dwellMs:4000..12000 def 7000, wakeStrength:0..1 def 0.6}
```

fadePx/wakeLenPx REMOVED as fields (W-11): fade derived from the route's
v0 `endpointSlackPx`; wake metrics are global constants.
superRefine: ships>1 ⇒ oneWay ∧ jitter=0; spacingPx ≥140; Σships ≤6,
4 shipped; phase `(k + h·spread)/ships` with spread=1 when ships==1
(fixes clustering, W-20); `dwellMs·speedPxPerS/1000 ≥ 92` (=84 wake span + 8 streak
tail — W-22: defaults must pass, arithmetic checked).

## D5 — Authoring: hand-first, snapper deferred (W-06)

Step order: intent waypoints hand-authored in source px → validate →
mandatory preview. The A* snapper is built ONLY if baked polylines fail
twice honestly. If built: cost field ∝ 1/(d−clearance) on coast_px EDT
(channel-center preference, not shortest-path coast-hugging); feasible
mask pre-eroded by fillet sagitta; full re-validation post-smoothing;
deterministic tie-break; explicit no-path failure.

Mandatory `debug/sea-routes-preview.webp`: painting + corridors + REAL
atlas sprites composited at ghost positions every 120px + exclusion
bands tinted + failures red (W-10: the art risk surfaces at first
Director look, not after runtime). Plus `debug/sea-routes-geometry.json`.

**Director mid-plan gate (W-10):** between authoring and runtime — the
preview (100% crops per route) is approved or the route is DROPPED, not
patched. Masks miss painted objects (reefs, painted ships, wonder FX);
the eye-check covers what no gate can.

## D6 — Offline gates (raster-AND, footprint-derived constants)

`validate_route_exclusions()` runs ONLY under `--check-routes` (or when
routes[] non-empty) — never breaks the shared build for other plans
(W-09). Corridor rasterized at 1:1, AND vs dilated forbidden masks,
`intersect_px == 0`.

Shared constants `seaTrafficConstants.json` (Python+TS read it):
`HULL_HALF_BEAM`, `WAKE_LAT_MAX`, `SPRITE_UP_PX`, `SHIP_SCALE_MAX=1.25`,
`WONDER_DISC_PX` (per-wonder configured extent, default 80),
`CONFLUENCE_DISC_PX=64`. Gate: `widthPx ≥ widthPx_min =
2·(max(HULL_HALF_BEAM, WAKE_LAT_MAX+streakHalfW)·SHIP_SCALE_MAX + margin)`
— no convention-only 44 (W-07).

HARD gates: foam dilated 8 (foam≤31px coast, verified); waterfall masks
dilated 24; river corridors dilated 30; river mouths 90px discs;
**confluences 64px discs** (W-16 sustained); **wonder placements,
per-wonder disc** (W-3 verified); route↔route NO crossings AND no shared
endpoints in v1; min length `≥ ships·140 + 2·endpointSlackPx`;
**time-overlap simulation**: pure shipState sampled over the full cycle
for every ship pair — min center distance > hull length, else build
fails (W-04). seaMarks: marks geometry exported to checked-in JSON
(shared input) → hard gate in Python too (W-08).
WARNINGS: shallow>0.5 over >35%; within 400px of rare zone; >60% steep
tangent; isolated marks inside corridor+16px.

## D7 — Atlas: procedural, baked headings (W-03, W-16, W-18)

`fx/ambient-ships.webp` 384×256: 2 kinds × 5 heading bins
(E,NE-away,N-away,SE-toward,S-toward; west via scale.x=−1) + 1 wake row
(2 streak variants 48×16). Hull tiles 48×48 + 2px padding, exact layout
+ metadata JSON emitted by the generator. Procedural PIL low-poly
orthographic, palette sampled from nave-pirata1, **lighting-neutral**
(mirror flips painted light — W-18; optional west-lit variant only if
Director flags in OB-5). Hull 36–44px.

**Heading is baked offline**: Python emits per-route run-length table
`[(arcStart, bin)]` (hysteresis applied along the arc at bake time) +
pre-smoothed tangent table. Runtime = lookup+lerp only: no atan2, no
hysteresis state, nothing stateful on the hashed path (W-03).
OB-4 includes a forced-turn capture proving no mirror-boundary flicker.

## D8 — Ends: dwell + alpha=0 reversal, strengthened test (W-02)

alpha = smoothstep(0, endpointSlackPx, dEnd); 0 during dwell; reversals
and oneWay respawn ONLY at alpha=0. The no-teleport guarantee is
STRUCTURAL, not sample-based (W-24/W-25): position and alpha are
continuous functions of arc s everywhere EXCEPT one point — the
cycle-boundary arc wrap (s: L→0 for oneWay, the direction reversal for
outAndBack). That single discontinuity occurs strictly inside dwell,
where alpha≡0 — so no visible frame can ever contain a position jump.
The property test checks that invariant, it does not constitute it. oneWay respawn is pinned: after dwell
the ship reappears at s=0 (the start terminus) exactly — never mid-route,
never inside the fade band (W-23). No-teleport test (strengthened):
bounded displacement OR (alpha<0.01 at both samples AND post-dwell
reappearance at s≡0 within 1px); per-sprite |Δalpha| bounded per Δ;
`dwellMs·speedPxPerS/1000 ≥ 92` enforced by Zod. `endMode:"occluded"` offered ONLY
where a gate proves canopy_mask coverage at the endpoint (W-11) —
verified in pre-flight, else not offered.

## D9 — Wake: stateless slots on cycle coordinate (W-05)

6 slots × 2 streaks (port/starboard with lateral offset
`lat(age)=2+8·ageFrac` — NOT bare ±18° which yields 27px spread over
the corridor). Positions: each slot's world position is `fold(emission_arc)` — the
polyline point the stern occupied at emission arc on the UNBOUNDED cycle
coordinate p, frozen at emission and never remapped (W-26). "Behind" is
defined as `emission_arc < p_stern` in travel coordinate, so on the
return leg new slots always trail: fold is applied to the emission arc
at emission time, not to the slot afterwards. Emission is gated on visibility: new slots are
emitted only while shipAlpha > 0.01 — the virtual dwell advance is an
AGING clock, never an emission source, so no slot can be created in the
fold-ahead region while the hull is invisible (W-27). Slots keep ageing
through dwell and reversal (no ghost puffs, no negative arc); since
reversal occurs inside dwell at alpha≡0 and dwell·speed ≥ 92 covers the
whole wake span plus streak tail, every pre-reversal streak has aged to
alpha 0 before the hull turns — enforced by the hard Zod constraint, so
a violating config cannot load. Explicit invariant (W-28/W-29): slots are anchored to the arc lattice —
emission_arc ≡ k·14, no hidden per-slot state; extinction requires
p_stern − emission_arc ≥ 84; the freshest possible slot has
emission_arc < p_stern at dwell start, so virtual advance Δ ≥ 92
(≥ 84 + 8 tail) makes ageFrac > 1 for EVERY emitted slot → alpha ≡ 0
before any reversal or wrap. Proof obligation closed at the schema
level, not just narrated. ageFrac = (p_stern − k·14)/84; alpha envelope
`smoothstep(0,0.15,a)·(1−a)^1.5·wakeStrength·shipAlpha`; width ×1→×2.4.
`wakeLen` slider scales streak sprite WIDTH ×0.5–1.5 (visual
only — W-30): aging uses the fixed 84px span unconditionally, so the
extinction invariant holds at every slider value; slots never
reposition (W-05 fix). Slot alpha =0 whenever shipAlpha<0.01 (test).
Wake driven by the SAME shipState call — one evaluation per ship per
frame, no drift (W-05/F5). NORMAL blend only, ≤0.35, 0xE8F4F6 — Canvas
and WebGL identical; no additive.
Falsifier: OB-4 wake-vs-water luminance Δ < 0.06 → raise tint, still NORMAL.

## D10 — Z-order (W-17, sustained)

`… shoal < ambientShipLayer (wakes+ships, single container) < coastFoam
< seaMarks < clouds+shadows < canopy/foreground < night wash`.
Ships BELOW coastFoam: painted depth authority wins on residual overlap;
gates make overlap impossible anyway, under-foam is the conservative
correct side. One container — no per-ship z exceptions.

## D11 — Reduced motion: HIDDEN (W-22)

Layer hidden, matching shoal convention. The static-frozen fallback is
dropped from the contract (unapproved third state); if the Director
wants static ships it becomes a separately approved deterministic
composition — not a silent option.

## D12 — Fish: CUT (rationale corrected, W-23)

Cut on scope + credibility (≥4–5 source px per fleck at fit-zoom =
noise), NOT on "stateful = nondeterministic" (deterministic boids are
admissible in principle). Re-admission (new slice): measured ≥2.0
display px at the declared fit-camera fixture; blind A/B vs shoal ≥4/5;
replay contract passed (stateful allowed if deterministic); +1 draw call
≤64 sprites. Re-open trigger: Director calls the sea "empty" at OB-5.

## D13 — Lab controls (W-19)

Foldable "Sea traffic" in Water tab; presentation only: alpha 0–1,
shipScale 0.8–1.25 (cap = SHIP_SCALE_MAX), wakeStrength 0–1, wakeLen
0.5–1.5 (envelope only), bob 0–2, maxShips `0..shipsInLoadedRoutes`
(recomputed from sea-traffic.json; 0 skips layer mount entirely; change
applies a 300ms cosmetic alpha ramp — no pop). Speed is NOT a slider
(phase-rebase only if Director demands).

## D14 — Perf budget, measurable (W-12)

≤+2 draw calls (one shared atlas, plain Container + manual batch —
ParticleContainer rejected pending Canvas-safety evidence). Sprites:
hulls 4 + wakes 48 = **52 default**, ≤**78 max** (arithmetic corrected,
W-26). `seaTrafficLayer.update()` self-time instrumented:
mean ≤0.15ms, p99 ≤0.4ms over 600 frames; on/off A/B ≥5 interleaved
runs, median delta, stated tolerance; sprite-transform writes/frame as
second metric. Atlas ≤120KB; sea-traffic.json+routes ≤20KB. Lever
hierarchy on breach: wakeLen → ship count → atlas complexity.

## Integration seams (flagged, no commits — T-13)

New files only + minimal touches: `PixiWorldMap.tsx` mount+update between
ambientSeaLayer and coastFoam (~8 lines) + `rendererPreference` PROP
plumbed from mappa2-lab (production default webgl unchanged — W-14);
`mappa2-lab.tsx` 1 JSX + optional `?freeze=<ms>`/`?renderer=canvas` lab
params (W-13/14); manifest Zod leaf `seaTraffic` + `routes.max` bump;
conditional 1-line seed accessor in ambientDirector.ts ONLY if no read
path exists (listed seam — deepseek N5). Canvas boot verified at
implementation; if pinned v8 fails → OB-2 = static Canvas-safety
assertion (NORMAL-only, no filters/meshes/ParticleContainer/shaders).

## Route inventory (input, not output — W-5 verified feasible)

| route | mode | ships | kind |
|---|---|---|---|
| west archipelago | oneWay | 2 | sloop |
| coast-island channel | outAndBack | 1 | skiff |
| open-sea pass | oneWay | 1 | sloop |

Any corridor failing gates after honest revision is dropped, never
gate-weakened.

## Contract

- **OB-1 unit:** PBT scrub-order 10⁴; frame-strip hash + mutation test;
  scripted-delta runtime equivalence; baked-heading lookup test (bin ≡
  Python table @1000 samples); no-teleport strengthened; wake
  dwell-suppression; Zod superRefine; seaMarks clearance (shared JSON);
  `scripts/tests/test_sea_routes.py` ≥8 adversarial fixtures incl.
  confluence-in-tidal-reach and shared-corridor-overlap; `--check-routes`
  exit 0; sibling `test_ambient_director.py` still green post-bump.
- **OB-2 e2e (R-247):** `mappa2-sea-traffic.spec.ts` WebGL + Canvas
  (prop override); `__seaTraffic.snapshot()`/`setSimMs` probe;
  reduced-motion → 0 sprites; no console errors; /game unchanged.
- **OB-3 safeguards:** lint scope, build:check, closure:lint,
  `--check-routes` exit 0.
- **OB-4 evidence** `test-results/plan-NNN-sea-traffic/`:
  sea-routes-preview.webp (+geometry.json); real-atlas crops per route @
  ticks {0,T/4,T/2,near-end} zoom 0.45+1.0; motion-diff pairs Δ5s+Δ30s;
  on/off diff under `?freeze` pin (all time sources frozen);
  reduced-motion + Canvas captures; forced-turn heading-boundary
  capture; wake luminance Δ≥0.06; self-eval (present only satisfying).
- **OB-5 human-eye:** Director mid-plan gate on preview (W-10) + final
  decomposed judgments (ship identity at recorded fit zoom, wake
  legibility, route composition, occlusion, endpoint continuity,
  reduced-motion, "sea not empty" fish trigger) — each camera/seed
  recorded per crop.
- **OB-6:** verification.json → verify:bundle → bundle.json.

## Execution order

0. Freeze `seaTrafficConstants.json` (footprint truth).
1. Atlas generation (real sprites needed by preview) + authoring intent
   waypoints → baked routes → all gates → preview.
   **Director mid-gate on preview.**
2. sea-traffic.json + Zod + pure shipState + tests.
3. Layer + wake slots + controls + freeze/renderer params.
4. OB-1..4 → OB-5 → OB-6.

Stop conditions: corridor infeasible after honest revision → drop route;
shared-file touch grows → flag PLAN-094 owner; Canvas boot fails →
fallback OB-2 path documented.
