# Phase 2: Conventional Commits & Semantic Versioning Setup Guide

**Phase:** 2 of 4  
**Timeline:** 2026-05-21 to 2026-05-23  
**Status:** In Progress

---

## 🎯 Phase 2 Overview

Phase 2 automates version bumping and changelog generation using conventional commits. Every commit message now maps to a semantic version (MAJOR.MINOR.PATCH).

### Deliverables
- ✅ `.commitlintrc.json` - Commit message validation
- ✅ `.releaserc.json` - Semantic-release configuration
- ✅ `.github/workflows/semantic-release.yml` - Auto-version workflow
- 📝 Team training materials (this guide)

### Key Benefits
- **Automatic Versioning:** Commit message determines version bump
- **Auto-generated Changelog:** Captures all changes automatically
- **GitHub Releases:** Creates release notes and GitHub releases
- **Team Alignment:** Clear commit message standards

---

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
npm install --save-dev \
  @commitlint/cli \
  @commitlint/config-conventional \
  semantic-release \
  @semantic-release/changelog \
  @semantic-release/git \
  @semantic-release/github \
  @semantic-release/commit-analyzer \
  @semantic-release/release-notes-generator
```

### Step 2: Add Git Hook for Commit Linting

```bash
# Create commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'

# Make it executable
chmod +x .husky/commit-msg
```

### Step 3: Add "prepare" Script to package.json

**Already configured** - `prepare` script installs Husky hooks automatically.

Verify in package.json:
```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

### Step 4: Configure commitlint

**Already created:** `.commitlintrc.json`

This file defines:
- Allowed commit types (feat, fix, docs, style, etc.)
- Commit message format requirements
- Interactive prompt rules

---

## 📝 Commit Message Format

### Basic Structure

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Components

**Type:** `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `chore` | `ci` | `revert`

**Scope:** Component being modified (core, spell, village, ui, etc.)

**Subject:** 50 character max, imperative, lowercase, no period

**Body:** (Optional) Explain what and why, not how. Max 100 characters/line.

**Footer:** (Optional) Reference issues: `Fixes #123`, `Closes #456`

### Examples

#### Feature (Bumps MINOR version: 1.0.0 → 1.1.0)
```
feat(core): add property validation to PGCard

Implement validation for all component props using TypeScript.
Prevents runtime errors from invalid prop values.

Fixes #456
```

#### Bug Fix (Bumps PATCH version: 1.0.0 → 1.0.1)
```
fix(spell): correct spell damage calculation

The 20% lifesteal bonus was applied twice due to duplicate
calculation in the mitigation phase.

Fixes #789
```

#### Breaking Change (Bumps MAJOR version: 1.0.0 → 2.0.0)
```
feat!(core): redesign MyComponent API

BREAKING CHANGE: Props structure changed from {x, y} to {position: {x, y}}.
This simplifies the component API and improves consistency.

Migration: See VERTICAL_SLICE_REFERENCE.md#migration-guide
Fixes #123
```

#### Documentation (No version bump)
```
docs: update README with new component sections

Add Vertical Slice architecture overview and quick start guide.
Improve clarity of component hierarchy.
```

#### Chore (No version bump)
```
chore: upgrade dependencies

Update Playwright to v1.40 and Vite to v5.0.
No functionality changes.
```

---

## 🔄 Workflow: Commit to Release

```
Developer commits with conventional message
        ↓
Husky commit-msg hook runs commitlint
        ↓
Message valid? → Commit succeeds ✓
Message invalid? → Commit blocked ✗
        ↓
git push origin main
        ↓
GitHub Actions: semantic-release workflow triggered
        ↓
Analyze commit messages since last release
        ↓
Determine version bump (MAJOR/MINOR/PATCH)
        ↓
Update package.json with new version
        ↓
Generate CHANGELOG.md
        ↓
Commit version bump + changelog
        ↓
Create GitHub Release & Release Notes
        ↓
Publish to NPM (if applicable)
```

---

## 📊 Version Bumping Logic

### Automatic Decision Tree

```
Commit type "feat!"  → MAJOR version
OR
"BREAKING CHANGE" in footer → MAJOR version
        ↓
      else
        ↓
Commit type "feat"   → MINOR version
        ↓
      else
        ↓
Commit type "fix" or "perf" → PATCH version
        ↓
      else
        ↓
(docs, test, chore, ci, style) → No version bump
```

### Examples

| Commits | Old Version | New Version | Reason |
|---------|-------------|-------------|--------|
| `feat(core): add PGCard` | 0.1.0 | 0.2.0 | Feature = MINOR |
| `fix(core): correct prop validation` | 1.0.0 | 1.0.1 | Fix = PATCH |
| `feat!(core): redesign API` | 1.5.0 | 2.0.0 | Breaking = MAJOR |
| `feat(core): add feature`<br/>`fix(core): fix bug` | 1.0.0 | 1.1.0 | Highest is MINOR |
| `feat(core): add feature`<br/>`feat!(core): breaking change` | 1.0.0 | 2.0.0 | Breaking trumps all |
| `docs: update README` | 1.2.3 | 1.2.3 | Docs = no change |

---

## 🚀 Interactive Commit Prompt

When you run `git commit`, commitlint provides an interactive prompt:

```
? Select the type of change that you're committing
  ◯ feat       A new feature
  ◯ fix        A bug fix
  ◯ docs       Documentation only changes
  ◯ style      Changes that do not affect the meaning of the code
  ◯ refactor   A code change that neither fixes a bug nor adds a feature
  ◯ perf       A code change that improves performance
  ◯ test       Adding missing tests or correcting existing tests
  ◯ chore      Changes to build system, dependencies, or tooling
  ◯ ci         Changes to CI/CD configuration files and scripts
  ◯ revert     Reverts a previous commit

? What is the scope of this change?
  ◯ core
  ◯ spell
  ◯ village
  ◯ balancer
  ◯ ui
  ◯ ci
  ◯ docs
  ◯ none

? Write a short, imperative tense description of the change:
> add property validation

? Provide a longer description of the changes:
> Implement TypeScript-based validation for all PGCard props.
> Prevents runtime errors from invalid values.

? Are there any breaking changes?
  ◯ Yes
  ◯ No

? Does this change affect any open issues?
  ◯ Yes
  ◯ No

? Add issue references (e.g. fixes #123):
> fixes #456
```

---

## ✅ Verification Steps

### 1. Test commitlint Locally

```bash
# This should succeed
git commit --allow-empty -m "feat(core): test conventional commit"
# Output: ✓ Commit message valid

# This should fail
git commit --allow-empty -m "wip: broken commit message"
# Output: ✗ Invalid commit message
```

### 2. Test semantic-release Workflow

When you push to main, GitHub Actions should:

```bash
# 1. Analyze commits since last release
# 2. Determine version (1.0.0 → 1.1.0?)
# 3. Update package.json
# 4. Update CHANGELOG.md
# 5. Commit both files
# 6. Create GitHub Release
```

Monitor at: https://github.com/YOUR_ORG/RPG/actions?query=workflow:Semantic-Release

### 3. Verify CHANGELOG Auto-generation

After first release, check:
- `CHANGELOG.md` should have new version entry
- Commits are organized by type (Features, Bug Fixes, etc.)
- Breaking changes are highlighted

Example:

```markdown
## [1.1.0] - 2026-05-21

### 🚀 Features
- add property validation to PGCard

### 🐛 Bug Fixes
- correct spell damage calculation

### 📚 Documentation
- update README with new sections
```

---

## 🔧 Troubleshooting

### Issue: Commit blocked with "subject-empty" error

**Cause:** Commit message is empty or too short

**Fix:**
```bash
# Use interactive prompt
git commit  # Follow prompts

# Or write complete message
git commit -m "feat(core): add new feature"
```

### Issue: "type-enum" error - invalid commit type

**Cause:** Used invalid type like `feature` instead of `feat`

**Valid types:**
- feat, fix, docs, style, refactor, perf, test, chore, ci, revert

**Fix:**
```bash
# Correct type
git commit -m "feat(core): add feature"  # ✓

# Not this
git commit -m "feature(core): add feature"  # ✗
```

### Issue: Husky hook not running on commit

**Fix:**
```bash
# Verify hook exists
ls -la .husky/commit-msg

# Make executable
chmod +x .husky/commit-msg

# Test manually
./.husky/commit-msg $PWD/.git/COMMIT_EDITMSG
```

### Issue: semantic-release workflow fails

**Check:**
1. GitHub token is valid (Settings → Secrets)
2. Dependencies installed: `npm list | grep semantic-release`
3. `.releaserc.json` is valid JSON
4. Branch is `main` or `develop`

---

## 📚 Configuration Files Reference

### .commitlintrc.json
- Defines commit type rules
- Sets message format requirements
- Provides interactive prompt structure

### .releaserc.json
- Configures semantic-release plugins
- Defines version bump rules
- Sets changelog format
- Configures GitHub integration

### .github/workflows/semantic-release.yml
- Triggers on push to main/develop
- Runs test:minimal before release
- Generates release notes
- Creates GitHub Release

---

## 🎓 Team Training Checklist

Before rolling out to team, ensure:

- [ ] All team members understand conventional commits
- [ ] `.commitlintrc.json` is reviewed and approved
- [ ] Test commit succeeds locally
- [ ] Developers know to use interactive prompt (`git commit`)
- [ ] Leadership understands automatic versioning
- [ ] Documentation is available (this guide)
- [ ] Emergency contact for broken releases

---

## 📖 Reference Links

| Document | Purpose |
|----------|---------|
| [VERTICAL_SLICE_REFERENCE.md](./context/VERTICAL_SLICE_REFERENCE.md) | Governance rules |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Daily commands |
| [Conventional Commits Spec](https://www.conventionalcommits.org/) | Standard reference |
| [Semantic Versioning](https://semver.org/) | Version numbering |
| [Semantic Release Docs](https://github.com/semantic-release/semantic-release) | Configuration details |

---

## ✨ Phase 2 Complete When

- [x] `.commitlintrc.json` created & tested
- [x] `.releaserc.json` created & tested
- [x] `.github/workflows/semantic-release.yml` created
- [ ] `commit-msg` hook installed locally
- [ ] Team trained on conventional commits
- [ ] First release created successfully
- [ ] CHANGELOG.md auto-generated
- [ ] GitHub Release created

---

## 🚀 Next Steps

1. **Install dependencies:** `npm install`
2. **Add commit-msg hook:** `npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'`
3. **Test locally:** `git commit --allow-empty -m "feat(test): verify"`
4. **Push to GitHub:** `git push origin main`
5. **Monitor:** Watch GitHub Actions for semantic-release workflow
6. **Share:** Send this guide to team

---

**Phase 2 Target Completion:** 2026-05-23  
**Status:** Implementation in progress  
**Next Phase:** Phase 3 - Version Lock Files & Metadata (2026-05-22)
