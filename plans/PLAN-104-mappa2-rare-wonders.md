---
title: PLAN-104 — `mappa2` Rare Sea Wonders (whaleBreach + abyssalPass)
status: draft — da battezzare Director (nessuna implementazione eseguita)
owner: agente locale
created: 2026-10-29
source_request: vettore Director «continua il plan, se nn è stato sottoposto a planner multi ai web fallo adesso» (2026-10-29) + ruling G-5 su PLAN-103 → piano dedicato
parent: PLAN-089 (T-009); sibling PLAN-094 (AmbientDirector + shoal), PLAN-101 (sea routes)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (vettore avanzamento/esito)
  - test-results/plan-104-mappa2-rare-wonders/ (evidence)
---

# PLAN-104 — Rare Sea Wonders su `/mappa2-lab`

## Provenance

Dibattito multi-AI web `mind-weaver/.mw/runs/20261029-mappa2-rare-wonders/`:
**CONVERGED** su `artifact-r002.md`, sha256
`23ffcf1bd1871ebae0ebfc136e23ed4ffc95f48e0cede39e0d823d29805105d7`.
ACCEPT 3/3 (claude, gemini, deepseek); chatgpt escluso (sessione anonima
local-chatgpt non indirizzabile — provider_dead fino a re-auth Director);
grok rimosso provider_dead (echo/gibberish + send mai atterrati). 19
obiezioni disposizionate `amended` su r002; grounding-ledger nella run.
Handoff di partenza: `.mw/runs/handoff-mappa2-rare-wonders-20261029.md`
(autointitolato «PLAN-098 provvisorio» → rinumerato **PLAN-104** da ruling
G-5 su PLAN-103).

---

# Artifact r002 — `mappa2` Rare Sea Wonders (PLAN-104)

r001 amended by 19 R2 witnesses (claude W-01..08, gemini W-01..04,
deepseek W-01..07). Substantive changes: visibility floor, z-order fix,
occupancy scoping, scheduler spec, force flag, tick interpolation,
per-size-class swept AABB, effective-min-coast physics, CI wiring,
one-author gates. Skeleton unchanged.

## Goal / scope / NOT-scope

As r001 (whaleBreach + abyssalPass v1; rareCameo dormant; single author;
zero hunk worldSurfaceConfig.ts; /game zero diff).

## Canonical decisions (r002)

- **Attachment:** abyssal sprites live in the existing `ambientSeaLayer`
  (already mounted, submerged band) — zero host edits. Whale sprites get
  `rareSurfaceBox` (z=3.5: above surface/foam band, below weather z=4,
  below rings z=5) created inside the leaf module; host call is the
  single `mountRareWonders(world, ambientSeaLayer)` line (≤4-line diff
  holds — no 5-line escape hatch; if it does not fit, the attach logic
  moves into the leaf module entirely or the Director rules first).
- **Z-order check:** AC-10 reads the zIndex constants from the leaf
  contract + one seeded overlap screenshot vs a known weather sprite —
  no live tree-walker (T-13 infeasible).
- **Swept area:** each zone declares `originRect` +
  `sweptAabbBySizeClass` (union over all reachable size classes AND
  enter/exit phases); the validator gates every one ⊂ sea_mask; fuzz
  test 10k seeded plans per kind assert path+extent stays inside.
- **Effective coast margin (physics fix):** `effectiveMinCoastDistancePx`
  = max(minCoastDistancePx, shadowRadius|splashRadius + marginPx) —
  computed, stored and displayed in the preview; whale 60/splash,
  abyssal 200/shadow. A 450px shadow implicitly needs ≥650px, not 200.
- **Yield gate:** T-001 emits a yield table (zones × size class ×
  effectiveMinCoast × survived). Yield below minimum per kind →
  DECISION NEEDED (Director ruling): candidates shrink abyssal band /
  documented believability trade / deep_sea_mask artifact. NO silent
  "lower minCoast" fallback.
- **Occupancy semantics:** `rare:<kind>` registration TTL = event
  duration + fade tail ONLY; scoped by bbox∩zone. Cooldowns live in
  planner maps, never the registry. Verify occupancyRegistry.queryBbox
  aggregates all keys generically; if shoal checks hardcoded keys, the
  rare family ships a plain-bbox adapter (zero shoal file edits —
  "shoal untouched" preserved).
- **Scheduler spec (testable):** automatic attempt n uses
  fnv1a(eventSeed|rare|n); next-attempt tick drawn from global spacing
  window; kind/zone/candidate in fixed draw order. Manual triggers use
  separate namespace fnv1a(eventSeed|rare|manual|m) — the automatic
  stream is untouched by lab clicks. AC-8 = 10h simulated session with
  interleaved manual triggers comparing the automatic subsequence.
- **Manual seam:** `triggerRare(kind, {force?, zoneId?})` — force
  bypasses cooldown+globalSpacing ONLY; never lock, gates or
  reducedMotion. reducedMotion checked FIRST, before any seed/lock —
  a blocked trigger leaves no log entry. Reason codes on every
  rejection (reducedMotion|cooldown|globalSpacing|guardReject|lockHeld).
- **Lifecycle:** state advanced by 100ms logical ticks; render position
  interpolated per frame between prev/current tick (render-only, never
  writes state — determinism preserved). Durations in logical ticks
  (whale 80-100); AC pins max per-frame displacement at 60fps.
- **Visibility (shoal lesson):** AC-16 perceptibilityFloor — during
  event peak, mean abs luma diff on primary ROI vs rare-disabled control
  ≥ leaf floor; abyssal carries visibility by SIZE+shape+darker tint,
  not alpha (alpha budget texturePeak×sprite(t)≤0.35, target 0.28-0.35,
  sprite.alpha sampled every tick of a seeded run); Director sign-off
  capture before T-007 closes.
- **Motion diff contract:** leaf `motionDiff: {rois:[{id,x,y,w,h,
  space:'canvas'}], metric:'lumaAbsDelta', budgetPct, perceptibilityFloor}`
  — reproducible numbers, not ad-hoc judgment.
- **Digest scope:** maskDigest covers sea_mask + coast_distance +
  shallow_mask + biome_ids + sampler version + params. T-002 wires the
  validator into an existing gate (npm script + negative fixture
  proving the gate fails on drift).
- **One author gates:** AC-17 grep gates — occupancyRegistry.register
  ('rare:') and spawnLog rare entries appear only in
  ambientRareWonders*.ts; triggerRare is the only externally callable
  seam; planner never selects rareCameo even if flag mis-set.
- **Planner/view split:** `ambientRarePlanner.ts` pure state machine
  (admission/cooldowns/lock/lifecycle — Pixi-free tests) +
  `ambientRareWonders.ts` thin view.

## Tasks (r002)

- T-001 Audit + yield table + go/no-go (zones × size × effectiveMinCoast
  survival) + DECISION NEEDED flag on sparse yield.
- T-002 Leaf contract (originRect, sweptAabbBySizeClass, thresholds,
  cooldowns, z-order consts, motionDiff block, maskDigest,
  familiesEnabled) + offline validator + preview + gate wiring +
  negative fixture.
- T-003 Deterministic atlas fx/rare/* + atlas.json (per-size-class arc
  coefficients, baked peak alpha ≤0.35 target 0.28-0.35, darker tint +
  interior gradient for abyssal).
- T-004 Zod leaf schema + manifest keys + loader (parallel once shape
  frozen).
- T-005 `ambientRarePlanner.ts` + `ambientRareWonders.ts` +
  mountRareWonders (whale box z=3.5, abyssal in ambientSeaLayer) +
  scheduler spec + force flag + tick-interpolated view + occupancy
  scoping + reason codes + triggerRare seam.
- T-006 Lab re-wire (button + kind selector + force debug) + legacy
  no-op guard; host diffs ≤4 lines each, no escape hatch.
- T-007 Verification (full matrix incl. fuzz 10k, 10h sim, cross-family
  occupancy, visibility floor, seeded captures, motion diff numbers,
  grep gates, zero-hunk checks, Director sign-off capture).

## Acceptance (r002)

AC-1..AC-15 as r001 with amendments above (swept AABB per size class;
effectiveMinCoast; whale z=3.5; durations in ticks; AC-10 via leaf
consts + seeded overlay). New:
- AC-16 perceptibilityFloor: primary-ROI luma delta ≥ leaf floor at
  event peak vs control; Director sign-off capture.
- AC-17 one-author grep gates (occupancy/spawnLog/triggerRare seam).
- AC-18 scheduler spec: 10h sim, manual triggers interleaved, automatic
  subsequence identical across two runs.
- AC-19 manual force: cooldown/spacing bypassed, lock/gates/
  reducedMotion never bypassed; reject leaves no log entry.
- AC-20 interpolation: max per-frame displacement at 60fps ≤ pinned px
  bound; sub-tick interpolation is render-only.
- AC-21 yield table emitted; sparse yield = DECISION NEEDED (ruling
  recorded), never silent fallback.
- AC-22 validator wired to a gate; negative fixture fails on drift;
  digest scope as specified.

## Risks (r002)

- Sparse deep-sea yield → DECISION NEEDED upfront (yield table drives
  ruling; candidates enumerated above).
- Registry lacks generic queryBbox → plain-bbox adapter inside rare
  family (no shoal edits).
- Invisible-wow recurrence → perceptibilityFloor + size-carried
  visibility + Director sign-off before close.
- View choppiness at 100ms ticks → render-only interpolation + px/frame
  bound.
- Contract freeze regression → sweptAabbBySizeClass settled before
  T-002 emits leaf.
