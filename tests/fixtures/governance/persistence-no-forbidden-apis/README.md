# Fixture — `persistence:no-forbidden-apis` (PLAN-122 T-3)

Invariant: `.windsurf/rules/00-project-invariants.md` §Persistence —
all save/load MUST go through `@/shared/persistence/PersistenceService`;
`localStorage`/`sessionStorage`, synchronous persistence and ad-hoc storage
middleware are FORBIDDEN.

- `violation.ts` — seeded violations (bare `localStorage`, `window.sessionStorage`
  member access, `localforage` import). **MUST fail** the check.
- `clean.ts` — sanctioned `PersistenceService` usage. **MUST pass.**

Verified by `npm run governance:check -- --selftest` (check licensed by this
pair per P3 — no demotion may cite a check without a green fixture pair).
