---
title: Global Session Shutdown Manager — Strategic Plan v2
status: draft
owner: Strategist
last_reviewed: 2026-07-22
domain: devops / infrastructure
---

# Global Session Shutdown Manager — Strategic Plan v2

> **Objective:** Replace the fragmented legacy auto-shutdown / auto-commit / auto-push mechanisms with exactly one project-aware, session-aware, fail-closed global shutdown manager for the user's macOS development environment.
>
> **Supersedes:** `src/docs/docs/plans/global_session_shutdown_manager_plan.md` (v1). v1 will be archived in OPS-SHUTDOWN-008.

## 1. Critique of Plan v1 (ChatGPT-style)

Plan v1 was a solid architectural starting point, but the user's feedback exposes four issues that make it risky to execute as written:

1. **Phase 0 was too gentle.** It proposed to "rename or remove" `auto-commit-push-shutdown.sh`. The script is currently active and has already committed 211 files + attempted shutdown. The first action must be a **kill switch** that neutralizes every execution path (running process, cron, launchd, other scripts) before any file is deleted.
2. **Registry was described as the source of truth.** The registry is better understood as an **aggregated runtime view** derived from the processes that register sessions. The real source of truth for each session is the live process that sends heartbeats.
3. **No final capability ownership audit.** Plan v1 ended at documentation. The user correctly adds a final phase (`OPS-SHUTDOWN-009`) that proves no other code path can execute shutdown, plus a static guard to prevent regressions.
4. **`canShutdown()` was underspecified.** It should be a pure, deterministic, testable function that returns a structured result (`allowed`, `reason`, `blockers[]`), not just a boolean.
5. **Idle detection hierarchy was not explicit.** The fallback chain must be: native helper → `ioreg` → `UNKNOWN` → **NO SHUTDOWN**.
6. **launchd role was ambiguous.** launchd is the supervisor of the manager; it is not the manager itself, and it must not independently trigger shutdown.
7. **Tool integration was vague.** The harness, coordinator, and Devin sessions must explicitly register state; the manager must not guess activity from filesystem or CPU.

## 2. Canonical Model: Machine > Project > Session

```text
MACHINE
├── PROJECT A (RPG)
│   ├── SESSION devin-1
│   ├── SESSION harness-A
│   └── SESSION coordinator-A
├── PROJECT B (AI Project Initializer)
│   ├── SESSION devin-2
│   └── SESSION test-runner
└── GLOBAL SHUTDOWN MANAGER
    ├── reads ~/.rpg-shutdown/session-registry.json (aggregated view)
    ├── reads user idle state
    ├── evaluates canShutdown()
    └── executes shutdown (only if allowed)
```

- Each **project** is autonomous and declares its own session states.
- The **global manager** never inspects filesystem writes, Git dirty state, CPU usage, or coordinator log writes to infer state.
- A **session** must explicitly register and heartbeat. A missing/expired heartbeat becomes `UNKNOWN`, and `UNKNOWN` blocks shutdown.

## 3. Audit Findings (Runtime Snapshot 2026-07-22)

| Mechanism | Location | Status | Risk |
|-----------|----------|--------|------|
| `auto-commit-push-shutdown.sh` | repo root | **ACTIVE — DANGEROUS** | Has auto-committed 211 files, pushed to main, and attempted shutdown on 2026-07-13. Must be neutralized immediately. |
| `auto-commit-only.sh` | repo root | active | Auto-commits only, no shutdown, but shares guardian code. |
| `scripts/autoCommit/commitFailureMonitor.js` | `scripts/autoCommit/` | active | Calls `shutdownSystem()` on commit/push/guardian failure. |
| `scripts/guardian/vercelDeploymentGuard.ts` | `scripts/guardian/` | active | Calls `shutdownSystem()` after deploy success/failure. |
| `ai-worker/autospegnimento.sh` + `ai-worker/coordinator_watch.py` | `ai-worker/` | legacy | Polls a kanban file; calls `sudo shutdown` / `osascript` if idle. |
| `test_shutdown_verification.sh` | repo root | orphan | References non-existent `shutdown_when_done.sh`; does filesystem mtime polling. |
| `shutdown_when_done.log` / `shutdown.log` / `shutdown.pid` | repo root | stale artifacts | `shutdown.pid` (30365) not running; logs historical. |
| `com.kurokasaiken.rpg-coordinator.plist` | `~/Library/LaunchAgents/` | installed, not running | Runs `coordinator/coordinator_cron_wrapper.sh` every 10 min; not shutdown itself but can dispatch. |
| `com.rpgbalancer.auto-snapshot.plist` | repo root (not loaded) | inactive | Snapshot agent only. |
| `crontab` | user | empty | — |
| `.zshrc` | user | no shutdown refs | — |

## 4. Guiding Principles

1. **Kill switch before cleanup.** Neutralize the active dangerous script before auditing or deleting anything. No `git reset`, `git clean`, automatic commit, or automatic push during Phase 0.
2. **Fail closed.** Any unreadable registry, unknown session, expired heartbeat, missing user-idle data, or unverified capability blocks shutdown.
3. **One capability owner.** Only `scripts/shutdownManager/shutdownExecutor.ts` may execute machine shutdown. All other code may only register state or request evaluation.
4. **Registry is an aggregated runtime view, not a source of truth.** Each session's source of truth is the live process that registers and heartbeats it.
5. **Project-aware, not filesystem-aware.** Sessions register semantic state; filesystem writes, CPU, and logs are ignored as shutdown criteria.
6. **Git is project-local.** Auto-commit and auto-push are opt-in per-project policies. Git dirty state is never a global shutdown blocker.
7. **Dry-run default.** Real shutdown is disabled until explicitly enabled and validated.
8. **Observable.** `npm run shutdown:status` explains every blocker in plain text.
9. **Rule registration and static enforcement.** A `.windsurf/rules/` invariant and a static guard prevent new shutdown scripts.
10. **launchd is supervisor, not manager.** launchd runs the global manager; it does not independently trigger shutdown.

## 5. Phased Plan

### Phase 0 — OPS-SHUTDOWN-000: Emergency Kill Switch (IMMEDIATE)

**Goal:** Neutralize `auto-commit-push-shutdown.sh` immediately. Do not delete it yet.

- Verify the script is not running. If it is running, terminate it.
- Verify no cron entry, launchd job, shell profile, or other script invokes it.
- Neutralize it by renaming to `archive/legacy_shutdown/auto-commit-push-shutdown.sh.DISABLED` or equivalent, so it cannot be accidentally started.
- Create `SHUTDOWN_DISABLED.sentinel` in repo root with a human-readable warning and timestamp.
- Write evidence log `test-results/ops-shutdown-000-emergency-<date>.log`.

**Explicitly forbidden in this phase:**

- `git reset --hard`
- `git clean -fd`
- automatic `git commit` or `git push`
- deleting the script (that happens in Phase 1)
- touching unrelated files

**Deliverable prompt:** `OPS-SHUTDOWN-000`
**Execution hint:** `atomic` (3-5 files, no logic, kill + rename + sentinel)

---

### Phase 1 — OPS-SHUTDOWN-001: Complete Audit & Legacy Cleanup

**Goal:** Enumerate and remove all legacy mechanisms.

- Search the entire filesystem and repository for every shutdown / poweroff / halt / `pmset` / `osascript` shutdown / `sudo shutdown` / auto-commit / auto-push / idle watcher reference.
- Delete or archive:
  - `ai-worker/autospegnimento.sh`
  - `ai-worker/coordinator_watch.py`
  - `ai-worker/start_coordinator_watch.sh`
  - `ai-worker/README_WATCH.md`
  - `ai-worker/last_activity.json`
  - the now-disabled `auto-commit-push-shutdown.sh`
  - `test_shutdown_verification.sh`
  - `shutdown.log`, `shutdown_when_done.log`, `shutdown.pid`
  - `src/docs/docs/operations/guardian_autopush_mandate.md` or mark it deprecated
- Strip shutdown calls from:
  - `scripts/autoCommit/commitFailureMonitor.js`
  - `scripts/guardian/vercelDeploymentGuard.ts`
  These components may log `SHUTDOWN_CAPABILITY_NOT_OWNED` or exit, but must not execute shutdown.
- Unload `com.kurokasaiken.rpg-coordinator.plist` if it is confirmed only legacy; otherwise keep under new contract.
- Run a second search and classify every remaining reference as `intentional-doc`, `active-new-system`, or `false-positive`.

**Deliverable prompt:** `OPS-SHUTDOWN-001`
**Execution hint:** `verified` (multi-file, safeguards required)

---

### Phase 2 — OPS-SHUTDOWN-002: Global Session Registry

**Goal:** Create the single authoritative aggregated registry.

- Design a Zod-validated JSON registry schema:
  - `version`, `machineId`, `updatedAt`
  - `projects.<id>.status` (derived from sessions)
  - `projects.<id>.sessions.<id>` with `pid`, `heartbeatAt`, `state`, `blockingReason`, `owner`, `ttlSeconds`
  - `policy` with `dryRun`, `userIdleThresholdSeconds`, `shutdownEnabled`
- Store registry under `~/.rpg-shutdown/session-registry.json` (machine-global, outside any project).
- Provide a TypeScript `SessionRegistry` module with atomic read/write, stale-session recovery, and lease renewal.
- Provide CLI commands:
  - `node scripts/shutdownManager/registerSession.ts --project RPG --session devin-1 --state RUNNING`
  - `node scripts/shutdownManager/heartbeatSession.ts --project RPG --session devin-1`
  - `node scripts/shutdownManager/releaseSession.ts --project RPG --session devin-1 --state COMPLETED`
- Default TTL: 60 seconds; expired heartbeats transition to `UNKNOWN` (not `IDLE`).

**Deliverable prompt:** `OPS-SHUTDOWN-002`
**Execution hint:** `verified`

---

### Phase 3 — OPS-SHUTDOWN-003: Shutdown Decision Engine

**Goal:** Implement the deterministic `canShutdown()` function and `shutdown:status` diagnostics.

- Implement a pure, testable function:

```ts
interface ShutdownEvaluation {
  allowed: boolean;
  reason: string;
  blockers: Array<{
    project: string;
    session: string;
    state: SessionState;
    reason?: string;
  }>;
  userIdleMs?: number | 'UNKNOWN';
  policy: ShutdownPolicy;
}

function canShutdown(
  registry: SessionRegistry,
  userIdleMs: number | 'UNKNOWN',
  policy: ShutdownPolicy
): ShutdownEvaluation;
```

- Logic:
  - If `userIdleMs === 'UNKNOWN'` → not allowed, reason `USER_IDLE_UNKNOWN`.
  - If `userIdleMs < policy.userIdleThresholdSeconds * 1000` → not allowed.
  - For each project/session:
    - `STARTING`, `RUNNING`, `WAITING_FOR_USER`, `BLOCKED`, `QUEUED`, `FAILED`, `STOPPING`, `UNKNOWN` → add to `blockers` and not allowed.
    - `IDLE` or `COMPLETED` → ok.
  - If all safe and `policy.shutdownEnabled === true` and `policy.dryRun === false` → allowed.
  - If `policy.dryRun === true` → `allowed = true` but the executor logs `WOULD_SHUTDOWN` and does not execute.
- Implement `npm run shutdown:status` script that prints `Eligible: YES/NO`, projects, sessions, user idle duration, blockers, and next evaluation time.

**Deliverable prompt:** `OPS-SHUTDOWN-003`
**Execution hint:** `verified`

---

### Phase 4 — OPS-SHUTDOWN-004: macOS User Idle Detection

**Goal:** Add a reliable, independent user-input idle signal.

- Implement a native macOS helper in `scripts/shutdownManager/macosIdleSeconds.swift`.
- Fallback chain:
  1. Native Swift helper (IOHIDSystem / IOKit)
  2. `ioreg -c IOHIDSystem` parsing
  3. `UNKNOWN` (which means **NO SHUTDOWN**)
- Provide `node scripts/shutdownManager/getUserIdleMs.ts` that invokes the helper.
- This signal is an independent input to `canShutdown()`; it never triggers shutdown by itself.

**Deliverable prompt:** `OPS-SHUTDOWN-004`
**Execution hint:** `verified`

---

### Phase 5 — OPS-SHUTDOWN-005: launchd Supervisor & Shutdown Executor

**Goal:** Run the global manager as a single per-user LaunchAgent, supervised by launchd.

- Create `scripts/shutdownManager/shutdownManager.ts` daemon:
  - Polls registry every 30 seconds.
  - Calls `canShutdown()`.
  - Logs every decision to `~/.rpg-shutdown/decisions.log`.
  - Performs pre-check → log → final recheck → execute → verify.
  - Never retries shutdown more than once per eligibility window.
- Create `com.rpgbalancer.shutdown-manager.plist` LaunchAgent. **launchd supervises the manager; it does not decide or execute shutdown.**
- Implement `scripts/shutdownManager/shutdownExecutor.ts`:
  - Primary: `osascript -e 'tell application "System Events" to shut down'`
  - Secondary: `sudo shutdown -h now` only if unattended sudo is verified.
  - On failure: log `SHUTDOWN_FAILED` with exit code and back off.
- Real shutdown disabled by default (`policy.shutdownEnabled = false`).

**Deliverable prompt:** `OPS-SHUTDOWN-005`
**Execution hint:** `verified`

---

### Phase 6 — OPS-SHUTDOWN-006: Integration with Existing Tools

**Goal:** Make the harness, coordinator, and Devin sessions register their state.

- Add heartbeat calls in:
  - `scripts/harness/runPrompt.ts` (states: `RUNNING` / `WAITING_FOR_USER` / `COMPLETED`)
  - `scripts/harness/dispatch.ts`
  - `coordinator/coordinator.py` or `coordinator_cron_wrapper.sh`
- Provide a shell wrapper `scripts/shutdownManager/session.sh` for manual session registration:
  - `session.sh start --project RPG --session devin-1`
  - `session.sh heartbeat --project RPG --session devin-1`
  - `session.sh complete --project RPG --session devin-1 --state COMPLETED`
- The manager must be usable from any project directory by reading `~/.rpg-shutdown/session-registry.json`.

**Deliverable prompt:** `OPS-SHUTDOWN-006`
**Execution hint:** `verified`

---

### Phase 7 — OPS-SHUTDOWN-007: Validation Matrix

**Goal:** Run all required scenarios before enabling real shutdown.

All tests run with `DRY_RUN=true` first, then with a mock shutdown executor (captures the command that would run, does not execute).

1. Project A `RUNNING`, Project B `IDLE` → no shutdown.
2. Project A `IDLE`, Project B `RUNNING` → no shutdown.
3. Both `IDLE` + user idle → shutdown allowed.
4. One `WAITING_FOR_USER` → no shutdown.
5. One `BLOCKED` → no shutdown.
6. One `UNKNOWN` → no shutdown.
7. Crashed process (expired heartbeat) → `UNKNOWN` → no shutdown.
8. User typing while AI idle → no shutdown.
9. User idle while AI running → no shutdown.
10. Continuous filesystem writes with sessions idle → shutdown allowed (filesystem ignored).
11. Uncommitted Git changes with all sessions safe → shutdown allowed (Git not a blocker).
12. Active harness process → `RUNNING` → no shutdown.
13. Coordinator writing logs → `RUNNING` → no shutdown.
14. Vite running → project must register or it does not block by itself.
15. Shutdown authorization fails → log `SHUTDOWN_FAILED`, no retry storm.
16. `canShutdown()` returns correct `reason` and `blockers` for every scenario.

**Deliverable prompt:** `OPS-SHUTDOWN-007`
**Execution hint:** `verified`

---

### Phase 8 — OPS-SHUTDOWN-008: Documentation & Governance

**Goal:** Document the system and archive the old plan.

- Update or archive `src/docs/docs/operations/guardian_autopush_mandate.md`.
- Write `src/docs/docs/operations/global_shutdown_manager_runbook.md`.
- Archive `global_session_shutdown_manager_plan.md` (v1) to `archive/plans/global_session_shutdown_manager_plan_v1.md` and update links.
- Update `MASTER_PLAN.md` with a link to this v2 plan.
- Update `src/docs/docs/coordinator/strategy_tasks.md` to mark `OPS-SHUTDOWN` complete.
- Final `npm run kanban:lint` and evidence log.

**Deliverable prompt:** `OPS-SHUTDOWN-008`
**Execution hint:** `assisted`

---

### Phase 9 — OPS-SHUTDOWN-009: Capability Ownership Audit & Static Enforcement

**Goal:** Prove there is exactly one shutdown capability owner and prevent regressions.

- Run a final repository-wide scan to ensure only `scripts/shutdownManager/shutdownExecutor.ts` (or equivalent) executes shutdown.
- Add a static guard script `scripts/shutdownManager/lintCapabilityOwnership.ts` (or shell equivalent) that fails if it finds any of the following outside `scripts/shutdownManager/`:
  - `sudo shutdown`
  - `osascript -e 'tell application "System Events" to shut down'`
  - `shutdown -h now`
  - `poweroff`
  - `halt`
  - `pmset sleep`
- Wire the guard into `npm run lint` or as `npm run shutdown:lint-capability` so CI blocks regressions.
- Update `.windsurf/rules/50-shutdown-governance.md` with the capability ownership section.
- Produce final evidence log `test-results/ops-shutdown-009-capability-audit-<date>.log`.

**Deliverable prompt:** `OPS-SHUTDOWN-009`
**Execution hint:** `verified`

## 6. Shutdown Decision Matrix

| Condition / State | Shutdown Allowed? | Rationale |
|-------------------|-------------------|-----------|
| Any session `RUNNING` | NO | Active work in progress. |
| Any session `WAITING_FOR_USER` | NO | Human input required. |
| Any session `BLOCKED` | NO | Error / credential / missing input; unsafe. |
| Any session `QUEUED` | NO | Work is scheduled. |
| Any session `STARTING` | NO | Session has not confirmed it is safe. |
| Any session `STOPPING` | NO | Session may still hold resources. |
| Any session `FAILED` | NO | Error state must be reviewed. |
| Any session `UNKNOWN` | NO | Fail closed. |
| Expired heartbeat | NO | Becomes `UNKNOWN`. |
| All sessions `IDLE` or `COMPLETED` | MAYBE | Only if user idle and policy allow. |
| User idle time < threshold | NO | Independent safety signal. |
| User idle time `UNKNOWN` | NO | Fail closed. |
| `policy.shutdownEnabled === false` | NO | Default until explicit enable. |
| `policy.dryRun === true` | YES (logged only) | Logs `WOULD_SHUTDOWN`, no execution. |

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `auto-commit-push-shutdown.sh` triggers shutdown before cleanup. | Phase 0 neutralizes all execution paths before Phase 1 deletes anything. |
| Phase 0 accidentally commits or pushes. | Phase 0 forbids any `git` operation. |
| Native idle detection unavailable. | Fallback to `ioreg`; if both fail, `UNKNOWN` → no shutdown. |
| Stale session registration blocks shutdown forever. | TTL + operator `session.sh clear` command. |
| Harness/coordinator not integrated immediately. | Manager only cares about registered sessions; unregistered processes must register or be ignored. |
| Real shutdown enabled too early. | `shutdownEnabled` defaults to `false`; requires explicit user action. |
| New shutdown scripts reappear. | `OPS-SHUTDOWN-009` static guard + `.windsurf/rules/50-shutdown-governance.md` invariant. |

## 8. Acceptance Criteria

- [ ] Phase 0 kill switch neutralized the active dangerous script with no `git` side effects.
- [ ] Exactly one active shutdown path exists (`shutdownManager.ts` → `shutdownExecutor.ts`).
- [ ] No legacy script can execute shutdown.
- [ ] No legacy cron / launchd / plist triggers shutdown.
- [ ] `canShutdown()` is pure, deterministic, and returns `{ allowed, reason, blockers[], userIdleMs, policy }`.
- [ ] Registry is an aggregated runtime view, not a source of truth.
- [ ] Multiple projects can register simultaneously.
- [ ] Multiple Devin sessions can coexist.
- [ ] `RUNNING` in any project blocks global shutdown.
- [ ] `IDLE` project does not block if another project is active.
- [ ] Filesystem writes are ignored as a shutdown signal.
- [ ] Git dirty state is project-local, never a global blocker.
- [ ] Unknown / expired heartbeat blocks shutdown.
- [ ] User idle detection hierarchy works and `UNKNOWN` blocks shutdown.
- [ ] `npm run shutdown:status` explains all blockers.
- [ ] `DRY_RUN=true` works and logs `WOULD_SHUTDOWN`.
- [ ] Real shutdown is disabled by default.
- [ ] All 16 validation scenarios pass.
- [ ] `OPS-SHUTDOWN-009` static guard passes and prevents regressions.
- [ ] `.windsurf/rules/50-shutdown-governance.md` invariant is registered.
