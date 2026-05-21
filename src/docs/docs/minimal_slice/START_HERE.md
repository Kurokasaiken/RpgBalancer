# Vertical Slice Architecture - START HERE 🚀

**Aligned with Master Plan:** See [MASTER_PLAN.md](../../MASTER_PLAN.md) for top-level governance
**Aligned with Plans Index:** See [IMPLEMENTATION_PLANS_INDEX.md](../IMPLEMENTATION_PLANS_INDEX.md) for plan navigation
**Aligned with Phase Index:** See [00_README.md](./00_README.md) for 6-phase incremental build
**Aligned with Semantic Constraints:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) for semantic constraints

Welcome! This document is your entry point to the vertical slice component architecture system.

---

## ⏱️ 30-Second Overview

The RPG Combat Simulator now uses a **disciplined vertical slice architecture** where:
- 13 components are isolated and independently testable
- Tests run automatically before commits (preventing regressions)
- GitHub Actions runs the same tests in CI/CD
- Semantic versioning enforces API stability
- Documentation is always in sync with code

**Status:** Phase 1 complete. Ready for deployment. ✅

---

## 🎯 Choose Your Path

### 👤 I'm a Developer
→ **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** (5 min)
- Essential commands
- Git workflow
- Common issues & fixes

### 🔧 I'm Setting Up Locally
→ **[STEP_1_CHECKLIST.md](./STEP_1_CHECKLIST.md)** (10 min)
- Verification steps
- Husky setup
- Troubleshooting

### 📋 I Need to Understand the Rules
→ **[context/VERTICAL_SLICE_REFERENCE.md](../../context/VERTICAL_SLICE_REFERENCE.md)** (20 min)
- Governance rules
- Versioning strategy
- Modification workflows
- Non-breaking vs. breaking changes

### 📅 I'm Planning the Future
→ **[IMPLEMENTATION_PLAN_DETAILED.md](./IMPLEMENTATION_PLAN_DETAILED.md)** (30 min)
- 4-phase roadmap (3 weeks)
- Success metrics
- Risk mitigation
- Phase 2-4 details

### ✅ I Need Executive Summary
→ **[PHASE_1_SUMMARY.md](./PHASE_1_SUMMARY.md)** (10 min)
- What was accomplished
- Key features
- Success criteria
- Next steps

### 📊 I Need Full Verification Details
→ **[PHASE_1_COMPLETION_REPORT.md](./PHASE_1_COMPLETION_REPORT.md)** (15 min)
- Detailed deliverables
- Test infrastructure
- Configuration summary
- Metrics & verification

---

## 🚀 Quick Start (5 minutes)

### 1. Verify Local Setup
```bash
npm run test:minimal
```
Should output: ✓ 370+ tests passing

### 2. View Test Report
```bash
npm run test:minimal:report
```
Opens browser with detailed Playwright report

### 3. Try a Commit
```bash
git add .
git commit -m "test: verify husky hook"
```
Should output: ✓ Pre-commit checks passed

### 4. Debug a Test (Optional)
```bash
npm run test:minimal:headed
```
Opens browser and runs tests with live visibility

---

## 📚 Document Map

```
VERTICAL_SLICE_START_HERE.md (YOU ARE HERE)
│
├─ QUICK_REFERENCE.md ...................... Essential commands & workflows
├─ STEP_1_CHECKLIST.md ..................... Setup & verification
├─ PHASE_1_SUMMARY.md ...................... Executive summary
│
├─ context/VERTICAL_SLICE_REFERENCE.md .... Governance & rules (MASTER)
├─ IMPLEMENTATION_PLAN_DETAILED.md ........ 4-phase roadmap
├─ PHASE_1_COMPLETION_REPORT.md ........... Detailed metrics
│
├─ HUSKY_SETUP_INSTRUCTIONS.md ............ Manual Husky setup
└─ README.md .............................. Project overview + Vertical Slice section
```

---

## 🎓 The Big Picture

### What is a Vertical Slice?

A **vertical slice** is a subset of components that:
1. Starts simple (single inputs/outputs)
2. Grows more complex over phases
3. Each component is fully isolated
4. Only its dedicated test page can modify it
5. Changes are governed by semantic versioning

**Benefits:**
- ✅ No regressions (tests block breaking changes)
- ✅ Clear ownership (one test page per component)
- ✅ Easy to understand (start simple, add complexity)
- ✅ Scalable (governance prevents maintenance chaos)

### The 13 Components (Organized in 6 Phases)

**Phase 1-2:** Core gameplay components  
**Phase 3-4:** Advanced mechanics  
**Phase 5-6:** Complex systems & interactions  

Each component has:
- Isolated test page (e.g., `/minimal-pgcard`)
- Comprehensive E2E tests (e.g., `minimal_slice_01_pgcard.spec.ts`)
- Semantic version (e.g., `1.2.3`)
- Immutable contract (API doesn't break)

---

## 🔄 Typical Workflow

### Adding a New Feature to Component X

```bash
# 1. Navigate to component's test page
# (e.g., http://localhost:5173/minimal-pgcard)

# 2. Modify component
vim src/components/core/PGCard.tsx

# 3. Update tests
vim tests/e2e/minimal_slice_01_pgcard.spec.ts

# 4. Run tests locally
npm run test:minimal

# 5. If failing, debug with browser
npm run test:minimal:headed

# 6. Once tests pass, commit
git commit -m "feat(core): add feature to PGCard"

# 7. Husky hook runs tests automatically
# Output: ✓ Pre-commit checks passed

# 8. Push to GitHub
git push origin main

# 9. GitHub Actions runs same tests
# View results: https://github.com/YOUR_ORG/RPG/actions
```

### If Tests Fail

```bash
# You'll see:
# ❌ Minimal slice tests failed - commit aborted

# Debug options:
npm run test:minimal:headed    # Watch browser during test
npm run test:minimal:debug     # Step through with debugger

# Once fixed, retry commit
git commit -m "feat(core): add feature to PGCard"
```

---

## 🔒 Key Rules (Don't Break These!)

### Rule 1: Only Modify Components from Their Test Pages
❌ **Don't:** Modify `PGCard.tsx` from `Village.tsx`  
✅ **Do:** Modify `PGCard.tsx` from `minimal-pgcard.tsx`

**Why:** Prevents unintended side effects and makes changes auditable

### Rule 2: All Props Must Have Tests
❌ **Don't:** Add a prop without updating tests  
✅ **Do:** Add prop + update tests in same commit

**Why:** Ensures component stability and prevents regressions

### Rule 3: Use Semantic Versioning
❌ **Don't:** Bump version arbitrarily  
✅ **Do:** PATCH for fixes, MINOR for features, MAJOR for breaking

**Why:** Consumers know what changed (SemVer standard)

### Rule 4: Write Clear Commit Messages
❌ **Don't:** `git commit -m "fix stuff"`  
✅ **Do:** `git commit -m "fix(core): correct PGCard prop validation"`

**Why:** Enables automation (Phase 2) and team communication

### Rule 5: Tests Must Be Comprehensive
❌ **Don't:** Test only happy path  
✅ **Do:** Test happy path, edge cases, error cases, accessibility

**Why:** Prevents bugs from reaching production

---

## 📊 Infrastructure Overview

```
Pre-commit Hook (Local)
├─ Triggered on: git commit
├─ Runs: npm run test:minimal --bail
├─ Blocks: If tests fail
└─ Output: Debug instructions on failure

        ↓
        
GitHub Actions (CI/CD)
├─ Triggered on: Push to main / PR
├─ Runs: npm run test:minimal
├─ Uploads: HTML reports (14 days)
├─ Comments: Results on PR
└─ Notifies: Slack on failure (optional)

        ↓
        
Test Results Summary
├─ Local: test-summary.json
├─ GitHub: Artifacts + PR comments
└─ Report: playwright-report/ (HTML)
```

---

## ✨ What You Can Do Now

- ✅ Run tests locally: `npm run test:minimal`
- ✅ View reports: `npm run test:minimal:report`
- ✅ Debug tests: `npm run test:minimal:headed`
- ✅ Commit with automatic testing: `git commit`
- ✅ Push to GitHub with CI/CD: `git push`
- ✅ Read documentation to understand rules

---

## 🚀 What's Coming Next (Phase 2)

**Conventional Commits & Semantic Versioning**

Automates:
- ✅ Commit message validation
- ✅ Version bumping (MAJOR.MINOR.PATCH)
- ✅ Changelog generation
- ✅ Release notes

**Timeline:** Week 2 (2026-05-21 to 2026-05-23)

---

## 📞 Need Help?

1. **Quick question?** → Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
2. **Setup issue?** → Read [STEP_1_CHECKLIST.md](./STEP_1_CHECKLIST.md)
3. **Understanding rules?** → Read [context/VERTICAL_SLICE_REFERENCE.md](../../context/VERTICAL_SLICE_REFERENCE.md)
4. **Debugging test?** → Run `npm run test:minimal:headed`

---

## 🎯 TL;DR

**What changed:** Added automated testing, pre-commit hooks, and governance  
**Why:** Prevent regressions and enforce discipline across 13 components  
**How you use it:** Commit normally, Husky runs tests automatically  
**If tests fail:** See debug instructions, fix, retry commit  
**Benefits:** No regressions reach GitHub, clear ownership, scalable  

**Status:** ✅ Ready to use. Phase 1 complete.

---

## 🔗 Essential Links

| Link | Purpose |
|------|---------|
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Commands & workflows |
| [context/VERTICAL_SLICE_REFERENCE.md](../../context/VERTICAL_SLICE_REFERENCE.md) | Rules & governance |
| [IMPLEMENTATION_PLAN_DETAILED.md](./IMPLEMENTATION_PLAN_DETAILED.md) | Full roadmap |
| [/minimal](http://localhost:5173/minimal) | Component hub (local) |
| [GitHub Actions](https://github.com/YOUR_ORG/RPG/actions) | CI/CD results |

## Related Documentation

- [Card System Description](../idle_village/card_system_description.md) - Complete card system architecture
- [Vertical Slice Entities](../../context/VERTICAL_SLICE_ENTITIES_FULL.md) - Complete entity inventory
- [Documentation Governance](../DOCUMENTATION_GOVERNANCE.md) - Single source of truth rules
- [RPG Project Context](../../context/RPG_PROJECT_CONTEXT.md) - Semantic constraints

---

**Last Updated:** 2026-05-20  
**Status:** Phase 1 Complete ✅  
**Next:** Phase 2 - Conventional Commits (2026-05-21)

**Now go build amazing components! 🎮**
