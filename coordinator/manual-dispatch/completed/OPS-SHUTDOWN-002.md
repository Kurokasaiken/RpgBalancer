# Manual Task: OPS-SHUTDOWN-002

## Title

Global Session Registry — Create the machine-wide session registry

## Description

Build the Zod-validated session registry at `~/.rpg-shutdown/session-registry.json`, plus atomic read/write/heartbeat CLI commands. This is the first implementation phase of the Global Session Shutdown Manager after the legacy cleanup.

## Prompt

Read the full specification in `prompts/OPS-SHUTDOWN-002.spec.json` and the master plan in `src/docs/docs/plans/ops_shutdown_remaining_phases_plan.md` before starting.

1. Verify the gating condition: `test-results/ops-shutdown-001-audit-<date>.log` exists and no unauthorized shutdown call sites exist outside `scripts/shutdownManager/`.
2. Create `scripts/shutdownManager/sessionRegistry.ts` with Zod schema and atomic file operations.
3. Create CLI scripts: `registerSession.ts`, `heartbeatSession.ts`, `releaseSession.ts`.
4. Write unit tests for round-trip, stale TTL, Zod validation, and concurrent writes.
5. Run safeguards: `npm run lint`, `npm run test -- scripts/shutdownManager/`, `npm run build:check`, `npm run kanban:lint`.
6. Produce evidence log `test-results/ops-shutdown-002-registry-<date>.log`.

## Files to Modify

- `scripts/shutdownManager/sessionRegistry.ts` (new)
- `scripts/shutdownManager/registerSession.ts` (new)
- `scripts/shutdownManager/heartbeatSession.ts` (new)
- `scripts/shutdownManager/releaseSession.ts` (new)
- `package.json` (optional helper scripts)

## Expected Output

- `~/.rpg-shutdown/session-registry.json` schema and atomic CLI commands working.
- All unit tests pass.
- Evidence log created.
- No code outside `scripts/shutdownManager/` executes shutdown.

## Dependencies

- `OPS-SHUTDOWN-001` completed and verified.

## Timestamp

2026-07-23T09:40:55.558035+00:00

## Executor

manual
