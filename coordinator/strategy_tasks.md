# Strategy Tasks - RPG Balancer

This file tracks all strategy tasks assigned by the Strategist to the Coordinator for agent execution.

## Task: IV-TRAILER-DAY1-001

**Title:** Days 1-3 - Astrolabe Vertical Slice (Scene 4: Risk)

**Status:** Completato

**Updated:** 2026-07-16

**Evidence:** test-results/build-check-2026-07-16.log

**Plan Reference:** [trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md)

**Created:** 2026-07-16

**Priority:** High

**Estimated Duration:** 120-180 minutes

---

## Task: IV-TRAILER-DAY4-006

**Title:** Days 4-6 - Trailer Viewer + Threat + Choice

**Status:** Non assegnato

**Plan Reference:** [trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md)

**Created:** 2026-07-16

**Priority:** High

**Estimated Duration:** 120-180 minutes

**Dependencies:** IV-TRAILER-DAY1-001

---

## Task: IV-TRAILER-DAY7-009

**Title:** Days 7-9 - Preparation + Consequence

**Status:** Non assegnato

**Plan Reference:** [trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md)

**Created:** 2026-07-16

**Priority:** High

**Estimated Duration:** 120-180 minutes

**Dependencies:** IV-TRAILER-DAY4-006

---

## Task: IV-TRAILER-DAY10-012

**Title:** Days 10-12 - Legacy + Outro

**Status:** Non assegnato

**Plan Reference:** [trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md)

**Created:** 2026-07-16

**Priority:** High

**Estimated Duration:** 120-180 minutes

**Dependencies:** IV-TRAILER-DAY7-009

---

## Task: IV-TRAILER-DAY13-015

**Title:** Days 13-14 - Final Polish and Integration

**Status:** Non assegnato

**Plan Reference:** [trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md)

**Created:** 2026-07-16

**Priority:** High

**Estimated Duration:** 120-180 minutes

**Dependencies:** IV-TRAILER-DAY10-012

---

## Full Prompt for Coordinator

### Task ID: IV-TRAILER-DAY1-001

### Title: Days 1-3 - Astrolabe Vertical Slice (Scene 4: Risk)

### Brief Description
Create AstrolabeTrailerController that demonstrates DestinyAstrolabe can be controlled for deterministic capture. This is Sprint 1 from the approved trailer vertical slice plan, focusing on the hero shot (Scene 4: Risk).

### Plan Reference
[trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md) - Section 6, Sprint 1 (Days 1-3)

### Estimated Duration
120-180 minutes

### Objectives
1. Create `src/ui/idleVillage/trailer/` directory structure
2. Create `AstrolabeTrailerController.tsx` that wraps DestinyAstrolabe
3. Implement scripted timeline (reveal → tension → near miss → HERO INJURED)
4. Implement internal CSS reward burst (NO separate component)
5. Verify DestinyAstrolabe renders correctly in trailer context
6. Demonstrate deterministic 7-second sequence that can be replayed identically
7. Capture first Steam-ready material (GIF, screenshots)

### Success Criteria and KPI Targets
- **Functional:** DestinyAstrolabe renders in trailer context without errors
- **Deterministic:** Pressing F5 produces identical 7-second sequence
- **Timeline:** Sequence follows reveal (0-2s) → tension (2-5s) → near miss (5-7s) → HERO INJURED
- **No Gameplay Mutation:** AstrolabeTrailerController does NOT modify DestinyAstrolabe internals, physics, or gameplay rules
- **Capture Ready:** At least 3 screenshot-worthy frames and 1 GIF-worthy loop
- **CSS Reward Burst:** Predefined particles, deterministic positions, NO physics, NO canvas, NO separate component

### Integration Points and Dependencies
- **Existing Component:** DestinyAstrolabe (reuse only, do NOT modify)
- **Routing:** Add `/trailer` route to existing routing system
- **CSS Variables:** Use trailer.css variables for tuning (--trailer-bg, --trailer-gold, etc.)
- **Config:** Reference `trailerConfig.ts` for timing values (create if needed)

### Guardrails

#### @trailer-only Convention (EXEMPT from gameplay architecture)
**Standard Invariants - EXEMPT (do NOT apply):**
- **Persistence Invariant:** NO PersistenceService, NO localStorage/sessionStorage, NO persistence of any kind
- **Localization Invariant:** NO i18n for copy text (hardcoded allowed for iteration speed), NO translation keys
- **Telemetry:** NO telemetry of any kind (marketing asset, not product)
- **Gameplay State:** NO gameplay state mutation, NO economy systems, NO player progression

**Standard Invariants - MUST PRESERVE (DO apply):**
- **Config-first:** All timing values, camera settings, sequence events in `trailerConfig.ts` with Zod validation
- **Skin/Theme:** Use CSS variables from trailer.css, NO standalone .css files, use Gilded Observatory tokens
- **Component Reuse:** Verify primitives before creating new components, reuse DestinyAstrolabe as-is
- **State Management:** Use React Context for local presentation state, NO Zustand (marketing-only)
- **Documentation:** JSDoc on all functions/interfaces, update plan changelog
- **Node/tooling:** Use pinned Node version from .nvmrc
- **Safeguards:** Run lint, build:check, kanban:lint before task complete

#### AstrolabeTrailerController Constraints
- **MAY:** Set initial state, trigger scripted actions, control presentation, include internal CSS reward burst
- **MAY NOT:** Change physics, modify probabilities, alter gameplay rules, fork DestinyAstrolabe, modify DestinyAstrolabe internals

#### Deterministic Seed Rule
- **FORBIDDEN:** NO `Math.random()` in trailer code
- **REQUIRED:** All randomness must come from deterministic seed
- **Config:** Add `capture.seed: 12345` to trailerConfig.ts
- **Implementation:** Use seeded random generator for all random values

#### No Placeholder Rule
- **FORBIDDEN:** No temporary shapes, debug boxes, fake assets, or developer UI after first integration day
- **REQUIRED:** Every captured frame must represent final visual language

### Implementation Scope

#### Files to Create
1. `src/ui/idleVillage/trailer/README.md` - Trailer system rules and @trailer-only convention
2. `src/ui/idleVillage/trailer/AstrolabeTrailerController.tsx` - Main component with scripted timeline
3. `src/ui/idleVillage/trailer/trailer.css` - CSS variables for trailer styling
4. `src/balancing/config/idleVillage/trailerConfig.ts` - Config with timing, camera, seed values

#### Files to Modify
1. **Routing system** - Add `/trailer` route with scene parameter support
2. **App.tsx or equivalent** - Add TrailerViewer shell (minimal switch statement for scene routing)

#### Component Reuse Requirements
- **DestinyAstrolabe:** Reuse existing component, do NOT modify internals
- **CSS Variables:** Use existing theme tokens from `src/ui/styleLab/tokens/gilded-observatory.css`

#### Testing Requirements
- **Unit Tests:** None required for Sprint 1 (focus on visual capture)
- **Integration Tests:** None required for Sprint 1
- **Visual Verification:** Manual browser test - verify DestinyAstrolabe renders correctly
- **Deterministic Test:** Press F5 10 times, verify sequence is identical each time
- **Capture Test:** OBS recording test for GIF production

### Documentation Updates
1. **trailer_vertical_slice_plan.md:** Update Sprint 1 progress in changelog after completion
2. **docs/trailer_capture_notes.md:** Add best timestamps, successful screenshots

### Safeguards
- **Lint Scope:** `src/ui/idleVillage/trailer/` (120s timeout)
- **Test Scope:** None for Sprint 1
- **Build Check:** `npm run build:check` (180s timeout)
- **Kanban Lint:** `npm run kanban:lint` (30s timeout)

### Evidence Logging Location
- Update `docs/plans/trailer_vertical_slice_plan.md` changelog with Sprint 1 completion
- Add screenshots/GIF to `docs/trailer_capture_notes.md`

### Governance Enforcement
- **Trusted/Frozen Components:** DestinyAstrolabe is trusted - do NOT modify, only reuse
- **Documentation Governance:** Update plan changelog, no trusted doc updates required (not touching frozen components)
- **COMPONENT_MASTER_INDEX:** No updates required (not creating reusable components)

### Execution Hint
**verified** - This task touches invariants (@trailer-only exemption, deterministic seed rule, no placeholder rule) and requires design judgment on what is exempt from gameplay architecture while preserving presentation architecture.

---

## Task: IV-TRAILER-DAY4-006

**Title:** Days 4-6 - Trailer Viewer + Threat + Choice (Scene 1-2)

**Status:** Non assegnato

**Plan Reference:** [trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md) - Section 6, Sprint 2 (Days 4-6)

**Created:** 2026-07-16

**Priority:** High

**Estimated Duration:** 120-150 minutes

---

## Full Prompt for Coordinator

### Task ID: IV-TRAILER-DAY4-006

### Title: Days 4-6 - Trailer Viewer + Threat + Choice (Scene 1-2)

### Brief Description
Create TrailerViewer shell with scene routing and implement Threat (Scene 1) and Choice (Scene 2) scenes. This establishes the trailer infrastructure and first two scenes.

### Plan Reference
[trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md) - Section 6, Sprint 2 (Days 4-6)

### Estimated Duration
120-150 minutes

### Objectives
1. Create TrailerViewer.tsx shell with scene selector (switch statement, NO patterns)
2. Add `/trailer` route with debug buttons and scene parameter support
3. Implement TrailerThreat.tsx (map + POI appear + GOBLIN INVASION banner, 0:00-0:05)
4. Implement TrailerChoice.tsx (village + asymmetric POI choices, 0:05-0:15)
5. Add capture mode support (?capture=true hides debug, forces autoplay, resets to t=0)
6. Verify all scenes navigate correctly
7. Test both scenes deterministically

### Success Criteria and KPI Targets
- **TrailerViewer:** Simple switch statement routing, NO abstraction, NO patterns
- **Routing:** `/trailer` with debug buttons, `/trailer?scene=threat|choice|preparation|risk|consequence|legacy|outro`
- **Capture Mode:** ?capture=true hides debug, forces autoplay, resets to t=0
- **Threat Scene:** 5-second map + POI appear + GOBLIN INVASION banner, screenshot-worthy frame
- **Choice Scene:** 10-second village + asymmetric POI choices, screenshot-worthy frame
- **Navigation:** All scenes navigate without errors
- **Deterministic:** Both sequences identical on F5 refresh

### Integration Points and Dependencies
- **Existing Components:** MapPage, LocationCard, QuestPOI, MapHeatmapOverlay (Threat)
- **Existing Components:** VillageSandbox, ResidentSlotRack, VillageRosterSection, WanderlustSurface (Choice)
- **Existing:** AstrolabeTrailerController.tsx (from Sprint 1)
- **Routing:** Extend existing routing system
- **Config:** trailerConfig.ts threat and choice timing

### Guardrails

#### @trailer-only Convention (EXEMPT from gameplay architecture)
**Standard Invariants - EXEMPT (do NOT apply):**
- **Persistence Invariant:** NO PersistenceService, NO localStorage/sessionStorage, NO persistence of any kind
- **Localization Invariant:** NO i18n for copy text (hardcoded allowed for iteration speed), NO translation keys
- **Telemetry:** NO telemetry of any kind (marketing asset, not product)
- **Gameplay State:** NO gameplay state mutation, NO economy systems, NO player progression

**Standard Invariants - MUST PRESERVE (DO apply):**
- **Config-first:** All timing values, camera settings, sequence events in `trailerConfig.ts` with Zod validation
- **Skin/Theme:** Use CSS variables from trailer.css, NO standalone .css files, use Gilded Observatory tokens
- **Component Reuse:** Verify primitives before creating new components, reuse existing components
- **State Management:** Use React Context for local presentation state, NO Zustand (marketing-only)
- **Documentation:** JSDoc on all functions/interfaces, update plan changelog
- **Node/tooling:** Use pinned Node version from .nvmrc
- **Safeguards:** Run lint, build:check, kanban:lint before task complete

#### TrailerViewer Architecture
- **REQUIRED:** Keep it STUPID - simple switch statement, NO patterns, NO abstraction
- **FORBIDDEN:** NO generic routing system, NO scene manager, NO timeline abstraction

#### Capture Mode
- **REQUIRED:** Freeze seed, freeze random, disable interaction
- **REQUIRED:** ?capture=true hides debug, forces autoplay, resets to t=0

#### No Placeholder
- **FORBIDDEN:** No temporary shapes, debug boxes, fake assets, or developer UI
- **REQUIRED:** All visual elements must be final quality

### Implementation Scope

#### Files to Create
1. `src/ui/idleVillage/trailer/TrailerViewer.tsx` - Shell with scene selector
2. `src/ui/idleVillage/trailer/TrailerThreat.tsx` - Map + POI appear + GOBLIN INVASION banner
3. `src/ui/idleVillage/trailer/TrailerChoice.tsx` - Village + asymmetric POI choices

#### Files to Modify
1. **Routing system** - Add `/trailer` route with debug buttons
2. `src/balancing/config/idleVillage/trailerConfig.ts` - Add threat and choice config

#### Component Reuse
- **MapPage, LocationCard, QuestPOI, MapHeatmapOverlay:** Reuse for Threat scene
- **VillageSandbox, ResidentSlotRack, VillageRosterSection, WanderlustSurface:** Reuse for Choice scene

#### Testing Requirements
- **Navigation Test:** All scenes navigate correctly
- **Capture Mode Test:** ?capture=true hides debug, forces autoplay
- **Deterministic Test:** Both sequences identical on F5
- **Visual Test:** Screenshot-worthy frames exist for both scenes

### Documentation Updates
1. **trailer_vertical_slice_plan.md:** Update Sprint 2 progress in changelog

### Safeguards
- **Lint Scope:** `src/ui/idleVillage/trailer/` (120s timeout)
- **Test Scope:** None
- **Build Check:** `npm run build:check` (180s timeout)
- **Kanban Lint:** `npm run kanban:lint` (30s timeout)

### Execution Hint
**assisted** - Simple routing and scene creation, no complex logic, no integration tests needed.

---

## Task: IV-TRAILER-DAY7-009

**Title:** Days 7-9 - Preparation + Consequence (Scene 3-5)

**Status:** Non assegnato

**Plan Reference:** [trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md) - Section 6, Sprint 3 (Days 7-9)

**Created:** 2026-07-16

**Priority:** High

**Estimated Duration:** 120-150 minutes

---

## Full Prompt for Coordinator

### Task ID: IV-TRAILER-DAY7-009

### Title: Days 7-9 - Preparation + Consequence (Scene 3-5)

### Brief Description
Implement Preparation (Scene 3) and Consequence (Scene 5) scenes. Preparation shows hero sheet + drag to POI. Consequence shows village lost + greyscale.

### Plan Reference
[trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md) - Section 6, Sprint 3 (Days 7-9)

### Estimated Duration
120-150 minutes

### Objectives
1. Create TrailerPreparation.tsx (hero sheet + drag to POI, 0:15-0:25)
2. Create TrailerConsequence.tsx (village lost + greyscale, 0:32-0:40)
3. Implement hero sheet: Attack 15, Defense 8, Magic 12
4. Implement drag hero token into QuestPOI with POI pulsing
5. Implement timer reaching zero with greyscale filter and impact overlay
6. Verify both scenes recordable with no clicks required
7. Add screenshot-worthy frames for each scene

### Success Criteria and KPI Targets
- **Preparation Scene:** Hero sheet (Attack 15, Defense 8, Magic 12), drag to POI, POI pulsing
- **Consequence Scene:** Timer reaches zero, greyscale filter, impact overlay, SETTLEMENT LOST
- **No Clicks:** Both scenes run automatically without interaction
- **Deterministic:** Both sequences identical on F5 refresh
- **Screenshots:** At least 1 screenshot-worthy frame per scene

### Integration Points and Dependencies
- **Existing Components:** WanderlustRosterCard, WanderlustPortrait, WanderlustStatBar, QuestPOI (Preparation)
- **Existing Components:** VillageSandbox, ActiveHUD, HUDNotificationLayer, TeaserImpactOverlay (Consequence)
- **TrailerViewer:** Scene routing from Sprint 2
- **Config:** trailerConfig.ts preparation and consequence timing

### Guardrails

#### @trailer-only Convention (EXEMPT from gameplay architecture)
**Standard Invariants - EXEMPT (do NOT apply):**
- **Persistence Invariant:** NO PersistenceService, NO localStorage/sessionStorage, NO persistence of any kind
- **Localization Invariant:** NO i18n for copy text (hardcoded allowed for iteration speed), NO translation keys
- **Telemetry:** NO telemetry of any kind (marketing asset, not product)
- **Gameplay State:** NO gameplay state mutation, NO economy systems, NO player progression

**Standard Invariants - MUST PRESERVE (DO apply):**
- **Config-first:** All timing values, camera settings, sequence events in `trailerConfig.ts` with Zod validation
- **Skin/Theme:** Use CSS variables from trailer.css, NO standalone .css files, use Gilded Observatory tokens
- **Component Reuse:** Verify primitives before creating new components, reuse existing components
- **State Management:** Use React Context for local presentation state, NO Zustand (marketing-only)
- **Documentation:** JSDoc on all functions/interfaces, update plan changelog
- **Node/tooling:** Use pinned Node version from .nvmrc
- **Safeguards:** Run lint, build:check, kanban:lint before task complete

#### No Placeholder
- **FORBIDDEN:** No temporary shapes, debug boxes, fake assets, or developer UI
- **REQUIRED:** All visual elements must be final quality

### Implementation Scope

#### Files to Create
1. `src/ui/idleVillage/trailer/TrailerPreparation.tsx` - Hero sheet + drag to POI
2. `src/ui/idleVillage/trailer/TrailerConsequence.tsx` - Village lost + greyscale

#### Files to Modify
1. `src/balancing/config/idleVillage/trailerConfig.ts` - Add preparation and consequence config
2. `src/ui/idleVillage/trailer/TrailerViewer.tsx` - Add scene routing

#### Component Reuse
- **WanderlustRosterCard, WanderlustPortrait, WanderlustStatBar, QuestPOI:** Reuse for Preparation
- **VillageSandbox, ActiveHUD, HUDNotificationLayer, TeaserImpactOverlay:** Reuse for Consequence

#### Testing Requirements
- **Auto-play Test:** Both scenes run without clicks
- **Deterministic Test:** Both sequences identical on F5
- **Visual Test:** Screenshot-worthy frames exist

### Documentation Updates
1. **trailer_vertical_slice_plan.md:** Update Sprint 3 progress in changelog

### Safeguards
- **Lint Scope:** `src/ui/idleVillage/trailer/` (120s timeout)
- **Test Scope:** None
- **Build Check:** `npm run build:check` (180s timeout)
- **Kanban Lint:** `npm run kanban:lint` (30s timeout)

### Execution Hint
**verified** - Component reuse verification required, touches multiple existing components, requires design judgment on visual presentation.

---

## Task: IV-TRAILER-DAY10-012

**Title:** Days 10-12 - Legacy + Outro (Scene 6-7)

**Status:** Non assegnato

**Plan Reference:** [trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md) - Section 6, Sprint 4 (Days 10-12)

**Created:** 2026-07-16

**Priority:** High

**Estimated Duration:** 120-150 minutes

---

## Full Prompt for Coordinator

### Task ID: IV-TRAILER-DAY10-012

### Title: Days 10-12 - Legacy + Outro (Scene 6-7)

### Brief Description
Implement Legacy (Scene 6) and Outro (Scene 7) scenes. Legacy shows knowledge preserved list. Outro shows WANDERLUST TRIUMPH + wishlist CTA.

### Plan Reference
[trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md) - Section 6, Sprint 4 (Days 10-12)

### Estimated Duration
120-150 minutes

### Objectives
1. Create TrailerLegacy.tsx (knowledge preserved list, 0:40-0:50)
2. Create TrailerOutro.tsx (WANDERLUST TRIUMPH + wishlist CTA, 0:50-0:55)
3. Implement KNOWLEDGE PRESERVED with artifacts, blueprints, surviving heroes
4. Implement bronze surface cards for each legacy item with checkmarks
5. Implement WANDERLUST TRIUMPH logo with PREPARE · ENDURE · TRIUMPH tagline
6. Implement animated wishlist CTA button
7. Verify both scenes recordable with compelling CTA

### Success Criteria and KPI Targets
- **Legacy Scene:** KNOWLEDGE PRESERVED, artifacts/blueprints/heroes with checkmarks, bronze surface cards
- **Outro Scene:** WANDERLUST TRIUMPH logo, PREPARE · ENDURE · TRIUMPH tagline, animated CTA
- **No Clicks:** Both scenes run automatically without interaction
- **Deterministic:** Both sequences identical on F5 refresh
- **Compelling CTA:** Final CTA is compelling and screenshot-worthy

### Integration Points and Dependencies
- **Existing Components:** VictoryComponent, ActivityLogPanel, WanderlustSurface, WanderlustPortrait (Legacy)
- **Existing Components:** WanderlustHeading, WanderlustSurface (Outro)
- **TrailerViewer:** Scene routing from Sprint 2
- **Config:** trailerConfig.ts legacy and outro timing

### Guardrails

#### @trailer-only Convention (EXEMPT from gameplay architecture)
**Standard Invariants - EXEMPT (do NOT apply):**
- **Persistence Invariant:** NO PersistenceService, NO localStorage/sessionStorage, NO persistence of any kind
- **Localization Invariant:** NO i18n for copy text (hardcoded allowed for iteration speed), NO translation keys
- **Telemetry:** NO telemetry of any kind (marketing asset, not product)
- **Gameplay State:** NO gameplay state mutation, NO economy systems, NO player progression

**Standard Invariants - MUST PRESERVE (DO apply):**
- **Config-first:** All timing values, camera settings, sequence events in `trailerConfig.ts` with Zod validation
- **Skin/Theme:** Use CSS variables from trailer.css, NO standalone .css files, use Gilded Observatory tokens
- **Component Reuse:** Verify primitives before creating new components, reuse existing components
- **State Management:** Use React Context for local presentation state, NO Zustand (marketing-only)
- **Documentation:** JSDoc on all functions/interfaces, update plan changelog
- **Node/tooling:** Use pinned Node version from .nvmrc
- **Safeguards:** Run lint, build:check, kanban:lint before task complete

#### No Placeholder
- **FORBIDDEN:** No temporary shapes, debug boxes, fake assets, or developer UI
- **REQUIRED:** All visual elements must be final quality

### Implementation Scope

#### Files to Create
1. `src/ui/idleVillage/trailer/TrailerLegacy.tsx` - Knowledge preserved list
2. `src/ui/idleVillage/trailer/TrailerOutro.tsx` - WANDERLUST TRIUMPH + wishlist CTA

#### Files to Modify
1. `src/balancing/config/idleVillage/trailerConfig.ts` - Add legacy and outro config
2. `src/ui/idleVillage/trailer/TrailerViewer.tsx` - Add scene routing

#### Component Reuse
- **VictoryComponent, ActivityLogPanel, WanderlustSurface, WanderlustPortrait:** Reuse for Legacy
- **WanderlustHeading, WanderlustSurface:** Reuse for Outro

#### Testing Requirements
- **Auto-play Test:** Both scenes run without clicks
- **Deterministic Test:** Both sequences identical on F5
- **Visual Test:** Screenshot-worthy frames exist
- **CTA Test:** Final CTA is compelling

### Documentation Updates
1. **trailer_vertical_slice_plan.md:** Update Sprint 4 progress in changelog

### Safeguards
- **Lint Scope:** `src/ui/idleVillage/trailer/` (120s timeout)
- **Test Scope:** None
- **Build Check:** `npm run build:check` (180s timeout)
- **Kanban Lint:** `npm run kanban:lint` (30s timeout)

### Execution Hint
**verified** - Component reuse verification required, touches multiple existing components, requires design judgment on visual presentation and CTA design.

---

## Task: IV-TRAILER-DAY13-015

**Title:** Days 13-14 - Final Polish and Integration

**Status:** Non assegnato

**Plan Reference:** [trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md) - Section 6, Sprint 5 (Days 13-14)

**Created:** 2026-07-16

**Priority:** High

**Estimated Duration:** 120-180 minutes

---

## Full Prompt for Coordinator

### Task ID: IV-TRAILER-DAY13-015

### Title: Days 13-14 - Final Polish and Integration

### Brief Description
Perform final polish across all 7 scenes, timing adjustments, visual consistency tuning, and OBS capture testing. This completes the 55-second video ready for Steam upload.

### Plan Reference
[trailer_vertical_slice_plan.md](../docs/plans/trailer_vertical_slice_plan.md) - Section 6, Sprint 5 (Days 13-14)

### Estimated Duration
120-180 minutes

### Objectives
1. Perform timing adjustments across all 7 scenes (threat, choice, preparation, risk, consequence, legacy, outro)
2. Perform visual consistency tuning across all scenes
3. OBS capture testing for 1080p/60fps output
4. Verify all 7 scenes run deterministically
5. Verify all 7 scenes have screenshot-worthy frames
6. Final polish and Steam-ready verification
7. Complete 55-second video ready for Steam upload

### Success Criteria and KPI Targets
- **Timing Adjustments:** All scene timings match trailerConfig.ts (55s total)
- **Visual Consistency:** All scenes follow same visual language
- **Deterministic:** All 7 scenes identical on F5 refresh
- **Screenshots:** At least 1 screenshot-worthy frame per scene (7 total)
- **OBS Capture:** 1080p/60fps output successful
- **Steam Ready:** Complete 55s video ready for Steam upload

### Integration Points and Dependencies
- **All 7 Scenes:** Threat, Choice, Preparation, Risk, Consequence, Legacy, Outro
- **TrailerViewer:** Scene routing complete
- **Config:** trailerConfig.ts all scene timings

### Guardrails

#### @trailer-only Convention (EXEMPT from gameplay architecture)
**Standard Invariants - EXEMPT (do NOT apply):**
- **Persistence Invariant:** NO PersistenceService, NO localStorage/sessionStorage, NO persistence of any kind
- **Localization Invariant:** NO i18n for copy text (hardcoded allowed for iteration speed), NO translation keys
- **Telemetry:** NO telemetry of any kind (marketing asset, not product)
- **Gameplay State:** NO gameplay state mutation, NO economy systems, NO player progression

**Standard Invariants - MUST PRESERVE (DO apply):**
- **Config-first:** All timing values, camera settings, sequence events in `trailerConfig.ts` with Zod validation
- **Skin/Theme:** Use CSS variables from trailer.css, NO standalone .css files, use Gilded Observatory tokens
- **Component Reuse:** Verify primitives before creating new components, reuse existing components
- **State Management:** Use React Context for local presentation state, NO Zustand (marketing-only)
- **Documentation:** JSDoc on all functions/interfaces, update plan changelog
- **Node/tooling:** Use pinned Node version from .nvmrc
- **Safeguards:** Run lint, build:check, kanban:lint before task complete

#### Production Gate
- **FORBIDDEN:** Scene NOT complete if requires manual clicks or cannot produce screenshot
- **REQUIRED:** All scenes run automatically without interaction, produce screenshot-worthy frame

### Implementation Scope

#### Files to Modify
1. `src/balancing/config/idleVillage/trailerConfig.ts` - Final timing adjustments
2. `src/ui/idleVillage/trailer/trailer.css` - Final visual consistency tuning
3. All scene components - Minor polish as needed

#### Testing Requirements
- **Complete Sequence Test:** 55-second video recordable in OBS
- **1080p/60fps Test:** OBS capture test passes
- **Visual Consistency Test:** All 7 scenes match theme
- **Production Gate Test:** All 7 scenes pass production gate criteria

### Documentation Updates
1. **trailer_vertical_slice_plan.md:** Update Sprint 5 completion in changelog, mark plan complete
2. **docs/trailer_capture_notes.md:** Add final timestamps, successful screenshots, OBS settings

### Safeguards
- **Lint Scope:** `src/ui/idleVillage/trailer/` (120s timeout)
- **Test Scope:** None
- **Build Check:** `npm run build:check` (180s timeout)
- **Kanban Lint:** `npm run kanban:lint` (30s timeout)

### Evidence Logging
- Update plan changelog with Sprint 5 completion
- Add final screenshots to trailer_capture_notes.md
- Document OBS capture settings

### Execution Hint
**verified** - Final polish requires design judgment on visual consistency and timing, touches all 7 scenes for production gate verification, OBS capture testing required.

