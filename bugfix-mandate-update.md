# Bugfix Mandate Update - Allow Rapid Fixes

## Problem Statement
The current agent-execution-mandate requires full workflow (lock check, planning, Kanban registration) for ALL changes to `src/ui/idleVillage/**` files, including critical bugfixes. This slows down rapid debugging and fixes.

## Proposed Solution
Create a "Bugfix Exception" path that allows rapid fixes while maintaining quality gates.

## Changes Required

### 1. Update agent-execution-mandate skill
Add section for bugfix exceptions:

```markdown
## Bugfix Exception Path

For critical bugfixes in `src/ui/idleVillage/**`:

**Conditions:**
- Issue is blocking development or testing
- Fix is minimal and targeted (single file, < 50 lines)
- No architectural changes or new features

**Allowed Workflow:**
- Skip lock check and planning phases
- Direct implementation with minimal safeguards
- Post-fix documentation within 24 hours

**Required Safeguards:**
- `npm run lint -- <target file>`
- `npm run build:check`
- Run relevant affected tests
- Document fix in `test-results/bugfix-<date>-<issue>.log`

**Post-Fix Requirements:**
- Update relevant documentation within 24 hours
- Register fix in Kanban as "Bugfix - Rapid"
- Add regression test if appropriate
```

### 2. Update coordinator-mandate skill
Add bugfix approval process:

```markdown
## Bugfix Coordination

Coordinator can approve rapid bugfix path by:
- Confirming issue is blocking
- Verifying fix scope is minimal
- Authorizing bugfix exception in chat
- Requiring post-fix documentation

## Bugfix Registration

After rapid fix:
- Register in Kanban with "Bugfix - Rapid" status
- Link to issue description and fix log
- Schedule regression test addition
```

### 3. Update strategy-tasks.md
Add bugfix strategy task:

```markdown
## BF-001: Bugfix Exception Framework
Enable rapid fixes for critical issues while maintaining quality gates.

### KPIs
- Bugfix resolution time: < 30 minutes for approved issues
- Documentation compliance: 100% within 24 hours
- Regression coverage: 90% for critical fixes
```

## Implementation Plan

### Phase 1: Update Skills
1. Modify agent-execution-mandate skill
2. Update coordinator-mandate skill  
3. Add strategy task BF-001

### Phase 2: Documentation
1. Update PROJECT_PHILOSOPHY.md with bugfix principles
2. Create bugfix workflow documentation
3. Update Kanban guidelines

### Phase 3: Testing
1. Test bugfix workflow with sample issue
2. Verify documentation compliance
3. Validate quality gates

## Quality Assurance

**Maintained Standards:**
- All code still passes lint and build checks
- Critical fixes still get proper testing
- Documentation remains comprehensive
- Kanban tracking continues

**Streamlined Process:**
- Skip planning for obvious fixes
- Direct implementation for blocking issues
- Post-fix documentation instead of pre-fix planning
- Rapid turnaround while maintaining quality

## Approval

As project owner, approve this update to enable:
- Faster debugging cycles
- Quick resolution of blocking issues  
- Maintained code quality through post-fix validation
- Proper documentation and tracking

## Next Steps

1. Implement skill updates
2. Test with current Time Engine issue
3. Validate workflow effectiveness
4. Refine based on usage patterns
