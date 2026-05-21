# Phase 4: Governance Enforcement & Automation

**Phase:** 4 of 4  
**Timeline:** 2026-05-23 onwards  
**Status:** Planning & Preparation

---

## 🎯 Phase 4 Overview

Phase 4 implements automated governance enforcement through branch protection rules, CODEOWNERS, PR checklists, and linting. This ensures no bad code reaches main branch.

### Key Deliverables
- 🔒 GitHub Branch Protection Rules
- 👥 CODEOWNERS file for access control
- ✅ PR Template with enforcement checklist
- 🚨 Doc/code sync linter
- 📋 Component modification audit log
- 🤖 Automated governance checks

### Problems Solved
- ✅ Prevents commits to main without review
- ✅ Ensures tests pass before merge
- ✅ Requires specific approvers (tech leads)
- ✅ Prevents documentation divergence
- ✅ Enforces governance rules in CI
- ✅ Creates audit trail of approvals

---

## 🔒 GitHub Branch Protection Rules

### Configuration (GitHub Web UI)

**Settings → Branches → Add Rule:**

```
Branch name pattern: main
```

**Required checks before merging:**
- [ ] Require a pull request before merging
  - [x] Require approvals: 1+ (or more for production)
  - [x] Require review from code owners
  - [x] Require status checks to pass:
    - test-minimal (GitHub Actions)
    - semantic-release (GitHub Actions)
    - commitlint (if added to CI)
  - [ ] Require branches to be up to date before merging
  - [ ] Require conversations to be resolved

**Restrictions:**
- [ ] Include administrators
- [ ] Restrict who can push to matching branches

---

## 👥 CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Vertical Slice Components - Access Control

# Core Components (Phase 1-2)
/src/components/core/PGCard.tsx              @tech-lead-1
/src/pages/minimal-pgcard.tsx                @tech-lead-1
/tests/e2e/minimal_slice_01_pgcard.spec.ts  @tech-lead-1

/src/components/core/ActivityCard.tsx        @tech-lead-2
/src/pages/minimal-activity-card.tsx         @tech-lead-2
/tests/e2e/minimal_slice_02_*.spec.ts       @tech-lead-2

/src/components/core/TheaterView.tsx         @tech-lead-3
/src/pages/minimal-theater-view.tsx          @tech-lead-3
/tests/e2e/minimal_slice_03_*.spec.ts       @tech-lead-3

/src/components/core/ActiveHUD.tsx           @tech-lead-4
/src/pages/minimal-active-hud.tsx            @tech-lead-4
/tests/e2e/minimal_slice_04_*.spec.ts       @tech-lead-4

/src/components/core/ActivitySlot.tsx        @tech-lead-5
/src/pages/minimal-activity-slot.tsx         @tech-lead-5
/tests/e2e/minimal_slice_05_*.spec.ts       @tech-lead-5

# CI/CD & Configuration
/.github/workflows/                           @devops-lead
/.github/                                     @devops-lead

# Versioning & Governance
/context/VERTICAL_SLICE_*.md                  @architect
/PHASE_*.md                                   @architect
/.commitlintrc.json                           @architect
/.releaserc.json                              @architect

# Documentation
/README.md                                    @docs-lead
/CHANGELOG.md                                 @docs-lead

# Default (catch-all)
*                                             @tech-lead-1
```

### Component Ownership Rules

**Each component has:**
- 1 Primary Owner (must approve changes)
- 1 Backup Owner (can approve if primary unavailable)
- Team lead responsibility

**Modification Workflow:**

```
Developer wants to modify PGCard
        ↓
Creates branch: feature/pgcard-update
        ↓
Makes changes to:
  - src/components/core/PGCard.tsx
  - tests/e2e/minimal_slice_01_pgcard.spec.ts
        ↓
Pushes to GitHub
        ↓
GitHub detects CODEOWNERS match
        ↓
Requires review from @tech-lead-1
        ↓
@tech-lead-1 reviews:
  - Tests pass? ✓
  - Props contract honored? ✓
  - Breaking changes documented? ✓
        ↓
Approves ✓ or Requests changes ✗
        ↓
If approved: Developer merges (or auto-merge enabled)
```

---

## ✅ PR Template with Enforcement

Create `.github/pull_request_template.md`:

```markdown
## Description

Describe the changes and why they were made.

## Type of Change

- [ ] **feat**: New feature
- [ ] **fix**: Bug fix
- [ ] **docs**: Documentation only
- [ ] **refactor**: Code refactoring
- [ ] **test**: Adding/updating tests
- [ ] **perf**: Performance improvement
- [ ] **chore**: Build system, dependencies
- [ ] **ci**: CI/CD changes

## Components Affected

- [ ] PGCard
- [ ] ActivityCard
- [ ] TheaterView
- [ ] ActiveHUD
- [ ] ActivitySlot
- [ ] Other: ___________

## Vertical Slice Governance Checklist

### Code Quality
- [ ] Tests added/updated for all changes
- [ ] All 370+ tests pass locally (`npm run test:minimal`)
- [ ] No regressions detected
- [ ] Accessibility checks completed
- [ ] Code follows project style

### Version & Contract
- [ ] Version number updated if needed (SemVer)
- [ ] Component contract honored (no breaking changes unless MAJOR bump)
- [ ] Breaking changes documented with migration guide
- [ ] VERTICAL_SLICE_REFERENCE.md updated (if applicable)

### Documentation
- [ ] CHANGELOG.md updated (if applicable)
- [ ] VERTICAL_SLICE_FROZEN_VERSIONS.md updated
- [ ] Component README updated (if applicable)
- [ ] Code comments added for complex logic
- [ ] Commit message follows conventional commits format

### Governance
- [ ] PR title uses conventional commits format
- [ ] All required status checks pass
- [ ] No conflicts with main branch
- [ ] Ready for code owner review

## Testing

- [ ] Local test pass: `npm run test:minimal`
- [ ] HTML report reviewed: `npm run test:minimal:report`
- [ ] No console errors or warnings
- [ ] Tested on multiple browsers (if applicable)

## Related Issues

Closes #123 (example issue number)
Relates to #456 (example related issue)

## Screenshots (if applicable)

Add screenshots of visual changes.

---

**Note:** This PR will trigger automatic checks:
- GitHub Actions test runs
- Semantic version determination
- CHANGELOG generation (if release)
- Code owner notifications
```

---

## 🚨 Doc/Code Sync Linter

Create `scripts/lint-vertical-slice.js`:

```javascript
#!/usr/bin/env node
/**
 * Lint Vertical Slice governance rules
 * Usage: node scripts/lint-vertical-slice.js
 * Exit codes: 0 = pass, 1 = fail
 */

const fs = require('fs');
const path = require('path');

class VerticalSliceLinter {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  error(message) {
    this.errors.push(`❌ ${message}`);
  }

  warn(message) {
    this.warnings.push(`⚠️ ${message}`);
  }

  async lint() {
    await this.checkComponentRegistry();
    await this.checkVersionConsistency();
    await this.checkDocumentationSync();
    await this.checkContractInheritance();
    await this.checkTestCoverage();
    
    return this.report();
  }

  async checkComponentRegistry() {
    const cwd = process.cwd();
    const registryPath = path.join(cwd, 'context/VERTICAL_SLICE_REFERENCE.md');
    
    if (!fs.existsSync(registryPath)) {
      this.error('VERTICAL_SLICE_REFERENCE.md not found');
      return;
    }

    const registry = fs.readFileSync(registryPath, 'utf8');
    const componentsDir = path.join(cwd, 'src/components/core');
    
    if (!fs.existsSync(componentsDir)) {
      this.warn('src/components/core directory not found');
      return;
    }

    const components = fs.readdirSync(componentsDir)
      .filter(f => f.endsWith('.tsx'))
      .map(f => f.replace('.tsx', ''));

    for (const component of components) {
      if (!registry.includes(component)) {
        this.warn(`Component ${component} not documented in VERTICAL_SLICE_REFERENCE.md`);
      }
    }
  }

  async checkVersionConsistency() {
    const cwd = process.cwd();
    const frozenPath = path.join(cwd, 'context/VERTICAL_SLICE_FROZEN_VERSIONS.md');
    const changelogPath = path.join(cwd, 'CHANGELOG.md');

    if (!fs.existsSync(frozenPath)) {
      this.error('context/VERTICAL_SLICE_FROZEN_VERSIONS.md not found');
      return;
    }

    if (!fs.existsSync(changelogPath)) {
      this.warn('CHANGELOG.md not found');
      return;
    }

    const frozen = fs.readFileSync(frozenPath, 'utf8');
    const changelog = fs.readFileSync(changelogPath, 'utf8');

    // Check version consistency
    const versionRegex = /version:\s*([\d.]+)/g;
    const frozenVersions = [...frozen.matchAll(versionRegex)];
    
    if (frozenVersions.length === 0) {
      this.warn('No versions found in VERTICAL_SLICE_FROZEN_VERSIONS.md');
    }
  }

  async checkDocumentationSync() {
    const cwd = process.cwd();
    const readmePath = path.join(cwd, 'README.md');
    const referencePath = path.join(cwd, 'context/VERTICAL_SLICE_REFERENCE.md');

    if (!fs.existsSync(readmePath)) {
      this.error('README.md not found');
      return;
    }

    const readme = fs.readFileSync(readmePath, 'utf8');

    // Check if README links to governance docs
    if (!readme.includes('VERTICAL_SLICE_REFERENCE') && !readme.includes('minimal')) {
      this.warn('README.md should reference Vertical Slice architecture');
    }
  }

  async checkContractInheritance() {
    const cwd = process.cwd();
    const referenceFile = path.join(cwd, 'context/VERTICAL_SLICE_REFERENCE.md');

    if (!fs.existsSync(referenceFile)) {
      return;
    }

    const content = fs.readFileSync(referenceFile, 'utf8');

    // Check for immutable contract sections
    if (!content.includes('immutable-contract') && !content.includes('Immutable Contract')) {
      this.warn('VERTICAL_SLICE_REFERENCE.md should define immutable contracts');
    }
  }

  async checkTestCoverage() {
    const cwd = process.cwd();
    const testsDir = path.join(cwd, 'tests/e2e');

    if (!fs.existsSync(testsDir)) {
      this.warn('tests/e2e directory not found');
      return;
    }

    const testFiles = fs.readdirSync(testsDir)
      .filter(f => f.startsWith('minimal_slice_') && f.endsWith('.spec.ts'));

    if (testFiles.length < 5) {
      this.warn(`Only ${testFiles.length} minimal slice test files found (expected ~13)`);
    }
  }

  report() {
    console.log('\n🔍 Vertical Slice Governance Lint Report\n');

    if (this.errors.length > 0) {
      console.log('Errors:');
      this.errors.forEach(e => console.log(`  ${e}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('Warnings:');
      this.warnings.forEach(w => console.log(`  ${w}`));
      console.log('');
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All governance checks passed\n');
      return 0;
    }

    const code = this.errors.length > 0 ? 1 : 0;
    console.log(`Summary: ${this.errors.length} errors, ${this.warnings.length} warnings`);
    return code;
  }
}

async function main() {
  const linter = new VerticalSliceLinter();
  const code = await linter.lint();
  process.exit(code);
}

main();
```

---

## 📋 Integration with package.json

Add governance scripts:

```json
{
  "scripts": {
    "lint:vertical-slice": "node scripts/lint-vertical-slice.js",
    "lint:all": "npm run lint && npm run lint:vertical-slice"
  }
}
```

---

## 🔄 GitHub Actions: Governance Checks

Create `.github/workflows/governance-checks.yml`:

```yaml
name: Governance Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main, develop]

jobs:
  governance:
    name: Vertical Slice Governance
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run governance linter
        run: npm run lint:vertical-slice

      - name: Verify version lock integrity
        run: npm run meta:verify
        continue-on-error: true

      - name: Check PR checklist
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const pr = context.payload.pull_request;
            const body = pr.body || '';
            
            const hasChecklist = body.includes('- [x]');
            if (!hasChecklist && pr.draft === false) {
              console.warn('⚠️ PR checklist items should be checked');
            }

      - name: Validate commit messages
        if: github.event_name == 'push'
        run: npm run test:minimal

      - name: Comment on PR with governance status
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ Governance checks failed. Please review the workflow logs.'
            })
```

---

## 📊 Audit Log Configuration

Create `scripts/audit-log.js` for tracking:

```javascript
/**
 * Audit Log - Track governance events
 */

const fs = require('fs');
const path = require('path');

class AuditLog {
  constructor() {
    this.logPath = path.join(process.cwd(), '.audit-log.json');
    this.logs = this.loadLogs();
  }

  loadLogs() {
    if (fs.existsSync(this.logPath)) {
      return JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
    }
    return [];
  }

  log(event) {
    const entry = {
      timestamp: new Date().toISOString(),
      ...event
    };
    
    this.logs.push(entry);
    this.saveLogs();
    return entry;
  }

  saveLogs() {
    fs.writeFileSync(
      this.logPath,
      JSON.stringify(this.logs, null, 2)
    );
  }

  getLog(filter) {
    return this.logs.filter(entry => {
      for (const key in filter) {
        if (entry[key] !== filter[key]) return false;
      }
      return true;
    });
  }
}

// Usage examples:
// auditLog.log({ action: 'component-modified', component: 'PGCard', author: 'developer-name' })
// auditLog.log({ action: 'version-locked', component: 'PGCard', version: '1.0.0' })
// auditLog.log({ action: 'pr-approved', component: 'ActivityCard', approver: 'tech-lead-2' })

module.exports = AuditLog;
```

---

## 🎯 Phase 4 Implementation Steps

### Step 1: GitHub Setup (Day 1)
- [ ] Enable branch protection on main
- [ ] Create CODEOWNERS file
- [ ] Configure required status checks
- [ ] Set up required reviewers

### Step 2: Create Enforcement Scripts (Day 2)
- [ ] Create lint-vertical-slice.js
- [ ] Create audit-log.js
- [ ] Add scripts to package.json

### Step 3: GitHub Actions Integration (Day 2)
- [ ] Create governance-checks.yml workflow
- [ ] Test on test branch
- [ ] Monitor initial runs

### Step 4: Team Training (Day 3)
- [ ] Train on CODEOWNERS
- [ ] Train on PR checklist
- [ ] Train on governance linting
- [ ] Share audit trail reports

---

## 📈 Expected Governance Enforcements

Once Phase 4 completes:

```
Merge to main requires:
  ✓ Tests pass (GitHub Actions)
  ✓ Semantic version determined
  ✓ Governance linter passes
  ✓ PR checklist completed
  ✓ Code owner approval
  ✓ No conflicts with main
  ✓ Conventional commit message
```

No bad code can reach main branch.

---

## 🚀 Phase 4 Complete When

- [ ] CODEOWNERS file created
- [ ] Branch protection enabled
- [ ] PR template created
- [ ] lint-vertical-slice.js working
- [ ] GitHub Actions governance workflow running
- [ ] Team trained on governance
- [ ] Audit log working
- [ ] Manual PR blocked if checklist incomplete

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| [VERTICAL_SLICE_REFERENCE.md](./context/VERTICAL_SLICE_REFERENCE.md) | Governance rules |
| [IMPLEMENTATION_PLAN_DETAILED.md](./IMPLEMENTATION_PLAN_DETAILED.md) | Full roadmap |
| [PHASE_2_SETUP_GUIDE.md](./PHASE_2_SETUP_GUIDE.md) | Semantic versioning |
| [PHASE_3_SETUP_GUIDE.md](./PHASE_3_SETUP_GUIDE.md) | Version lock files |

---

**Phase 4 Target Completion:** 2026-05-24+  
**Status:** Ready to implement  
**Next Phase:** N/A (Phase 4 is final phase)
