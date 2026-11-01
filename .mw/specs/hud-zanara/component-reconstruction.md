# HUD Asset Reconstruction Protocol — r002 (converged)

Project-wide protocol: approved AI HUD mockups -> production components at
identical-or-better material fidelity. Generation engine: Gemini web UI.
Director bar: "same identical result as source mockup, or better — more
beautiful, more curated". Redesign is never allowed: the mockup owns design;
"better" means material/rendering quality only.

## Non-negotiable invariant
No asset becomes canonical for looking beautiful. It becomes canonical only
when beauty, geometry AND production rendering all pass against the approved
mockup. Any design deviation (silhouette, ornament placement, material
identity, composition) is BLOCKED regardless of scores — it can only enter
via Director-signed spec amendment (bumps spec version, re-gates the kit).

## F0 — Component spec contract (machine-readable, YAML per component)
- Elements list (complete — omission is an analysis defect, not a choice)
- Intended mount zones in CROP coords + (post-asset) ACTUAL mount zones +
  explicit deviation measurement — two geometries, never conflated
- Palette sampled from pixels (5 material points: gold hi/mid/shadow,
  enamel, gem)
- Slice-regions explicit for variable-size pieces (border-image 9-slice
  offsets), not generic "scaling-mode"
- States inventory; layer stack: content < inner-shadow overlay (CSS inset
  clipped to fitted hole — stops portraits looking pasted) < frame <
  gem/highlight overlay
- Min display size; panel sizes are known -> fixed-size variants preferred
  over 9-slice unless a span demonstrably tiles (seam-autocorrelation test)

## F1 — Anchor component first, kit second
- The roster row (best empirical result) is the ANCHOR: generate its sheet,
  repair to approval, then PROMOTE ring/gem/plaque-frame/enamel-insert/vine
  into the canonical kit (zanara-kit.yaml: anchors, mount zones, scaling
  mode, source dims, provenance)
- Every later generation attaches the kit board as the material reference
- Kit freezes only after a validation board (kit pieces + actual production
  components at production size) passes vs the mockup — off-register pieces
  are repaired in their origin chat BEFORE freeze; errors cannot propagate
  unfrozen
- Spine/vine = separate reusable ornament layer (kit piece, not per-row)

## F2 — Component sheets + scripted detection gate
- ONE generation per component sheet: N identical rows on flat navy
  #0a1622 (no shadow, no vignette), hollow ring hole, empty plaque interior
- "Known by construction" is strengthened: prompt declares grid (row count,
  pitch, margins); post-gen a SCRIPT gate detects elements via
  bg-difference connected components and verifies count, pitch regularity
  (<=2% variance), margins. Fail -> repair loop, never hand-cut.
- Cut ALL N rows from the single generated sheet — intra-sheet coherence
  is the point of one-call generation; discarding it re-introduces splice
  drift. Best-row selection is a FALLBACK only when the scripted gate flags
  a defective row; any fallback use is recorded in F6 provenance.

## F3 — Automated measurement (once, scripted)
- Script fits mount zones on the extracted asset: ring hole as circle/
  ellipse (center+radius), plaque interior as polygon/rounded-rect.
- Hand-entered numbers banned. Results written to manifest.
- Two distinct measurements: extraction boundaries (from sheet layout) vs
  mount anchors (from fitted artwork).

## F4 — Tolerance-by-design mounting
- Portraits sit UNDER the ring, oversized 3-4px bleed, clipped by a mask
  derived from the asset's own inner alpha -> +/-1-2px decentering becomes
  invisible
- Bars/fills clipped by mask derived from trough asset; fills are CSS
- No eyeballed coordinates; CSS positioning from spec is allowed, manual
  visual nudging is not an acceptance method

## F5 — Verification: numeric gates FIRST, eyeball as blocker list
- Landmarks (ring dia, plaque width, gem dia, frame thickness) within +/-3%
  of mockup after scale-normalizing
- Silhouette IoU >= 0.93 on blurred masks; ring/hole concentricity <= 1%
  of diameter
- Palette: 5 sampled points at DeltaE00 <= 6 vs kit/mockup
- "Better" check: structural SSIM >= 0.90 (design unchanged) AND Laplacian
  variance >= mockup (sharper, not blurrier)
- Eyeball = zero blockers (melted ornament, asymmetric bevel, wrong facet,
  banding, halo) + max 2 minor defects, flicker A/B at 100% and 200%
- Thresholds are PROVISIONAL until a documented calibration pass on the
  pilot components (roster, alabaster frame, nav): per-component masked
  zones (dynamic content excluded from metrics), measured pass/fail on the
  pilots, calibration report in F6. Until calibration: gates are advisory,
  the mandatory criteria are visual comparison + the structural-deviation
  block; after calibration the numeric gates become binding.
- Fault routing: GENERATION -> anchored edit; EXTRACTION -> re-matte (no
  regeneration); GEOMETRY -> refit; LAYOUT -> spec change

## F6 — Provenance + registration
- Hash + raw Gemini outputs + chat URLs + edit chain + prompt versions +
  script version + verdict
- Cut/matte outputs reproducible from raw with one command
- Scaling integrity: record actual source dims; reject assets needing
  destructive upscale; generate at 3-4x and downscale for sharpness
- States: CSS tints/filters by default; generated per-state asset only
  when geometry changes, in the same chat as base (shared register)

## Generation loop (Gemini web)
- Prompt is a COMPILED artifact (header: ref roles crop=structure
  kit=materials, palette hexes; component block from spec; constraints:
  flat navy, ortho, no text, equal spacing, margin; lint step). Free-form
  only in repair edits; every edit prompt versioned.
- G1: 4 variants -> auto-gate -> repair: 1 anchored edit per defect
  ("keep everything, change only X"), cap 3 -> fresh chat with best image
  as ref, cap 3 -> budget exhausted: ship best candidate + visible
  "fidelity debt" entry in F6.
- Background tabs only (Target.createTarget background:true); raw output
  immutable; matte derived by script (luminance/chroma + decontamination
  vs navy; check on checker AND real map).

## Per-component recipes
- Roster: row sheet -> best row replicated; portrait under ring; text/HP
  in fitted clear-zone
- Alabaster frame: generate at exact aspect; slice corners+spans; 9-slice
  only if span ornament-free (seam test); else fixed-size variants
- Nav bar: end caps + center (or two halves overlapping seam); icon slots
  as holes
- Resources: trough asset + CSS fill clipped by trough mask
- Corner rounds: part of frame sheet at 3-4x -> downscale (never extract
  from ~76px crop)
- Victory seal: standalone hero piece, kit board as palette ref; glow/
  rays in CSS
