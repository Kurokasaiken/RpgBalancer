# Constructive Critique: "One Page Per Entity + One Page Per Interaction Pair" Approach

**Author:** System Analysis  
**Date:** 2026-05-20  
**Re:** Your proposed approach to building the vertical slice

---

## Executive Summary

Your approach is **sound fundamentally** but has **3 risks** that need mitigation. Below: detailed critique + solutions.

### TL;DR
- ✅ **GOOD:** One page per entity forces clarity on "what is frozen, what can break"
- ✅ **GOOD:** Pairing tests with docs prevents drift
- ✅ **GOOD:** Testing real Playwright interactions catches bugs unit tests miss
- ⚠️ **RISKY:** 35 entities = 35 minimal pages. Maintenance burden is high.
- ⚠️ **RISKY:** Some entities are "infrastructure" (hooks, services) not visual. Pages don't make sense.
- ⚠️ **RISKY:** Interaction pairs grow combinatorially (35 choose 2 = 595 pairs). You can't test all.

---

## Detailed Analysis

### 1. STRENGTHS of This Approach ✅

#### 1.1 Forces Documentation Clarity
**Strength:** Creating a page `/minimal-pgtoken` with ONLY PgToken forces you to answer:
- What visual state does PgToken have?
- What can break?
- What are edge cases?

**Result:** Prevents "just ship it, docs later" mentality.

**Verdict:** ✅ **Excellent.** This is your biggest win.

#### 1.2 Bidirectional Binding (Docs ↔ Tests)
**Strength:** Test file reads `.md`, extracts cases, implements them. If test finds gap, doc updates first.

**Result:** Docs and tests never drift. They're two views of same truth.

**Verdict:** ✅ **Excellent.** Most projects lose this. You're keeping it tight.

#### 1.3 Real Playwright Tests Catch Real Bugs
**Strength:** No mocking of `assignResident()`. Tests run against live `/dev` server.

**Result:** Pickup alignment bug, ghost click bug, race conditions — these only appear in real Playwright. Vitest mocks miss them.

**Verdict:** ✅ **Excellent but slow.** Trade-off: 5-10s per test. Worth it.

---

### 2. RISKS & FRICTION POINTS ⚠️

#### 2.1 RISK: 35 Entities = 35 Minimal Pages + 35 Test Files

**Problem:**
```
src/pages/
├── minimal-pgtoken.tsx                      ← Phase 1
├── minimal-roster.tsx                       ← Phase 2
├── minimal-slotRack.tsx                     ← Phase 3
├── minimal-drag-roster-to-slot.tsx          ← Phase 4
├── minimal-activity.tsx                     ← Phase 5
├── minimal-gameplay.tsx                     ← Phase 6 (extends existing)
├── minimal-resourceHUD.tsx                  ← Phase 6 sub-entity
├── minimal-skillCheckPanel.tsx              ← Phase 5 sub-entity
├── minimal-outcomeModal.tsx                 ← Phase 5 sub-entity
├── minimal-levelUpAnimation.tsx             ← Phase 6 sub-entity
├── minimal-upgradeIcon.tsx                  ← Phase 6 sub-entity
├── minimal-marketActionCard.tsx             ← Phase 5 sub-entity
├── minimal-jobCard.tsx                      ← Phase 4 sub-entity
├── minimal-questCard.tsx                    ← Phase 5 sub-entity
├── ... (20+ more)
```

**Issue:**
- 35 pages = 35 routes to maintain
- 35 test files = 35 × 100 LOC = 3,500 test LOC
- **Maintenance burden:** Every time you change a component, you update Page + Test + Docs
- **Bloat:** Many of these pages are near-identical (just swap the component)

**Example of bloat:**
```typescript
// minimal-pgtoken.tsx
<ResidentRosterSection residents={[mockResident1, mockResident2]} />

// minimal-roster.tsx
<ResidentRosterSection residents={allResidents} />

// minimal-activity.tsx
<ResidentRosterSection residents={allResidents} />
<ResidentSlotRack assignments={assignments} />
```

Three pages, similar logic, separate maintenance. **Risk:** If you fix a bug in RosterSection, do you propagate it to all 3 pages? Easy to miss.

**Verdict:** ⚠️ **Medium Risk.** Not impossible, but high friction.

---

#### 2.2 RISK: "Infrastructure Entities" Don't Have Visual Pages

**Problem:**
These entities exist but have no visual page:

| Entity | Category | Can you make a "minimal page"? |
|--------|----------|---|
| **ResidentState** (D.1) | Data model | ❌ Abstract. No UI. |
| **ActivityDefinition** (D.2) | Data model | ❌ Abstract. No UI. |
| **useVillageResidents** (F.1) | Hook | ❌ Invisible logic. |
| **useOutcomeCalculation** (F.6) | Hook | ❌ Pure function. No UI. |
| **useReputationSystem** (F.7) | Hook | ❌ State management. |
| **TimeEngine** (G.3) | Service | ❌ Tick logic. No UI. |
| **PersistenceService** (G.4) | Service | ❌ Save/load. No UI. |

**Your proposal:** "Create a page for each"

**Reality:** These aren't visual. A page like `/minimal-residentsState` would be:
```typescript
// /minimal-residentsState.tsx
export function MinimalResidentStatePage() {
  const residents = useVillageResidents();
  return (
    <div>
      <h1>ResidentState Debug</h1>
      <pre>{JSON.stringify(residents, null, 2)}</pre>
    </div>
  );
}
```

This is a **debug page**, not a spec page. It's not a "minimal slice" of gameplay. Tests would be:
```typescript
test('ResidentState has id, name, status', () => {
  // Just checking JSON shape. Not gameplay-relevant.
});
```

**Verdict:** ⚠️ **High Risk.** This adds noise without value. Better approach below.

---

#### 2.3 RISK: Combinatorial Explosion of Interaction Pairs

**Problem:**
Your proposal: "one page x coppia d elementi che devono interagire"

Math:
- 35 entities
- Pairs: 35 choose 2 = 595 possible pairs
- Not all are meaningful, but many are:
  - PgToken × Roster (4 interactions: drag, click, filter, sort)
  - PgToken × SlotRack (3 interactions: drag onto slot, hover, drop outside)
  - PgToken × JobCard (2 interactions: drag onto, complete)
  - PgToken × QuestCard (2 interactions: drag onto, skill check)
  - ... (50+ more meaningful pairs)

**Your workload:** ~50 interaction pair pages + tests.

**Verdict:** ⚠️ **Very High Risk.** Combinatorial explosion. You'll burn out before Phase 3.

---

### 3. RECOMMENDED MITIGATIONS ✅

#### 3.1 Mitigation for Risk 2.1: Smart Page Grouping

**Instead of:** 35 separate `/minimal-X` pages

**Do this:**
```
/minimal-pgtoken                 ← PgToken isolated (Phase 1)
/minimal-roster                  ← Roster + PgToken (Phase 2)
/minimal-drag                     ← PgToken + Roster + SlotRack + Drag (Phase 4)
/minimal-activity                ← + JobCard + Timer (Phase 5)
/minimal-gameplay                ← Full game (Phase 6, extends existing)
```

**Rationale:**
- Each page adds ONE new interaction (or new set)
- Pages build on each other (not in parallel)
- Reduces from 35 pages to ~6-7 core pages
- Less maintenance, more focused

**Verdict:** ✅ **Solves risk 2.1.** Reduces pages from 35 to 6-7.

---

#### 3.2 Mitigation for Risk 2.2: Separate "Data Model Tests" from "Visual Pages"

**Instead of:** Forcing all entities into visual pages

**Do this:**

Create two test suites:

**Suite A: Visual Pages** (Playwright, real interaction)
```
tests/e2e/minimal_slice_01_pgtoken.spec.ts          ← See PgToken, hover, etc.
tests/e2e/minimal_slice_02_roster_pgtoken.spec.ts   ← See Roster, sort, filter
tests/e2e/minimal_slice_04_drag.spec.ts             ← Drag interactions
```

**Suite B: Data Model Tests** (Vitest, unit/integration)
```
tests/unit/ResidentState.test.ts             ← JSON shape, state transitions
tests/unit/ActivityDefinition.test.ts        ← Config validation
tests/unit/useOutcomeCalculation.test.ts     ← Skill check roll logic (deterministic)
tests/unit/useReputationSystem.test.ts       ← Reputation tracking (deterministic)
```

**Rationale:**
- Visual pages are for "what the player sees"
- Data model tests are for "correctness of logic"
- Not everything needs a visual page
- Simpler, faster data model tests (no browser)

**Verdict:** ✅ **Solves risk 2.2.** Clear separation.

---

#### 3.3 Mitigation for Risk 2.3: Prioritize "Critical Pairs"

**Instead of:** Testing all 595 possible pairs

**Do this:**
1. Identify **core gameplay loop** (what must work):
   - PgToken → Roster (visibility, ordering)
   - PgToken → SlotRack (assignment, state)
   - JobCard → PgToken (drag, timer, payoff)
   - QuestCard → PgToken (drag, timer, skill check)
   - Outcome → ResidentState (rewards, level up)
   - LevelUp → UpgradeIcon (unlock UI)

2. Test **these 6 core pairs** exhaustively.

3. For other pairs, use **integration tests** (not separate pages).

**Example:**
```typescript
// Just one page: /minimal-drag
test('drag pgtoken to jobcard completes job', () => {
  // Tests: PgToken × JobCard × Timer × PayOff
  // All in one test, same page
});

test('drag pgtoken to questcard triggers skill check', () => {
  // Tests: PgToken × QuestCard × SkillCheck × Outcome
});

test('quest outcome level up hero, unlock upgrade', () => {
  // Tests: Outcome × LevelUp × UpgradeIcon
});
```

**Rationale:**
- 6 core pairs >> 595 pairs
- Each pair tests multiple entities (no duplication)
- "Critical path" through the game is covered
- Maintainable scope

**Verdict:** ✅ **Solves risk 2.3.** Focuses effort on what matters.

---

## 4. RECOMMENDED REVISED APPROACH

### WHAT TO DO

1. **Keep your core idea:** Docs → Tests → Docs bidirectional binding. Gold.

2. **Reduce page count:** 6-7 pages instead of 35.
   ```
   /minimal-pgtoken              ← Phase 1: PgToken alone
   /minimal-roster               ← Phase 2: Roster + PgToken
   /minimal-slotRack             ← Phase 3: SlotRack layout
   /minimal-drag                 ← Phase 4: Drag JobCard + QuestCard
   /minimal-gameplay             ← Phase 5: Activity + SkillCheck
   /minimal-gameplay (same)      ← Phase 6: Outcome + LevelUp
   ```

3. **Separate data model tests** from visual tests.
   - Playwright tests = visual interactions on `/dev` server
   - Vitest tests = deterministic logic (outcomes, reputation, etc.)

4. **Test 6 critical pairs**, not 595.
   - PgToken ↔ Roster
   - PgToken ↔ SlotRack
   - PgToken ↔ JobCard
   - PgToken ↔ QuestCard
   - Outcome ↔ ResidentState
   - LevelUp ↔ UpgradeIcon

5. **Create entity docs incrementally:**
   - Don't force pages for invisible entities (hooks, services)
   - Instead, write **inline code comments** + **architecture diagrams** for them
   - Example: `useOutcomeCalculation` gets a detailed header comment + doc link, but no page

### STRUCTURE

```
context/
├── RPG_PROJECT_CONTEXT.md                    ← Governance ✅
├── DECISION_LOG.md                           ← Decisions ✅
├── VERTICAL_SLICE_ENTITIES_FULL.md           ← Entity inventory ✅
└── APPROACH_CONSTRUCTIVE_CRITIQUE.md         ← This file ✅

src/docs/docs/minimal_slice/
├── 00_README.md                              ← Index ✅
├── 01_pgtoken.md                             ← Phase 1 spec ✅
├── 01_pgtoken.semantics.json                 ← Phase 1 JSON ✅
├── 02_roster_pgtoken.md                      ← Phase 2 spec [TODO]
├── 03_slotRack.md                            ← Phase 3 spec [TODO]
├── 04_drag_with_jobcard.md                   ← Phase 4 spec [TODO]
├── 05_gameplay_with_questcard.md             ← Phase 5 spec [TODO]
├── 06_full_gameplay.md                       ← Phase 6 spec [TODO]
├── architecture_data_models.md               ← ResidentState, Activity, Outcome (NOT pages, just docs)
├── architecture_hooks_business_logic.md      ← useOutcome, useReputation, etc. (docs + inline comments)
└── guard_layers_reference.md                 ← G1-G6 detailed

src/pages/
├── minimal-pgtoken.tsx                       ← Phase 1 page
├── minimal-roster.tsx                        ← Phase 2 page
├── minimal-slotRack.tsx                      ← Phase 3 page
├── minimal-drag.tsx                          ← Phase 4 page (JobCard + QuestCard)
└── minimal-gameplay.tsx                      ← Phase 5-6 (extends existing)

tests/e2e/
├── minimal_slice_01_pgtoken.spec.ts          ← 10 tests (visual)
├── minimal_slice_02_roster_pgtoken.spec.ts   ← 12 tests (visual)
├── minimal_slice_03_slotRack.spec.ts         ← 8 tests (visual)
├── minimal_slice_04_drag.spec.ts             ← 20 tests (visual, drag + job + quest)
└── minimal_slice_05_full_gameplay.spec.ts    ← 15 tests (full loop)

tests/unit/
├── ResidentState.test.ts                     ← Data model validation
├── ActivityDefinition.test.ts                ← Config validation
├── useOutcomeCalculation.test.ts             ← Deterministic logic
├── useReputationSystem.test.ts               ← Reputation tracking
└── ...
```

---

## 5. TIMELINE IMPACT

### Old Approach (35 pages):
- Estimate: 6-8 weeks (3 pages/week × ~50 effective pages)
- Risk: High burnout, maintenance nightmare

### Revised Approach (6-7 pages):
- Estimate: 4-5 weeks (1-2 pages/week, plus data model tests in parallel)
- Risk: Lower, more sustainable

---

## 6. FINAL VERDICT

| Aspect | Rating | Comment |
|--------|--------|---------|
| **Core idea (docs ↔ tests)** | ⭐⭐⭐⭐⭐ | Excellent. Keep it. |
| **Playwright real tests** | ⭐⭐⭐⭐⭐ | Catch real bugs. Worth the 5s/test. |
| **35 pages approach** | ⭐⭐ | Too much. Scale back to 6-7. |
| **Infrastructure entity pages** | ⭐ | Artificial. Use docs + code comments instead. |
| **595 pair combinations** | ⭐ | Combinatorial explosion. Focus on 6 critical pairs. |
| **Revised 6-7 pages + data model tests** | ⭐⭐⭐⭐⭐ | **Recommended.** Balanced effort/confidence. |

---

## 7. NEXT STEP

You have two choices:

**Option A: Proceed with 35 pages** (your original proposal)
- Pro: Exhaustive coverage
- Con: High maintenance burden, risk of burnout
- Timeline: 6-8 weeks

**Option B: Proceed with revised approach** (6-7 pages + data model tests)
- Pro: Sustainable, focused, lower risk
- Con: Less exhaustive (but still solid)
- Timeline: 4-5 weeks

**Recommendation:** **Option B.** Better ROI for effort.

---

**Prepared by:** System Analysis  
**Date:** 2026-05-20  
**For review by:** Fausto Boni

