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

## Quiet window

- When `policy.quietWindow.enabled` is true, shutdown is allowed only while the quiet window is active.
- `restrictedDaysOfWeek` (0=Sunday … 6=Saturday, default `[1,2,3,4,5]`) names the days on which the window covers only `startHour`–`endHour` (overnight, wraps midnight). On days not listed, the window is active all day — Director ruling 2026-10-17 (R-211): weekdays 22:00→07:00, Saturday and Sunday unrestricted.
- An empty `restrictedDaysOfWeek` means no day is restricted: the window is active all day, every day.
- A missing `restrictedDaysOfWeek` field (legacy registries or hand-built policy objects) resolves to the Mon–Fri default.

## Unregistered-process backstop

- The `ps`-based backstop classifies matches before vetoing (R-212): real work — test runners, builds, harness, coordinator, deliberation — blocks shutdown; server fixtures (`vite preview`, dev servers) are reported but **never** veto. A leftover server is not work: its consumer is what the blocking patterns detect.
- New blocking patterns may be added only for actual work; new server/fixture patterns must go to the non-blocking list.

## Media playback guard (Director ruling 2026-11-22, R-377)

- While `pmset -g assertions` reports a media playback assertion — video wake lock (`NoDisplaySleepAssertion`/`NoIdleSleepAssertion`), audio render (`PreventUserIdleSystemSleep` whose name mentions audio), any `PreventUserIdleDisplaySleep` (players, AirPlay) — an otherwise-allowed shutdown is vetoed as long as user idle stays below `policy.mediaGuard.vetoMaxIdleSeconds` (default 7200s).
- Past the cap, playback alone is not proof of presence ("asleep with the video running"): the manager posts a macOS **notification banner** (never a dialog — no focus steal, CTR-foreground-001) and probes `HIDIdleTime` for `policy.mediaGuard.gracePeriodSeconds` (default 300s). Any input during the window cancels the shutdown; silence lets it proceed.
- An unreadable `pmset` is treated as "media may be playing" (fail-closed; the grace probe bounds the error).
- Transient power-management holds (`delayDisplayOff`) and powerd's generic "display is on" are not playback.

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
