---
trigger: always_on
description: Documentation governance invariants for trusted and frozen components — single source of truth, no closure without runtime verification, and canonical statuses.
---

# Documentation Governance Invariants

Applies to every task that touches or creates a trusted/frozen component or contract.

## Single source of truth

- Every `trusted`/`frozen` component or contract has exactly one `*_trusted.md`
  trusted doc and one entry in `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`.
- General documents index and link; they do not duplicate the contract.

## Change policy

- Modifying the behavior, visual contract, runtime contract, source-of-truth usage,
  or runtime binding of a `trusted`/`frozen` component requires updating:
  1. The corresponding `*_trusted.md` doc.
  2. The `COMPONENT_MASTER_INDEX.md` row (status, link, test page, last certified).
  3. Evidence log in `test-results/`.

## Runtime verification

- No documentation closure without runtime verification.
- `npm run build:check`, `npm run lint -- <scope>`, and relevant contract/RTL tests
  must pass before the task can be considered complete.

## Plan synchronization

- The master plan and all relevant implementation plans must be referenced before
  drafting a new plan and updated when the implementation advances or diverges.
- A plan that is out of sync with the code is treated as a bug and blocks task closure.

## Canonical statuses

- Use only these statuses: `draft`, `candidate`, `trusted`, `frozen`, `deprecated`.

## Exceptions

- Kit exceptions are tracked in `src/docs/docs/idle_village/EXCEPTIONS.md`.
