# Wanderlust Balancer Skin Rollout Plan

**Scope:** Apply `balancer-skin.css` ("Placca su Basalto") to all high-density information surfaces: Balancer Dashboard, Spell Creator, and Roster/Character UIs. Functional behavior must remain unchanged.

---

## 1. Goals & Success Criteria
- Uniform Wanderlust visual language across analytical surfaces without altering gameplay logic or data pipelines.
- Zero regression in drag & drop, calculators, or spell crafting flows.
- Telemetry parity (all existing events still fire; new `skin_rendered` events logged).
- Style Lab pillars (`frontier | wilderness | empire`) switch at runtime without repaint glitches.
- Evidence log per phase (`test-results/wanderlust-skin-<phase>-<YYYY-MM-DD>.log`) capturing lint/test/build outputs.

## 2. Constraints & References
- Keep business logic, calculators, and persistence unchanged.
- Respect config-first rules (`src/balancing/config/**`, `src/ui/idleVillage/skins/**`).
- Mandatory references: `balancer-skin.css`, `IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md`, `Skin Binding Registry Guide`, `Component Skin Integration Guide`.
- Persistence via `PersistenceService` only.
- Testing stack: Vitest (unit/RTL), Playwright (E2E/VRT), `npm run build:check`, `npm run kanban:lint` before completion.

## 3. Phased Execution

### Phase A – Foundation (1-2 days)
1. Import `balancer-skin.css` after `base.css` for Balancer, Spell Creator, Roster entry points.
2. Audit DOM structure for each surface; add `.card` wrapper hierarchy + `skinDataAttributes` passthrough where missing.
3. Verify Style Lab integration (ensure pillars/presets propagate via `useSkinPreferences`).
4. Smoke tests: `npm run test -- tests/unit/balancer`, targeted RTL for roster, `npm run test:e2e -- tests/e2e/idleVillage/testRosterPgCards.spec.ts`.

### Phase B – Component Wrappers (2-3 days)
1. Balancer Dashboard:
   - Wrap panels (stat tables, sliders) with card scaffold.
   - Map existing data viz components to plaques/buttons defined in CSS.
   - Track `skin_balancer_panel_rendered` telemetry.
2. Spell Creator:
   - Apply skin to spell summary cards, rune slots, and control rails.
   - Ensure sliders use `.track`, `.fill`, `.thumb` styling hooks.
3. Roster / Characters:
   - Ensure ResidentSlotRack, PgCard, and related components expose `data-slot-skin`, `data-style-lab-pillar` attributes.
   - Update RTL tests for new attributes (no logic change).
4. Regression tests + visual snapshots (Playwright VRT for each page in two pillars).

### Phase C – Integration & QA (1-2 days)
1. Cross-page walkthrough verifying functionality unchanged (assignment, spell save/load, balancer adjustments).
2. Performance sanity: compare FPS / interaction latency before vs after (target < 5% delta).
3. Accessibility sweep: keyboard focus, reduced-motion class toggles.
4. Documentation & evidence log update.

### Phase D – Release Prep (0.5 day)
1. Final lint/test/build suite.
2. Kanban update + sign-off from art direction & gameplay owners.
3. Prep rollback instructions (toggle to previous skin via registry flag).

## 4. Deliverables & Ownership
| Artifact | Description |
| --- | --- |
| Updated CSS imports | Each page imports `balancer-skin.css` after `base.css`. |
| Wrapper adjustments | `.card` scaffolding + plaques applied to target components. |
| Telemetry updates | `skin_rendered` events for Balancer, Spell Creator, Roster. |
| Test reports | Vitest, Playwright, VRT outputs + evidence logs. |
| Documentation | Implementation plan annotated (done) + rollout summary in CHANGELOG. |

## 5. Risk & Mitigation
- **Visual regressions**: use Playwright screenshots for all pillars.
- **Performance hits**: monitor bundle diff; lazy-load CSS only on relevant routes.
- **Accessibility**: enforce `motion-reduced` class toggle and contrast tokens.
- **Telemetry noise**: throttle new events via existing analytics middleware.

## 6. Next Steps
1. Assign Kanban tickets per phase (A/B/C/D) with named owners.
2. Kick off Phase A by creating CSS imports + DOM audits.
3. Schedule design review once Phase B prototypes are ready.

## 7. Task Breakdown & Kanban Mapping

| Task ID | Phase | Scope | Dependencies | Safeguards / Evidence |
| --- | --- | --- | --- | --- |
| **WB-SKIN-A – Foundation Imports & Audits** | Phase A | Import `balancer-skin.css`, audit DOM wrappers for Balancer/Spell/Roster, verify Style Lab pillars propagate, smoke tests on balancer + roster. | None | `npm run lint -- src/ui/balancing src/ui/idleVillage`, targeted RTL roster suite, `npm run test -- tests/e2e/idleVillage/testRosterPgCards.spec.ts`, `npm run build:check`, `npm run kanban:lint`, log `test-results/wanderlust-skin-A-<date>.log`. |
| **WB-SKIN-B – Component Wrappers & Telemetry** | Phase B | Apply skin scaffolding to Balancer dashboard panels, Spell Creator cards/sliders, Roster components (ResidentSlotRack, PgCard) with telemetry `skin_*_rendered`, VRT across pillars. | WB-SKIN-A | Add/extend unit + RTL for altered components, Playwright `@wanderlust-balancer` / `@wanderlust-roster` scenarios, VRT captures for Frontier/Wilderness, `npm run build:check`, `npm run kanban:lint`, log `test-results/wanderlust-skin-B-<date>.log`. |
| **WB-SKIN-C – Integration QA & Performance** | Phase C | Cross-page functional regression (assignment, spell save/load, balancer adjustments), performance sampling (<5% delta), accessibility sweep (keyboard, reduced motion). | WB-SKIN-B | `npm run test -- tests/unit/balancer tests/unit/spells`, Playwright regression paths, performance script (FPS capture), axe/aria checks, `npm run build:check`, `npm run kanban:lint`, log `test-results/wanderlust-skin-C-<date>.log`. |
| **WB-SKIN-D – Release Prep & Rollback** | Phase D | Final lint/test/build suite, Kanban closure, art/gameplay sign-off, rollback instructions (registry flag). | WB-SKIN-C | Full safeguard suite (lint, targeted/unit regression, Playwright smoke, `npm run build:check`, `npm run kanban:lint`), documentation updates (CHANGELOG, rollout summary), log `test-results/wanderlust-skin-D-<date>.log`. |
