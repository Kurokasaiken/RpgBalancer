---
title: Global Session Shutdown Manager — Strategic Plan
status: draft
owner: Strategist
last_reviewed: 2026-07-22
domain: devops / infrastructure
---

# Global Session Shutdown Manager — Strategic Plan

> **Objective:** Replace the fragmented legacy auto-shutdown / auto-commit / auto-push mechanisms with exactly one project-aware, session-aware, fail-closed global shutdown manager for the user's macOS development environment.

## 1. Critique of the Original Request

The original request is architecturally sound but **unimplementable as a single prompt** for the following reasons:

- **Scope overload:** It mixes audit, legacy cleanup, registry design, macOS idle detection, launchd integration, shutdown execution, observability, and validation into one task. This violates the project rule that prompts should target 30–60 minutes and be split across subsystems.
- **Assumes a blank slate:** It does not acknowledge the existing active `auto-commit-push-shutdown.sh` script, which is currently dangerous and has already auto-committed 211 files and attempted shutdown. Immediate deactivation must come before any new design.
- **Under-estimates the user-idle signal:** Detecting macOS user input idle time robustly (IOHIDSystem / IOKit) typically requires a native helper (Swift / Objective-C / `ioreg` parsing). A Node script cannot reliably get sub-minute idle time without a native dependency.
- **Conflates two concerns:** The user relies on automated Git backup (`auto-commit-only.sh`, `auto-commit-push-shutdown.sh`) but the request treats Git state as irrelevant to shutdown. The plan must preserve an opt-in auto-commit policy while making it independent from shutdown.
- **No registration in `.windsurf/rules/`:** A new cross-cutting system (global shutdown governance) must be registered as an invariant so agents stop introducing new shutdown scripts. The original request did not specify this.
- **No integration with existing harness/coordinator:** The harness, coordinator, and launchd agent already run background work. The new manager must consume their state, not duplicate them.

## 2. Audit Findings (Runtime Snapshot 2026-07-22)

| Mechanism | Location | Status | Risk |
|-----------|----------|--------|------|
| `auto-commit-push-shutdown.sh` | repo root | **ACTIVE** | Auto-commits, pushes, then attempts `sudo shutdown` / `osascript` shutdown. Already executed on 2026-07-13. |
| `auto-commit-only.sh` | repo root | active | Auto-commits only, no shutdown, but shares guardian code. |
| `scripts/autoCommit/commitFailureMonitor.js` | `scripts/autoCommit/` | active | Calls `shutdownSystem()` on commit/push/guardian failure. |
| `scripts/guardian/vercelDeploymentGuard.ts` | `scripts/guardian/` | active | Calls `shutdownSystem()` after deploy success/failure. |
| `ai-worker/autospegnimento.sh` + `ai-worker/coordinator_watch.py` | `ai-worker/` | legacy | Polls `kanban_vuoto.json`; calls `sudo shutdown` / `osascript` if idle. |
| `test_shutdown_verification.sh` | repo root | orphan | References non-existent `shutdown_when_done.sh`; does filesystem mtime polling. |
| `shutdown_when_done.log` / `shutdown.log` / `shutdown.pid` | repo root | stale artifacts | `shutdown.pid` (30365) not running; logs historical. |
| `com.kurokasaiken.rpg-coordinator.plist` | `~/Library/LaunchAgents/` | installed, not running | Runs `coordinator/coordinator_cron_wrapper.sh` every 10 min; not shutdown itself but can dispatch. |
| `com.rpgbalancer.auto-snapshot.plist` | repo root (not loaded) | inactive | Snapshot agent only. |
| `crontab` | user | empty | — |
| `.zshrc` | user | no shutdown refs | — |

## 3. Guiding Principles

1. **Fail closed:** Any unreadable registry, unknown session, expired heartbeat, or missing user-idle data blocks shutdown.
2. **One source of truth:** Exactly one process on the machine is authorized to request shutdown.
3. **Project-aware, not filesystem-aware:** Sessions register their semantic state; filesystem writes are ignored as a shutdown criterion.
4. **Git is project-local:** Auto-commit and auto-push are preserved as an opt-in per-project policy; they are not a global shutdown signal.
5. **Dry-run default:** Real shutdown is disabled until explicitly enabled and validated.
6. **Observable:** `npm run shutdown:status` (or equivalent) explains every blocker in plain text.
7. **Rule registration:** A new `.windsurf/rules/` invariant governs future shutdown scripts.

## 4. Phased Plan

### Phase 0 — Emergency Disable & Preserve Safety (IMMEDIATE, 1 prompt)

**Goal:** Stop the active dangerous script before any other work.

- Stop any running `auto-commit-push-shutdown.sh` / `auto-commit-only.sh` / `coordinator_watch.py` process.
- Rename or remove `auto-commit-push-shutdown.sh` so it cannot be accidentally started.
- Add a `.windsurf/rules/50-shutdown-governance.md` invariant that forbids new shutdown scripts outside the global manager.
- Create a temporary `SHUTDOWN_DISABLED.sentinel` explaining the state.
- Document the immediate state in `test-results/ops-shutdown-emergency-<date>.log`.

**Deliverable prompt:** `OPS-SHUTDOWN-000`

### Phase 1 — Complete Audit & Legacy Cleanup

**Goal:** Enumerate and remove all legacy mechanisms, leaving only the new system path.

- Search the entire filesystem and repository for every shutdown / auto-commit / auto-push / idle watcher reference.
- Delete or archive:
  - `ai-worker/autospegnimento.sh`
  - `ai-worker/coordinator_watch.py`
  - `ai-worker/start_coordinator_watch.sh`
  - `ai-worker/README_WATCH.md`
  - `ai-worker/last_activity.json`
  - `auto-commit-push-shutdown.sh`
  - `test_shutdown_verification.sh`
  - `shutdown.log`, `shutdown_when_done.log`, `shutdown.pid`
  - `src/docs/docs/operations/guardian_autopush_mandate.md` or update it to deprecated
- Remove shutdown calls from:
  - `scripts/autoCommit/commitFailureMonitor.js`
  - `scripts/guardian/vercelDeploymentGuard.ts`
- Unload `com.kurokasaiken.rpg-coordinator.plist` if it is confirmed only legacy; otherwise keep under new contract.
- Run a second search and classify every remaining reference as `intentional-doc`, `active-new-system`, or `false-positive`.

**Deliverable prompt:** `OPS-SHUTDOWN-001`

### Phase 2 — Global Session Registry

**Goal:** Create the single authoritative registry.

- Design a Zod-validated JSON registry schema:
  - `version`, `machineId`, `updatedAt`
  - `projects.<id>.status`
  - `projects.<id>.sessions.<id>` with `pid`, `heartbeatAt`, `state`, `blockingReason`, `owner`, `ttlSeconds`
  - `policy` with `dryRun`, `userIdleThresholdSeconds`, `shutdownEnabled`
- Store registry under `~/.rpg-shutdown/session-registry.json` (machine-global, outside any project).
- Provide a TypeScript `SessionRegistry` module with atomic read/write and stale-session recovery.
- Provide CLI commands:
  - `node scripts/shutdownManager/registerSession.ts --project RPG --session devin-1 --state RUNNING`
  - `node scripts/shutdownManager/heartbeatSession.ts --project RPG --session devin-1`
  - `node scripts/shutdownManager/releaseSession.ts --project RPG --session devin-1 --state COMPLETED`
- Default TTL: 60 seconds; expired heartbeats transition to `UNKNOWN` (not `IDLE`).

**Deliverable prompt:** `OPS-SHUTDOWN-002`

### Phase 3 — Shutdown Decision Engine

**Goal:** Implement the deterministic `canShutdown()` function and `shutdown:status` diagnostics.

- Implement `evaluateShutdownEligibility(registry, userIdleMs)`:
  - Forbid if any session is `RUNNING`, `WAITING_FOR_USER`, `BLOCKED`, `UNKNOWN`, `STARTING`, `STOPPING`.
  - Allow only if all sessions are `IDLE` or `COMPLETED` **and** user idle time exceeds threshold **and** `policy.shutdownEnabled === true`.
  - Require user idle threshold default 30 minutes, configurable.
- Implement `npm run shutdown:status` script that prints:
  - `Eligible: YES/NO`
  - Projects and sessions with states
  - User idle duration
  - Active blockers
  - Next evaluation time
- Support `DRY_RUN=true` mode that logs `WOULD_SHUTDOWN` / `WOULD_NOT_SHUTDOWN` with reason.

**Deliverable prompt:** `OPS-SHUTDOWN-003`

### Phase 4 — macOS User Idle Detection

**Goal:** Add a reliable, independent user-input idle signal.

- Implement a native macOS helper in `scripts/shutdownManager/macosIdleSeconds.swift` (or use `ioreg -c IOHIDSystem` parsing if native compilation is not viable).
- Provide `node scripts/shutdownManager/getUserIdleMs.ts` that invokes the helper.
- Use this signal only as an independent input to the decision engine; it never triggers shutdown by itself.

**Deliverable prompt:** `OPS-SHUTDOWN-004`

### Phase 5 — launchd Manager & Shutdown Executor

**Goal:** Run the global manager as a single per-user LaunchAgent.

- Create `scripts/shutdownManager/shutdownManager.ts` daemon:
  - Polls registry every 30 seconds.
  - Logs decisions to `~/.rpg-shutdown/decisions.log`.
  - Never retries shutdown more than once per eligibility window.
  - On shutdown, performs pre-check → log → final recheck → execute → verify.
- Create `com.rpgbalancer.shutdown-manager.plist` LaunchAgent.
- Implement shutdown executor with explicit commands:
  - `osascript -e 'tell application "System Events" to shut down'` as primary.
  - `sudo shutdown -h now` only if unattended sudo is verified.
  - On failure, log `SHUTDOWN_FAILED` with exit code and back off.
- Real shutdown disabled by default (`policy.shutdownEnabled = false`).

**Deliverable prompt:** `OPS-SHUTDOWN-005`

### Phase 6 — Integration with Existing Tools

**Goal:** Make the harness, coordinator, and Devin sessions register their state.

- Add heartbeat calls in:
  - `scripts/harness/runPrompt.ts` (RUNNING/WAITING_FOR_USER/COMPLETED)
  - `scripts/harness/dispatch.ts`
  - `coordinator/coordinator.py` or `coordinator_cron_wrapper.sh`
- Provide a VSCode / Windsurf extension command or a shell wrapper for manual session registration.
- The manager must be usable from any project directory by reading `~/.rpg-shutdown/session-registry.json`.

**Deliverable prompt:** `OPS-SHUTDOWN-006`

### Phase 7 — Validation Matrix

**Goal:** Run the 15 required scenarios before enabling real shutdown.

All tests run in `DRY_RUN=true` first, then with a mock shutdown executor (captures the command that would run, does not execute).

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

**Deliverable prompt:** `OPS-SHUTDOWN-007`

### Phase 8 — Documentation & Governance

- Update or archive `src/docs/docs/operations/guardian_autopush_mandate.md`.
- Write `src/docs/docs/operations/global_shutdown_manager_runbook.md`.
- Update `MASTER_PLAN.md` with a link to this plan.
- Final `npm run kanban:lint` and evidence log.

**Deliverable prompt:** `OPS-SHUTDOWN-008`

## 5. Shutdown Decision Matrix

| Session State | Shutdown Allowed? | Rationale |
|---------------|-------------------|-----------|
| `STARTING` | NO | Session has not confirmed it is safe. |
| `RUNNING` | NO | Active work in progress. |
| `WAITING_FOR_USER` | NO | Human input required. |
| `BLOCKED` | NO | Error / credential / missing input; unsafe. |
| `QUEUED` | NO | Work is scheduled. |
| `IDLE` | MAYBE | Only if all other conditions pass. |
| `COMPLETED` | YES | Session explicitly released its lock. |
| `FAILED` | NO | Error state must be reviewed. |
| `STOPPING` | NO | Session may still hold resources. |
| `UNKNOWN` | NO | Fail closed. |
| Registry unreadable / corrupt | NO | Fail closed. |
| User not idle | NO | Independent safety signal. |
| `policy.shutdownEnabled === false` | NO | Default until explicit enable. |

## 6. Immediate Next Steps for the Coordinator

1. Create Kanban rows for `OPS-SHUTDOWN-000` through `OPS-SHUTDOWN-008`.
2. Assign `OPS-SHUTDOWN-000` immediately to stop the active dangerous script.
3. Do **not** run any prompt that touches shutdown without `DRY_RUN=true` default.
4. Ensure every execution prompt includes the rule: real shutdown is disabled unless `SHUTDOWN_ENABLED=true` is explicitly set by the user.

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Existing `auto-commit-push-shutdown.sh` triggers shutdown before cleanup. | Phase 0 disables it before any other change. |
| Native idle detection fails on macOS. | Fall back to `ioreg` parsing; if both fail, user-idle signal becomes `UNKNOWN` → no shutdown. |
| Stale session registration blocks shutdown forever. | TTL + conservative recovery; operator can manually clear registry. |
| Harness/coordinator not integrated immediately. | Manager defaults to `UNKNOWN` for unregistered active processes? No — only registered sessions matter; other processes must register. |
| Real shutdown enabled too early. | `shutdownEnabled` defaults to `false`; requires explicit user action. |

## 8. Acceptance Criteria (Final)

- [ ] Exactly one active shutdown path exists (`shutdownManager.ts` + LaunchAgent).
- [ ] No legacy script can execute shutdown.
- [ ] No legacy cron / launchd / plist triggers shutdown.
- [ ] Multiple projects can register simultaneously.
- [ ] `RUNNING` in any project blocks global shutdown.
- [ ] `IDLE` project does not block if another project is active.
- [ ] Filesystem writes are ignored as shutdown signal.
- [ ] Git dirty state is project-local, never global.
- [ ] Unknown / expired heartbeat blocks shutdown.
- [ ] `npm run shutdown:status` explains all blockers.
- [ ] `DRY_RUN=true` works and logs `WOULD_SHUTDOWN`.
- [ ] Real shutdown disabled by default.
- [ ] All 15 validation scenarios pass.
- [ ] `.windsurf/rules/50-shutdown-governance.md` invariant registered.

