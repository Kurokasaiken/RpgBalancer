---
title: OPS-SHUTDOWN — Coordinator Implementation Plan
status: approved
owner: Coordinator
last_reviewed: 2026-07-22
domain: devops / infrastructure
---

# OPS-SHUTDOWN — Coordinator Implementation Plan

> **Approved by user:** run `OPS-SHUTDOWN-000` immediately. No other phase may run in parallel until `000` is verified complete.

## 1. Rollout sequence (strict gating)

```text
OPS-SHUTDOWN-000  ──► VERIFY ──► OPS-SHUTDOWN-001 ──► OPS-SHUTDOWN-002 ──► ... ──► OPS-SHUTDOWN-009
     │                              │
     └── APPROVED NOW               └── queue only after 000 passes
```

| Order | Prompt | Gating condition before start |
|-------|--------|-------------------------------|
| 1 | `OPS-SHUTDOWN-000` | User has explicitly approved this prompt. No other `OPS-SHUTDOWN-*` may run concurrently. |
| 2 | `OPS-SHUTDOWN-001` | Evidence log `test-results/ops-shutdown-000-emergency-<date>.log` exists, `SHUTDOWN_DISABLED.sentinel` exists, original script path is non-executable, no active process/scheduler invokes it. |
| 3 | `OPS-SHUTDOWN-002` | Evidence log `test-results/ops-shutdown-001-audit-<date>.log` exists, second search shows zero unauthorized shutdown call sites outside `scripts/shutdownManager/`, `commitFailureMonitor.js` and `vercelDeploymentGuard.ts` no longer call `shutdownSystem`. |
| 4 | `OPS-SHUTDOWN-003` | Registry module compiles, atomic read/write/heartbeat commands work in dry-run. |
| 5 | `OPS-SHUTDOWN-004` | `canShutdown()` has unit tests covering all 16 decision-matrix rows. |
| 6 | `OPS-SHUTDOWN-005` | `getUserIdleMs()` returns a number or `'UNKNOWN'`; `UNKNOWN` blocks shutdown. |
| 7 | `OPS-SHUTDOWN-006` | `shutdownManager.ts` runs and logs decisions every 30s; `com.rpgbalancer.shutdown-manager.plist` loads/unloads correctly; real shutdown is disabled by default. |
| 8 | `OPS-SHUTDOWN-007` | Harness, coordinator, Devin can register/heartbeat/release sessions via wrapper or direct calls. |
| 9 | `OPS-SHUTDOWN-008` | All 16 validation scenarios pass in dry-run and with mock executor. |
| 10 | `OPS-SHUTDOWN-009` | Runbook exists, v1 plan archived, `MASTER_PLAN.md` updated. |

## 2. Phase 0 execution instructions for the coordinator

### Step 1 — Dispatch `OPS-SHUTDOWN-000` to a single agent

- Use `prompts/OPS-SHUTDOWN-000.spec.json`.
- Set `execution_mode = atomic`.
- **Do not bundle** with any other phase.
- The agent must run entirely locally in the shell; no build/test required except `kanban:lint` at the end.

### Step 2 — Required commands the agent must execute

1. **STOP** any running process matching:
   - `auto-commit-push-shutdown.sh`
   - `auto-commit-only.sh`
   - `coordinator_watch.py`
   - `start_coordinator_watch.sh`
2. **DISABLE** `auto-commit-push-shutdown.sh` by moving/renaming it to `archive/legacy_shutdown/auto-commit-push-shutdown.sh.DISABLED` (create `archive/legacy_shutdown/` if needed).
3. **NEUTRALIZE** execution paths:
   - Check `crontab -l` for any shutdown/auto-commit/auto-push entries.
   - Check `launchctl list | grep -i -E 'shutdown|auto|commit'`.
   - Search `~/.zshrc`, `~/.bashrc`, `~/.bash_profile` for invocations.
   - Search repository for other scripts that `exec` or `source` the disabled file.
4. **VERIFY**:
   - `ls -la auto-commit-push-shutdown.sh` returns non-existent or non-executable.
   - `ps aux | grep -E 'auto-commit-push|auto-commit-only|coordinator_watch' | grep -v grep` returns empty.
   - `crontab -l` has no matching entries.
   - `launchctl list` has no matching agents.
5. **CREATE**:
   - `SHUTDOWN_DISABLED.sentinel` in repo root with timestamp, reason, and pointer to `global_session_shutdown_manager_plan_v2.md`.
   - `test-results/ops-shutdown-000-emergency-<date>.log` with process list, scheduler checks, and verification output.
6. **FORBIDDEN** in this phase:
   - `git reset --hard`
   - `git clean -fd`
   - `git commit`
   - `git push`
   - deleting `auto-commit-push-shutdown.sh` (rename/move only; deletion is Phase 1)
   - modifying unrelated source files
   - creating any new shutdown mechanism
7. **RUN** `npm run kanban:lint` and add output to evidence log.

### Step 3 — Coordinator verification before approving next phase

Before queueing `OPS-SHUTDOWN-001`, the coordinator MUST:

- Read `test-results/ops-shutdown-000-emergency-<date>.log`.
- Confirm `SHUTDOWN_DISABLED.sentinel` exists and is non-empty.
- Confirm `auto-commit-push-shutdown.sh` is not executable from its original path.
- Confirm no process matching the dangerous script is running.
- Confirm no scheduler (cron/launchd) can restart it.
- If any of the above fails, **do not proceed**; send the prompt back for rework.

## 3. General coordinator rules for the entire OPS-SHUTDOWN stream

1. **No parallel execution.** `OPS-SHUTDOWN-*` phases are strictly sequential because each phase alters the machine state on which the next phase depends.
2. **No phase auto-starts.** The user must approve each phase, or the coordinator must verify the previous phase evidence log before auto-queueing.
3. **Dry-run default until `OPS-SHUTDOWN-007`.** Real shutdown must remain disabled (`policy.shutdownEnabled === false`) until all validation scenarios pass.
4. **Evidence log required for every phase.** No phase is complete without an entry in `test-results/`.
5. **Capability ownership is final.** `OPS-SHUTDOWN-009` must prove that only `scripts/shutdownManager/shutdownExecutor.ts` owns the shutdown capability.

## 4. Definition of done for the stream

- [ ] `OPS-SHUTDOWN-000` evidence log verified by coordinator.
- [ ] `OPS-SHUTDOWN-001` evidence log verified; zero unauthorized shutdown call sites remain.
- [ ] `OPS-SHUTDOWN-002` registry works from any project directory.
- [ ] `OPS-SHUTDOWN-003` `canShutdown()` returns `{ allowed, reason, blockers[], userIdleMs, policy }` and has unit tests.
- [ ] `OPS-SHUTDOWN-004` user idle detection returns number or `'UNKNOWN'`; `UNKNOWN` blocks shutdown.
- [ ] `OPS-SHUTDOWN-005` `shutdownManager.ts` supervised by `com.rpgbalancer.shutdown-manager.plist`; real shutdown disabled by default.
- [ ] `OPS-SHUTDOWN-006` harness/coordinator/Devin integrate via session registration and heartbeat.
- [ ] `OPS-SHUTDOWN-007` all 16 validation scenarios pass in dry-run and with mock executor.
- [ ] `OPS-SHUTDOWN-008` runbook exists, v1 plan archived, `MASTER_PLAN.md` updated.
- [ ] `OPS-SHUTDOWN-009` `npm run shutdown:lint-capability` passes and prevents regressions.

## 5. Lint capability guard scope (for OPS-SHUTDOWN-009)

The static guard `npm run shutdown:lint-capability` must scan for, at minimum, the following strings outside `scripts/shutdownManager/`:

- `shutdown`
- `poweroff`
- `halt`
- `pmset sleepnow`
- `pmset displaysleepnow`
- `osascript` combined with `shut down`
- `osascript` combined with `log out`
- `sudo shutdown`
- `System Events` combined with `shut down`

The guard should also detect:

- Import of a module that historically owned shutdown from outside `scripts/shutdownManager/`.
- Wrapper scripts whose name suggests auto-shutdown (e.g. `auto_shutdown_*.sh`, `*spegnimento*`).

A match must produce a CI/lint failure, not a warning.

## 6. Handoff note

This plan is the coordinator's control document for the `OPS-SHUTDOWN` stream. The strategist has already created:

- `src/docs/docs/plans/global_session_shutdown_manager_plan_v2.md`
- `.windsurf/rules/50-shutdown-governance.md`
- `prompts/OPS-SHUTDOWN-000.spec.json`
- `prompts/OPS-SHUTDOWN-001.spec.json`

The coordinator must now dispatch `OPS-SHUTDOWN-000` immediately and enforce the gating rules above.
