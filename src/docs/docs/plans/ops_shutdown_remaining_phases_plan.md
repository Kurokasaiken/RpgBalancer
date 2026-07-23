---
title: OPS-SHUTDOWN Remaining Phases (002–009) — Master Plan
status: draft
owner: Strategist
last_reviewed: 2026-07-23
domain: devops / infrastructure
---

# OPS-SHUTDOWN Remaining Phases (002–009) — Master Plan

> **Objective:** Complete the Global Session Shutdown Manager after `OPS-SHUTDOWN-000` (emergency kill switch) and `OPS-SHUTDOWN-001` (legacy audit/cleanup) are verified. Build the remaining 8 phases sequentially, ending with a capability-ownership audit and static guard.
>
> **Supersedes/updates:** `src/docs/docs/plans/global_session_shutdown_manager_plan_v2.md` remains the strategic foundation; this document is the executable rollout plan for the phases that follow `001`.
>
> **Governance:** `.windsurf/rules/50-shutdown-governance.md` is the mandatory baseline. Only `scripts/shutdownManager/shutdownExecutor.ts` may execute shutdown; every other component may only register sessions or request evaluation.

## 1. Current state (post-OPS-SHUTDOWN-001)

| Item | Status |
|---|---|
| `OPS-SHUTDOWN-000` emergency kill switch | ✅ Completed |
| `OPS-SHUTDOWN-001` audit & legacy cleanup | ✅ Completed |
| Legacy shutdown scripts | Archived / neutralised in `archive/legacy_shutdown/` |
| `shutdownSystem()` in guardians | Removed from `commitFailureMonitor.js` and `vercelDeploymentGuard.ts` |
| Active shutdown call sites outside `scripts/shutdownManager/` | 0 (verified by second `grep`) |
| `scripts/shutdownManager/` directory | ❌ Does not exist yet |
| `~/.rpg-shutdown/session-registry.json` | ❌ Does not exist yet |
| `com.rpgbalancer.shutdown-manager.plist` | ❌ Does not exist yet |

## 2. Rollout sequence (strict gating)

| Phase | Prompt | Gating condition before start |
|---|---|---|
| 2 | `OPS-SHUTDOWN-002` | Evidence log `test-results/ops-shutdown-001-audit-<date>.log` exists; zero unauthorized shutdown call sites outside `scripts/shutdownManager/`; `commitFailureMonitor.js` and `vercelDeploymentGuard.ts` no longer call `shutdownSystem`. |
| 3 | `OPS-SHUTDOWN-003` | Registry module compiles; atomic read/write/heartbeat commands work in dry-run. |
| 4 | `OPS-SHUTDOWN-004` | `canShutdown()` unit tests cover the 16-row decision matrix. |
| 5 | `OPS-SHUTDOWN-005` | `getUserIdleMs()` returns a number or `'UNKNOWN'`; `UNKNOWN` blocks shutdown. |
| 6 | `OPS-SHUTDOWN-006` | `shutdownManager.ts` runs and logs decisions every 30s; `com.rpgbalancer.shutdown-manager.plist` loads/unloads correctly; real shutdown is disabled by default. |
| 7 | `OPS-SHUTDOWN-007` | Harness, coordinator, Devin can register/heartbeat/release sessions via wrapper or direct calls. |
| 8 | `OPS-SHUTDOWN-008` | All 16 validation scenarios pass in dry-run and with mock executor. |
| 9 | `OPS-SHUTDOWN-009` | Runbook exists; v1 plan archived; `MASTER_PLAN.md` updated; `npm run shutdown:lint-capability` passes. |

## 3. Phase details

### 3.1 Phase 2 — OPS-SHUTDOWN-002: Global Session Registry

**Goal:** Create the single authoritative aggregated registry at `~/.rpg-shutdown/session-registry.json`.

**Deliverables:**

- Zod-validated JSON registry schema (`version`, `machineId`, `updatedAt`, `projects`, `sessions`, `policy`).
- TypeScript `SessionRegistry` module: atomic read/write, stale-session recovery, lease renewal.
- CLI scripts:
  - `scripts/shutdownManager/registerSession.ts`
  - `scripts/shutdownManager/heartbeatSession.ts`
  - `scripts/shutdownManager/releaseSession.ts`
- Default TTL: 60 seconds; expired heartbeats become `UNKNOWN` (which blocks shutdown).

**Success criteria:**

- Registry file can be created, read, and updated atomically.
- CLI commands succeed from any directory.
- Stale sessions transition to `UNKNOWN`.

**Evidence log:** `test-results/ops-shutdown-002-registry-<date>.log`
**Execution hint:** `verified`

---

### 3.2 Phase 3 — OPS-SHUTDOWN-003: Shutdown Decision Engine

**Goal:** Implement the deterministic `canShutdown()` function and `npm run shutdown:status` diagnostics.

**Deliverables:**

- Pure function:

  ```ts
  interface ShutdownEvaluation {
    allowed: boolean;
    reason: string;
    blockers: Array<{ project: string; session: string; state: SessionState; reason?: string }>;
    userIdleMs?: number | 'UNKNOWN';
    policy: ShutdownPolicy;
  }
  ```

- Logic: `UNKNOWN` user idle → not allowed; any active/unknown session → not allowed; `dryRun` logs `WOULD_SHUTDOWN`; real shutdown only if `shutdownEnabled === true`.
- `npm run shutdown:status` script prints eligibility, blockers, idle duration, and next evaluation.

**Success criteria:**

- `canShutdown()` is pure, deterministic, and unit-tested.
- All 16 matrix rows have explicit test cases.

**Evidence log:** `test-results/ops-shutdown-003-decision-engine-<date>.log`
**Execution hint:** `verified`

---

### 3.3 Phase 4 — OPS-SHUTDOWN-004: macOS User Idle Detection

**Goal:** Provide an independent user-input idle signal.

**Deliverables:**

- Native helper `scripts/shutdownManager/macosIdleSeconds.swift` (IOHIDSystem / IOKit).
- Fallback chain:
  1. Swift helper
  2. `ioreg -c IOHIDSystem` parsing
  3. `UNKNOWN` (no shutdown)
- `node scripts/shutdownManager/getUserIdleMs.ts` returns `number | 'UNKNOWN'`.

**Success criteria:**

- Helper runs on macOS and returns a number, or falls back gracefully.
- `UNKNOWN` is handled by `canShutdown()` as a blocker.

**Evidence log:** `test-results/ops-shutdown-004-idle-detection-<date>.log`
**Execution hint:** `verified`

---

### 3.4 Phase 5 — OPS-SHUTDOWN-005: launchd Supervisor & Shutdown Executor

**Goal:** Run the global manager as a per-user LaunchAgent with a real executor module.

**Deliverables:**

- `scripts/shutdownManager/shutdownManager.ts` daemon:
  - Polls registry every 30 seconds.
  - Calls `canShutdown()`.
  - Logs every decision to `~/.rpg-shutdown/decisions.log`.
  - Pre-check → log → final recheck → execute (if enabled) → verify.
- `com.rpgbalancer.shutdown-manager.plist` LaunchAgent.
- `scripts/shutdownManager/shutdownExecutor.ts`:
  - Primary: `osascript -e 'tell application "System Events" to shut down'`
  - Secondary: `sudo shutdown -h now` only if unattended sudo verified.
  - On failure: log `SHUTDOWN_FAILED` and back off.
- `policy.shutdownEnabled` defaults to `false`; `policy.dryRun` defaults to `true`.

**Success criteria:**

- Manager runs supervised by launchd.
- Real shutdown is disabled by default.
- Executor logs commands and failures; no retry storm.

**Evidence log:** `test-results/ops-shutdown-005-executor-<date>.log`
**Execution hint:** `verified`

---

### 3.5 Phase 6 — OPS-SHUTDOWN-006: Integration with Existing Tools

**Goal:** Make harness, coordinator, and Devin sessions register their state.

**Deliverables:**

- Heartbeat calls in:
  - `scripts/harness/runPrompt.ts`
  - `scripts/harness/dispatch.ts`
  - `coordinator/coordinator.py` or `coordinator_cron_wrapper.sh`
- Shell wrapper `scripts/shutdownManager/session.sh`:
  - `session.sh start --project RPG --session devin-1 --state RUNNING`
  - `session.sh heartbeat --project RPG --session devin-1`
  - `session.sh complete --project RPG --session devin-1 --state COMPLETED`
  - `session.sh clear` (operator override for stale entries)

**Success criteria:**

- Existing tools send heartbeats during work.
- Manual wrapper works from any project directory.
- Unregistered long-lived processes do not block shutdown unless they register.

**Evidence log:** `test-results/ops-shutdown-006-integration-<date>.log`
**Execution hint:** `verified`

---

### 3.6 Phase 7 — OPS-SHUTDOWN-007: Validation Matrix

**Goal:** Run all 16 required scenarios before enabling real shutdown.

**Deliverables:**

- Test harness that runs each scenario with `DRY_RUN=true`, then with a mock executor that captures the command without executing.
- 16 scenarios covering RUNNING, IDLE, COMPLETED, WAITING_FOR_USER, BLOCKED, QUEUED, UNKNOWN, expired heartbeat, user idle, filesystem ignored, Git ignored, harness active, coordinator active, Vite unregistered, shutdown failure, and `canShutdown()` correctness.

**Success criteria:**

- All 16 scenarios pass in dry-run.
- All 16 scenarios pass with mock executor.
- No real shutdown occurs during tests.

**Evidence log:** `test-results/ops-shutdown-007-validation-matrix-<date>.log`
**Execution hint:** `verified`

---

### 3.7 Phase 8 — OPS-SHUTDOWN-008: Documentation & Governance

**Goal:** Document the new system and archive the old plan.

**Deliverables:**

- `src/docs/docs/operations/global_shutdown_manager_runbook.md`
- Archive `global_session_shutdown_manager_plan.md` (v1) to `archive/plans/global_session_shutdown_manager_plan_v1.md`
- Update `MASTER_PLAN.md` with a link to the v2 plan and this rollout plan.
- Update `src/docs/docs/coordinator/strategy_tasks.md` to mark `OPS-SHUTDOWN` stream complete.
- Final `npm run kanban:lint` and evidence log.

**Success criteria:**

- Runbook is accurate and covers normal operation, troubleshooting, and emergency disable.
- Old plan is archived without breaking links.
- Kanban lint passes.

**Evidence log:** `test-results/ops-shutdown-008-docs-<date>.log`
**Execution hint:** `assisted`

---

### 3.8 Phase 9 — OPS-SHUTDOWN-009: Capability Ownership Audit & Static Guard

**Goal:** Prove exactly one shutdown capability owner exists and prevent regressions.

**Deliverables:**

- Final repository-wide scan: only `scripts/shutdownManager/shutdownExecutor.ts` executes shutdown.
- Static guard `scripts/shutdownManager/lintCapabilityOwnership.ts` (or shell equivalent) that fails if any of the following appear outside `scripts/shutdownManager/`:
  - `shutdown -h now`, `sudo shutdown`, `poweroff`, `halt`, `pmset sleepnow`, `osascript` + `shut down`, `System Events` + `shut down`
- Wire guard into `npm run lint` or as `npm run shutdown:lint-capability` in `package.json`.
- Update `.windsurf/rules/50-shutdown-governance.md` if new patterns are discovered.

**Success criteria:**

- Guard passes in CI and locally.
- No legacy wrapper names (e.g. `auto_shutdown_*.sh`, `*spegnimento*`) exist in active paths.
- Final evidence log produced.

**Evidence log:** `test-results/ops-shutdown-009-capability-audit-<date>.log`
**Execution hint:** `verified`

## 4. Common guardrails

### 4.1 Invariants

- `.windsurf/rules/50-shutdown-governance.md` — only the Global Shutdown Manager may execute shutdown.
- Real shutdown is disabled by default (`policy.shutdownEnabled === false`).
- Dry-run mode must be verified before real shutdown is enabled.
- `UNKNOWN` user idle or expired heartbeat blocks shutdown (fail-closed).

### 4.2 Forbidden actions (all phases)

- Do NOT call `shutdown`, `poweroff`, `halt`, `pmset sleep`, `osascript` shutdown, or `sudo shutdown -h now` outside `shutdownExecutor.ts`.
- Do NOT enable `policy.shutdownEnabled === true` before `OPS-SHUTDOWN-007` passes.
- Do NOT delete `~/.rpg-shutdown/session-registry.json` unless recovering from corruption.
- Do NOT make filesystem writes, Git dirty state, or CPU usage a shutdown criterion.

### 4.3 Safeguards per phase

Every phase must run and pass:

| Safeguard | Scope | Timeout |
|---|---|---|
| `npm run lint -- <scope>` | Changed files in `scripts/shutdownManager/` and related package scripts | 120s |
| `npm run test -- <scope>` | Unit tests for registry, decision engine, idle detection, validation matrix | 300s |
| `npm run build:check` | Full repo build check | 180s |
| `npm run kanban:lint` | Kanban validation | 30s |

## 5. Definition of done for the entire stream

- [ ] `OPS-SHUTDOWN-002` registry works from any project directory.
- [ ] `OPS-SHUTDOWN-003` `canShutdown()` returns `{ allowed, reason, blockers[], userIdleMs, policy }` and is fully unit-tested.
- [ ] `OPS-SHUTDOWN-004` user idle detection returns `number | 'UNKNOWN'`; `UNKNOWN` blocks shutdown.
- [ ] `OPS-SHUTDOWN-005` `shutdownManager.ts` supervised by `com.rpgbalancer.shutdown-manager.plist`; real shutdown disabled by default.
- [ ] `OPS-SHUTDOWN-006` harness/coordinator/Devin integrate via session registration and heartbeat.
- [ ] `OPS-SHUTDOWN-007` all 16 validation scenarios pass in dry-run and with mock executor.
- [ ] `OPS-SHUTDOWN-008` runbook exists, v1 plan archived, `MASTER_PLAN.md` updated.
- [ ] `OPS-SHUTDOWN-009` `npm run shutdown:lint-capability` passes and prevents regressions.
- [ ] `.windsurf/rules/50-shutdown-governance.md` invariant is enforced.

## 6. Handoff to coordinator

1. Use this master plan as the source of truth for `OPS-SHUTDOWN-002` through `OPS-SHUTDOWN-009`.
2. Dispatch `OPS-SHUTDOWN-002` first; do **not** queue later phases until the gating condition for each is verified.
3. For each phase, generate or reuse a `prompts/OPS-SHUTDOWN-NNN.spec.json` file that references this plan and the v2 strategic plan.
4. After each phase, update `src/docs/docs/coordinator/agent_assignments.md` and `coordinator/manual-dispatch/queue.json`.
5. Maintain `test-results/ops-shutdown-NNN-<artifact>-<date>.log` evidence logs.

---
End of plan.
