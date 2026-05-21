# Vertical Slice Quick Reference Card

## 🚀 Essential Commands

```bash
# Run all minimal-slice tests
npm run test:minimal

# View test results in browser
npm run test:minimal:report

# Debug failing tests (watch browser live)
npm run test:minimal:headed

# Step through with debugger
npm run test:minimal:debug

# Watch mode for development
npm run test:minimal:watch
```

---

## 🔒 Git Workflow

```bash
# Make changes to component or test
vim src/components/core/MyComponent.tsx
vim tests/e2e/minimal_slice_01_mycomponent.spec.ts

# Stage changes
git add src/components/ tests/e2e/minimal_slice_*

# Commit (Husky hook runs tests automatically)
git commit -m "feat: add MyComponent"

# If tests fail, you'll see:
# ❌ Minimal slice tests failed - commit aborted

# Fix the issue and try again
npm run test:minimal:headed  # Debug
git commit -m "feat: add MyComponent"

# Once tests pass: ✓ Pre-commit checks passed
# Commit succeeds!

# Push to GitHub (CI/CD runs again)
git push origin main
```

---

## 📋 Component Versioning

### Adding a New Component

1. **Create component:** `src/components/core/NewComponent.tsx`
2. **Create test page:** `src/pages/minimal-new-component.tsx`
3. **Create E2E test:** `tests/e2e/minimal_slice_XX_newcomponent.spec.ts`
4. **Run tests:** `npm run test:minimal`
5. **Update VERTICAL_SLICE_REFERENCE.md** with new component info
6. **Commit with conventional message:**
   ```bash
   git commit -m "feat(core): add NewComponent v1.0.0"
   ```

### Modifying a Component

**Non-breaking change (PATCH/MINOR):**
```bash
git commit -m "fix(core): improve MyComponent logic"
# Version bumps: 1.0.0 → 1.0.1 (PATCH)
```

**Breaking change (MAJOR):**
```bash
git commit -m "feat!(core): redesign MyComponent API

BREAKING CHANGE: Props structure changed from {...} to {...}
Migration: see VERTICAL_SLICE_REFERENCE.md#migration-guide"
```

---

## 📊 Test Files Structure

```
tests/e2e/
├── minimal_slice_01_pgcard.spec.ts          # Component 1
├── minimal_slice_02_activity-card.spec.ts   # Component 2
├── minimal_slice_03_theater-view.spec.ts    # Component 3
└── minimal_slice_XX_*.spec.ts               # Component XX
```

Each file should:
- ✅ Test all props and states
- ✅ Validate visual rendering
- ✅ Test edge cases
- ✅ Include accessibility checks
- ✅ Cover 100% of component behavior

---

## 🔍 Common Issues & Fixes

### Issue: "Husky hook not running"
```bash
# Verify it's installed
ls -la .husky/pre-commit

# Make it executable
chmod +x .husky/pre-commit

# Test manually
./.husky/pre-commit
```

### Issue: "Tests fail locally but pass on GitHub"
```bash
# Clear cache
rm -rf node_modules/.playwright
npm run test:minimal

# Check Node version
node --version  # Should be v18+
```

### Issue: "Tests timeout"
```bash
# Run with fewer workers
PLAYWRIGHT_WORKERS=1 npm run test:minimal

# Or increase timeout in playwright.config.ts
# timeout: 30000 (30 seconds)
```

### Issue: "Commit blocked by failing tests"
```bash
# Debug the test
npm run test:minimal:headed

# Once fixed, try commit again
git commit -m "..."

# Or skip hooks (not recommended!)
git commit --no-verify -m "..."
```

---

## 📚 Documentation

| Link | Purpose |
|------|---------|
| [VERTICAL_SLICE_REFERENCE.md](./context/VERTICAL_SLICE_REFERENCE.md) | Full governance guide |
| [IMPLEMENTATION_PLAN_DETAILED.md](./IMPLEMENTATION_PLAN_DETAILED.md) | Complete roadmap |
| [PHASE_1_COMPLETION_REPORT.md](./PHASE_1_COMPLETION_REPORT.md) | Phase 1 summary |
| [README.md](./README.md) | Project overview |

---

## 🎯 Key Rules

1. **Only modify components from their isolated test page**
   - Reason: Prevents regression across the codebase

2. **Every prop must have a test**
   - Reason: Ensures component stability

3. **Tests must be exhaustive**
   - Cover happy path, edge cases, errors
   - Validate visual output
   - Check accessibility

4. **Use semantic versioning**
   - Breaking changes → MAJOR version
   - New features → MINOR version
   - Bug fixes → PATCH version

5. **Write clear commit messages**
   - Use conventional commits format
   - Include rationale for breaking changes
   - Reference migration guides

---

## 🚨 Pre-commit Hook Behavior

When you commit changes to minimal-slice files:

```
1. Git detects changes to:
   - src/pages/minimal-*
   - src/components/core/*
   - tests/e2e/minimal_slice_*

2. Husky runs .husky/pre-commit script

3. Script executes: npm run test:minimal --bail

4. If tests pass:
   ✓ Commit proceeds normally

5. If tests fail:
   ✗ Commit is blocked
   → You see debug instructions
   → Fix the issue and retry commit
```

---

## 📈 Next Phase (Week 2)

Phase 2 will add:
- **Conventional Commit Linting:** Enforce commit message format
- **Semantic Release:** Automatic version bumping
- **Changelog Generation:** Auto-generated from commits
- **GitHub Actions:** Auto-version CI job

For now, manually track versions in component files and VERTICAL_SLICE_REFERENCE.md.

---

**Last Updated:** 2026-05-20  
**Status:** Phase 1 Complete ✅  
**Next Phase:** Phase 2 - Conventional Commits & Versioning
