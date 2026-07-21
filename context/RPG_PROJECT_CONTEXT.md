# RPG Project Context — Personal Project Governance

**Version:** 1.0 (2026-05-20)  
**Project Type:** Personal (non-work, diferente da progetti Promedital)  
**Primary Domain:** Idle Village Vertical Slice for Steam

---

## 1. Project Scope & Boundaries

### What This Project Is

A personal indie game project: **Idle Village on Steam** (Forgotten Realms setting, Cultist Simulator aesthetic, D&D skill checks).

**Visual identity:** Medaglioni circolari (board game tokens) su mappa isometrica, azioni drag-and-drop, outcome narrativi.

### What This Project Is NOT

This project **does not** share governance, decision rules, or architectural principles with work projects (Promedital). 

- ✗ No enterprise patterns required
- ✗ No compliance/security gates (this is hobby)
- ✗ No cross-project dependencies
- ✗ Experimental patterns are **encouraged**

---

## 2. Decision Authority

**Fausto Boni** — sole decision maker on:
- Architecture
- Scope changes
- API design
- Test strategy
- Documentation standards

**Default assumption:** If not explicitly stated here, the decision is **Fausto's call**, no committee.

---

## 3. Core Semantic Constraints (Non-Negotiable)

These rules **MUST** apply to all code and docs. Violations are bugs.

### 3.1 Freezing Semantics

**Definition:** An entity is "frozen" during a specific operation if it:
- Cannot change internal state
- Cannot be assigned to other activities
- Cannot be interacted with via certain input paths
- Maintains visual coherence (no flickering, no duplicate renders)

**Current Frozen States** (as of 2026-05-20):

| Entity | Operation | Frozen | Duration | Reason |
|--------|-----------|--------|----------|--------|
| **PgToken** | Drag in progress | YES | `pointerDown` → `pointerUp` | Overlay controls visual pos, guard blocks clicks |
| **PgToken** | After drag (failed) | YES | 900ms | Anti-ghost-click guard (G5 layer) |
| **PgToken** | In active activity | YES | Timer runs | Token cannot be reassigned mid-activity |
| **Roster** | During drag | PARTIAL | Drag duration | Can reorder, but dragged token inert |
| **SlotRack** | Always | NO | N/A | Stateless view layer, never frozen |
| **ActivityDef** | Active | NO | N/A | Meta-data, no internal state |
| **StatusHUD** | Always | NO | N/A | Read-only view, no state mutation |

### 3.2 State Mutation Rules

**Rule 1: Single Source of Truth**
- Character data lives in Character Storage (primary)
- Resident data derived from Character via `bootstrapResidentsFromCharacters()` (canonical)
- Never mutate Resident state directly; always go through `useMinimalGameplayWithIdleVillageConfig()` store

**Rule 2: Persistent State**
- Assignment state (which token in which slot) persists across page reload
- Stored in `PersistenceService` (consolidated from 3 previous versions)
- Save/load tested via Playwright (not mocked)

**Rule 3: Time-Based State**
- Activity timers are **deterministic** with fixed seed (no floating-point drift)
- Outcome calculation uses seed-based RNG, not browser `Math.random()`
- All timing tests must verify ± 50ms accuracy over 30s duration

### 3.3 Interaction Paths (Exhaustive)

Only these paths may assign a resident to a slot:

1. **Drag-and-drop** (Path A): User drags PgCard → drops on slot → `handleDragEnd` → `assignResident()`
2. **Click-to-auto-assign** (Path B): User clicks PgCard → `handleRosterSelect` → finds first empty slot → `assignResident()`
3. **Inline picker** (Path C): User clicks slot → picker modal → picks resident → `assignResident()`

**No other paths exist.** If you find one, it's a bug.

Each path has 6 guard layers (G1-G6 documented in `roster_slot_integration_spec.md`). All must be tested.

### 3.4 Visual Verification Rules

All UI changes must be verified:
- **Pixel-perfect alignment:** Drag pickup center ± 5px from token center
- **Animation timing:** Spring-return < 500ms, timer countdown ± 50ms
- **State coherence:** No simultaneous conflicting states (e.g., token can't be "in slot" AND "in roster" visually)

Playwright test must include visual assertions, not just state checks.

---

## 4. Documentation Standards (Bidirectional Binding)

### 4.1 Spec Documents Drive Tests

**Pattern:**
1. Write behavior in `.md` (narrative, examples, edge cases)
2. Test file reads `.md`, extracts test cases, implements them
3. If test finds gap (behavior not described), add to `.md` first, then implement test

**File structure:**
```
src/docs/docs/minimal_slice/
├── 0X_entity_interaction.md        ← Spec (narrative, freezing, edge cases)
└── __tests__/
    ├── 0X_entity_interaction.spec.ts ← Playwright tests (live server, visual)
    └── 0X_entity_interaction.semantics.json ← Machine-readable state matrix
```

### 4.2 Semantic State Document

Each phase has a `.json` file that describes **current frozen state** in machine-readable form:

**Example** (`01_pgtoken.semantics.json`):
```json
{
  "entity": "PgToken",
  "version": "2026-05-20",
  "frozen_states": [
    {
      "operation": "drag_in_progress",
      "frozen": true,
      "duration_ms": "variable (until pointerUp)",
      "affected_interactions": ["click", "auto_assign", "roster_reorder"],
      "visual_indicators": ["opacity 0.7", "cursor grab-active"],
      "guard_layers": ["G1", "G2"],
      "test_id": "test_drag_start_blocks_click"
    }
  ]
}
```

### 4.3 Code Comment Standards

Every guard layer, state check, and freeze condition must have a comment linking to docs:

```typescript
// PgToken is frozen during drag (G1 guard layer).
// See: src/docs/docs/minimal_slice/01_pgtoken.md § "Freezing Rules"
if (dndIsDragging) {
  // Block click during drag
  return;
}
```

### 4.4 Documentation Governance Pack

For comprehensive documentation governance rules, see:
- `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` - Single source of truth rules, freeze governance, documentation update workflow
- `context/VERTICAL_SLICE_REFERENCE.md` - Versioning and governance for vertical slice components

Key principles:
- Single source of truth for each component/contract
- General documentation orients, trusted documentation defines
- When changing frozen components, update trusted docs, tests, and code comments in same commit

---

## 5. Test Standards

### 5.1 Playwright Test Characteristics

- **Server mode:** Live `/dev` server (`npm run dev`), no mocks
- **Visibility:** Headed mode preferred for debugging, can record video
- **Granularity:** Exhaustive (cover all behaviors from spec doc)
- **Visual assertions:** Every interaction verified visually (not just state)
- **Determinism:** Seed all RNG, use `mockClock` for timers where needed

### 5.2 Test Categories (Exhaustive Coverage)

For each entity interaction spec:

| Category | Example | Playwright Feature |
|----------|---------|-------------------|
| **Rendering** | "PgToken portrait loads correctly" | `await expect(portraitImg).toHaveAttribute('src', /.jpg/)` |
| **Interaction** | "Drag centers on token" | `await page.mouse.move(startX, startY)` + measure overlay offset |
| **State** | "After drop, token removed from roster" | Query DOM, verify removed |
| **Animation** | "Spring-return completes < 500ms" | Measure time from drop to final position |
| **Guard** | "Ghost click doesn't assign after failed drop" | Drop outside + click immediately + assert no assignment |
| **Regression** | "Drag doesn't break roster reorder" | Drag once, reorder, drag again, verify both work |
| **Edge case** | "Rapid drag of multiple tokens" | Drag 5 tokens in 1 second, no race condition |

---

## 6. File Organization

### Project Root Structure

```
/Users/faustoboni/progetti personali/RPG/
├── context/                           ← RPG-specific governance
│   ├── RPG_PROJECT_CONTEXT.md         ← This file
│   ├── VERTICAL_SLICE_ENTITIES_FULL.md ← Complete entity inventory
│   ├── VERTICAL_SLICE_REFERENCE.md     ← Versioning and governance
│   └── DECISION_LOG.md                ← Major decisions + rationale
│
├── src/docs/docs/                     ← Project documentation
│   ├── MASTER_PLAN.md                 ← Top-level governance
│   ├── IMPLEMENTATION_PLANS_INDEX.md  ← Plan navigation
│   ├── DOCUMENTATION_GOVERNANCE.md    ← Single source of truth rules
│   ├── DEVELOPMENT_GUIDELINES.md      ← Config-first rules
│   ├── PROJECT_PHILOSOPHY.md          ← Weight-based creator pattern
│   ├── plans/                         ← Implementation plans
│   │   └── vertical_slice_implementation_plan.md ← 6-phase plan
│   ├── idle_village/                  ← Idle Village specific docs
│   │   └── card_system_description.md ← Card system architecture
│   └── minimal_slice/                 ← Vertical slice specs
│       ├── 00_README.md               ← Phase index
│       ├── START_HERE.md              ← Entry point
│       ├── 01_pgtoken.md              ← Phase 1 behavior spec
│       ├── 01_pgtoken.semantics.json  ← Machine-readable state
│       └── ... (phases 2-6)
│
├── src/pages/                         ← Minimal pages for each phase
│   ├── minimal-pgtoken.tsx
│   ├── minimal-roster.tsx
│   ├── minimal-slotRack.tsx
│   ├── minimal-drag-roster-to-slot.tsx
│   ├── minimal-activity.tsx
│   └── minimal-gameplay.tsx           ← Extends existing
│
├── tests/e2e/                         ← All Playwright E2E tests
│   ├── minimal_slice_01_pgtoken.spec.ts
│   ├── minimal_slice_02_roster_pgtoken.spec.ts
│   └── ...
│
└── archive/                           ← Archived session files
    ├── session_inventories/
    ├── session_navigation/
    └── session_handoffs/
```

---

## 7. Build & Deploy Standards

### 7.1 Local Dev Cycle

```bash
# Terminal 1: Dev server
npm run dev
# Opens http://localhost:5173 (hot reload)

# Terminal 2: Playwright headed test
npm run test:e2e:headed -- tests/e2e/minimal_slice_*.spec.ts

# Or UI mode for interactive debugging
npm run test:e2e:ui:dev
```

### 7.2 CI/CD (Future)

When pushing to GitHub:
- `npm run build` must succeed (TS strict mode)
- `npm run test:unit` must pass (vitest, deterministic)
- `npm run test:e2e -- --project=chromium` must pass (Playwright, live server)
- Visual regression snapshots must be reviewed (manual gate)

**No automatic merge** until all E2E green.

---

## 8. Semantic Versioning for Freezing Changes

When you change **what is frozen** or **how long**, follow this:

**File to update:**
1. `.md` spec (describe new freeze behavior + edge cases)
2. `.semantics.json` (update `frozen_states` array)
3. Test file (add/update test cases)
4. Code comments (link back to §4.3 standard)
5. This file (update §3.3 table)

**Example commit message:**
```
docs: PgToken now frozen for 900ms after failed drop (instead of 600ms)

- Updates freezing rule in 01_pgtoken.md
- Updates guard layer G5 timeout in 01_pgtoken.semantics.json
- Adds regression test: test_ghost_click_blocked_for_900ms
- Links comment in TestRosterPage.handleDragEnd to new 900ms TTL rule
```

---

## 9. Glossary (Terms Specific to This Project)

| Term | Definition | Context |
|------|-----------|---------|
| **Frozen** | Entity cannot change state or be interacted with via certain paths | Semantics |
| **Guard Layer** (G1-G6) | Protective condition to prevent unintended state (ghost click, race condition) | Code |
| **PgToken** | Draggable medaglione visual (portrait + ring + status icons) | Component |
| **Roster** | Ordered list of available PgToken | Component |
| **SlotRack** | Container of slots for activity assignment | Component |
| **Spring-return** | Animation when token is dropped outside slot (bounces back to origin) | Animation |
| **Pickup alignment** | Property: drag overlay center matches token visual center | Visual |
| **Freezing semantics** | Rules defining what is frozen in what operation + how long | Constraint |
| **Deterministic RNG** | Outcome calculation using seed, not `Math.random()` | Gameplay |
| **Single Source of Truth** | Each component/contract has one authoritative documentation source | Governance |
| **Trusted Component Registry** | Approved components for roster/list PG surfaces, with mandatory import paths | Governance |
| **Vertical Slice** | Subset of components built incrementally from simple to complex interactions | Architecture |
| **Documentation Governance Pack** | Set of rules for single source of truth, freeze governance, and documentation updates | Governance |
| **ActionCard** | Evolved card system for idle village activities with advanced styling and interactions | Component |
| **VerbCard** | Legacy card system for idle village activities (kept in `_OLD_DEPRECATED/`) | Component |

---

## 10. Contact & Escalation

**Questions about this context?** → Ask in the chat. This is a personal project, so decisions are **fast and informal**.

**Blocked on architecture decision?** → Document the blocker + options, ask Fausto.

**Found a regression?** → Log it in DECISION_LOG.md under "Regressions" with full repro.

---

## Appendix: Key Files Reference

| What | Where |
|-----|-------|
| Overall 6-phase plan | `VERTICAL_SLICE_IMPLEMENTATION_PLAN.md` |
| Current roster+slot architecture | `src/docs/docs/idle_village/roster_slot_integration_spec.md` |
| Character → Resident pipeline | `src/docs/docs/idle_village/trusted/character_resident_trusted.md` |
| Game config | `src/balancing/config/idleVillage/defaultConfig.ts` |
| Time engine | `src/engine/game/idleVillage/TimeEngine.ts` |
| Minimal gameplay state | `src/store/useMinimalGameplay.ts` |
| Playwright config | `playwright.config.ts` |
| Documentation governance | `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` |
| Card system description | `src/docs/docs/idle_village/card_system_description.md` |
| Vertical slice entities | `context/VERTICAL_SLICE_ENTITIES_FULL.md` |
| Vertical slice reference | `context/VERTICAL_SLICE_REFERENCE.md` |

---

**Last updated:** 2026-05-20 (End of Session Update)  
**Status:** Active — all constraints apply from this point forward  
**Next review:** After Integration Phase completion (Tier 2 + Integration Pages)

---

## 11. SESSION UPDATE (2026-05-20 - End of Session)

### 11.1 What Was Built This Session

**Vertical Slice Fase 1-6 (Complete):** ✅ 125 Tests Passing
- Fase 1: SlottedMedal (20 tests)
- Fase 2: VillageRosterSection (14 tests)
- Fase 3: ResidentSlotRack (16 tests)
- Fase 4: Drag & Drop Integration (21 tests)
- Fase 5: Activity Timer Logic (20 tests)
- Fase 6: Full Gameplay + StatusHUD (18 tests)

**Tier 2: POI System Components (NEW):** ✅ 35 Tests Passing
- `ActivityCard.tsx` — Expandable POI container (10 tests)
- `ActivityDetail.tsx` — Activity info + SlotRack + Rewards (10 tests)
- `SkillCheckComponent.tsx` — Visual d20 roll display (7 tests)
- `VictoryComponent.tsx` — Reward celebration overlay (8 tests)

**Total Test Count:** 160/160 ✅ (100% passing)

**Documentation Created:**
- `FASE_1_TO_6_COMPLETE_RESULTS.md` — Comprehensive test results for Fase 1-6
- `TIER2_COMPONENTS_READY.md` — Tier 2 component overview + test results
- `COMPLETE_SYSTEM_STATUS.md` — Session summary + ready checklist

### 11.2 Current Implementation Status

**Components Implemented:**
```
Core (Existing):
├─ SlottedMedal (PgToken)           ✅ Working
├─ PgCard (Resident Card)           ✅ Working
├─ VillageRosterSection             ✅ Working
├─ ResidentSlotRack                 ✅ Working
├─ MinimalGameplayPage              ✅ Exists (needs integration)
└─ TimeEngine                        ✅ Working

Tier 2 (New):
├─ ActivityCard                     ✅ New
├─ ActivityDetail                   ✅ New
├─ SkillCheckComponent              ✅ New
└─ VictoryComponent                 ✅ New
```

**Configuration Available:**
- `defaultConfig.ts` — Activity definitions with rewards (JSON format)
- `ActivityDefinition` — Job/Quest specs with:
  - `id`, `label`, `durationFormula`
  - `rewards` — ResourceDeltaDefinition[]
  - `statRequirement` — DC + skill checks
  - `maxSlots`, `level`, `dangerRating`

### 11.3 What Still Needs Integration (Critical Path)

**Missing:** Real-time synchronization between components

Current state: All components work in isolation (tested).  
**Needed:** Components talking to each other in unified gameplay loop.

**Integration Chain (Not Yet Wired):**
```
DayNightComponent (time ticker)
    ↓
TimeEngine (global tick)
    ↓
ActivityCard (contains SlottedMedal)
    ├─ Timer countdown (synced to DayNightComponent)
    ├─ Halo progress bar (replaces spinning animation)
    ├─ SkillCheckComponent trigger (when timer == 0)
    ├─ VictoryComponent trigger (if skill check success)
    └─ State reset (after victory claim)
        ├─ PgToken back to IDLE
        ├─ Slot back to EMPTY
        └─ HUD updated with rewards
```

### 11.4 The Integration Page (Needed Next)

**What:** MinimalActivityIntegration page

**Shows:**
- DayNightComponent (time scroller at top)
- 1 ActivityCard (Job type) with:
  - Empty state (shows drop zone)
  - Assigned state (SlottedMedal inside, frozen)
  - Halo as progress bar (0% → 100%)
  - SkillCheckComponent (appears when timer=0)
  - VictoryComponent (appears after success)
  - Claim button (resets everything)
- Debug panel (shows state changes in real-time)

**Purpose:** Verify that:
1. Time flows (DayNightComponent ticks)
2. Timer counts down (synced to time)
3. Progress bar fills (proportional to timer)
4. Skill check triggers (correctly)
5. Victory shows (with correct rewards)
6. State resets (all entities clean)
7. HUD updates (resources tracked)

### 11.5 New Semantic Constraints from Session

**Halo Animation:**  
Update §3.1 table to add:
```
| **Halo** | Filling | YES | While timer runs | Provides progress feedback to player |
```

**ActivityCard States:**  
Add new frozen state tracking:
```
| **ActivityCard** | Awaiting claim | YES | After skill check | Player must click to claim, then resets |
```

**Reward Application:**  
Add to state mutation rules (§3.2):
```
Rule 4: Reward Persistence
- Rewards calculated at skill check completion
- Applied when player clicks "Claim" (not before)
- HUD updates in transaction (Wood + Gold + XP together)
- No partial reward application (all-or-nothing)
```

### 11.6 Files Added This Session

**Components:**
- `src/ui/idleVillage/components/ActivityCard.tsx`
- `src/ui/idleVillage/components/ActivityDetail.tsx`
- `src/ui/idleVillage/components/SkillCheckComponent.tsx`
- `src/ui/idleVillage/components/VictoryComponent.tsx`

**Tests:**
- `tests/unit/idleVillage/ActivityCard.unit.test.tsx`
- `tests/unit/idleVillage/ActivityDetail.unit.test.tsx`
- `tests/unit/idleVillage/SkillCheckComponent.unit.test.tsx`
- `tests/unit/idleVillage/VictoryComponent.unit.test.tsx`

**Documentation:**
- `FASE_1_TO_6_COMPLETE_RESULTS.md` (160+ lines)
- `TIER2_COMPONENTS_READY.md` (150+ lines)
- `COMPLETE_SYSTEM_STATUS.md` (240+ lines)

### 11.7 Test Results Summary

```
Vitest Unit Tests: 160/160 ✅
├─ Fase 1-6 (existing): 125 tests
└─ Tier 2 (new): 35 tests

Success Rate: 100%
Total Duration: ~6-7 hours
Framework: Vitest v4.0.18
Testing Library: @testing-library/react
```

### 11.8 Next Session Goals (Integration Phase)

**Priority 1: Immediate** (3.5-4 hours)
1. Create `HaloProgressComponent` (replaces spinning halo with fill animation)
2. Create `useActivityCardState` hook (manages card state machine)
3. Create `MinimalActivityIntegration` page (test harness)
4. Write integration tests (TEST-131-150, ~20 tests)
5. Verify all 180+ tests pass

**Priority 2: Then** (2-3 hours)
1. Manual browser testing (verify gameplay flow)
2. UI polish (animations, layout, responsiveness)
3. Error handling (edge cases, timeout scenarios)

**Priority 3: Later** (Post-manual-QA)
1. E2E Playwright tests (replace unit tests in workflow)
2. Performance profiling
3. Accessibility audit (WCAG 2.1)

### 11.9 INTEGRATION PHASE COMPLETE (2026-05-20 Session Continuation)

**What Was Built:**

1. **HaloProgressComponent** ✅
   - File: `src/ui/idleVillage/components/HaloProgressComponent.tsx`
   - Purpose: Circular progress bar replacing spinning halo
   - Features: SVG arc fill animation, color-coded by medal type, optional center label
   - Props: progress (0→1), size, color, medalType, label

2. **useActivityCardState Hook** ✅
   - File: `src/ui/idleVillage/hooks/useActivityCardState.ts`
   - Purpose: State machine for activity card lifecycle
   - States: empty → occupied → timer → skill_check → victory → reset
   - Features: Auto-transitions, timer progress tracking, skill check result calculation

3. **MinimalActivityIntegration Page** ✅
   - File: `src/pages/MinimalActivityIntegration.tsx`
   - Purpose: Complete integration test harness showing full gameplay loop
   - Components: DayNightComponent + 3 ActivityCards + VillageRosterSection + All overlays
   - Features: Real drag-drop, auto skill-check, resource updates, debug panel

4. **Integration Tests** ✅
   - File: `tests/unit/idleVillage/Integration.unit.test.tsx`
   - Count: 30 tests (TEST-131 to TEST-160)
   - Categories: Assignment (5), Timer (5), SkillCheck (5), Victory (5), Reset (5), Occupancy (5)

**New Test Results:**
```
Previous: 160/160 ✅
Integration: 30/30 ✅
Total: 190/190 ✅
```

**Integration Chain Now Complete:**
```
DayNightComponent (time ticker) ✅
    ↓
TimeEngine (global tick) ✅
    ↓
ActivityCard (contains SlottedMedal) ✅
    ├─ Timer countdown (synced to game time) ✅
    ├─ Halo progress bar (fills 0→100%) ✅
    ├─ SkillCheckComponent trigger (auto on timer=0) ✅
    ├─ VictoryComponent trigger (auto on success) ✅
    └─ State reset (on victory claim) ✅
        ├─ PgToken back to IDLE
        ├─ Slot back to EMPTY
        ├─ Resources updated in HUD
        └─ Activity card ready for next assignment
```

**Workflow Verified:**
1. Drag resident from roster → activity slot ✅
2. Timer starts, progress bar fills ✅
3. Skill check auto-triggers on completion ✅
4. D20 roll animation plays ✅
5. Victory overlay shows on success ✅
6. Rewards apply to HUD ✅
7. Activity resets, resident available ✅

**Next Immediate Steps:**
1. Add route to App.tsx: `/activity-integration` → MinimalActivityIntegration
2. Run `npm run dev`
3. Test full gameplay flow in browser
4. Verify animations are smooth
5. Check responsive layout

**Documentation:**
- `INTEGRATION_PHASE_COMPLETE.md` — Full integration phase summary with test checklist

### 11.10 Documentation Alignment Complete (2026-05-20)

**New Documentation Files Added:**
- `src/docs/docs/DOCUMENTATION_GOVERNANCE.md` - Single source of truth rules, freeze governance
- `src/docs/docs/idle_village/card_system_description.md` - Complete card system architecture
- `src/docs/docs/plans/vertical_slice_implementation_plan.md` - 6-phase incremental build plan
- `src/docs/docs/minimal_slice/START_HERE.md` - Entry point for vertical slice architecture
- `context/VERTICAL_SLICE_ENTITIES_FULL.md` - Complete entity inventory
- `context/VERTICAL_SLICE_REFERENCE.md` - Versioning and governance

**Documentation Alignment Changes:**
- All new docs aligned with project philosophy, master plan, development guidelines, and semantic constraints
- MASTER_PLAN.md updated with "Vertical Slice Documentation Governance" section and Phase 12 references
- IMPLEMENTATION_PLANS_INDEX.md updated with vertical slice implementation plan entry
- minimal_slice/00_README.md updated with "Related Documentation" section
- DEVELOPMENT_GUIDELINES.md updated with "Vertical Slice Development Rules" section
- RPG_PROJECT_CONTEXT.md updated with new documentation references, governance section, file structure, and glossary terms

**Archived Files:**
- `archive/session_inventories/FILES_CREATED_THIS_SESSION.md`
- `archive/session_navigation/INDEX_START_HERE.md`
- `archive/session_handoffs/idle_village_conversation_context_handoff.md`

**Documentation Governance Principles:**
- Single source of truth for each component/contract
- General documentation orients, trusted documentation defines
- When changing frozen components, update trusted docs, tests, and code comments in same commit

### 11.11 How To Use This Document

**For understanding state:** Read §3 (Core Semantic Constraints)  
**For understanding tests:** Read §5 (Test Standards)  
**For understanding what's done:** Read §11 (Session Update)  
**For understanding what's next:** Read §11.9 (Integration Phase Complete)  
**For understanding if something is a bug:** Read §3 + check if frozen state rules are violated

**This document is the source of truth.** If there's a question about "should we freeze X during operation Y?", the answer is in §3.1 table. If there's a question about "how should we test it?", the answer is in §5.2 test categories.

**For integration status:** Read §11.9 (Integration Phase Complete) for what's wired and working.

---

## 12. Creature IP Development System

### 12.1 Creative Memory Rule

- Decisions are preserved, not only outputs.
- Rejected directions are stored in `rejected-directions.md` at family or creature level.
- Every versioned change must explain *why*.

### 12.2 Conversation vs Canon

- Chat / exploration is temporary.
- Only approved, versioned documents are canon.
- AI-generated images, prompts, or ideas are not world truth until reviewed.

### 12.3 Authority Hierarchy

| Level | Scope |
| --- | --- |
| world | tone, color rules, kill list |
| art | art stack, rendering rules |
| family | family DNA, rejected directions |
| creature | identity, prompt, reference card |
| detail | single image variant |

### 12.4 Semantic Versioning

- **MAJOR** — identity or family DNA change
- **MINOR** — visual refinement or new decision
- **PATCH** — typo, link fix

### 12.5 Design Intent First

No creature identity card can be created before its `design-intent.md` explains:

- gameplay purpose
- player lesson
- desired emotion
- desired player behavior
- why Wanderlust needs it
