## 📝 Description

Describe the changes and why they were made.

---

## 🏷️ Type of Change

- [ ] **feat**: New feature
- [ ] **fix**: Bug fix
- [ ] **docs**: Documentation only
- [ ] **refactor**: Code refactoring
- [ ] **test**: Adding/updating tests
- [ ] **perf**: Performance improvement
- [ ] **chore**: Build system, dependencies
- [ ] **ci**: CI/CD changes

---

## 🎯 Components Affected

- [ ] PGCard
- [ ] ActivityCard
- [ ] TheaterView
- [ ] ActiveHUD
- [ ] ActivitySlot
- [ ] Other: ___________

---

## ✅ Vertical Slice Governance Checklist

### Code Quality
- [ ] Tests added/updated for all changes
- [ ] All minimal slice tests pass locally (`npm run test:minimal`)
- [ ] No regressions detected
- [ ] Accessibility checks completed
- [ ] Code follows project style guidelines

### Version & Contract
- [ ] Version number updated if needed (follows SemVer)
- [ ] Component contract honored (no breaking changes unless MAJOR bump)
- [ ] Breaking changes documented with migration guide
- [ ] VERTICAL_SLICE_REFERENCE.md updated (if applicable)
- [ ] VERTICAL_SLICE_FROZEN_VERSIONS.md updated

### Documentation
- [ ] CHANGELOG.md entry added (if applicable)
- [ ] Component README updated (if applicable)
- [ ] Code comments added for complex logic
- [ ] Commit message follows conventional commits format

### Governance
- [ ] PR title uses conventional commits format: `type(scope): description`
- [ ] All required status checks pass
- [ ] No conflicts with main branch
- [ ] Ready for code owner review
- [ ] Audit log will be updated

---

## 🧪 Testing

**Test Results:**
- [ ] Local tests pass: `npm run test:minimal`
- [ ] HTML report reviewed: `npm run test:minimal:report`
- [ ] No console errors or warnings
- [ ] Tested on multiple browsers (if applicable)
- [ ] Edge cases covered

**Test Coverage:**
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Accessibility checks completed
- [ ] Visual regression checked

---

## 🔗 Related Issues

Closes #_____ (issue number)
Relates to #_____ (related issue)

---

## 📸 Screenshots (if applicable)

Add screenshots of visual changes here.

---

## 🚀 Deployment Notes

- [ ] This PR can be deployed immediately
- [ ] This PR requires coordination with other PRs
- [ ] This PR requires database migration
- [ ] This PR requires configuration change

---

**⚠️ Important:** This PR will trigger automatic checks:
- GitHub Actions test runs
- Semantic version determination
- CHANGELOG generation (if release)
- Code owner notifications
- Governance linting
- Version integrity verification
