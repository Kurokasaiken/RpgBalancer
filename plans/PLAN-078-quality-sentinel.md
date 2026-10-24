---
title: 'PLAN-078 — Quality Sentinel: State-Graph Perturbation, Three-Pass Non-Intrusive Oracles, and PLAN-077 Ledger Integration'
status: baptized
version: r004
created: 2026-10-22
request: R-266 (Director 2026-10-22)
related: PLAN-041, PLAN-047, PLAN-051, PLAN-054, PLAN-067, PLAN-071, PLAN-077
visual-fork: skipped — ops/QA runner and CLI tooling only; zero changes to src/ui/** or visual tokens — §5 vincoli (files_touched: scripts/sentinel/**, tests/unit/sentinel/**)
documentation_impact: REQUIRED
documentation_targets:
  - plans/INDEX.md
---

# PLAN-078 — Quality Sentinel (converged artifact r004)

> **Revision history.** The v1 draft (commit `acb40de3`, "esplorazione visuale autonoma")
> was critiqued in an explorer session and then adversarially debated in a multi-AI web
> debate (`mw-web-debate`, electorate chatgpt/claude/deepseek/gemini/grok):
> run `mind-weaver/.mw/runs/20261022-plan078-quality-sentinel/`, **CONVERGED 5/5 ACCEPT**
> on `artifact-r004` sha256 `a885496d65a94bd0292c12b2afcd29b6694a1087d527255e7967aaa8bbe2092c`.
> 23 objections raised and dispositioned across 4 artifact revisions (r001→r004).
> This file materializes the converged artifact; §0 preserves the original v1 intent verbatim.
> **Baptized by the Director 2026-10-22 («procedi»).**

## 0. Intent (v1, preserved verbatim)

Create a governed quality-inspection service that opens RPG Balancer in a real browser, explores meaningful player flows, captures screenshots and diagnostic evidence, and finds issues that existing scripted tests may not cover: functional defects, layout failures, visual inconsistency, interaction friction, runtime errors, regressions, and measurable performance degradation.

The goal is not another agent that merely reads source code or runs the entire test suite. It is a bounded, evidence-producing inspector that chooses useful areas to inspect, verifies findings, avoids duplicate tickets, and leaves actionable reports for the Director and implementation agents.

**First principle:** reuse the repository's existing capabilities before introducing new infrastructure. No new browser automation framework unless the audit demonstrates a specific gap Playwright cannot fill.

**Operating principle:** observe and report first. No autonomous code fixes, snapshot promotion, design decisions, auto-commit, auto-push, or machine shutdown outside the existing governance.

### 0.1 Why v1 was rewritten (critique summary)

- **Repository amnesia:** v1 cited deprecated `/minimal-gameplay` and proposed a parallel finding FSM, ignoring the canonical `/game` surface, the PLAN-067/071 harness (`src/docs/docs/game_surface_audit/harness/harness.mjs.txt`, `lensAudit` L1–L9), PLAN-054 living contracts (`discoverGameSurface.ts`, `.mw/surface-map.json`, `.mw/contracts/`), and the baptized PLAN-077 ledger (`scripts/ledger/`).
- **Blind to real bugs:** a settle-then-screenshot inspector cannot see the temporal/kinetic/state-perturbation defects that dominate the real defect log (PLAN-071 video audit, R-257..R-265): cold-decode black frames, 1-frame drag snap, proxy+source overlap, heading/art desync, orphan wings on minimize, `currentTick` long-task churn, `parked`-state animation leaks.
- **VLM in the critical loop:** empirical research (ACM 2026, 19,738 keyframes / 41h gameplay) puts off-the-shelf VLM precision at ~0.50; PLAN-041 proved free-tier providers hit 429/503 in unattended night runs; T-04/PLAN-047 reserve taste judgment to the Director's eye.
- **Contradictory exploration model:** a fixed deterministic itinerary is a slower E2E spec, not an explorer.

## 0bis. Debate delta (what the artifact revisions changed)

- **r001 → r002 (19 objections):** Three-Pass Oracle separation (clean perf pass / isolated pixel replay / quiescence-gated at-rest pass); `normalizeSelector()` + `fingerprint` formula + `affected_matrix` (viewport/DPR/locale excluded → 1 ledger item per bug); per-run ingest cap 10; scoped content-hash T-13 guard; per-node PLAN-077 surface-lock skip; guarded `CLOSED→OPEN`; calibration expanded to seeded faults + 5 negative controls; `DomainTextOracle` allowlist.
- **r002 → r003 (3 objections, Claude):** `never_quiesced` finding on quiescence timeout + degraded `L1/L3/L4` audit (10th seeded fault); `signature_family` introduced for Temporal/Pixel oracles; host-conditional ANGLE backend (`darwin→metal`, `win32→d3d11`), `renderer_class` in baseline key.
- **r003 → r004 (1 objection, DeepSeek):** `signature_family` narrowed to a flakiness classifier only — same-family + same-exact-signature ingests; same-family + divergent signatures emits one `SENTINEL-<hash>` observation candidate (both `candidate_component_ids`, `observed_signatures[]`) for Director adjudication, never auto-ingested; cross-family → `flaky_candidate`. `T-003` rewritten to assert both branches. `degraded: true` propagates into ledger evidence.

## 1. Goal

1. Build a deterministic, headless **Quality Sentinel** for `/game` (`src/pages/game-frame-pixi.tsx`) that explores a typed **State-Transition Graph (`S0..S15`)** under systematic **Perturbation Operators** (viewports including ultrawide `3440×1440`, locales `en`/`it-IT`, mid-state lifecycle interrupts `minimize/close/Escape/drag-cancel/reload`, and 5× WebGL mount/unmount soak cycles).
2. Detect functional, temporal/kinetic, geometric, domain/i18n, and WebGL/runtime regressions at **zero LLM token cost** using a **Three-Pass Non-Intrusive Oracle Pipeline** calibrated against all 10 witness bug classes and 5 negative controls with **`0%` false positives on auto-ingested defects (`FP <= 5%` overall)**.
3. Connect verified findings directly to **PLAN-054** (`discoverGameSurface.ts` / `.mw/surface-map.json`) and **PLAN-077** (`.mw/ledger/journal.ndjson`) under an exclusive ledger lock with normalized selector fingerprinting, exact-`failure_signature` reproduction matching (`signature_family` as flakiness classifier only), `affected_matrix` aggregation, guarded `CLOSED → OPEN` reopen, and `.spec.ts` reproducer generation.

### 1.1 State graph & perturbations

- **Nodes:** `S0_BootVeil` → `S1_WorldMapIdle` ↔ `S2_VillageView` ↔ `S3_VillageRegistry` / `S4_VillageStash` / `S5_Merchant`; `S6_QuestPlanner` (± Bag Picker, ± Forecast Wing) → `S7_QuestJourneyOutbound` → `S8_QuestStageNarrative` → `S9_QuestStageChoice` → `S10_QuestSkillCheckArmed` → `S11_QuestSkillCheckParked` → `S12_QuestJourneyReturn` → `S13_QuestRewardPopup` → `S14_GameMenuSettingsSaveLoad` → `S15_GoblinInvasionEvent`.
- **Perturbation operators:** `VP_SWEEP` (`1280×720`, `1280×800`, `1440×900`, `1920×1080`, `3440×1440` × DPR `1/2`), `LOCALE_SWEEP` (`en`/`it-IT`), `LIFECYCLE_INTERRUPT` (`minimize→restore`, `close→reopen`, `Escape`, `drag-start→cancel`, `drag-start→clamped release`, `reload mid-state` with PersistenceService hydration check), `SOAK_CYCLE` (5× WebGL mount/unmount `PixiWorldMap` ↔ `DepthScene` ↔ `DestinyAstrolabeV62` for `T-000` texture-pool leaks).

### 1.2 Three-Pass Non-Intrusive Oracle Pipeline

- **Pass 1 — `TemporalPerfOracle` (clean kinetic/perf pass):** explicit warm-up drain before the gesture start timestamp; `PerformanceObserver('longtask')`, `__gamePerf` (`p95 <= 33ms`), pure DOM rAF invariants: drag-release 1-frame snap `T-A6`, source+proxy bbox overlap `R-257`, `data-astro-frames`/`data-astro-idle` quiescence `BV-04`, `processedUpToTick` stillness. **Zero pixel readback** (`toDataURL`/`readPixels` forbidden here); observer overhead self-measured (`<= 1.5ms/frame` validity gate); emits `never_quiesced` when the Pass-2 gate times out.
- **Pass 1b — `TemporalPixelOracle` (isolated luminance/visual replay):** replays only scene/node transitions (`S0→S1`, `S6→S8`, `S8→S9`, `S10→S11`) at the canonical `1440×900` viewport (cold-decode and node-art desync are asset/state-machine properties, not viewport properties) with perf assertions disabled, under a pinned CDP network/CPU throttle profile; samples 16×9 downscaled luminance and `(headingText, canvas/img hash)` — catches `>300ms` black entry frames (`T-A4`, incl. opacity/shader occlusion) and heading/art desync (`T-A3`).
- **Pass 2 — quiescence-gated at-rest pass:** **Visual Quiescence Gate** (`Math.abs(currentRect - prevRect) < 0.5px` across 2 consecutive `rAF` ticks + `150ms` post-gesture settle debounce, `quiescenceTimeoutMs = 2000`) before `GeometryOracle` L1–L6 (collision, truncation+fold-straddle, plaque/viewport containment, orphan wings, `CTR-game-005` map fit, hit-area/portal scope), `DomainTextOracle` (allowlist `.mw/sentinel/domain-text-allow.json`, `matched_rule` + `surrounding_text_snippet`; forbidden tokens `slot-token:`, `\d+\s*pp\b`, `TICKS`, `NaN`, `undefined`, `translation_missing`), and `RuntimeOracle` (`pageerror`, `console.error`, React update-depth, failed assets, WebGL context loss). On timeout: `never_quiesced` + degraded audit — `L1/L3/L4` on last frame (`degraded: true`, propagated to ledger evidence), `L2/L5/L6` `skipped_degraded`.

### 1.3 Reproduction gates & fingerprinting

- `fingerprint = sha256(oracle_id | component_id | state_node | perturbation_kind | normalizeSelector(target))`; `normalizeSelector` strips `:nth-child`, array indices, `/^data-react/`, `slot-token:*`, CSS-module hashes; `viewport`/`DPR`/`locale` excluded → `affected_matrix[]` on `evidence_attached`.
- Deterministic oracles (`Geometry`, `DomainText`, `Runtime`): **2× Determinism Gate** with exact `failure_signature` match (`oracle_id + assertion_kind + state_transition`).
- Temporal/Pixel oracles: **2× / 3-of-5 Pinned-Profile Gate** requiring same `signature_family` **and** same exact `failure_signature`; `oracle_family` is a closed enum `{cold_decode_visual, heading_art_atomicity, drag_kinetic, proxy_overlap, idle_quiescence}`.
- Same-family + divergent signatures → one `SENTINEL-<hash>` observation candidate (both `candidate_component_ids`, `observed_signatures[]`) → Morning Digest, Director adjudication. Cross-family divergence → `flaky_candidate`. No auto-ingest in either case.
- `renderer_class` (from `WEBGL_debug_renderer_info`) is part of the perf baseline key; `software` downgrades all timing findings to `advisory`.

### 1.4 PLAN-077 bridge & worktree safety

- Exclusive `.mw/ledger/.ingest.lock`; content-hash recheck of monitored paths (`src/**`, `scripts/**`, `.mw/contracts/**`, `.mw/surface-map.json`, `public/**`, `package.json`; excludes `.mw/runs/**`, `.mw/ledger/**`, `~/.rpg-shutdown/**`) immediately before each write.
- `dirty_worktree_advisory` at start (digest allowed, `item_reopened` prohibited); per-node `RUNNING` surface-lock check → `skipped_surface_locked`.
- Guarded `CLOSED → OPEN`: automated `item_reopened` requires clean `HEAD` AND changed `surface_manifest_hash` (or `--force-reopen`); otherwise `evidence_attached` + `regression_review_needed` in the digest.
- Per-run cap `<= 10` new `item_ingested`; overflow → `capped_pending_ingest`. Every ingested defect ships a generated `.spec.ts` reproducer.
- Layer C (optional VLM triage) is post-run only, may emit only `kind: 'observation'` (structural guard), never gates navigation, never confirms defects (`T-04`/`PLAN-047`).
- Rule 16 (headless/background only, dedicated ephemeral port) and Rule 50 (register + heartbeat + release in `~/.rpg-shutdown/session-registry.json`; never invokes shutdown) are binding.

## 2. Out of Scope

- Runtime mutation of any `src/**` file (`PLAN-054` compliance) — the Sentinel is instrumentation/probe-only.
- Synchronous LLM/VLM calls in the browser loop; promoting Layer C above `observation`.
- Autonomous code edits, baseline updates, `git commit`/`push`, OS shutdown calls.
- Reactivating paused dispatch workflows (`R-208`).

## 3. Tasks

- **T-001 — Config Schema, `normalizeSelector()`, Renderer Backend & State-Graph Harness Promotion**
  - *Files:* `scripts/sentinel/sentinelConfig.ts`, `scripts/sentinel/selectorNormalizer.ts`, `scripts/sentinel/rendererBackend.ts`, `scripts/sentinel/gameSurfaceHarness.ts`, `.mw/sentinel/domain-text-allow.json`, `tests/unit/sentinel/sentinelConfig.test.ts`
  - *Depends on:* —
  - *Output:* Zod-validated `SentinelConfigSchema` (`S0..S15`, perturbations, thresholds incl. `quiescenceTimeoutMs = 2000`, `signature_families` closed enum, `angleBackend` host map, per-run cap 10), `normalizeSelector()` golden tests, host-conditional renderer selection with host-detection fallback unit test (`darwin`/`win32`/`linux` × hardware/software), Playwright harness promoted from `harness.mjs.txt` (isolated port, guaranteed cleanup, `renderer_class` in `run-manifest.json`).

- **T-002 — Three-Pass Non-Intrusive Oracles**
  - *Files:* `scripts/sentinel/oracles/{temporalPerfOracle,temporalPixelOracle,geometryOracle,domainTextOracle,runtimeOracle,quiescenceGate,index}.ts`
  - *Depends on:* T-001
  - *Output:* the pipeline of §1.2 — Pass 1 (warm-up drain, `longtask`, `__gamePerf`, drag-snap `T-A6`, proxy-overlap `R-257`, idle quiescence `BV-04`, `never_quiesced`), Pass 1b (transition-edge luminance + heading/art replay `T-A4`/`T-A3`, pinned CDP profile), Pass 2 (quiescence gate + degraded `L1/L3/L4`; `DomainTextOracle` allowlist; `RuntimeOracle`).

- **T-003 — Seeded-Fault (`10/10`) & Negative-Control (`5/5`) Calibration Suite (`PLAN-051`)**
  - *Files:* `tests/unit/sentinel/sentinelOracles.test.ts`, `scripts/sentinel/fixtures/seededFaults.ts`
  - *Depends on:* T-002
  - *Output:*
    - **10 seeded faults:** (1) `QuestRewardPopup` viewport overflow `T-A1`, (2) `>300ms` black entry `T-A4`, (3) choice row fold straddle `T-A5`, (4) 1-frame drag snap `T-A6`, (5) source+proxy overlap `R-257`, (6) heading/art desync `T-A3`, (7) orphan `quest-check-column` wing `C1`, (8) active CSS/rAF in `parked` `BV-04`, (9) `slot-token:`/`+15pp`/untranslated `it-IT` `T-A5`/`R-258`/`T-A13`, (10) perpetual jitter container → `never_quiesced` + degraded `L1/L3/L4`.
    - **Reproduction-gate tests:** same-family same-signature → 1 defect, correct owner; same-family divergent → 0 defects + 1 observation candidate.
    - **5 negative controls:** valid scroll fold, hidden wing, allowed `it-IT` proper nouns, `<150ms` settle, valid `+15%` chip.
    - Structural test: Layer C emits only `kind: 'observation'`.

- **T-004 — PLAN-054 Component Resolver, Reproducer Generator & Concurrency-Safe PLAN-077 Ledger Bridge**
  - *Files:* `scripts/sentinel/componentResolver.ts`, `scripts/sentinel/reproducerGenerator.ts`, `scripts/sentinel/ledgerBridge.ts`, `scripts/ledger/workItem.ts` (`evidence_attached` reducer support), `tests/unit/sentinel/ledgerBridge.test.ts`
  - *Depends on:* T-002, T-003
  - *Output:* reproduction gates of §1.3, `affected_matrix` aggregation, `.mw/ledger/.ingest.lock`, pre-ingest content-hash recheck, guarded `CLOSED→OPEN`, `observed_signatures[]`/`degraded` evidence propagation, per-run cap, `.spec.ts` reproducer output.

- **T-005 — Night-Run Controller, Scoped Taint/Lock Guards, Shutdown Heartbeat & Morning Digest**
  - *Files:* `scripts/sentinel/runSentinel.ts`, `scripts/sentinel/worktreeTaintGuard.ts`, `scripts/sentinel/morningDigest.ts`, `tests/unit/sentinel/runSentinelLifecycle.test.ts`, `package.json`, `plans/INDEX.md`
  - *Depends on:* T-001, T-004
  - *Output:* CLI `npm run sentinel:run`, scoped taint guard, per-node lock skip, Rule 50 registry/heartbeat/release, Rule 16 focus-safety, `.mw/runs/sentinel-<ts>/morning-digest.md` sections: `Confirmed Defects` / `Flaky/Race Candidates` / `Observation Candidates` (incl. `SENTINEL-<hash>` divergent-signature items) / `Visual Observations`.

## 4. Post-convergence advisory notes (non-blocking, for T-004/T-005)

Recorded verbatim from the Round-4 acceptance (Claude) — adopt during implementation, no re-vote required:

1. **Promotion path:** define a Director-side action that promotes an observation candidate to `defect` with Director-chosen owner; the promoted item carries the original `SENTINEL-<hash>` as `source_ref` — otherwise an always-signature-flipping bug stays in the digest forever.
2. **Recurrence escalation:** count consecutive runs re-emitting the same divergent candidate; past a configurable threshold (suggested 3), flag `persistent_divergent_candidate` in the digest — visibility only, never auto-ingests.

## 5. Acceptance Criteria & Closure Contract (`verification.json`)

- **OB-1** (10/10 seeded faults + 5/5 negative controls + normalization + reproduction-gate semantics + renderer fallback): `npm run test -- tests/unit/sentinel/sentinelConfig.test.ts tests/unit/sentinel/sentinelOracles.test.ts` passes.
- **OB-2** (concurrency-safe ledger bridge, matrix dedup, guarded reopen): `npm run test -- tests/unit/sentinel/ledgerBridge.test.ts tests/unit/scripts/workItemFsm.test.ts` passes.
- **OB-3** (lifecycle, scoped T-13 taint, per-node lock skip, Rule 50): `npm run test -- tests/unit/sentinel/runSentinelLifecycle.test.ts` + `npm run shutdown:lint-capability` + `npm run foreground:lint` pass.
- **OB-4** (headless pilot on `/game`): `npx tsx scripts/sentinel/runSentinel.ts --tier=1 --dry-run` completes with 0 orphan processes; writes `.mw/runs/sentinel-pilot/morning-digest.md` + `run-manifest.json` (incl. `renderer_class`).
- **OB-5** (repo safeguards): `npm run lint -- scripts/sentinel tests/unit/sentinel` + `npm run build:check` + `npm run closure:lint` pass.

*Visual/perceptual claims (T-04):* the Sentinel's own Morning Digest output and any `observation` candidates are advisory artifacts for Director eye-review; no metric closes a visual claim by itself.

## 6. Implementation status (2026-10-22/23)

### 6.1 Runner hardening (2026-10-23, local agent session)

Three defects found running the first full tier-1 sweep, all in
`scripts/sentinel/**` (in-scope, probe-only — no `src/**` touched):

1. **Hook-mount race after `LIFECYCLE_INTERRUPT` reload** — `applyPerturbation`
   re-reached the node before `__idleVillageTestHooks` remounted; hook-assisted
   reaches use optional chaining → silent no-op → fatal `waitVisible` timeout
   on S6. Fix: `waitForFunction(__idleVillageTestHooks)` post-reload
   (`perturbationApplier.ts`).
2. **`demoLaunch` cancels on live run** — after a mid-run reload the rehydrated
   quest makes `anyRunActive` true, so `demoLaunch` no-ops (canonical send
   boundary, `useQuestExpeditionSession.tsx:933`). Fix: `SurfaceNode.resume`
   post-reload driver; quest nodes `S7..S13` use `resumeQuestRun` — the R-133
   recovery affordance (click `[data-quest-poi-id]` → `onOpenRun` →
   `quest-window`), then `node.reach` drives the rehydrated run forward.
   First attempt used `data-testid="map-quest-poi"` which resolves to 2
   elements (one per revealed POI) — selector is the wrapper
   `[data-map-quest-poi-target][data-quest-poi-id="poi-goblin"]`.
3. **Perturbation failure = fatal** — an unreached node after reload killed
   the whole run. Fix: `runSentinel` records `${node}:${pert}@${cell}` into
   `unreachedStates` (digest-visible evidence) and continues.

Regression coverage (R-247): `tests/unit/sentinel/perturbationApplier.test.ts`
(3 tests — hook wait ordering, no-hook fallback, resume preference).

Evidence: `.mw/runs/probe-s6-reload`, `.mw/runs/probe-s7-reload`,
`.mw/runs/sentinel-2026-10-23T0829/` (full tier-1, 42min, 0 fatal,
7 confirmed / 14 flaky / 1235 divergent, 4 unreached).

Known residual harness gaps observed in `0829`: S4 stash reach leaves the
registry panel open → warehouse pin hover intercepted; S8 resume is
state-dependent (a rehydrated run already past narrative can't re-produce
`quest-window-beat`); S12/S13 long drives exceed their budgets when the
rehydrated run is already late-stage.

### 6.2 Harness + oracle calibration (2026-10-23, R-270 ingest session)

1. **S4 reach via registry row** — `openVillageBuildingPanel` hovers the map
   pin; with the registry drawer open the pin is physically occluded (by
   design — the drawer is modal). Canonical path while the drawer is open:
   click `[data-registry-row="<building-id>"]` (locale-independent selector)
   → row tooltip → `village-open-stash`. `LAYOUT-registry-pin-intercept`
   withdrawn as oracle false positive.
2. **L5 plaque-clearance miscalibration** — the oracle required
   `plaque-clearance + panel-padding` (22px) on **all** edges. Corrected:
   (a) `plaque-clearance` (12px) is already the horizontal frame breathing
   room — not summed with `panel-padding`; (b) edges intentionally anchored
   to the viewport (hang/plinth plaques flush by design) are exempt;
   (c) scroll-clipped children are measured on their **visible intersection**
   with clipping ancestors, not the full offscreen rect; (d) vertical floor:
   `panel-padding` (10px) on free edges. Lens L9 updated to the same
   calibrated rule. Post-calibration: **0 violations on S0, S1, S2, S3, S6**;
   `LAYOUT-plaque-clearance-systemic` withdrawn as oracle false positive.
3. **`sentinelConfig.plaqueClearancePx`** now documents token semantics
   (horizontal clearance only) so evidence text matches the rule.

R-270 outcome: 5 defects ingested→fixed (truncation, 2× fold-straddle,
hit-area <32px, stash-uniformity); 2 withdrawn false positives. All ledger
items at `AWAITING_DIRECTOR` pending `item-confirm`.

All five tasks implemented and verified in the working tree (not committed — shared dirty worktree, T-13):

- **T-001 ✅** — `sentinelConfig.ts` (Zod schema, closed `signature_families`, thresholds), `selectorNormalizer.ts`, `rendererBackend.ts` (darwin→Metal / win32→D3D11 / linux+CI→SwiftShader), `gameSurfaceHarness.ts` (S0–S15 graph, hook-assisted reach with `howStateReached` provenance, per-capture manifest). 21/21 unit tests green.
- **T-002 ✅** — `oracles/{temporalPerf,temporalPixel,geometryOracle,domainTextOracle,runtimeOracle,quiescenceGate,index}.ts`; Pass-1 rAF/perf sampling with zero pixel readback, Pass-1b isolated pixel replay, Pass-2 quiescence-gated structural oracles, repeat gate per r004 (exact `signature` = ingest key; `signature_family` = flakiness classifier only).
- **T-003 ✅** — `tests/unit/sentinel/sentinelCalibration.test.ts` + `fixtures/seededFaults.ts`: **10/10 seeded faults detected, 5/5 negative controls pass**. Live run evidence: `.mw/runs/sentinel-calibration/` (≈330s full suite; quest-journey test shares ONE drive S8→S9→S11→S13, doubling S9/S11 as clean controls).
- **T-004 ✅** — `componentResolver.ts` (PLAN-054 contracts, root-file outranks scope-file), `reproducerGenerator.ts`, `ledgerBridge.ts` (unresolved ownership never ingests; `surface_id` required; dedup/cap/lock), `workItem.ts` `evidence_attached` reducer scope.
- **T-005 ✅** — `runSentinel.ts` controller (Rule-50 registry/heartbeat/release, fail-closed), `worktreeTaintGuard.ts` (T-13 drift detection), `morningDigest.ts`, `perturbationApplier.ts`, lifecycle/bridge unit suites.

**Real oracle defects found by calibration (fixed):**

1. `quiescenceGate` keyed surface rects by raw attribute value — every `[data-skin="hud-plaque"]` collapsed into one Map entry, hiding movement on all but the last sibling → keyed by `(label, DOM index)`.
2. `geometryOracle` claimed R-205 viewport-leak coverage but no check compared surface rects to the viewport → added `viewportLeaks()` (family `containment`, signature `vleak|<el>`).
3. `temporalPerf` longtask observer re-counted page-load buffered entries → sampling window + non-buffered start/stop.
4. `runtimeOracle` flooded on dev-server noise → Vite/ERR_ABORTED noise filter, `?t=` query normalization, per-signature dedup.
5. Geometry signatures embedded live text (clock/counters) → `sigKey()` digit normalization so one defect yields one signature.
6. T-13 harness resilience: `expedition`/`advanceTicks`/`auditState` tolerate HMR execution-context destruction and hook-remount gaps on a shared worktree.

**Verification:** `npx vitest run tests/unit/sentinel` → 61 tests, calibration 3/3 live; `npm run build:check` ✅; `npm run closure:lint` exit 0 (pre-existing fail-closed invariant notes unrelated to this diff). `npm run lint -- <scope>` N/A — `scripts/`+`tests/` are outside the ESLint scope (eslintignore); typecheck is the gate for these files. Pre-existing zod type error in `scripts/shutdownManager/sessionRegistry.ts` (quietWindow default missing `restrictedDaysOfWeek`) fixed in this diff — semantically identical (Mon–Fri default per Rule 50), required because `runSentinel` imports the registry.

## 7. verify:bundle — `.mw/runs/plan078-quality-sentinel/` (2026-10-23)

Obligations evaluated on real evidence:

| OB | Result | Evidence |
|---|---|---|
| OB-1 | PASS | `command-logs/OB-1.log` — config+oracles suites green |
| OB-2 | PASS | `command-logs/OB-2.log` — ledger bridge + workItem FSM green |
| OB-3 | PASS | `command-logs/OB-3.log` — lifecycle + shutdown/foreground lints green |
| OB-4 | PASS | `command-logs/OB-4.log` — tier-1 headless pilot executed by the bundler (13 findings, dry-run, 0 orphan processes, `renderer_class: metal`) |
| OB-5 | PASS | `command-logs/OB-5.log` — `build:check` ✅ + scoped typecheck ✅ |

`bundle.json` → `verifier ok`, `red_first ok`, `decision_report ok` (schema-check), `trusted_lock ok`. **Verdict: BLOCKED — not by this diff:** the `contracts` gate reports ~370 baseline reasons (INV declared without `// INV:` blocks, Mode B-amend attestations, STRICT_FILES/inventory drift, executedCount unknown) generated by a parallel session's in-flight PLAN-067/054 contract work on the shared worktree (T-13). Every bundle produced today by the PLAN-077 stream (t001–t007) is identically BLOCKED on the same baseline; no PLAN-078 file is implicated. PLAN-078 files are dispositioned via auditabile `coverage_exception` records (`scripts/sentinel/**`, `tests/unit/sentinel/**`, `.mw/sentinel/**`, `scripts/ledger/workItem.ts`) and `parallel-session-unblock` records for the other session's files — the living-sync Mode B/C attestations belong to that session's closure.

**Director adjudication required for:** ledger ingestion of pilot findings (deferred until a clean-worktree run) and the `SENTINEL-<hash>` observation candidates in the digests.
