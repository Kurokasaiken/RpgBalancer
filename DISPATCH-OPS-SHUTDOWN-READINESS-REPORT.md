# Dispatch Ops Shutdown — Readiness Report

**Date:** 2026-07-23  
**Scope:** Audit and controlled dry-run of the "Dispatch Ops Shutdown" system in the RPG project.  
**Constraint:** No production code was modified and no real shutdown was executed.  
**Dry-run artifact:** `test-results/ops-shutdown-readiness-dryrun.ts` and `test-results/ops-shutdown-readiness-dryrun.log`.

---

## 1. Executive Summary

The RPG project is in the middle of the `OPS-SHUTDOWN` stream. Phases 0, 1 and 2 are complete: the dangerous legacy `auto-commit-push-shutdown.sh` has been neutralized, legacy shutdown paths have been removed or disabled, and the global session registry (`scripts/shutdownManager/sessionRegistry.ts`) is in place with a Zod schema, atomic read/write and CLI commands.

However, **the components that actually decide when it is safe to shut down and that issue a shutdown command do not exist yet**. There is no `canShutdown()` decision engine, no `shutdownManager.ts` daemon, no `shutdownExecutor.ts`, no `getUserIdleMs.ts`, no `com.rpgbalancer.shutdown-manager.plist`, no `npm run shutdown:status` and no `npm run shutdown:lint-capability`. More importantly, the coordinator, harness and manual dispatch queue do **not** register sessions in the global registry, so the shutdown manager would not even know that work is in progress.

**Verdict:** `NOT READY`

The system cannot today guarantee that overnight dispatch jobs will terminate and cause a controlled shutdown. It will, by design, *block* shutdown when anything is running, but it cannot progress from "blocked" to "shutdown" without the missing manager/executor, idle detection and tool integration.

---

## 2. Entry Points and Task Lifecycle

### 2.1 Primary dispatch entry points

| Entry point | File | What it does | Registers session in `~/.rpg-shutdown/session-registry.json`? |
|---|---|---|---|
| **Coordinator CLI** | `coordinator/coordinator.py` | Selects tasks, dispatches harness, queues ai-worker, queues manual tasks | No |
| **Coordinator cron** | `coordinator/coordinator_cron_wrapper.sh` invoked by `coordinator/com.kurokasaiken.rpg-coordinator.plist` every 600s | Prevents concurrent runs via a PID file and `live_registry.json` check; runs `coordinator.py` | No |
| **Manual queue** | `coordinator/dispatcher.py` | Adds manual tasks to `coordinator/manual-dispatch/pending/` and `queue.json`; waits for `/run-manual-tasks` and `complete_manual_task` | No |
| **Harness single run** | `scripts/harness/runPrompt.ts` | Executes one prompt end-to-end; updates kanban; has its own `taskTimeout` (default 10 min) and `commandTimeout` (default 5 min) | No |
| **Harness dispatch** | `scripts/harness/dispatch.ts` | Runs kanban waves in parallel worktrees; per-task timeout defaults to harness `taskTimeout` | No |
| **AI worker** | `ai-worker/coordinator.py` / GitHub Actions `ai-worker.yml` | Remote/autonomous executor; commits/pushes results | No |

None of the active dispatch entry points integrate with the global shutdown registry. The only registry writes that exist are the legacy local `coordinator/live_registry.json` used by `coordinator/registry_manager.py` to avoid file-target conflicts, and the new global `sessionRegistry.ts` module, which is currently only exercised by unit tests and by this dry-run.

### 2.2 Manual task lifecycle (no global session awareness)

1. `coordinator/coordinator.py` calls `calcola_batch_eseguibile()`.
2. Manual tasks are separated and passed to `dispatch_batch_to_manual()`.
3. `coordinator/dispatcher.py` creates a markdown prompt in `coordinator/manual-dispatch/pending/` and appends the task to `coordinator/manual-dispatch/queue.json` with status `pending`.
4. A human runs `/run-manual-tasks` inside Windsurf.
5. `complete_manual_task()` moves the file to `completed/`, updates `queue.json`, `agent_assignments.md` and `strategy_tasks.md`.

There is no bridge from this lifecycle to the global shutdown registry.

### 2.3 Automatic task lifecycle (no global session awareness)

- **Harness:** `coordinator/coordinator.py::dispatch_harness_batch()` runs `npm run harness:dispatch` with a hard-coded 1800s timeout. On timeout it prints an error and returns; it does not update `agent_assignments.md` or the global registry.
- **AI worker:** `coordinator/coordinator.py::dispatch_ai_worker_batch()` writes `ai-worker/kanban.json`, marks tasks `In corso` in `agent_assignments.md`, commits and pushes. The coordinator then exits and waits for the next cron cycle; it does not wait for remote completion.
- **Registry cleanup:** `registry_manager.py::cleanup_old_entries()` can remove running entries older than 30 minutes, but this is the coordinator's local `live_registry.json`, not the global shutdown registry.

---

## 3. Shutdown Mechanism

### 3.1 Current shutdown-capable components

| Component | Status | Notes |
|---|---|---|
| `scripts/shutdownManager/sessionRegistry.ts` | ✅ Exists | Zod schema, atomic read/write, register/heartbeat/release, TTL-based stale recovery. |
| `scripts/shutdownManager/registerSession.ts` | ✅ Exists | CLI to register a session. |
| `scripts/shutdownManager/heartbeatSession.ts` | ✅ Exists | CLI to renew a session heartbeat. |
| `scripts/shutdownManager/releaseSession.ts` | ✅ Exists | CLI to release a session to a terminal state. |
| `canShutdown()` / decision engine | ❌ Missing | Planned for `OPS-SHUTDOWN-003`. |
| `shutdownManager.ts` daemon | ❌ Missing | Planned for `OPS-SHUTDOWN-005` (polls every 30s). |
| `shutdownExecutor.ts` | ❌ Missing | Planned for `OPS-SHUTDOWN-005`. |
| `getUserIdleMs.ts` / idle detection | ❌ Missing | Planned for `OPS-SHUTDOWN-004`. |
| `com.rpgbalancer.shutdown-manager.plist` | ❌ Missing | Planned for `OPS-SHUTDOWN-005`. |
| `npm run shutdown:status` | ❌ Missing | Planned for `OPS-SHUTDOWN-003`. |
| `npm run shutdown:lint-capability` | ❌ Missing | Planned for `OPS-SHUTDOWN-009`. |

### 3.2 Legacy shutdown paths

- `SHUTDOWN_DISABLED.sentinel` exists in the repo root; the dangerous `auto-commit-push-shutdown.sh` is archived as `archive/legacy_shutdown/auto-commit-push-shutdown.sh.DISABLED`.
- `ai-worker/autospegnimento.sh`, `ai-worker/start_coordinator_watch.sh` and `ai-worker/coordinator_watch.py` now only print `SHUTDOWN_CAPABILITY_NOT_OWNED` and exit.
- `scripts/autoCommit/commitFailureMonitor.js` no longer calls `shutdownSystem()`; it logs `SHUTDOWN_CAPABILITY_NOT_OWNED` and exits.
- `scripts/guardian/vercelDeploymentGuard.ts` no longer calls `shutdownSystem()`; it logs `SHUTDOWN_CAPABILITY_NOT_OWNED` and exits.
- Stale but still executable copies of the old shutdown scripts exist in `.claude/worktrees/pensive-moore-4e787f/` and `.claude/worktrees/festive-bassi-88cd8e/`. They are not loaded by any scheduler, but they remain on disk and should be neutralized.

### 3.3 How a shutdown would flow (planned)

```text
Coordinator / Harness / Devin
        |
        v
registerSession(project=RPG, session=..., state=RUNNING)
        |
        +--> periodic heartbeatSession(...)
        |
        +--> releaseSession(..., state=COMPLETED/FAILED)
        |
        v
shutdownManager.ts (launchd, every 30s)
  -> getUserIdleMs() -> number | 'UNKNOWN'
  -> readRegistry()
  -> recoverStaleSessions()
  -> canShutdown(registry, userIdleMs, policy)
  -> if allowed && shutdownEnabled && !dryRun
       -> shutdownExecutor.ts -> osascript / sudo shutdown
```

At the time of this audit, only the bottom registry block exists; everything above and below it is missing.

---

## 4. Timeouts, Watchdogs and Heartbeats

### 4.1 Global session registry TTL

- Default `ttlSeconds` is 60 in `registerSession.ts` and `sessionRegistry.ts`.
- `recoverStaleSessions()` in `sessionRegistry.ts` transitions sessions whose `heartbeatAt + ttlSeconds` is in the past to state `UNKNOWN` with `blockingReason: 'heartbeat expired'`.
- `UNKNOWN` is a blocking state in the planned `canShutdown()` matrix.

### 4.2 Local harness and coordinator timeouts

| Timeout | Location | Value | Behavior on timeout |
|---|---|---|---|
| Harness per-task | `scripts/harness/runPrompt.ts` | `config.taskTimeout` = 600,000 ms (10 min) | Rejects with `Error('timeout')`, marks kanban `Assegnato`, writes evidence log |
| Harness per-command | `scripts/harness/config.ts` | `commandTimeout` = 300,000 ms (5 min) | Used by tool layer |
| Harness dispatch per-task | `scripts/harness/dispatch.ts` | `args.timeout ?? config.taskTimeout` | Kills child with `SIGTERM` |
| Coordinator harness batch | `coordinator/coordinator.py::dispatch_harness_batch()` | 1800 s | `subprocess.TimeoutExpired` caught, prints error, returns 0 |
| Coordinator cron interval | `coordinator/com.kurokasaiken.rpg-coordinator.plist` | 600 s | Re-runs wrapper; wrapper skips if PID file or running registry entries exist |
| Local registry entry age | `coordinator/registry_manager.py::cleanup_old_entries()` | 30 min | Removes stale `live_registry.json` running entries |

### 4.3 Missing watchdogs

- There is **no hard upper bound on session duration**.
- There is **no watchdog that force-releases a stuck `RUNNING` or `UNKNOWN` session**.
- There is **no watchdog that kills a hanging harness/ai-worker/manual task and then requests a shutdown**.
- The registry will mark stale sessions `UNKNOWN`, but `UNKNOWN` blocks shutdown indefinitely until an operator manually releases the session.

---

## 5. Dry-Run Results

A controlled dry-run was created at `test-results/ops-shutdown-readiness-dryrun.ts` and executed with `tsx`. It uses the real `scripts/shutdownManager/sessionRegistry.js` module and a reference implementation of the planned `canShutdown()` decision engine. The shutdown command is always captured and never executed.

### 5.1 Scenarios

| Scenario | Setup | Result | Interpretation |
|---|---|---|---|
| **A — All tasks complete** | Three sessions registered then released as `COMPLETED`; user idle 600s; `shutdownEnabled=true`, `dryRun=false` | `allowed=true`; shutdown command **intercepted** | ✅ With all sessions terminal and user idle, the planned engine would request shutdown. |
| **B — Stuck agent** | One session `RUNNING`; heartbeat set 120s in the past; `recoverStaleSessions()` called | Session became `UNKNOWN`; `allowed=false`; no shutdown | ⚠️ Fail-closed: a stuck agent blocks shutdown. Manual release is required. After simulated operator release, shutdown is allowed. |
| **C — Process failure** | Session released as `FAILED` | `allowed=false`; no shutdown | ⚠️ A failed process blocks shutdown. Only recovery to `COMPLETED` allows shutdown. |
| **D — User active** | One `COMPLETED` session; user idle 60s (< 300s threshold) | `allowed=false` | ✅ User idle threshold works as a blocker. |
| **E — Policy disabled** | One `COMPLETED` session; user idle 600s; `shutdownEnabled=false` | `allowed=false` | ✅ `shutdownEnabled=false` default blocks shutdown. |

All assertions passed. The dry-run log is at `test-results/ops-shutdown-readiness-dryrun.log`.

### 5.2 Important caveat

The dry-run tested the **intended contract** because the production `canShutdown()`, `shutdownManager.ts` and `shutdownExecutor.ts` do not exist yet. The real registry module is sound; the missing pieces are the decision/execution loop and the integrations that would feed it.

---

## 6. Lifecycle and Failure Paths

### 6.1 Normal completion path (today)

1. `coordinator_cron_wrapper.sh` runs `coordinator.py`.
2. `coordinator.py` dispatches harness and/or ai-worker and/or manual tasks.
3. Harness and ai-worker run asynchronously or remotely.
4. Manual tasks wait for human execution.
5. Coordinator exits.
6. **No component evaluates whether the machine can be shut down.**

### 6.2 Stuck-agent path (today)

1. A harness task hangs.
2. `runPrompt.ts` or `dispatch.ts` kills the child after `taskTimeout`.
3. Kanban is reset to `Assegnato`; no global registry entry is created.
4. If the coordinator re-dispatches the same task, the cycle repeats.
5. **Result:** coordinator cron keeps running indefinitely; no shutdown is requested.

If the missing registry integration existed and the session were left `RUNNING` without heartbeats, it would become `UNKNOWN` and block shutdown forever.

### 6.3 Process-failure path (today)

1. A process fails and is not explicitly released.
2. With registry integration, its session would remain `RUNNING` until heartbeat TTL expiry, then become `UNKNOWN`.
3. `UNKNOWN` blocks shutdown.
4. **Result:** no automatic recovery and no shutdown.

### 6.4 AI-worker remote path (today)

1. `coordinator.py` pushes `ai-worker/kanban.json` and marks tasks `In corso`.
2. Coordinator exits.
3. GitHub Actions workflow runs the ai-worker.
4. There is no signal back to the local machine to indicate completion.
5. **Result:** no local shutdown possible.

### 6.5 Manual-task path (today)

1. `dispatcher.py` creates a pending task.
2. A human must run `/run-manual-tasks` and then `complete_manual_task`.
3. There is no timeout or automatic release.
4. **Result:** a forgotten pending manual task would block shutdown indefinitely if integrated with the global registry.

---

## 7. Indefinite-Hang Paths (No Guaranteed Shutdown)

1. **No shutdown decision loop.** Even if all sessions were `COMPLETED`, no component currently calls `canShutdown()` or requests shutdown.
2. **No tool integration.** Coordinator, harness, ai-worker and manual dispatcher do not register sessions. The shutdown manager (when built) will see an empty registry and might incorrectly allow shutdown while work is actually running.
3. **Stuck/UNKNOWN sessions block forever.** A session that misses its TTL becomes `UNKNOWN`. There is no automatic force-release or max-duration timeout.
4. **No idle detection.** `getUserIdleMs.ts` does not exist; the planned fallback is `UNKNOWN`, which blocks shutdown.
5. **No hard session duration cap.** A `RUNNING` session that heartbeats regularly but is logically stuck will never be terminated.
6. **Remote ai-worker has no local completion signal.** The coordinator cannot know when a remote run is done.
7. **Manual tasks require human action.** No timeout or automatic transition to `COMPLETED`/`FAILED`.
8. **Stale worktree copies.** `.claude/worktrees/pensive-moore-4e787f/` and `.claude/worktrees/festive-bassi-88cd8e/` still contain executable old shutdown scripts, creating a latent risk if accidentally invoked.

---

## 8. Known Gaps

| Gap | Impact | Required phase |
|---|---|---|
| `canShutdown()` decision engine not implemented | No shutdown decision possible | `OPS-SHUTDOWN-003` |
| `shutdownManager.ts` daemon not implemented | No polling, no decision/execution loop | `OPS-SHUTDOWN-005` |
| `shutdownExecutor.ts` not implemented | No command builder/caller | `OPS-SHUTDOWN-005` |
| `getUserIdleMs.ts` not implemented | No independent user-idle signal | `OPS-SHUTDOWN-004` |
| `com.rpgbalancer.shutdown-manager.plist` not installed | Manager not supervised by launchd | `OPS-SHUTDOWN-005` |
| `session.sh` wrapper missing | Operators cannot easily register/heartbeat/release | `OPS-SHUTDOWN-006` |
| Coordinator does not register sessions | Manager unaware of coordinator work | `OPS-SHUTDOWN-006` |
| Harness `runPrompt.ts` / `dispatch.ts` do not register sessions | Manager unaware of harness work | `OPS-SHUTDOWN-006` |
| Manual dispatcher does not register sessions | Manager unaware of manual tasks | `OPS-SHUTDOWN-006` |
| No max-session-duration watchdog | Stuck or heartbeating-but-stuck sessions hang forever | Not explicitly in plan; should be added |
| `npm run shutdown:status` missing | No runtime diagnostics | `OPS-SHUTDOWN-003` |
| `npm run shutdown:lint-capability` missing | No regression guard | `OPS-SHUTDOWN-009` |
| Stale `.claude/worktrees` copies remain | Latent active shutdown scripts on disk | `OPS-SHUTDOWN-001` follow-up |

---

## 9. Verdict and Conditions for Readiness

### Verdict: `NOT READY`

The global session registry is solid and the legacy kill-switch work is complete, but the system that would actually decide when to shut down, execute the shutdown, detect user idle and integrate with dispatch tools does not exist. As a result, overnight automatic jobs can be dispatched and may hang or complete without any guaranteed path to a controlled shutdown.

### Conditions to move to `READY`

1. Implement `OPS-SHUTDOWN-003` (`canShutdown()` + `npm run shutdown:status`).
2. Implement `OPS-SHUTDOWN-004` (`getUserIdleMs.ts` with Swift → `ioreg` → `UNKNOWN` fallback).
3. Implement `OPS-SHUTDOWN-005` (`shutdownManager.ts`, `shutdownExecutor.ts`, `com.rpgbalancer.shutdown-manager.plist`).
4. Implement `OPS-SHUTDOWN-006` integrations: coordinator, harness and manual dispatch must `registerSession`/`heartbeatSession`/`releaseSession`.
5. Add a `maxSessionDuration` watchdog or operator `session.sh clear` automation so that stuck or `UNKNOWN` sessions do not block shutdown forever.
6. Implement `OPS-SHUTDOWN-007` validation matrix and `OPS-SHUTDOWN-009` static guard (`npm run shutdown:lint-capability`).
7. Remove or neutralize the stale `.claude/worktrees/*/auto-commit-push-shutdown.sh` and related copies.
8. Re-run this dry-run against the real production `shutdownManager.ts` and confirm all scenarios pass without the reference `canShutdown()` implementation.

Until these conditions are met, **do not enable `policy.shutdownEnabled = true` and do not rely on automatic shutdown for overnight runs.**
