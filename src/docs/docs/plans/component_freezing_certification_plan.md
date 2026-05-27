# Component Freezing & Certification Plan

**Status:** Draft
**Created:** 2026-05-21
**Objective:** Extract, freeze, test, document, and certify components from /test for use in minimal-* pages

---

## Executive Summary

This plan creates a centralized "Component Kit" system that extracts frozen components from the /test implementation, making them reusable across minimal-* pages without code duplication or inline logic.

---

## Phase 1: Analysis & Architecture (1 day)

### 1.1 Component Inventory
Identify all real components used in TestRosterPage.tsx:

**Core Components:**
- `VillageRosterSection` - Roster display with sorting/filtering
- `ResidentSlotRack` / `ResidentSlotRackSkin` - Slot display system
- `CustomDragOverlay` - Drag visual feedback
- `DragContext` / `DragProvider` - Drag state management
- `ActivityCapsule` - Activity card display
- `ClockWidget` - Time display
- `TimeEngineStrip` - Time progression display
- `ActiveHUD` - Active activity HUD

**Supporting Components:**
- `SlotRackWithSkin` - Skin-aware slot rack
- `PoiDetailSkinWrapper` - POI detail skin system
- `CertifiedWorkerPickerSheet` - Worker selection UI

### 1.2 Architecture Design

**Directory Structure:**
```
src/ui/idleVillage/frozen/
├── kits/
│   ├── rosterKit.tsx          # Complete roster component kit
│   ├── slotRackKit.tsx        # Complete slot rack component kit
│   ├── dragKit.tsx            # Complete drag system kit
│   ├── activityKit.tsx        # Complete activity component kit
│   └── timeKit.tsx            # Complete time display kit
├── mockData/
│   ├── residents.ts           # Centralized mock residents
│   ├── activities.ts          # Centralized mock activities
│   └── scenarios.ts           # Centralized test scenarios
└── index.ts                   # Export all kits
```

**Component Kit Pattern:**
Each kit is a self-contained module that exports:
1. The frozen component
2. Required mock data
3. Configuration presets
4. Usage documentation
5. Version metadata

---

## Phase 2: Component Extraction (2 days)

### 2.1 Extract Roster Kit
**Source:** TestRosterPage.tsx lines 21-22, 80-82

**Tasks:**
- Extract `VillageRosterSection` usage pattern
- Create `rosterKit.tsx` with:
  - Export: `FrozenRosterSection` (frozen component)
  - Export: `mockResidents` (centralized mock data)
  - Export: `rosterConfig` (configuration preset)
  - Version: `v1.0.0`
  - Git commit: Freeze reference

**Output:** `src/ui/idleVillage/frozen/kits/rosterKit.tsx`

### 2.2 Extract Slot Rack Kit
**Source:** TestRosterPage.tsx lines 29-34

**Tasks:**
- Extract `ResidentSlotRack` usage pattern
- Create `slotRackKit.tsx` with:
  - Export: `FrozenSlotRack` (frozen component)
  - Export: `mockSlots` (centralized mock data)
  - Export: `slotRackConfig` (configuration preset)
  - Version: `v1.0.0`
  - Git commit: Freeze reference

**Output:** `src/ui/idleVillage/frozen/kits/slotRackKit.tsx`

### 2.3 Extract Drag Kit
**Source:** TestRosterPage.tsx lines 65-82

**Tasks:**
- Extract drag system components
- Create `dragKit.tsx` with:
  - Export: `FrozenDragSystem` (complete drag setup)
  - Export: `dragConfig` (configuration preset)
  - Version: `v1.0.0`
  - Git commit: Freeze reference

**Output:** `src/ui/idleVillage/frozen/kits/dragKit.tsx`

### 2.4 Extract Activity Kit
**Source:** TestRosterPage.tsx line 54

**Tasks:**
- Extract `ActivityCapsule` usage pattern
- Create `activityKit.tsx` with:
  - Export: `FrozenActivityCapsule` (frozen component)
  - Export: `mockActivities` (centralized mock data)
  - Version: `v1.0.0`
  - Git commit: Freeze reference

**Output:** `src/ui/idleVillage/frozen/kits/activityKit.tsx`

### 2.5 Extract Time Kit
**Source:** TestRosterPage.tsx lines 48-49

**Tasks:**
- Extract time display components
- Create `timeKit.tsx` with:
  - Export: `FrozenTimeDisplay` (frozen component)
  - Export: `timeConfig` (configuration preset)
  - Version: `v1.0.0`
  - Git commit: Freeze reference

**Output:** `src/ui/idleVillage/frozen/kits/timeKit.tsx`

---

## Phase 3: Freezing & Versioning (1 day)

### 3.1 Git Freeze Strategy
For each component kit:

1. **Create freeze branch:**
   ```bash
   git checkout -b freeze/roster-kit-v1.0.0
   ```

2. **Commit frozen version:**
   ```bash
   git add src/ui/idleVillage/frozen/kits/rosterKit.tsx
   git commit -m "freeze: RosterKit v1.0.0 frozen from TestRosterPage.tsx

   Source: TestRosterPage.tsx (commit: <current-sha>)
   Components: VillageRosterSection, useCanonicalRosterBundle
   Version: 1.0.0
   Status: frozen
   "
   ```

3. **Tag frozen version:**
   ```bash
   git tag -a frozen/roster-kit-v1.0.0 -m "RosterKit v1.0.0 frozen"
   ```

4. **Create freeze reference file:**
   ```typescript
   // src/ui/idleVillage/frozen/kits/rosterKit.freeze.ts
   export const FREEZE_REFERENCE = {
     version: '1.0.0',
     gitCommit: '<commit-sha>',
     gitTag: 'frozen/roster-kit-v1.0.0',
     sourceFile: 'src/ui/idleVillage/TestRosterPage.tsx',
     frozenAt: '2026-05-21',
     certified: false,
   };
   ```

### 3.2 Semantic Versioning
Follow SemVer (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes (API, behavior, props)
- **MINOR**: Backward-compatible additions
- **PATCH**: Bug fixes only

**Version Policy:**
- Initial freeze: `v1.0.0`
- Bug fixes: `v1.0.1`, `v1.0.2`, etc.
- New features: `v1.1.0`, `v1.2.0`, etc.
- Breaking changes: `v2.0.0`, `v3.0.0`, etc.

---

## Phase 4: Testing (2 days)

### 4.1 Unit Tests
For each component kit:

```typescript
// src/ui/idleVillage/frozen/kits/__tests__/rosterKit.test.tsx
import { FrozenRosterSection, mockResidents } from '../rosterKit';

describe('RosterKit v1.0.0', () => {
  test('renders with mock data', () => {
    // Test component renders correctly
  });

  test('frozen behavior preserved', () => {
    // Test behavior matches TestRosterPage.tsx
  });

  test('API contract stable', () => {
    // Test props interface unchanged
  });
});
```

### 4.2 Snapshot Tests
For each component kit:

```typescript
// src/ui/idleVillage/frozen/kits/__tests__/rosterKit.snapshot.test.tsx
import { FrozenRosterSection, mockResidents } from '../rosterKit';

test('RosterKit snapshot matches frozen version', () => {
  const tree = renderer.create(<FrozenRosterSection residents={mockResidents} />).toJSON();
  expect(tree).toMatchSnapshot();
});
```

### 4.3 Integration Tests
Test component kits together:

```typescript
// src/ui/idleVillage/frozen/__tests__/integration.test.tsx
import { FrozenRosterSection } from './kits/rosterKit';
import { FrozenSlotRack } from './kits/slotRackKit';

describe('Frozen Component Integration', () => {
  test('Roster + SlotRack drag works', () => {
    // Test drag-and-drop between frozen components
  });
});
```

### 4.4 Regression Tests
Create regression tests for each phase:

```typescript
// tests/e2e/minimal_slice_regression.spec.ts
test('Phase 1 (PgToken) uses frozen RosterKit', async ({ page }) => {
  await page.goto('/minimal-pgcard');
  // Verify frozen component is used
});
```

---

## Phase 5: Documentation (1 day)

### 5.1 Component Kit Documentation
For each kit, create:

```markdown
# RosterKit v1.0.0 - Frozen Component

## Overview
Frozen roster component extracted from TestRosterPage.tsx

## Version
- **Version:** 1.0.0
- **Frozen At:** 2026-05-21
- **Git Commit:** <commit-sha>
- **Git Tag:** frozen/roster-kit-v1.0.0
- **Source:** TestRosterPage.tsx (lines 21-22, 80-82)

## Components
- `VillageRosterSection` - Main roster display
- `useCanonicalRosterBundle` - Roster state management

## Usage
```typescript
import { FrozenRosterSection, mockResidents } from '@/ui/idleVillage/frozen/kits/rosterKit';

<FrozenRosterSection residents={mockResidents} />
```

## API Contract
- Props: `{ residents: ResidentState[] }`
- Behavior: Sorting, filtering, drag handles
- Frozen: No modifications allowed without version bump

## Certification
- **Status:** Pending
- **Tests:** Unit, snapshot, integration
- **Evidence:** test-results/roster-kit-v1.0.0-2026-05-21.log
```

### 5.2 Central Documentation
Create `src/docs/docs/idle_village/frozen_components.md`:

```markdown
# Frozen Components Registry

## Component Kits
- [RosterKit v1.0.0](./frozen/kits/rosterKit.md)
- [SlotRackKit v1.0.0](./frozen/kits/slotRackKit.md)
- [DragKit v1.0.0](./frozen/kits/dragKit.md)
- [ActivityKit v1.0.0](./frozen/kits/activityKit.md)
- [TimeKit v1.0.0](./frozen/kits/timeKit.md)

## Usage Policy
All minimal-* pages MUST use frozen component kits.
No inline code or modifications allowed.
```

---

## Phase 6: Certification (1 day)

### 6.1 Certification Checklist
For each component kit:

- [ ] Unit tests pass (Vitest)
- [ ] Snapshot tests pass (Vitest)
- [ ] Integration tests pass (Vitest)
- [ ] E2E tests pass (Playwright)
- [ ] Documentation complete
- [ ] Freeze reference created
- [ ] Git tag created
- [ ] Version metadata accurate

### 6.2 Certification Evidence
Create evidence log:

```bash
# Run certification
npm run test:frozen --rosterKit
npm run test:e2e --minimal-pgcard

# Generate evidence
npm run evidence:generate --rosterKit-v1.0.0
```

**Output:** `test-results/roster-kit-v1.0.0-certification-2026-05-21.log`

### 6.3 Certification Badge
Add to component kit:

```typescript
export const CERTIFICATION_STATUS = {
  version: '1.0.0',
  certified: true,
  certifiedAt: '2026-05-21',
  evidence: 'test-results/roster-kit-v1.0.0-certification-2026-05-21.log',
};
```

---

## Phase 7: Minimal Page Recreation (2 days)

### 7.1 Delete Existing Pages
Delete all existing minimal-* pages:

```bash
rm src/pages/minimal-pgcard.tsx
rm src/pages/minimal-roster.tsx
rm src/pages/minimal-slotRack.tsx
rm src/pages/minimal-drag.tsx
rm src/pages/minimal-activity.tsx
rm src/pages/minimal-hud.tsx
```

### 7.2 Create New Pages Using Frozen Kits
For each phase:

**Phase 1 (PgToken):**
```typescript
// src/pages/minimal-pgcard.tsx
import React from 'react';
import { FrozenRosterSection, mockResidents } from '@/ui/idleVillage/frozen/kits/rosterKit';

/**
 * MinimalPgCardPage
 * 
 * Uses frozen RosterKit v1.0.0
 * No inline code, no modifications allowed
 */
export default function MinimalPgCardPage() {
  return <FrozenRosterSection residents={mockResidents} />;
}
```

**Phase 2 (Roster):**
```typescript
// src/pages/minimal-roster.tsx
import React from 'react';
import { FrozenRosterSection, mockResidents } from '@/ui/idleVillage/frozen/kits/rosterKit';

export default function MinimalRosterPage() {
  return <FrozenRosterSection residents={mockResidents} />;
}
```

**Phase 3 (SlotRack):**
```typescript
// src/pages/minimal-slotRack.tsx
import React from 'react';
import { FrozenSlotRack, mockSlots } from '@/ui/idleVillage/frozen/kits/slotRackKit';

export default function MinimalSlotRackPage() {
  return <FrozenSlotRack slots={mockSlots} />;
}
```

**Phase 4 (Drag):**
```typescript
// src/pages/minimal-drag.tsx
import React from 'react';
import { FrozenDragSystem } from '@/ui/idleVillage/frozen/kits/dragKit';
import { FrozenRosterSection, mockResidents } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { FrozenSlotRack, mockSlots } from '@/ui/idleVillage/frozen/kits/slotRackKit';

export default function MinimalDragPage() {
  return (
    <FrozenDragSystem>
      <FrozenRosterSection residents={mockResidents} />
      <FrozenSlotRack slots={mockSlots} />
    </FrozenDragSystem>
  );
}
```

**Phase 5 (Activity):**
```typescript
// src/pages/minimal-activity.tsx
import React from 'react';
import { FrozenActivityCapsule, mockActivities } from '@/ui/idleVillage/frozen/kits/activityKit';
import { FrozenTimeDisplay } from '@/ui/idleVillage/frozen/kits/timeKit';

export default function MinimalActivityPage() {
  return (
    <>
      <FrozenActivityCapsule activities={mockActivities} />
      <FrozenTimeDisplay />
    </>
  );
}
```

**Phase 6 (HUD):**
```typescript
// src/pages/minimal-hud.tsx
import React from 'react';
import { FrozenTimeDisplay } from '@/ui/idleVillage/frozen/kits/timeKit';

export default function MinimalHUDPage() {
  return <FrozenTimeDisplay />;
}
```

### 7.3 Update App.tsx
Update routing to use new pages (no changes needed if routes are the same).

---

## Phase 8: Verification (1 day)

### 8.1 Build Verification
```bash
npm run build
```

### 8.2 Test Verification
```bash
npm run test:frozen
npm run test:e2e
```

### 8.3 Visual Verification
```bash
npm run test:e2e:visual
```

### 8.4 Documentation Verification
- All component kits have documentation
- All minimal pages have JSDoc
- Freeze references are accurate
- Version metadata is correct

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Analysis & Architecture | 1 day | None |
| Phase 2: Component Extraction | 2 days | Phase 1 |
| Phase 3: Freezing & Versioning | 1 day | Phase 2 |
| Phase 4: Testing | 2 days | Phase 3 |
| Phase 5: Documentation | 1 day | Phase 3 |
| Phase 6: Certification | 1 day | Phase 4, 5 |
| Phase 7: Minimal Page Recreation | 2 days | Phase 6 |
| Phase 8: Verification | 1 day | Phase 7 |

**Total Duration:** 11 days

---

## Success Criteria

- [ ] All component kits extracted and frozen
- [ ] All component kits have git tags
- [ ] All component kits have unit tests
- [ ] All component kits have snapshot tests
- [ ] All component kits have integration tests
- [ ] All component kits have documentation
- [ ] All component kits are certified
- [ ] All minimal-* pages use frozen kits
- [ ] All minimal-* pages have no inline code
- [ ] All tests pass (unit, snapshot, integration, E2E)
- [ ] Build succeeds
- [ ] Visual regression tests pass

---

## Risks & Mitigations

### Risk 1: TestRosterPage.tsx changes during extraction
**Mitigation:** Create freeze branch immediately, lock TestRosterPage.tsx during extraction

### Risk 2: Component kits too complex
**Mitigation:** Start with simple kits, iterate on complexity

### Risk 3: Mock data not sufficient for all phases
**Mitigation:** Create comprehensive mock data library with multiple scenarios

### Risk 4: Version conflicts
**Mitigation:** Use strict SemVer, document breaking changes clearly

### Risk 5: Certification fails
**Mitigation:** Fix issues before certification, create evidence logs

---

## Rollback Plan

If certification fails or issues arise:

1. **Revert frozen kits:**
   ```bash
   git checkout main
   git branch -D freeze/roster-kit-v1.0.0
   git tag -d frozen/roster-kit-v1.0.0
   ```

2. **Restore old minimal pages:**
   ```bash
   git checkout HEAD~1 -- src/pages/minimal-*.tsx
   ```

3. **Document rollback:**
   Create rollback log in `test-results/rollback-<date>.log`

---

## Next Steps

1. **Execute Phase 1:** Analysis & Architecture
2. **Create freeze branch:** `git checkout -b freeze/component-kits-v1.0.0`
3. **Begin extraction:** Start with RosterKit
4. **Iterate:** Complete all phases sequentially
5. **Certify:** Ensure all success criteria met
6. **Deploy:** Merge to main after verification

---

**Last Updated:** 2026-05-21
**Status:** Draft - Pending Review
**Owner:** Cascade
