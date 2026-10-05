---
trigger: always_on
description: Global session shutdown governance — only the authorized manager can request machine shutdown, and no component may introduce competing shutdown/auto-commit/auto-push mechanisms.
---

# Global Session Shutdown Governance

Applies to every task that touches or introduces auto-shutdown, auto-commit, auto-push, idle detection, poweroff, halt, sleep, or machine-state orchestration.

## Single source of truth

- The **Global Session Shutdown Manager** (`scripts/shutdownManager/shutdownManager.ts`, launched via `com.rpgbalancer.shutdown-manager.plist`) is the only component authorized to request macOS shutdown.
- No shell script, Python script, Node script, Git hook, cron job, LaunchAgent, or application code may call `shutdown`, `poweroff`, `halt`, `pmset sleep`, `osascript -e 'tell application "System Events" to shut down'`, `sudo shutdown -h now`, or any equivalent command except through this manager.

## Project and session registration

- Any project, Devin window, harness run, or long-lived process that must block shutdown must register in `~/.rpg-shutdown/session-registry.json` and send periodic heartbeats.
- Filesystem writes, Git dirty state, CPU usage, or coordinator log writes are not valid shutdown signals by themselves.

## Fail-closed defaults

- Real shutdown is disabled by default (`policy.shutdownEnabled === false`).
- Dry-run mode (`DRY_RUN=true`) must be implemented and verified before real shutdown is enabled.
- Unknown, expired, corrupted, or unreadable registry state blocks shutdown.

## Auto-commit / auto-push separation

- Automated Git backup (`auto-commit`, `auto-push`) may be preserved as an opt-in per-project policy.
- Git state must never be used as a global shutdown criterion.
- No script may combine auto-commit, auto-push, and shutdown without explicit review and policy configuration.

## Capability ownership

- Only `scripts/shutdownManager/shutdownExecutor.ts` (or the explicit successor module named in this rule) may execute machine shutdown.
- Every other component — including harness, coordinator, deployment guards, and commit guardians — may only:
  - register a session
  - send heartbeats
  - update session state
  - request a shutdown evaluation
- No other module may call `shutdown`, `poweroff`, `halt`, `pmset sleep`, `osascript -e 'tell application "System Events" to shut down'`, `sudo shutdown -h now`, or any equivalent API.

## Static enforcement

- `npm run shutdown:lint-capability` (or a CI step) must scan the repository and fail if shutdown-capable commands appear outside `scripts/shutdownManager/`.
- Any prompt that adds shutdown behavior must wire this guard or update it.
- Violations must be flagged to the Strategist/Coordinator before the task is considered complete.

## Adding or modifying shutdown behavior

- Any prompt that adds shutdown/auto-shutdown/idle-shutdown behavior must first update this invariant and register the component in `session-registry.json`.
- All changes require `npm run shutdown:status` diagnostics and an evidence log in `test-results/`.
