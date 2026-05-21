# Minimal Slice Documentation — 6 Phases to Vertical Slice Completion

**Last updated:** 2026-05-20  
**Version:** 1.0  
**Scope:** Incremental documentation + testing for idle village vertical slice (Steam release)

---

## Overview

This directory documents a **6-phase incremental build** of the vertical slice:

| Phase | Entità Primaria | Pagina Route | Durata | Key Behavior |
|-------|---|---|---|---|
| **1** | **PgToken** (isolato) | `/minimal-pgtoken` | 2-3g | Portrait rendering, rarity ring, status icon, hover |
| **2** | **Roster + PgToken** | `/minimal-roster` | 2-3g | Ordering (A-Z, rarity, status), filtering, availability indicator |
| **3** | **SlotRack** (isolato) | `/minimal-slotRack` | 1-2g | Layout (board vs detail), state CSS, slot IDs |
| **4** | **Drag: Roster → SlotRack** | `/minimal-drag-roster-to-slot` | 3-4g | **Pickup alignment, ghost click guards, spring-return** |
| **5** | **Activity + Timer** | `/minimal-activity` | 2-3g | Timer accuracy, outcome calculation, freezing during activity |
| **6** | **StatusHUD** (full gameplay) | `/minimal-gameplay` (extends) | 1-2g | Real-time sync, complete playthrough, no crash |

---

## How to Use This Documentation

### For Reading

1. **Start with this README** — overview of all phases
2. **Pick a phase number** (1-6) — read corresponding `0X_entity_interaction.md`
3. **Each spec file contains:**
   - **"Chi sono e cosa faccio"** — entity description, visuals, interaction summary
   - **"Quando sono congelato"** — freezing rules for this entity + operation
   - **"Come interagisco con..."** — cross-entity behavior + timing
   - **"Cosa può andare storto"** — known issues, guard layers, edge cases
   - **"Test Cases"** — exhaustive list of scenarios to test (drives Playwright tests)

### For Writing Tests

1. Read the phase `.md` file
2. Look at **"Test Cases"** section
3. Implement one test per case in corresponding `tests/e2e/minimal_slice_0X_*.spec.ts`
4. Each test has a comment linking to the `.md` line number it covers
5. If test finds new behavior (not in `.md`), add to `.md` first, then to test

### For Changing Behavior

1. Update the `.md` file (describe new behavior + edge cases)
2. Update the `.semantics.json` file (machine-readable state)
3. Update test cases (add/remove/modify tests)
4. Update code comments (link to new behavior in `.md`)
5. Update `context/DECISION_LOG.md` (log why you changed it)

---

## File Structure

```
src/docs/docs/minimal_slice/
├── 00_README.md                           ← This file
├── 01_pgtoken.md                          ← Phase 1 spec
├── 01_pgtoken.semantics.json              ← Phase 1 machine-readable state
├── 02_roster_pgtoken.md
├── 02_roster_pgtoken.semantics.json
├── 03_slotRack.md
├── 03_slotRack.semantics.json
├── 04_drag_roster_to_slot.md              ← CRITICAL: pickup alignment + guards
├── 04_drag_roster_to_slot.semantics.json
├── 05_activity_timer.md
├── 05_activity_timer.semantics.json
├── 06_complete_gameplay_hud.md
├── 06_complete_gameplay_hud.semantics.json
├── guard_layers_reference.md              ← Detailed G1-G6 guard layer explanation
└── freezing_semantics.md                  ← Detailed freezing state machine
```

All test files live in `tests/e2e/minimal_slice_*.spec.ts`.

---

## Key Constraints (from context/RPG_PROJECT_CONTEXT.md)

### Freezing is Non-Negotiable

Every state change must respect these freezing rules:

| Entity | When Frozen | Duration | Why |
|--------|----------|----------|-----|
| **PgToken** | During drag | `pointerDown` → `pointerUp` | Overlay controls visual, guard blocks clicks |
| **PgToken** | After failed drop | 900ms | G5 guard layer prevents ghost click |
| **PgToken** | In active activity | Until timer completes | Cannot reassign mid-activity |
| **Roster** | During drag (partial) | Drag duration | Token inert, but list can reorder |
| **SlotRack** | Never | N/A | Stateless view |
| **ActivityDef** | Never | N/A | Metadata, no state |
| **StatusHUD** | Never | N/A | Read-only view |

**If you change these rules, update BOTH the `.md` AND `context/DECISION_LOG.md`.**

### Tests Must Be Live Playwright

- No mocking of `assignResident()`, no fake timers (except seed-based RNG)
- Visual assertions: pickup alignment ± 5px, animation < 500ms
- State assertions: token in/out of roster, slot occupied/empty
- Run against live `/dev` server (slow but real)

### Docs Drive Tests

- Every test case in `.md` must have a corresponding Playwright test
- Every Playwright test must have a comment citing its source in `.md`
- If test finds behavior not in `.md`, update `.md` first, then test

---

## Expected Timeline

```
Week 1:
  Mon-Tue → Phase 1 DONE
  Wed     → Phase 2 DONE
  Thu-Fri → Phase 3 DONE

Week 2:
  Mon-Thu → Phase 4 DONE (extra time for pickup alignment if needed)
  Fri     → Phase 5 DONE

Week 3:
  Mon     → Phase 6 DONE
  Tue-Wed → Regression testing + cleanup
  Thu     → Manual playtest (5+ min loop, no crash)
  Fri     → Buffer
```

---

## Running Tests Locally

```bash
# Terminal 1: Start dev server
npm run dev
# Opens http://localhost:5173

# Terminal 2: Run all minimal slice tests
npm run test:e2e:headed -- tests/e2e/minimal_slice_*.spec.ts

# Or just Phase 1
npm run test:e2e:headed -- tests/e2e/minimal_slice_01_pgtoken.spec.ts

# Or UI mode (interactive)
npm run test:e2e:ui:dev
```

---

## When Something Breaks

1. **Test fails:** Check the comment in test for source `.md` line. Read that section to understand expected behavior.
2. **Visual regression:** Playwright generates screenshot diff. Review, decide: update snapshot or fix code.
3. **State mismatch:** Trace state back to source (Character Storage → Resident → Roster). Find where mutation happens.
4. **Timing off:** Check if RNG seed is stable, if timers are deterministic.

**All blockers logged in `context/DECISION_LOG.md` under "Regressions Found & Fixed".**

---

## Related Documentation

- [Card System Description](../idle_village/card_system_description.md) - Complete card system architecture for Idle Village
- [Vertical Slice Entities](../../context/VERTICAL_SLICE_ENTITIES_FULL.md) - Complete entity inventory for vertical slice
- [Documentation Governance](../DOCUMENTATION_GOVERNANCE.md) - Single source of truth rules for documentation
- [RPG Project Context](../../context/RPG_PROJECT_CONTEXT.md) - Semantic constraints and project governance
- [Vertical Slice Start Here](./START_HERE.md) - Entry point for vertical slice architecture

## Glossary (See also context/RPG_PROJECT_CONTEXT.md)

| Term | Definition |
|------|-----------|
| **Frozen** | Entity cannot change state or be interacted with via certain paths |
| **Guard Layer** (G1-G6) | Protective condition to prevent unintended state (ghost click, race, etc) |
| **PgToken** | Draggable medaglione visual (portrait + ring + status icons) |
| **Roster** | Ordered list of available PgToken |
| **SlotRack** | Container of slots for activity assignment |
| **Spring-return** | Animation when token dropped outside slot (bounces back) |
| **Pickup alignment** | Drag overlay center matches token visual center (± 5px tolerance) |
| **Freezing semantics** | Rules defining what is frozen in what operation + how long |

---

## Questions?

- **About a phase:** Read the corresponding `.md` file
- **About freezing:** See `freezing_semantics.md` + `guard_layers_reference.md`
- **About test strategy:** See `context/RPG_PROJECT_CONTEXT.md` §5
- **About a decision:** See `context/DECISION_LOG.md`

**Still stuck?** Ask Fausto in the chat.

---

**Last updated:** 2026-05-20  
**Next review:** After Phase 1 completion
