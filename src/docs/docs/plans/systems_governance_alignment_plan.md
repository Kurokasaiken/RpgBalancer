# Systems Governance Alignment Plan

**Status:** Implemented — governance scaffolding complete; contract tests for certified kits still failing  
**Goal:** Ensure every a-priori system (i18n, skin, frozen kits, documentation governance, persistence, telemetry, config-first) is encoded in the shared baseline (`.windsurf/rules/` + skills), and that every existing/future component follows those rules.

## Executive Summary

The codebase has already implemented the **Frozen Kits** (a.k.a. "brik") system, the **i18n** pipeline, the **skin** system, and **documentation governance**. However, two of these systems are **not yet in the `.windsurf/rules/` layer** — they live only in plan docs and code comments. This means an agent can currently create a new component or modify a frozen component without being forced by the baseline to respect the kit/doc contract.

This plan fixes that by:

1. Registering **Frozen Kits** and **Documentation Governance** as `.windsurf/rules/` (auto-registered for the Strategist/Coordinator).
2. Updating **all skills** to enforce these new systems.
3. Auditing `COMPONENT_MASTER_INDEX.md` vs `KIT_REGISTRY` vs runtime.
4. Creating a conformance checklist for existing components.
5. Producing a backlog of small, parallel prompts to bring the codebase into full compliance.

## 1. Reconnaissance — what is already in place

| System | Implementation | Registered in `.windsurf/rules/` | Registered in skills |
| ------ | -------------- | --------------------------------- | -------------------- |
| i18n / localization | `react-i18next`, `@/localization/i18n`, `i18n:extract/validate/build-pseudo` | ✅ `00-project-invariants.md` + `10-ui-invariants.md` | ✅ `idle-village-task` |
| Skin system | `useSkinPreferences`, `DEFAULT_SKIN_PRESET_ID`, `skinConfigRegistry`, Style Lab tokens | ✅ `10-ui-invariants.md` | ✅ `idle-village-task` |
| Frozen Kits ("brik") | `src/ui/idleVillage/frozen/**`, `KitShell`, `withKitShell`, `KIT_REGISTRY`, `scripts/freeze-kit.ts`, `tests/contract/minimal-vs-test.spec.ts`, `TestHub` | ❌ | ❌ |
| Documentation Governance | `DOCUMENTATION_GOVERNANCE.md`, `COMPONENT_MASTER_INDEX.md`, `src/docs/docs/idle_village/trusted/*_trusted.md` | ❌ | ❌ |
| Persistence | `PersistenceService` (async) | ✅ `00-project-invariants.md` + `20-config-persistence.md` | ✅ `idle-village-task` |
| Config-first + Zod | `src/balancing/config/**` | ✅ `00-project-invariants.md` + `20-config-persistence.md` | ✅ `idle-village-task` |
| Telemetry | `trackTelemetryEvent` | ✅ `10-ui-invariants.md` (mentioned) | ✅ `idle-village-task` |
| Drag & drop | `@dnd-kit` only | ✅ `10-ui-invariants.md` | ✅ `idle-village-task` |

**Key files for the plan:**

- `src/ui/idleVillage/frozen/registry.ts` — `KIT_REGISTRY` single source of truth.
- `src/ui/idleVillage/frozen/_infra/KitShell.tsx` — smart auto-provider wrapper.
- `src/ui/idleVillage/frozen/kits/index.ts` — one-line public barrel export.
- `src/ui/idleVillage/TestHub.tsx` — TestHub generated from `KIT_REGISTRY.hub`.
- `tests/contract/minimal-vs-test.spec.ts` — contract sweep for certified kits.
- `scripts/freeze-kit.ts` — generator for new kits.
- `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` — component index.
- `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` — governance rules.
- `src/docs/docs/plans/component_freezing_certification_plan_v2.md` — full design doc.

## 2. Gaps found

- **G1 — Missing rule for Frozen Kits.** A new `src/ui/idleVillage/**/*.tsx` component is not required by any `.windsurf/rules/` to be exported via a frozen kit, to have a `KitShell` provider chain, or to be listed in `KIT_REGISTRY`.
- **G2 — Missing rule for Documentation Governance.** A change to a `trusted`/`frozen` component does not have an always-on rule forcing the agent to update the corresponding trusted doc and `COMPONENT_MASTER_INDEX.md`.
- **G3 — Skills are not updated.** `coordinator/skills/strategist-mandate/SKILL.md`, `coordinator/skills/coordinator-mandate/SKILL.md`, `coordinator/skills/agent-execution-mandate/SKILL.md`, and `coordinator/skills/idle-village-task/SKILL.md` do not mention frozen kits or documentation governance in their checklists.
- **G4 — `COMPONENT_MASTER_INDEX.md` drift.** Last certified dates are mostly 2026-04-xx, while the code has moved to frozen kits and `interaction_core` (2026-07-12). The index does not list `KIT_REGISTRY` status.
- **G5 — `TestHub` has `EXTRA_PAGES` not in registry.** Some test pages are still manually listed in `TestHub.tsx` instead of being backed by `KIT_REGISTRY` entries.
- **G6 — `tests/contract/minimal-vs-test.spec.ts` only runs on certified kits with `contract`.** Draft kits have no contract enforcement, so they can drift from `/test` without CI failure.

## 3. Scope

This plan **does NOT implement gameplay features**. It only changes the shared baseline and the documentation that describes the systems. It is governance infrastructure.

In scope:

- New/updated `.windsurf/rules/` files.
- Updated `coordinator/skills/` files (versioned source of truth for agent skills).
- Audit of `COMPONENT_MASTER_INDEX.md` and `KIT_REGISTRY`.
- A conformance checklist for components.
- A backlog of prompts to align existing components (produced by the Coordinator, not this plan).

Out of scope:

- Refactoring individual components (covered by follow-up prompts).
- New features.

## 4. Deliverables

### A) New `.windsurf/rules/` files

1. `.windsurf/rules/30-frozen-kits.md` — `glob` trigger: `src/ui/idleVillage/frozen/**`, `src/ui/idleVillage/**/*.tsx`, `src/pages/minimal-*.tsx`.  
   Content:
   - Every new Idle Village component must be added as a frozen kit, extend an existing kit, or have a tracked exception in `src/docs/docs/idle_village/EXCEPTIONS.md`.
   - Public consumers import from `src/ui/idleVillage/frozen/kits/index.ts` (one-line barrel).
   - Each kit must have a `KitShell`/`withKitShell` provider chain so it is self-contained and provider-safe.
   - Draft kits must be in `KIT_REGISTRY` with `status: 'draft'` and a `docPath`; they are not contract-guaranteed and may change without a version bump.
   - Certified kits must have a `contract`, `certManifestPath`, `docPath`, and `hub` entry in `KIT_REGISTRY`; they are immutable unless the kit version is bumped.
   - New minimal pages must be reflected in `KIT_REGISTRY.hub` so `TestHub` stays generated.
   - Contract sweep `tests/contract/minimal-vs-test.spec.ts` must pass for all certified kits.

2. `.windsurf/rules/40-documentation-governance.md` — `always_on` (or `glob` on `src/docs/docs/idle_village/**` + `src/docs/docs/**/*.md`).  
   Content:
   - Every `trusted`/`frozen` component must have a single `*_trusted.md` doc and an entry in `COMPONENT_MASTER_INDEX.md`.
   - Changing a component's behavior, visual contract, runtime contract, or source-of-truth usage requires updating the trusted doc, the master index, and producing evidence.
   - No documentation closure without runtime verification (build, lint, contract, RTL/Playwright, evidence log).
   - No duplication of contracts in general docs.
   - Canonical statuses: `draft`, `candidate`, `trusted`, `frozen`, `deprecated`.

3. Update `00-project-invariants.md` §"This layer is the shared baseline" to list Frozen Kits and Documentation Governance as examples of mandatory a-priori systems.

### 4. Command timeout policy

Every command that an agent, the Strategist, or the Coordinator invokes must have a maximum runtime. Default values are:

- `kanban:lint`: 30s
- `npm run lint -- <scope>`: 120s
- `npm run build:check` / `npm run build`: 180s
- `npm run test -- <scope>`: 300s
- `harness:run` per task: 600s
- `harness:dispatch` total: 1800s

If a command exceeds its timeout, stop it, log the event, and treat it as a failure. The Strategist must scope plans so that no command runs longer than its maximum; the Coordinator must run the harness with `--timeout`; and the Agent must not re-run hanging commands without narrowing scope or switching approach.

### B) Updated `coordinator/skills/` files

- `coordinator/skills/strategist-mandate/SKILL.md` — add Frozen Kits and Documentation Governance to the auto-registration examples and to the "before drafting" research checklist; codify the **handoff prompt** that the Strategist must paste into the chat for the user to copy into a Coordinator session; add **research & senior perspective**, **ask for feedback on uncertainty**, and **always reference and update plans** as responsibilities.
- `coordinator/skills/coordinator-mandate/SKILL.md` — add: verify every prompt that touches a trusted/frozen component references the trusted doc update; check `KIT_REGISTRY` alignment; **mandate execution** after `prompt:check` and file audit; add **research & senior perspective**, **ask for feedback on uncertainty**, and **plan-update audit** as responsibilities; add explicit note that `harness:run` and `harness:dispatch` are already configured in `package.json` and the Coordinator must not claim they are missing.
- `00-project-invariants.md` and `40-documentation-governance.md` — add **plan synchronization** rule: plans must be referenced before drafting and updated automatically when implementation changes.
- `coordinator/skills/agent-execution-mandate/SKILL.md` — add: if the task changes a trusted/frozen component, update the trusted doc and `COMPONENT_MASTER_INDEX.md` before marking complete.
- `coordinator/skills/idle-village-task/SKILL.md` — add: use frozen kits (`@/ui/idleVillage/frozen/kits`); create new kits via `npm run freeze:kit <KitName>`; add `hub` metadata; keep `TestHub` generated.

### C) Audit of `COMPONENT_MASTER_INDEX.md` vs `KIT_REGISTRY`

- Compare every `trusted` entry in `COMPONENT_MASTER_INDEX.md` with the corresponding `KIT_REGISTRY` status.
- Identify missing `kitId` entries, missing `trusted.md` files, and outdated `last certified` dates.
- Output a `COMPONENT_MASTER_INDEX_AUDIT.md` table.

### D) Component conformance checklist

For every component in `TestHub` or `KIT_REGISTRY`, verify:

1. Is it in `KIT_REGISTRY`?
2. Is it exported from `src/ui/idleVillage/frozen/kits/index.ts`?
3. Does it have a `KitShell`/`withKitShell` wrapper (or consume one)?
4. Does it have a `*_trusted.md` doc?
5. Is it in `COMPONENT_MASTER_INDEX.md`?
6. Is it i18n-free (no hardcoded strings)?
7. Does it use the default skin system?
8. Does it use `trackTelemetryEvent` for interactions?
9. Does it have a contract test (certified) or a drafted contract (draft)?

### E) Automated governance checks (rules-as-code)

`GOV-008` is not a manual audit; it must be a deterministic gate that returns a non-zero exit code and actionable messages.

- Create `scripts/validate-systems.ts` that checks:
  - Every `trusted`/`frozen` component appears in `COMPONENT_MASTER_INDEX.md` and `KIT_REGISTRY`.
  - Every `*_trusted.md` file exists and is not empty.
  - No duplicate contract definitions in general docs.
  - `tests/contract/minimal-vs-test.spec.ts` passes for all certified kits.
  - `EXCEPTIONS.md` (if present) is well-formed and all exceptions are tracked.
- Gate returns exit code `1` on failure with a machine-readable report.
- Add unit tests for `validate-systems.ts` under `tests/unit/harness/validateSystems.test.ts`.
- Wire `validate:systems` into `package.json` and CI (as a non-blocking step until GOV-001..GOV-007 are complete, then blocking).
- Add CI step for `tests/contract/minimal-vs-test.spec.ts`.

### F) Exception path for non-kit components

The clause "documented exception" in `30-frozen-kits.md` must be strict:

- `src/docs/docs/idle_village/EXCEPTIONS.md` is the single source of truth for kit exceptions.
- Each exception row contains: `kitId`-or-component, `reason`, `owner`, `review date`, and `Kanban task ID`.
- `kanban:lint` or `validate:systems` must validate that every exception in `EXCEPTIONS.md` is referenced and still active.
- Frozen-kit-exception label is recommended for PR review.

### G) Runtime verification criteria

Documentation closure is only allowed after all of the following are green:

1. `npm run build:check` passes.
2. `npm run lint -- <scope>` passes.
3. `tests/contract/minimal-vs-test.spec.ts` passes for the affected certified kit.
4. Relevant RTL/Playwright tests pass.
5. Evidence log is written to `test-results/<TASK_ID>-harness-<TIMESTAMP>.log`.

## 5. Proposed prompts (Kanban-ready)

These prompts are intentionally small, parallelizable, and max 2-3 files each. The Coordinator will expand them into full prompt prose.

| Prompt ID | Title | Scope | Dependencies | Files |
| --------- | ----- | ----- | ------------ | ----- |
| `GOV-001` | Add Frozen Kits rule to `.windsurf/rules/` | Create `.windsurf/rules/30-frozen-kits.md` and update `00-project-invariants.md` examples. | None | `.windsurf/rules/30-frozen-kits.md`, `00-project-invariants.md` |
| `GOV-002` | Add Documentation Governance rule to `.windsurf/rules/` | Create `.windsurf/rules/40-documentation-governance.md`. | `GOV-001` | `.windsurf/rules/40-documentation-governance.md` |
| `GOV-003` | Update `strategist-mandate` and `coordinator-mandate` skills | Add Frozen Kits + Documentation Governance to auto-registration and research; codify the Strategist handoff prompt and the Coordinator execution mandate. | `GOV-001`, `GOV-002` | `coordinator/skills/strategist-mandate/SKILL.md`, `coordinator/skills/coordinator-mandate/SKILL.md` |
| `GOV-004` | Update `agent-execution-mandate` and `idle-village-task` skills | Add Frozen Kits + trusted-doc update to execution flow. | `GOV-001`, `GOV-002` | `coordinator/skills/agent-execution-mandate/SKILL.md`, `coordinator/skills/idle-village-task/SKILL.md` |
| `GOV-005` | Audit `COMPONENT_MASTER_INDEX.md` vs `KIT_REGISTRY` | Produce `COMPONENT_MASTER_INDEX_AUDIT.md` with missing/obsolete entries. | `GOV-002` | `COMPONENT_MASTER_INDEX.md` (read), `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX_AUDIT.md` (new) |
| `GOV-006` | Update `COMPONENT_MASTER_INDEX.md` from audit | Apply audit findings; set `last certified` and status to match `KIT_REGISTRY`. | `GOV-005` | `COMPONENT_MASTER_INDEX.md` |
| `GOV-007` | Migrate `TestHub` `EXTRA_PAGES` into `KIT_REGISTRY` | Apply the decision matrix in §5.1 to every `EXTRA_PAGES` entry: add kit candidates as `draft`, merge duplicates into existing kits, deprecate obsolete pages, keep deliberate non-kit pages in `EXTRA_PAGES`. | `GOV-001` | `src/ui/idleVillage/TestHub.tsx`, `src/ui/idleVillage/frozen/registry.ts` |
| `GOV-008` | Add systems governance lint script | Create `scripts/validate-systems.ts` as a deterministic executable gate with non-zero exit code, actionable output, and unit tests. | `GOV-005`, `GOV-006` | `scripts/validate-systems.ts`, `tests/unit/harness/validateSystems.test.ts`, `package.json` |

### 5.1 Decision matrix for `TestHub` `EXTRA_PAGES`

The migration must not blindly convert every extra page into a kit. Use the following matrix:

| Category | Current `EXTRA_PAGES` id | Destination / Action | Rationale |
| --- | --- | --- | --- |
| Merge into existing kit | `slot` | Absorb into `slotRackKit` | Slot functionality is already owned by the certified `slotRackKit`. |
| Kit candidate | `roster-slot-integration` | New `rosterSlotKit` (draft) | Integration surface worth freezing. |
| Kit candidate | `job-poi-roster` | New `jobPoiRosterKit` (draft) | Integration surface worth freezing. |
| Kit candidate | `job-poi-roster-time` | New `jobPoiRosterTimeKit` (draft) | Integration surface worth freezing. |
| Deprecate | `quest-detail-legacy` | Remove from `EXTRA_PAGES` after archiving | Superseded by newer quest components. |
| Deprecate | `v8-skin-sandbox` | Remove from `EXTRA_PAGES` after archiving | V8 skin architecture is superseded. |
| Keep as non-kit | `v9-skin-sandbox` | Remain in `EXTRA_PAGES` | Visual sandbox page, not a component kit. |
| Keep as non-kit | `poi-detail` (`/poi-detail-verification`) | Remain in `EXTRA_PAGES` | Verification harness, not a production kit. |
| TBD | `poi-quest-detail-roster-integration`, `poi-job-detail-roster-integration` | Decide in `GOV-007` using the same matrix | Integration pages; candidate for merge or deprecation. |

## 6. Dependencies and waves

```text
Wave 1: GOV-001, GOV-002 (rules layer)
Wave 2: GOV-003, GOV-004 (skills) — depends on Wave 1
Wave 3: GOV-005 (audit) — depends on Wave 2
Wave 4: GOV-006, GOV-007, GOV-008 (alignment + tooling) — depends on Wave 3
```

## 7. Success criteria

- `.windsurf/rules/` contains explicit, always-on/glob-scoped rules for Frozen Kits and Documentation Governance.
- All `coordinator/skills/` mention the new systems in their checklists.
- `COMPONENT_MASTER_INDEX.md` is aligned with `KIT_REGISTRY` and the runtime.
- `TestHub` `EXTRA_PAGES` is empty or only contains deliberate non-kit pages with documented justification.
- `scripts/validate-systems.ts` exits 0 and has unit test coverage.
- `tests/contract/minimal-vs-test.spec.ts` passes for all certified kits.
- `npm run lint -- .windsurf/rules` passes.
- `npm run build:check` passes.
- `npm run kanban:lint` passes.
- `prompts/GOV-*.md` or `prompts/GOV-*.spec.json` are dispatchable via `harness:dispatch` (`.spec.json` preferred, `.md` fallback).

## 8. Change log

- 2026-07-14 — Plan drafted by Strategist. Identifies Frozen Kits and Documentation Governance as the two missing rule-file registrations.
- 2026-07-14 — Senior-engineer review integrated: decision matrix for GOV-007, strict exception path, deterministic `validate:systems` gate, runtime verification criteria, and `dispatch.ts` `.spec.json` support.
- 2026-07-14 — Waves 1-4 executed: `.windsurf/rules/30-frozen-kits.md`, `.windsurf/rules/40-documentation-governance.md`, skill updates, `COMPONENT_MASTER_INDEX.md` aligned, `TestHub` extra pages migrated, `scripts/validate-systems.ts` with `validate:systems` npm script and unit tests. `tests/contract/minimal-vs-test.spec.ts` still fails for rosterKit, pgcardKit, slotRackKit; tracked as known debt.
