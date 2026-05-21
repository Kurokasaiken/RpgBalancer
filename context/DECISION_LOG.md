# RPG Project Decision Log

**Version:** 1.0 (2026-05-20)  
**Purpose:** Record major architecture & strategy decisions with rationale. Audit trail for "why did we do X?"

---

## Decision 001: Incremental Testing Strategy (6 Phases)

**Date:** 2026-05-20  
**Context:** Vertical slice has existing code (roster, drag, slots) but bugs exist (pickup alignment, ghost clicks). Need strategy to avoid regressions while fixing.

**Decision:** Build 6 minimal pages, each adding one entità/interaction:
1. PgToken alone
2. Roster + PgToken (ordering)
3. SlotRack alone
4. Drag: Roster → SlotRack
5. Activity + Timer
6. StatusHUD (full gameplay)

**Rationale:**
- Each phase is isolated, testable, deployable to `/minimal-{phase}`
- Tests are live Playwright (slow, real), not mocked
- If Phase 4 (drag) breaks, can rollback to Phase 3 and investigate
- Docs are bidirectional: spec → test + test finds gaps → spec

**Alternative rejected:** "Fix everything in place" — risk of invisible regressions

**Implications:**
- ~4 weeks timeline (2-3 days per phase + buffer)
- ~10-15 Playwright tests per phase (exhaustive coverage)
- All behavior must be documented before test written
- Semantic state tracked in `.semantics.json` files

**Status:** ✅ Approved & ongoing

---

## Decision 002: Freezing Semantics as Constraint (Non-Negotiable)

**Date:** 2026-05-20  
**Context:** Multiple bugs (ghost click, spring-return timing, pickup alignment) stem from unclear "what is frozen when". Need single definition.

**Decision:** Define **freezing state machine** for every entity:
- PgToken during drag: frozen (no click, no assign)
- PgToken after failed drag: frozen 900ms (G5 guard)
- PgToken in activity: frozen until timer completes
- Roster: frozen during drag (no reorder while dragging)
- SlotRack: never frozen (stateless)

Documented in `RPG_PROJECT_CONTEXT.md` §3.1 (canonical source).

**Rationale:**
- Makes guard layer conditions explicit (why block this interaction?)
- Tests can verify "frozen state" + "guard blocks attempt"
- If behavior needs to change, it's a documented constraint change, not accidental mutation

**Alternative rejected:** "Guards are implicit in code" — leads to unmaintainability + missed cases

**Implications:**
- Every test must assert frozen state (not just state change)
- Code comments must link to this doc
- If you change freeze behavior, you must update this file + all tests + semantics.json

**Status:** ✅ Approved & enforced

---

## Decision 003: Test are Live Playwright (Not Mocked)

**Date:** 2026-05-20  
**Context:** Existing test suite mixes unit (vitest, mocked) and E2E (playwright, real). For minimal slice, need certainty that bugs are fixed.

**Decision:** All minimal slice Playwright tests run against **live `/dev` server**:
- No mocking of `assignResident()`, no mock timers (except where needed for determinism)
- Visual assertions (drag overlay position, spring-return animation, token position)
- State assertions (token in/out of roster, slot occupied/empty)
- Timing assertions (timer ± 50ms, animation < 500ms)

**Rationale:**
- Mocked tests pass, reality fails (Playwright has caught this before)
- Live tests are slow (~5-10s per test) but catch real bugs (pickup alignment, race conditions)
- Visual regression snapshots catch unintended CSS changes

**Alternative rejected:** "Use vitest with mocks for speed" — speed != confidence

**Implications:**
- Test suite runs slower (~30 min for all 6 phases)
- Must have stable `/dev` server during test
- Tests may be flaky if server is slow (acceptable, will retry)
- Cannot test in CI until Playwright config supports headless mode

**Status:** ✅ Approved & ongoing

---

## Decision 004: Bidirectional Binding (Docs → Tests → Docs)

**Date:** 2026-05-20  
**Context:** Existing docs are outdated, tests are incomplete. Need a way to keep them in sync.

**Decision:** 
1. Write behavior spec in `.md` (narrative, examples, edge cases, known issues)
2. Test file reads spec, implements test cases extracted from spec
3. If test finds new behavior (not in spec), add to spec first, then implement test
4. Semantics `.json` is machine-readable version of spec (for tooling, future)

**Rationale:**
- Docs are primary source of truth
- Tests drive spec updates (not the reverse)
- Machine-readable JSON allows future tooling (auto-test generation, mutation testing)

**Alternative rejected:** "Tests + docs separate, sync manually" — leads to drift

**Implications:**
- Every test must cite line numbers from corresponding `.md`
- Spec file changes must be coordinated with test changes
- `.semantics.json` is derived from `.md`, not source of truth

**Status:** ✅ Approved & enforced

---

## Decision 005: Personal Project Context Governance

**Date:** 2026-05-20  
**Context:** This is a personal hobby project, very different from work projects. Need clear boundary.

**Decision:**
- Separate governance file: `context/RPG_PROJECT_CONTEXT.md`
- Separate decision log: `context/DECISION_LOG.md` (this file)
- Separate test docs: `src/docs/docs/minimal_slice/` (not shared with work projects)
- Separate page routes: `/minimal-*` namespace

**Rationale:**
- Work projects have different standards (enterprise, compliance, processes)
- RPG project is experimental, personal, no-approval-needed
- Clear separation prevents governance bleed

**Implications:**
- All RPG-specific decisions logged here, not in work logs
- Code in `src/ui/idleVillage/` is RPG-specific, not reused in work projects
- Build/deploy separate from work CI/CD

**Status:** ✅ Approved & ongoing

---

## Decision 006: Deterministic RNG + Fixed Seed for Testing

**Date:** 2026-05-20  
**Context:** Outcome calculations (skill checks, loot drops) use randomness. Tests must be deterministic.

**Decision:** All RNG in gameplay uses **seeded PRNG**, not `Math.random()`:
- Outcome calculation: seed = `Date.now() + residentId` (or similar)
- Activity timer: fixed duration, no variance
- Playwright tests use same seed mechanism (or mocked time) for reproducibility

**Rationale:**
- Flaky tests (random failures) are bad for confidence
- Deterministic tests allow regression detection + debugging
- Seeded RNG still provides gameplay variety (different players, different seeds)

**Alternative rejected:** "Disable RNG for tests" — unrealistic, doesn't find real bugs

**Implications:**
- RNG implementation must be configurable (prod seed vs test seed)
- All outcome tests must assert exact result (not "random outcome occurred")
- If you change RNG algorithm, you must update test seeds

**Status:** ✅ Approved & ongoing

---

## Decision 007: Roster State is Derived, Not Stored

**Date:** 2026-05-20  
**Context:** Roster contains PgTokens. Should roster state be independent or derived from Character/Resident storage?

**Decision:** **Roster state is derived:**
- Canonical source: Character Storage (primary)
- Derived via: `bootstrapResidentsFromCharacters()` → ResidentState[]
- Roster renders ResidentState[], no additional state
- If Character updates, Resident updates automatically

**Rationale:**
- Single source of truth (no sync bugs)
- Simplifies state management (less mutation)
- Easier to debug (trace state back to source)

**Alternative rejected:** "Roster maintains independent state" — sync nightmare

**Implications:**
- Never mutate Roster state directly; go through Character storage
- Tests verify "Character updated → Roster reflects update"
- Performance: Roster recomputes if Character changes (acceptable, Resident list is small)

**Status:** ✅ Approved & enforced

---

## Regressions Found & Fixed

**Regression 001: Drag Pickup Alignment**

| Aspect | Details |
|--------|---------|
| **Date Found** | 2026-05-20 (pre-planning) |
| **Symptom** | Cursor not centered on token when drag starts |
| **Root Cause** | CustomDragOverlay offset or transform-origin not matching token visual center |
| **Status** | 🟡 Investigating (Macro-Fase A.3 of VERTICAL_SLICE_ROADMAP) |
| **Phase to Fix** | Phase 4 (Drag integration) |
| **Blocker?** | YES — blocks all drag interactions until fixed |

**Regression 002: Ghost Click After Failed Drop**

| Aspect | Details |
|--------|---------|
| **Date Found** | 2026-05-20 (pre-planning, guard layers exist) |
| **Symptom** | Token drops outside slot, but synthetic click triggers auto-assign anyway |
| **Root Cause** | Guard layers G1-G6 partially effective; edge case in timing |
| **Status** | 🟡 Guard layers added, needs regression test verification |
| **Phase to Verify** | Phase 4 (Drag integration) |
| **Blocker?** | YES — guard system must be robust |

**Regression 003: Spring-Return Animation Timing**

| Aspect | Details |
|--------|---------|
| **Date Found** | 2026-05-20 (pre-planning) |
| **Symptom** | Token doesn't return to origin after failed drop, or returns too slowly (> 500ms) |
| **Root Cause** | Spring physics timing or animation frame sync issue |
| **Status** | 🟡 Needs measurement in Phase 4 test |
| **Phase to Verify** | Phase 4 (Drag integration) |
| **Blocker?** | YES — UX feedback (visual feedback critical) |

---

## Open Questions (To Be Decided)

### Q1: Should Roster support infinite scroll or pagination?

**Context:** If game has 100+ characters, roster list becomes unwieldy.

**Options:**
- A: Virtual scrolling (render only visible PgToken)
- B: Pagination (10 per page, buttons)
- C: Keep unbounded (accept performance hit)

**Timeline:** Defer to Phase 2, revisit after prototype.

### Q2: Should dropped-outside token animate back, or snap instantly?

**Context:** Spring-return animation is pretty but adds 300-500ms latency feedback.

**Options:**
- A: Animate (current, < 500ms)
- B: Snap instantly (faster feedback)
- C: User preference toggle

**Timeline:** Decide in Phase 4. Test both, ask Fausto.

### Q3: How many test scenarios are "exhaustive"?

**Context:** Phase 4 might need 15+ test cases (drag on slot, drag outside, drag multiple, rapid drag, etc). How many is enough?

**Options:**
- A: Cover all documented behaviors in `.md` (current decision, exhaustive)
- B: Top 5-10 scenarios (faster, less coverage)
- C: Guided by code coverage (75%+ lines covered)

**Timeline:** Stick with A (exhaustive), measure after Phase 1.

---

## Future Decisions (Roadmap)

- **Macro-Fase B onwards:** Will need decisions on MarketActionCard design, outcome modal layout, level-up animation, etc. Log decisions here as they arise.
- **Steam integration:** Build strategy, certificates, storefront design. TBD.
- **Localization:** EN primary, IT stub. Decision on translation tooling later.

---

**Last updated:** 2026-05-20  
**Frequency:** Update after each major decision (expected ~1x week during development)  
**Owner:** Fausto Boni
