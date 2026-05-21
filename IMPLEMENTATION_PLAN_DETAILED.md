# Vertical Slice Implementation Plan - Detailed Roadmap

## 📊 High-Level Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: CI/CD & Test Infrastructure          Week 1 (CURRENT) │
│ • GitHub Actions workflow setup                                  │
│ • Playwright report configuration                                │
│ • Pre-commit hooks (Husky)                                       │
│ • Hub page creation                                              │
│ → Outcome: Tests run automatically on every push                 │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: Conventional Commits & Versioning    Week 2             │
│ • Commitlint setup                                               │
│ • Semantic Release configuration                                 │
│ • Auto-generated changelog                                       │
│ • Component version tracking                                     │
│ → Outcome: Automated version bumping via commit messages         │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: Documentation & Lock Files           Week 2-3           │
│ • Version lock file generation                                   │
│ • Component metadata extraction                                  │
│ • Migration guide automation                                     │
│ • Dependency graph tracking                                      │
│ → Outcome: Immutable component contracts with audit trail        │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: Governance Enforcement               Week 3             │
│ • CODEOWNERS configuration                                       │
│ • Branch protection rules                                        │
│ • PR checklist automation                                        │
│ • Doc/code sync linting                                          │
│ → Outcome: Enforced governance workflow                          │
└─────────────────────────────────────────────────────────────────┘
```

---

# PHASE 1: CI/CD & Test Infrastructure

## Overview

**Objective:** Establish automated test execution and reporting infrastructure

**Deliverables:**
1. GitHub Actions workflow for Playwright tests
2. Playwright HTML + JSON + JUnit reporters configured
3. Pre-commit hooks that run tests locally
4. Hub page showing component inventory + test status
5. Updated documentation

**Duration:** 2-3 days

---

## Step 1.1: GitHub Actions Workflow Setup ⭐ EXECUTE NOW

### Files to Create

#### 1. `.github/workflows/minimal-tests.yml`

This file creates a CI pipeline that:
- Runs on every push to main/develop and PR
- Installs dependencies
- Runs Playwright tests
- Uploads reports as artifacts
- Comments on PRs with results

**Create this file with the content in the next section.**

#### 2. `.github/workflows/minimal-tests-nightly.yml` (Optional)

```yaml
# .github/workflows/minimal-tests-nightly.yml
name: Minimal Slice Tests - Nightly

on:
  schedule:
    # Run every night at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  test-minimal-nightly:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps
      
      - name: Run Playwright tests
        run: pnpm test:minimal -- --reporter=html,json
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-nightly-${{ github.run_id }}
          path: playwright-report/
          retention-days: 30
      
      - name: Slack notification (if failed)
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "❌ Nightly Minimal Tests Failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Minimal slice tests failed in nightly run\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Details>"
                  }
                }
              ]
            }
```

### Step 1.1 Actions

1. **Create `.github/workflows/minimal-tests.yml`**:

```bash
mkdir -p .github/workflows
# File creation in next step
```

2. **Update `playwright.config.ts`** to add reporters

3. **Update `package.json`** with test scripts

4. **Create test summary script**

5. **Commit and push to GitHub**

6. **Verify workflow runs** in GitHub Actions tab

---

## Step 1.2: Playwright Configuration

### Update `playwright.config.ts`

Ensure your Playwright config is set up correctly:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/minimal_slice_*.spec.ts',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    ['list'],
  ],
  
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

## Step 1.3: Package.json Scripts

Add/update test scripts:

```json
{
  "scripts": {
    "test:minimal": "playwright test tests/e2e/minimal_slice_*.spec.ts --reporter=html,json,junit",
    "test:minimal:headed": "playwright test tests/e2e/minimal_slice_*.spec.ts --headed",
    "test:minimal:debug": "playwright test tests/e2e/minimal_slice_*.spec.ts --debug",
    "test:minimal:report": "playwright show-report",
    "test:minimal:watch": "playwright test tests/e2e/minimal_slice_*.spec.ts --watch"
  }
}
```

---

## Step 1.4: Pre-commit Hooks (Husky)

### Installation

```bash
# Install Husky
pnpm install husky --save-dev

# Initialize Husky
pnpm exec husky install

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
set -e

echo "🧪 Running minimal slice pre-commit checks..."

# Check if test or component files were modified
if git diff --cached --name-only | grep -qE '(tests/e2e/minimal_slice_|src/pages/minimal-|src/components/core/)'; then
  echo "⚠️ Minimal slice files detected - running tests..."
  pnpm test:minimal --bail || {
    echo "❌ Tests failed - commit aborted"
    exit 1
  }
fi

echo "✓ Pre-commit checks passed"
EOF

chmod +x .husky/pre-commit
```

---

## Step 1.5: Hub Page Creation

See detailed code in Step 3 below.

---

## Step 1.6: Documentation Updates

Create:
1. `context/VERTICAL_SLICE_REFERENCE.md` - Main reference
2. Update `README.md` with quick links
3. Create section in project docs

---

# PHASE 1 EXECUTION SCHEDULE

## Day 1: Setup & Workflow

- [ ] Create `.github/workflows/minimal-tests.yml`
- [ ] Update `playwright.config.ts`
- [ ] Update `package.json` scripts
- [ ] Install Husky and create `.husky/pre-commit`
- [ ] Push to branch and verify workflow runs on GitHub

## Day 2: Hub Page & Local Testing

- [ ] Create `src/pages/minimal-hub.tsx`
- [ ] Add hub route to `src/App.tsx`
- [ ] Test hub page locally at `/minimal`
- [ ] Run tests locally: `pnpm test:minimal`
- [ ] Verify report generation: `pnpm test:minimal:report`

## Day 3: Documentation & Polish

- [ ] Create `context/VERTICAL_SLICE_REFERENCE.md`
- [ ] Update `README.md` with links
- [ ] Document workflow in team wiki
- [ ] Train team on new workflow
- [ ] Create GitHub issue template for minimal slice PRs

---

# NEXT PHASES OVERVIEW

## Phase 2: Conventional Commits & Versioning

**Files to Create/Update:**
- `.commitlintrc.json` - Commit message validation
- `semantic-release` config - Auto versioning
- `.github/workflows/release.yml` - Release automation
- `CHANGELOG.md` - Auto-generated changelog

**Outcome:**
```
feat: Add new feature → v1.1.0 (MINOR)
fix: Bug fix → v1.0.1 (PATCH)
feat!: Breaking change → v2.0.0 (MAJOR)
```

---

## Phase 3: Documentation & Lock Files

**Files to Create/Update:**
- `scripts/generate-version-locks.ts` - Lock file generation
- `src/components/core/*.lock.json` - Version locks
- `VERTICAL_SLICE_FROZEN_VERSIONS.md` - Auto-generated
- `docs/MIGRATION_*.md` - Migration guides

**Outcome:**
```json
{
  "component": "PgCard",
  "version": "1.0.0",
  "frozen_at": "2026-05-20",
  "immutable_contract": { ... },
  "dependents": [...]
}
```

---

## Phase 4: Governance Enforcement

**Files to Create/Update:**
- `.github/CODEOWNERS` - Code ownership
- `.github/workflows/enforce-sync.yml` - Doc/code sync check
- `.lintstagedrc.json` - Lint staged files
- PR template - Checklist automation

**Outcome:**
```
✓ All tests pass
✓ Spec updated
✓ CODEOWNERS approval
✓ Conventional commit message
→ Merge allowed
```

---

# Success Metrics

After Phase 1 complete:

- ✓ CI runs tests on every push
- ✓ Test results visible in PR comments
- ✓ Hub page shows current status
- ✓ Pre-commit hook prevents bad commits
- ✓ Team can see component inventory

After Phase 4 complete:

- ✓ Automatic version bumping
- ✓ Immutable component contracts
- ✓ Doc/code always in sync
- ✓ Governance enforced
- ✓ Full audit trail
- ✓ 0 manual bookkeeping

---

# Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Tests take too long** | Parallel execution, cache deps, split by phase |
| **False positives** | Retries on CI (2x), stable selectors in tests |
| **Artifact storage costs** | Compress videos (FFmpeg), delete old reports, keep 14 days |
| **Team adoption** | Clear documentation, examples, training session |
| **Breaking changes missed** | CODEOWNERS review, commit message validation |

---

# Questions & Decisions

Before proceeding:

1. **Who are the CODEOWNERS?** (2-3 platform leads)
2. **Slack integration?** (Optional: notify on failures)
3. **Test retention policy?** (14 days? 30 days?)
4. **Artifact compression?** (Reduce storage costs)
5. **Release automation schedule?** (Immediate or batched?)

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-05-20  
**Status:** READY FOR EXECUTION
