# Legacy Shutdown / Auto-Commit / Auto-Push Archive

This directory contains shutdown-capable, auto-commit, auto-push, and idle-watcher artifacts that have been archived during `OPS-SHUTDOWN-001`.

**Do not execute any `.DISABLED` script.** They are preserved only for audit and historical reference.

## Main repository artifacts archived

| Original path | Archived name | Reason |
|---|---|---|
| `ai-worker/autospegnimento.sh` | `autospegnimento.sh.DISABLED` | Legacy idle-triggered shutdown script |
| `ai-worker/coordinator_watch.py` | `coordinator_watch.py.DISABLED` | Legacy idle watcher with shutdown capability |
| `ai-worker/start_coordinator_watch.sh` | `start_coordinator_watch.sh.DISABLED` | Legacy idle watcher launcher |
| `ai-worker/README_WATCH.md` | `README_WATCH.md` | Legacy idle watcher documentation |
| `ai-worker/last_activity.json` | `last_activity.json` | Legacy idle watcher state file |
| `ai-worker/kanban_vuoto.json` | `kanban_vuoto.json` | Legacy idle watcher state file |
| `test_shutdown_verification.sh` | `test_shutdown_verification.sh.DISABLED` | Legacy shutdown verification script |
| `shutdown.log` | `shutdown.log` | Legacy shutdown log |
| `shutdown_when_done.log` | `shutdown_when_done.log` | Legacy shutdown log |
| `shutdown.pid` | `shutdown.pid` | Legacy shutdown PID file |

## Previously archived by OPS-SHUTDOWN-000

| Original path | Archived name | Reason |
|---|---|---|
| `auto-commit-push-shutdown.sh` | `auto-commit-push-shutdown.sh.DISABLED` | Dangerous combined auto-commit/push/shutdown script |

## Stale worktree `.claude/worktrees/pensive-moore-4e787f/` copies

Dangerous copies found in a detached worktree were also moved here and suffixed with the worktree identifier.

| Original worktree path | Archived name |
|---|---|
| `.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh` | `auto-commit-push-shutdown.sh.pensive-moore-4e787f.DISABLED` |
| `.claude/worktrees/pensive-moore-4e787f/ai-worker/autospegnimento.sh` | `autospegnimento.sh.pensive-moore-4e787f.DISABLED` |
| `.claude/worktrees/pensive-moore-4e787f/ai-worker/coordinator_watch.py` | `coordinator_watch.py.pensive-moore-4e787f.DISABLED` |
| `.claude/worktrees/pensive-moore-4e787f/ai-worker/start_coordinator_watch.sh` | `start_coordinator_watch.sh.pensive-moore-4e787f.DISABLED` |
| `.claude/worktrees/pensive-moore-4e787f/scripts/autoCommit/commitFailureMonitor.js` | `commitFailureMonitor.js.pensive-moore-4e787f.DISABLED` |
| `.claude/worktrees/pensive-moore-4e787f/scripts/guardian/vercelDeploymentGuard.ts` | `vercelDeploymentGuard.ts.pensive-moore-4e787f.DISABLED` |
| `.claude/worktrees/pensive-moore-4e787f/test_shutdown_verification.sh` | `test_shutdown_verification.sh.pensive-moore-4e787f.DISABLED` |

## Notes

- `scripts/autoCommit/commitFailureMonitor.js` and `scripts/guardian/vercelDeploymentGuard.ts` in the main repository had their `shutdownSystem()` calls removed and now log `SHUTDOWN_CAPABILITY_NOT_OWNED` before exiting.
- Active auto-snapshot and coordinator LaunchAgents do **not** trigger shutdown; they were left in place and documented in the audit evidence log.

Date of archival: 2026-07-23
