# Director Intent → Spec

## Purpose

The Director's statements about expected behavior, visual contracts, and runtime rules are not bugs: they are the source material for the canonical documentation. This rule ensures that every new piece of information given by the Director is folded into the relevant `*_spec.md`, `*_workflow.md`, or `*_trusted.md` as expected behavior, and not left only in the error registry or a bug report.

## Invariants

1. **No single-source violations.** A contract lives in exactly one spec/workflow/trusted doc. The error registry, bug reports, and prompt files may link to it, but must not copy it.
2. **Capture as expected behavior.** When the Director says "X should happen" or "Y must not happen," translate that into a `Comportamento atteso` / `Expected behavior` / `Visual contract` block in the relevant spec, using the Director's own words.
3. **One update, one place.** If the same behavior crosses multiple components (e.g., pause affects `poi_detail_interaction_spec.md` and `time_engine_quest_interaction_spec.md`), add a `Comportamento atteso` note in each relevant doc, but keep the canonical detailed scenario in the most specific doc and cross-link the others.
4. **Tests derive from the spec.** For every `Comportamento atteso` added, either an existing test covers it or a new `test`/`test.fixme`/`test.fail` is added. The test is named after the scenario, not the error ID.
5. **Error registry is an index of deviations, not a contract store.** If a behavior is not yet implemented, record `ERR-NNN` with a short description and a link to the spec that contains the full contract. Do not paste the full contract into the registry.

## Workflow

1. Receive the Director's input.
2. Identify the canonical document(s) that own the surface(s) involved.
3. Add the expected behavior as a new scenario, invariant, or `Comportamento atteso` section in the spec/workflow.
4. If the new behavior exposes an unimplemented/misbehaving contract, open an `ERR-NNN` in the relevant error registry and link back to the spec.
5. Add or update the Playwright/RTL test to match the spec text.
6. Run `npm run build:check` and `npm run kanban:lint` before considering the turn complete.

## Examples

- Director: *"il tempo nn deve scorrere quando chiudo"*  
  Agent action: add `Comportamento atteso` in `poi_detail_interaction_spec.md` and `time_engine_quest_interaction_spec.md`: closing the POI detail restores the pause state that was active before opening. Then record ERR-029 in the registry with a link.

- Director: *"quando tutti gli slot sn occupati ne compare 1 altro, deve nascere una barra x scorrere"*  
  Agent action: add `Comportamento atteso` in `roster_slot_rack_interaction_spec.md` about horizontal scroll with fixed detail width. Then record ERR-031 with a link.

## References

- `00-project-invariants.md`
- `40-documentation-governance.md`
- `poi_quest_detail_roster_time_clock_page_workflow.md`
