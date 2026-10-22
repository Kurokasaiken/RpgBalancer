---
title: 'PLAN-078 — Quality Sentinel: esplorazione visuale autonoma, bug hunting e audit notturno'
status: draft
created: 2026-10-22
request: Director request 2026-10-22 — plan after repository audit and online research; RICHIESTE reference to be assigned
related: PLAN-047, PLAN-051, PLAN-067, PLAN-071, PLAN-077, PLAN-049; scripts/visual/minimalGameplayBaselineRunner.ts; scripts/harness/dispatch.ts; scripts/benchmark/nightrun.ts; scripts/shutdownManager/
documentation_impact: REQUIRED
documentation_targets:
  - plans/INDEX.md
  - context/OPEN.md (only if implementation discovers unresolved policy decisions)
---

# PLAN-078 — Quality Sentinel

## 0. Intent

Create a governed quality-inspection service that opens RPG Balancer in a real browser, explores meaningful player flows, captures screenshots and diagnostic evidence, and finds issues that existing scripted tests may not cover: functional defects, layout failures, visual inconsistency, interaction friction, runtime errors, regressions, and measurable performance degradation.

The goal is not another agent that merely reads source code or runs the entire test suite. It is a bounded, evidence-producing inspector that chooses useful areas to inspect, verifies findings, avoids duplicate tickets, and leaves actionable reports for the Director and implementation agents.

**First principle:** reuse the repository's existing capabilities before introducing new infrastructure. No new browser automation framework unless the audit demonstrates a specific gap Playwright cannot fill.

**Operating principle:** observe and report first. No autonomous code fixes, snapshot promotion, design decisions, auto-commit, auto-push, or machine shutdown outside the existing governance.

## 1. Repository reconnaissance (verified starting points)

- Playwright is already configured in playwright.config.ts; package scripts include test:e2e, test:visual, visual:minimal-gameplay, minimal:e2e, preview:playwright, and mobile/reporting commands.
- scripts/visual/minimalGameplayBaselineRunner.ts captures Minimal Gameplay across three viewports and five game states.
- Existing E2E, visual-regression, surface-coverage, audit, stress, and benchmark scripts must be catalogued and reused where appropriate.
- scripts/benchmark/nightrun.ts is the reference for bounded night-run lifecycle/session registration.
- scripts/shutdownManager/ and .windsurf/rules/50-shutdown-governance.md are the sole shutdown authority. The real shutdown policy defaults disabled and must remain so unless separately authorized.
- scripts/harness/dispatch.ts exists, but the legacy automatic dispatch workflow is documented as paused. This plan does not reactivate R-208 or introduce an independent dispatcher.
- PLAN-047 requires visual choices/baselines to remain governed and preserves the Director's human-eye gate for representation/material/identity. Automated metrics cannot approve taste.
- PLAN-051's evidence/trust rules and PLAN-077's work-item lifecycle must be inspected before defining report and closure integration. Do not create a parallel ticket ledger if the existing contract can represent findings.
- PLAN-067 and PLAN-071 provide examples of surface maps, headless evidence capture, diagnosis-first waves, and human review boundaries.

These are starting facts, not proof that every existing script is currently healthy. T-001 must execute or inspect them and record current state.

## 2. Scope and non-goals

### In scope

1. Open the application in a real browser using the existing Playwright setup and test-mode build.
2. Navigate and interact with selected player-facing screens and flows, including routes, dialogs, overlays, drag/drop and meaningful game-state transitions.
3. Capture screenshots at known viewports/states; on failure retain trace, console/network diagnostics, and relevant DOM/geometry evidence.
4. Compare with approved visual baselines and existing design-system/skin contracts.
5. Find issues in:
   - functional behavior and invalid state transitions;
   - clipping, overlap, overflow, inaccessible or unreachable controls;
   - inconsistent typography, spacing, tokens, icons, terminology, or component grammar;
   - console errors, failed requests, unhandled runtime errors;
   - repeated rendering/work, obvious expensive operations, and measured interaction/load regressions;
   - missing coverage on important player-facing surfaces.
6. Verify candidate findings with a repeat attempt or a deterministic assertion before filing.
7. Produce deduplicated, severity-ranked work items with reproduction steps, screenshots, logs, measurements, confidence, and acceptance criteria.
8. Run bounded during-day or overnight cycles, with adaptive resource limits and safe cancellation.
9. Re-check findings after fixes when an explicit verification trigger is available.

### Out of scope

- Automatically fixing code in the initial version.
- Updating or accepting visual baselines automatically.
- Deciding whether a new aesthetic direction is beautiful or canonically correct.
- Treating an AI visual opinion as a confirmed defect without corroborating evidence or a Director judgment.
- Replacing Playwright, the existing visual baseline runner, the dispatcher, the work-item ledger, or shutdown manager.
- Reactivating paused dispatch workflows.
- Unrestricted random exploration of destructive, irreversible, account, filesystem, or production actions.
- Claiming that a game is fun based solely on automated UI checks.

## 3. Design and runtime model

### 3.1 Two complementary inspection layers

**Layer A — deterministic checks**
- Existing unit/E2E/visual tests, Playwright assertions, console/page errors, failed requests, DOM geometry, accessibility signals, screenshot diffs, and repeatable timings.
- Cheap checks run before model-based inspection.
- Performance findings require measured evidence and a reproducible comparison; source-code suspicions alone are not performance defects.

**Layer B — AI-assisted visual exploration**
- The agent receives a bounded route/surface itinerary, approved references, and the current state/viewport.
- It opens the browser, inspects screenshots, and performs only allowlisted interactions.
- It may suggest additional steps, but must log the action and observed result; every suspected issue gets a screenshot or equivalent evidence and a reproduction path.
- Use an available multimodal model/provider already approved in the project environment. T-001 must identify the actual supported integration and cost before choosing a provider; do not hard-code a speculative API.
- The model is a detector/triager, not the authority on aesthetic taste.

### 3.2 Inspection targets and prioritization

Build the target queue from existing surface-coverage registries, routes, E2E specs, recent diffs, open defects, and surfaces with weak/no recent evidence.

Prioritize:
1. player-critical paths and recently changed surfaces;
2. surfaces with known defects or recurring regressions;
3. important uncovered screens and responsive breakpoints;
4. broader exploratory checks when budget remains.

Every run records surfaces attempted, surfaces completed, skipped targets and reasons. Do not claim full application coverage from a partial run.

### 3.3 Evidence package

Each run produces a stable directory under the repository's existing run/evidence conventions, containing:
- run manifest: commit SHA, build/config, viewport, browser, timestamps, budget and model/tool version;
- route/interaction log and test outcome;
- screenshots with deterministic names and state/viewport metadata;
- Playwright trace and console/network errors when applicable;
- measured timing and baseline comparison where available;
- findings JSON plus concise Markdown report;
- hashes or equivalent stable references for artifacts.

Avoid committing large raw artifacts by default. Follow the existing evidence/bundle conventions and define retention/size limits in T-001.

### 3.4 Finding contract and severity

Each finding should contain:
- stable fingerprint and affected surface/component;
- category: functional, layout, visual-consistency, performance, accessibility/interaction, coverage, or infrastructure;
- severity: critical / high / medium / low / observation;
- status: candidate / reproduced / needs-human-review / duplicate / dismissed / fixed-awaiting-verification / verified-fixed;
- confidence with explicit rationale;
- reproduction steps and expected vs actual behavior;
- evidence links, viewport, commit SHA and relevant logs/measurements;
- suggested next action and testable acceptance criteria.

A visual difference alone is not necessarily a defect: intentional approved changes, animation, nondeterministic content, and environment noise must be distinguished. Findings with weak evidence remain observations or human-review items rather than entering the implementation queue as confirmed bugs.

Integrate with PLAN-077's existing work-item lifecycle after inspecting its contract. Do not create a second authoritative ledger. Human confirmation remains mandatory for aesthetic judgments and any state transition that the existing governance reserves to the Director.

## 4. Resource and safety governance

- Default to one browser exploration worker and one heavy browser session at a time. Parallelize cheap independent checks only when the machine budget permits.
- Use a configurable time budget, per-step timeout, total-run timeout, retry budget, and cancellation path.
- Before each heavy stage, sample current load and active registered sessions. Reduce scope or defer if the machine is busy; do not spawn more agents merely to finish sooner.
- Reuse one browser/context where safe; isolate/reset test state between flows. Never share a mutable game state with a developer/test session.
- Run against the test-mode build and isolated test data, never production.
- Allowlist routes and interactions; block destructive or irreversible actions unless explicitly seeded and safe.
- Register the run with the existing shutdown session registry and send heartbeats. Release the session in a guaranteed cleanup/finally path, including failures and cancellation.
- The Sentinel may request a shutdown evaluation only through the existing manager. It must never execute shutdown commands itself.
- Keep actual shutdown disabled unless the existing policy has been explicitly configured and dry-run evidence reviewed. A completed Sentinel run is not by itself authorization to shut down the machine.
- No auto-commit or auto-push. Preserve dirty work and follow existing repository safety rules.
- If the app fails to start, the browser crashes, evidence storage fails, or session state is unreadable, report infrastructure failure and fail closed rather than filing speculative gameplay bugs.

## 5. Tasks and acceptance criteria

### T-001 — Existing capability and gap audit (prerequisite)

Inventory Playwright configuration/projects, routes and surface registries, visual baselines, screenshots, test reporters, performance/stress scripts, evidence bundles, existing model integrations, issue/work-item contracts, dispatcher limits, and shutdown lifecycle.

Run safe, representative commands where practical and record actual pass/fail/currentness, execution cost, artifact location, and known gaps. Check for existing screenshot/image-analysis integrations before adding dependencies.

**Acceptance**
- An evidence-backed capability matrix marks each capability as reusable / incomplete / missing / stale.
- Each proposed new dependency or service has a demonstrated gap and cost rationale.
- The chosen first pilot surface is important, reproducible, and safe to reset.
- No runtime behavior or shutdown policy is changed.

### T-002 — Inspection contract and pilot itinerary

Define a versioned configuration for surface, routes, states, viewports, allowed interactions, expected assertions, approved visual references, time budget, and exclusion rules. Use the existing route/surface registry as the source where possible.

**Acceptance**
- The itinerary is deterministic and can be replayed on the same commit.
- Every action is allowlisted and logged.
- The pilot covers at least one complete player-facing flow and more than one viewport.
- No open-ended click-everything behavior.

### T-003 — Browser Explorer and evidence capture

Implement the smallest runner that starts/attaches to the test build, navigates the pilot, captures screenshots, records browser console and failed network requests, and stores traces on failure. Reuse Playwright and existing baseline runner helpers where compatible.

**Acceptance**
- A clean run creates a complete manifest and expected artifacts.
- An injected browser/runtime failure produces a traceable report with screenshot and diagnostics.
- Cleanup always closes owned browser processes and releases registered session state.
- Existing tests and visual baselines are not silently changed.

### T-004 — Candidate detection and triage

Add deterministic detection first: uncaught errors, failed critical requests, visible/DOM overflow, off-viewport interactive controls, screenshot differences, failed assertions, and measurable timing thresholds where reliable. Add multimodal screenshot inspection only after the provider, cost and privacy boundary are confirmed in T-001.

**Acceptance**
- Seeded defects in a test fixture are detected and classified.
- At least one layout defect and one interaction/runtime defect are found in a controlled pilot.
- A seeded intentional visual change does not automatically become a confirmed bug without classification.
- Performance findings cite measurements and comparison context, not guesses.

### T-005 — Finding deduplication and work-item integration

Map findings to PLAN-077's item schema and lifecycle, including existing open defects and component/surface contracts. Use stable fingerprints plus evidence/commit context; retain history when a recurring defect reappears.

**Acceptance**
- The same seeded defect across repeat runs creates no duplicate active work item.
- A recurring defect on a new commit updates/links the existing history instead of erasing prior evidence.
- Uncertain aesthetic observations route to human review.
- No work item is marked fixed without the established verification and confirmation gates.

### T-006 — Performance and adaptive budget

Implement a conservative budget controller using current machine load, active sessions, recent run duration and failure rate. Start sequentially; do not implement speculative multi-agent parallelism.

**Acceptance**
- Configurable max duration, step timeout, retry budget and cancellation are enforced.
- Simulated high load defers or reduces work rather than increasing concurrency.
- An interrupted run records partial results and releases its session.
- Baseline/performance comparisons use equivalent build, browser, viewport and scenario conditions.

### T-007 — Night-run wrapper and shutdown integration

Adapt the lifecycle pattern in scripts/benchmark/nightrun.ts; register/heartbeat/release through the existing shutdown manager. Provide explicit dry-run/status diagnostics and a bounded scheduled/manual invocation. Do not add a competing LaunchAgent or direct power command.

**Acceptance**
- Success, test failure, timeout, cancellation, browser crash and process interruption paths have lifecycle tests.
- The run never invokes a machine shutdown API directly.
- npm run shutdown:status and npm run shutdown:lint-capability pass with evidence in test-results/.
- Real shutdown remains disabled unless independently authorized under the existing policy.
- The report clearly distinguishes “inspection completed” from “machine shutdown permitted”.

### T-008 — Seeded-defect acceptance round

Create isolated fixtures or controlled test-only faults covering clipping/overflow, broken interaction/state, console error, visual mismatch, and a measurable slowdown or an explicitly documented limitation if a reliable performance fixture is unavailable.

**Acceptance**
- Each supported seeded fault is detected with reproducible evidence.
- False positives are recorded; tune the detector until the agreed pilot threshold is met.
- Run at least two clean repetitions to measure determinism and deduplication.
- No seeded fault or test data leaks into production code/state.

### T-009 — Pilot report, operating guide and decision gate

Produce a sample report and a Director-readable morning summary: critical/high findings, new/recurring findings, surfaces inspected/skipped, screenshots/evidence links, resource cost, duration, false positives, and recommended next actions.

**Acceptance**
- Pilot results are reviewed before enabling unattended nightly operation.
- Document how to start, stop, inspect artifacts, configure budgets and disable the run.
- Update this plan and plans/INDEX.md with actual evidence; update context/OPEN.md only for unresolved decisions that genuinely need tracking.
- No claim of full coverage or unattended readiness without the acceptance evidence above.

## 6. Rollout gates

1. **Gate A — Audit:** T-001 complete; scope/provider/cost grounded in actual repo.
2. **Gate B — Browser pilot:** T-002/T-003 replay reliably on a safe flow.
3. **Gate C — Detection:** T-004/T-005 pass seeded-defect and dedup tests.
4. **Gate D — Bounded unattended run:** T-006/T-007 lifecycle and safety tests pass.
5. **Gate E — Nightly opt-in:** T-008/T-009 reviewed; Director explicitly authorizes enabling schedule. Shutdown remains a separate policy decision.

Do not skip a gate because the ordinary E2E suite is green.

## 7. Online technical references

- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
- Playwright Trace Viewer: https://playwright.dev/docs/trace-viewer
- Playwright screenshots: https://playwright.dev/docs/screenshots
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- GitHub Actions scheduled workflows: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows

These references inform tool choice; repository contracts and local evidence remain authoritative for implementation.

## 8. Documentation Impact

**REQUIRED** — add this plan to plans/INDEX.md. Update context/OPEN.md only if T-001 reveals unresolved policy decisions that cannot be resolved under existing contracts. Do not introduce new canonical rules before Director review.
