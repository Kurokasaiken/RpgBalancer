Project instructions are in `AGENTS.md` at the repository root. Read it.

Then the binding invariants in `.windsurf/rules/*.md` — in particular
`00-project-invariants.md` (persistence via PersistenceService, config-first,
skinConfigRegistry, i18n, primitives reuse, Zustand-vs-Context, JSDoc,
mandatory safeguards) — and the surface index in `context/recurring-traps.md`
before touching code. Pre-flight, even when no `mw-*` skill is invoked: read
the traps your surface hits and re-apply them before calling work done (T-04:
a claim about a scene, animation or UI is closed only with a witness that can
actually see it, not by the diff or a metric; say what was not verified).

Before "done": `npm run lint -- <scope>`, `npm run test -- <scope>`,
`npm run build:check`, `npm run closure:lint`, `npm run governance:check`.
