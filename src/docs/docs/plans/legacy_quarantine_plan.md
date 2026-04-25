# Legacy Sandbox & UI Quarantine Plan

## Scope (Jan 2026)

The following folders are temporarily ignored by ESLint via `lintQuarantineIgnores` until
we either migrate their functionality or delete the obsolete code paths:

1. `_OLD_DEPRECATED/**`
2. `old_*.tsx` files at repo root (legacy UI experiments)
3. `src/ui/idleVillage/legacy/**`
4. `src/ui/testing/__legacy__/**`

## Goals

- **Short term**: keep `npm run check:sandbox-docs` green by excluding unstable legacy files from lint/test gates.
- **Medium term**: decide which artifacts must be ported to the current Idle Village map (Phase 12) or Balancer v10 flows.
- **Long term**: delete quarantined directories once migrated, so the lint ignore list returns to empty.

## Remediation Checklist

| Status | Task | Owner | Notes |
| --- | --- | --- | --- |
| ☐ | Catalogue each quarantined component/page and record the last time it shipped in production | WS5 QA | Use `git log --since=2025-06-01` to spot dead code |
| ☐ | For Idle Village legacy flows, confirm whether Phase 12 ActivitySlot parity covers them | Phase 12 owners | If parity exists, schedule deletion PR |
| ☐ | Port any required mock/test utilities from `src/ui/testing/__legacy__` into the new RoundRobin stress testing suite | Phase 10.5 team | Maintain config-first data sources |
| ☐ | Remove `_OLD_DEPRECATED` assets that are fully superseded by Observatory theme components | Style Lab | Validate via docs/plans/art_direction_plan.md |
| ☐ | Once a folder has zero consumers, drop it from `lintQuarantineIgnores` and delete it | Repo maintainers | Treat as regular change with tests |

## Acceptance Criteria

- Quarantined code must not block CI (lint/tests) for active modules.
- Every quarantined folder has a documented decision ("delete", "port", "rewrite") by Feb 28 2026.
- All surviving code paths are refactored to the config-first architecture (balancer preset configs, PersistenceService, etc.).

## Next Review

- **Milestone**: WS5 Baseline QA retro (Feb 2026)
- **Action**: Re-run lint without global ignores to ensure only intended files remain.
