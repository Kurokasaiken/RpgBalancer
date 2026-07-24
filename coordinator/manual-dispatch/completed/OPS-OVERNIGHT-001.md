# Manual Task: OPS-OVERNIGHT-001

## Title

Overnight Safety Runner — Minimal fail-closed batch executor for overnight execution

## Description

Implement an isolated Python ops runner that wraps a batch of shell commands, enforces per-task timeout, inactivity/heartbeat timeout, global timeout, process-group termination, and structured logging. The runner is a short-term bridge for tonight's batch execution and does NOT replace the Global Session Shutdown Manager. It must NOT call shutdown/poweroff/halt/osascript/pmset or modify canonical Coordinator/Strategist/ProjectRunner/Execution Runtime.

## Prompt

Read `src/docs/docs/plans/overnight_safety_runner_plan.md` and `prompts/OPS-OVERNIGHT-001.spec.json` before starting. Create only new files under `scripts/overnight_runner/`; do not modify existing production code.

1. Create `scripts/overnight_runner.py` entry point with `--config` and `--dry-run` CLI flags.
2. Create `scripts/overnight_runner/config.py` and `scripts/overnight_runner/default.config.json` for JSON-first configuration.
3. Create `scripts/overnight_runner/runner.py` with process group management (`start_new_session=True`, `SIGTERM` -> `SIGKILL` escalation).
4. Implement per-task timeout, inactivity timeout / optional `heartbeat_pattern`, and global timeout.
5. Stream stdout/stderr live, print `[N/TOTAL] <id> <status>` progress, and write `test-results/overnight-runner-{timestamp}.log` and `.json` summary.
6. Implement fail-closed exit codes: `0` all passed, `1` task failure/timeout/stuck, `2` runner/global timeout error.
7. Create `scripts/overnight_runner/dryrun.py` and run the dry-run with five scenarios: completion, infinite hang, error, global timeout, stuck/inactivity.
8. Add a static guard that rejects any `command` or `on_complete` string containing `shutdown`, `poweroff`, `halt`, `osascript`, `pmset`, or `sudo shutdown`.

## Files to Modify

- `scripts/overnight_runner.py` (new)
- `scripts/overnight_runner/__init__.py` (new)
- `scripts/overnight_runner/config.py` (new)
- `scripts/overnight_runner/runner.py` (new)
- `scripts/overnight_runner/default.config.json` (new)
- `scripts/overnight_runner/dryrun.py` (new)

## Expected Output

- `python3 scripts/overnight_runner.py --dry-run` completes within 60s with all expected PASS/TIMEOUT/KILLED/STUCK outcomes.
- A real batch of `sleep`/`echo` commands completes and produces `.log` + `.json` summary.
- A `sleep 1000` task with `timeout_seconds=5` is KILLED and runner exits `1`.
- A silent task exceeding `inactivity_timeout_seconds` is marked STUCK and KILLED.
- A two-task `sleep 1000` batch with `global_timeout_seconds=10` aborts within 10s.
- No shutdown/poweroff/halt/osascript/pmset string appears in runner source except in governance comments.
- `kanban:lint` passes after documentation updates.

## Dependencies

- Python 3 available on macOS
- No dependency on OPS-SHUTDOWN-003/004/005/006 (registry not used)

## Timestamp

2026-07-23T18:37:05.294067+00:00

## Executor

manual
