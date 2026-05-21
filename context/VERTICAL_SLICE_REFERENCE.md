# Vertical Slice: Component Versioning & Governance (RPG Context)

## Overview

The Idle Village RPG uses a **vertical slice architecture** for component development with:
- **Semantic versioning** (MAJOR.MINOR.PATCH) for each component
- **Immutable contracts** enforced via test-driven development
- **Automated CI/CD** validation
- **Governance** via branch protection and code ownership

## Current State

**13 Isolated Components** → **370+ Tests** → **Frozen Versions**

### Phase 1-2: Core UI Components (FROZEN)
1. **PgCard** (v1.0.0) - Portrait + Rarity rings + Status icons
2. **SlottedMedal** (v1.0.0) - Circular variant of PgCard
3. **VillageRosterSection** (v1.0.0) - Sorting/filtering resident list
4. **ClockWidget** (v1.0.0) - Time display + speed controls

### Phase 3: Supporting Components (FROZEN)
5. **ResidentSlotRack** (v1.0.0) - Slot display (drag-ready)
6. **ResourceHUD** (v1.0.0) - Resource counter display

### Phase 4: Activity Components (FROZEN)
7. **JobCard** (v1.0.0) - Job assignment card
8. **QuestCard** (v1.0.0) - Quest assignment card

### Phase 5: Action/State Components (FROZEN)
9. **SkillCheckPanel** (v1.0.0) - Dice roll + result calculation
10. **OutcomeModal** (v1.0.0) - Success/failure display
11. **MarketActionCard** (v1.0.0) - Market item trading

### Phase 6: Integration Tests (IN PROGRESS)
12. **PgCard + JobCard Drag** - Resident assignment flow
13. **QuestCard + SkillCheck + Outcome** - Full quest resolution

## Versioning Strategy

### Semantic Versioning

Follows [Semantic Versioning](https://talent500.com/blog/semantic-versioning-explained-guide/):

```
MAJOR.MINOR.PATCH
  1  .  0  .  0

MAJOR: Breaking changes (interface, behavior, props)
MINOR: Backward-compatible additions
PATCH: Bug fixes only
```

### Immutable Contracts

Each component defines an **immutable contract** that cannot change without major version bump:

```typescript
/**
 * @component PgCard
 * @version 1.0.0
 * @frozen 2026-05-20
 * 
 * IMMUTABLE CONTRACT (v1.x):
 * - Props: { resident: ResidentState }
 * - Renders: Portrait + Rarity ring + Status icons
 * - Behaviors: Hover tooltip, selection state
 * 
 * CHANGEABLE:
 * - Colors, fonts, animations (display only)
 * - Performance optimizations
 * 
 * BREAKING CHANGES REQUIRE:
 * - Version bump to 2.0.0
 * - New spec document
 * - Migration guide
 * - All tests rewritten
 */
```

## Governance Rules

### Branch Protection

**Main branch requires:**
- ✓ All tests passing (CI)
- ✓ Squash + meaningful commit message ([Conventional Commits](https://www.conventionalcommits.org/))
- ✓ CODEOWNERS approval (2+ leads for minimal-*.tsx)
- ✓ PR checklist completed (spec updated, tests passing)

### Code Ownership (CODEOWNERS)

```
# .github/CODEOWNERS

# Minimal slice components require platform lead approval
src/pages/minimal-*.tsx @platform-leads
src/components/core/*.tsx @platform-leads
tests/e2e/minimal_slice_*.spec.ts @platform-leads
src/docs/docs/minimal_slice/*.md @platform-leads
```

## Modification Workflow

### Non-Breaking Change (1.0.0 → 1.0.1 or 1.1.0)

```bash
$ git checkout -b fix/pgcard-color-issue
# Make changes (colors, animations, perf only)
$ pnpm test:minimal        # ✓ All tests pass
$ git commit -m "fix: PgCard hover color contrast (accessibility)

spec: Updated 01_pgcard.md color contrast ratio
test: All 30 tests passing"
# Push → CI validates → Merge
# Version auto-bumped: v1.0.1
```

### Breaking Change (1.0.0 → 2.0.0) - RARE

```bash
$ git checkout -b feat/pgcard-new-slot-size
# Change slot size (BREAKING!)
$ pnpm test:minimal        # ❌ 5 tests fail
# ⇒ Must update spec + tests together
$ # Update 01_pgcard.md with v2.0.0 changes
$ # Update .spec.ts expectations
$ pnpm test:minimal        # ✓ All tests pass
$ git commit -m "feat!: PgCard v2.0 new 120px slot size

BREAKING CHANGE: Slot size changed 100px → 120px
Impact: MinimalRosterPage, MinimalSlotRackPage (must update)

spec: New document 01_pgcard_v2.md
migration: docs/MIGRATION_pgcard_v1_to_v2.md
test: All 30 tests re-written and passing"

# After merge:
# - Version auto-bumped: v2.0.0
# - Dependent components flagged (need updates)
# - Migration guide published
```

## References

- **Semantic Versioning:** [Semantic Versioning Explained](https://talent500.com/blog/semantic-versioning-explained-guide/)
- **Conventional Commits:** [Conventional Commits Guide](https://www.deployhq.com/blog/conventional-commits-a-standardized-approach-to-commit-messages/)
- **Automated Versioning:** [Semantic Release and Branch Protection Rules](https://gonzalohirsch.com/blog/semantic-release-and-branch-protection-rules/)
- **Playwright CI/CD:** [Setting up CI | Playwright](https://playwright.dev/docs/ci-intro/)

## Running Tests

```bash
# Run all minimal slice tests
pnpm test:minimal

# Run with UI (headed)
pnpm test:minimal:headed

# Debug mode
pnpm test:minimal:debug

# View HTML report
pnpm test:minimal:report

# Run specific component test
npx playwright test tests/e2e/minimal_slice_01_pgcard.spec.ts
```

---

**Last Updated:** 2026-05-20  
**Maintained By:** Platform Team  
**Next Review:** 2026-06-01
