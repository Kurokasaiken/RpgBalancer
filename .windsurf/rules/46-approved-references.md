# Approved References Preservation (Director ruling 2026-11-14)

Applies to every visual/design artifact in the project.

## Rule

Anything the Director **baptizes** — approves, calls "va bene", "questo", "così" —
and anything the Director **passes in chat as a screenshot and designates as
reference or similar** becomes a **reference artifact** and MUST be preserved
durably. Reference artifacts are input to future work, not disposable output.

## Duties of the agent

1. **Persist the artifact in a durable location** — the spec's `refs/` directory
   (e.g. `.mw/specs/<spec>/refs/`), never only in `gen/`, `test-results/`, `/tmp`
   or other regenerable/scratch paths. Copy, don't move: keep the generated
   original too.
2. **Name it as reference**: `ref-<name>.<ext>` or `approved-<name>.<ext>` so a
   later session can tell it is binding, not exploratory.
3. **Register it** in the spec's notes (e.g. `NOTES.md`) or plan: what was
   approved, when, verbatim quote of the Director's approval, and the artifact
   path. If the approval changed a decision, cite it in the relevant plan/contract.
4. **Never overwrite or delete** a reference artifact. New iterations go in new
   files.
5. **Generators**: if the artifact was produced by an ad-hoc script or inline
   code, save the generator (or the recipe/parameters) next to the artifact
   (`refs/` or `scripts/`), so the approved look can be reproduced or iterated.
6. **Chat screenshots**: when the Director pastes an image and calls it a
   reference (or "una cosa simile"), save it from the pasted-image temp path
   into `refs/` immediately — temp paths are not durable.

## First registered references

- `refs/mockup-hub-fan-village.jpg` — mockup approvato (ventaglio Luogo).
- `refs/approved-fan-v65.png` — render anello ellittico battezzato "procedi"
  (2026-11-14): è il modello target per il componente Luogo.
