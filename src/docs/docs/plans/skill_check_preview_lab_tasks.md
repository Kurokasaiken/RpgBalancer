# Skill Check Preview Lab Refactor – Task List

**Linked Plan:** [skill_check_preview_lab_plan.md](skill_check_preview_lab_plan.md)  
**Status Legend:** ☐ pending · ☑️ done

---

## Phase 1 – View Mode Consolidation & Storage Cleanup

- [ ] Remove the `alt-v6-plus` view option and related branching from `SkillCheckPreviewPage.tsx`.
- [ ] Add a migration guard to clear legacy `ALT_VIEW_MODE_STORAGE_KEY` entries or coerce them to the single-view default.
- [ ] Verify localStorage writes/readbacks only use the remaining dispatch view key.

## Phase 2 – V6 Embedding & Controls

- [ ] Replace the SVG dispatch polygon renderer with `<AltVisualsV6Asterism>` while preserving the layout.
- [ ] Integrate the “Riavvia scena” and “Ritira dado” buttons into the Skill Check controls column, wiring them to the V6 controller.
- [ ] Remove `shotPower`, `spinBias`, and `handleThrow` logic plus related sliders/button.
- [ ] Hide the “Stella Perfetta (Test Mode)” toggle when the Lab renders V6 (pass `enablePerfectStarToggle={false}`).
- [ ] Ensure log/timer UI still renders meaningful output or adjust copy to reflect new interaction model.

## Phase 3 – Stat Cardinality & Icon Overlay

- [ ] Implement a helper (with JSDoc) that returns the 5-position stat distribution array based on active stat count.
- [ ] Map stat IDs to icon metadata via `getStatIconComponent`/`deriveAxisMeta`, avoiding inline emoji.
- [ ] Pass the derived `axisMeta` array into `AltVisualsV6Asterism` and verify canvas icons update when stats toggle.
- [ ] Add targeted unit test(s) for the cardinality helper to prevent regressions.

## Phase 4 – Validation & Polish

- [ ] Update `tests/ui.spec.ts` (and any other relevant suites) to reflect the single-view mode and new controls.
- [ ] Run `npm run test -- tests/ui.spec.ts` (or broader suites) and ensure all pass.
- [ ] Perform manual smoke test inside Skill Check Preview Lab verifying controls + stats flow.
- [ ] Update documentation (Master Plan summary + changelog if needed) once implementation is merged.
