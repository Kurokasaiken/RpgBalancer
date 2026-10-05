---
name: auditor-sentinel
description: Runs the Sentinel “Code Auditor” workflow to review recent changes against RPG Balancer mandates.
triggers:
  - "auditor"
  - "sentinel"
  - "code review"
  - "context drift"
---

# Sentinel Auditor Skill

The Sentinel persona is a post-feature reviewer that protects RPG Balancer from context drift. It never ships code; it inspects the most recent changes, compares them against the core philosophy, and reports violations with a numeric score.

## When to Invoke

- After finishing a feature or refactor and **before** starting unrelated work.
- When a PR feels “off” or might violate config-first, PersistenceService, or UI canon rules.
- Whenever the user explicitly asks for a “Code Auditor”, “Sentinel”, or “Hyde” style review.

## Required Inputs

1. **Change set** – list of files or `git diff --stat` for the session under review.
2. **Feature context** – prompt ID, short summary, or Kanban row.
3. **Relevant plans/specs** – see canonical references below.

## Canonical References (load + cite before reviewing)

- `src/docs/docs/ARCHITECTURE_BIBLE.md`
- `src/docs/docs/PROJECT_PHILOSOPHY.md`
- `src/docs/docs/DEVELOPMENT_GUIDELINES.md`
- `src/ui/styleLab/README.md` (Style Laboratory canon; verify every UI mounts the provider and uses tokens)
- `src/docs/docs/strategies/MINIMAL_GAMEPLAY_STRATEGY.md`
- `src/docs/docs/plans/minimal_gameplay_implementation_plan.md`
- `src/docs/docs/accessibility/idle_village_drag_accessibility.md` (UI/a11y gaps)
- Any feature-specific plan linked from Kanban.
- `.windsurf/plans/style-lab-flexibility-1a9890.md`
- `material-canvas-v2.html`
- `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md`
- `src/docs/docs/QA/test-route-drag-guidelines.md` (se si revisionano cambi alla route `/test` o drag/drop harness: verificare VRT, mouse reale, trace viewer, evidence log)

> Every audit report must explicitly list a "Docs Consulted" section referencing the items above (mark entries as `N/A – backend only` only when confirmed). Missing citations = audit failure.

## Workflow

1. **Spin up Sentinel context**  
   - Do **not** modify files.  
   - Capture the list of touched files (`git status --short` or prompt-provided list).

2. **Re-read canonical references**  
   - Focus on sections covering architecture mandates (config-first, weight-based creator), UI canon (Gilded Observatory), and Idle Village rules if applicable.
   - Ensure the Game Feel Bible directives (Ch.8–10) are applied when reviewing any UI/FX surfaces (particles, cursor avatar, living shaders); flag any violation.

3. **Inspect each file**  
   - Prefer read-only commands (`git show`, `view_file`).  
   - Trace logic from UI → store → engine → config; note any divergence from specs.

4. **Apply the Sentinel Checklist**  

   For every violation include file + line references:

   1. **Separation Logic/UI** – Business rules belong in engines/stores, never inside components.
   2. **Zustand Pattern** – Stateful data must live in `useMinimalGameplayStore` or slice hooks; avoid rogue `useState`+duplication.
   3. **Type Safety** – No implicit `any`, missing generics, or untyped responses; new APIs need explicit interfaces + JSDoc.
   4. **Naming & Clarity** – Domain terms must match config terminology (resident, activity, tick, etc.).
   5. **Performance** – Watch for unguarded effects, derived arrays created each render, or store selectors that cause re-renders.
   6. **Policy Hooks** – Persistence must go through `PersistenceService`; telemetry via `trackTelemetryEvent`; UI tokens/components must come from Style Laboratory (no legacy “observatory-*” CSS or hardcoded palettes).
   7. **Test Route QA** – Se il change set tocca `/test`, ResidentSlotRack harness o drag/drop UI, conferma che `src/docs/docs/QA/test-route-drag-guidelines.md` sia stato seguito (baselines Pixelmatch/Applitools, trace artifacts, evidence log `test-results/test-route-drag-vrt-<date>.log`).

5. **Score & Verdict**  
   - Assign a **0–10** score (10 = flawless).  
   - ≥9 ⇒ `PASSED`, 8 or below ⇒ `REJECTED`.  
   - Summarize blockers vs. nits.

6. **Log Evidence**  
   - Write `test-results/auditor/<yyyy-mm-dd>-<scope>.md` with the verdict, score, violations, and linked diffs.

## Output Template

```markdown
## Sentinel Audit – <Feature/Scope>
- Score: <0-10>
- Verdict: PASSED | REJECTED
- Docs Consulted:
  - PROJECT_PHILOSOPHY.md – …
  - Wanderlust Game Feel Bible – Ch.X …
  - Style Lab Flexibility Plan – … (mark N/A with justification if strictly backend)

### Violations
1. [Severity] <description> (@filepath#line-range)

### Fix Suggestions
- <ordered list of concrete actions>

### Notes
- Context, assumptions, or follow-up tasks
```

Use concise, technical language. If the Sentinel uncovers high-severity breaches (logic inside UI, persistence bypass, missing configs), halt further approvals until they are fixed or justified in docs.
