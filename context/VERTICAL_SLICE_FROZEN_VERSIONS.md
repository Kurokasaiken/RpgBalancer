# Vertical Slice - Frozen Component Versions

**Last Updated:** 2026-05-20  
**Status:** Phase 1 Complete - Phase 2 In Progress

---

## 📋 Component Version Registry

This document tracks the semantic version of each frozen component in the vertical slice architecture. Each component is independently versioned according to SemVer (MAJOR.MINOR.PATCH).

### Version Status Legend
- 🟢 **stable** - Component released and production-ready
- 🟡 **wip** - Work in progress, breaking changes likely
- 🔴 **deprecated** - Component superseded, migration required
- ⚪ **pre-release** - Beta testing phase

---

## Phase 1-2: Core Gameplay Components

### Component 1: PGCard (Player Grid Card)
```yaml
name: PGCard
version: 1.0.0
status: stable
released: 2026-05-20
phase: 1
test-page: /minimal-pgcard
test-file: tests/e2e/minimal_slice_01_pgcard.spec.ts
repository: src/components/core/PGCard.tsx

api:
  props:
    - id: string (required)
    - character: Character (required)
    - isSelected: boolean
    - onSelect: (id: string) => void
    - isDragging: boolean
  
immutable-contract: ✅ FROZEN
  - All props as defined above
  - No component export changes
  - Visual layout locked

changes-since-release: none
breaking-changes: none
migration-guide: N/A
```

### Component 2: ActivityCard (Activity Display)
```yaml
name: ActivityCard
version: 1.0.0
status: wip
released: null
phase: 1
test-page: /minimal-activity-card
test-file: tests/e2e/minimal_slice_02_activity_card.spec.ts
repository: src/components/core/ActivityCard.tsx

api:
  props:
    - activity: Activity (required)
    - onAction: (type: string) => void
  
immutable-contract: 🔄 IN DEVELOPMENT
  - Props may change during Phase 1
  - Visual layout stabilizing
  - Breaking changes expected

changes-since-release: N/A
breaking-changes: Expected during Phase 1
migration-guide: TBD
```

### Component 3: TheaterView (Stage Display)
```yaml
name: TheaterView
version: 0.1.0
status: wip
released: null
phase: 1
test-page: /minimal-theater-view
test-file: tests/e2e/minimal_slice_03_theater_view.spec.ts
repository: src/components/core/TheaterView.tsx

api:
  props:
    - scene: Scene (required)
    - characters: Character[]
  
immutable-contract: 🔴 UNSTABLE
  - Early prototype phase
  - Major changes expected
  - Not recommended for external use

changes-since-release: N/A
breaking-changes: Very likely
migration-guide: Contact team
```

### Component 4: ActiveHUD (Active Activity HUD)
```yaml
name: ActiveHUD
version: 0.1.0
status: wip
released: null
phase: 2
test-page: /minimal-active-hud
test-file: tests/e2e/minimal_slice_04_active_hud.spec.ts
repository: src/components/core/ActiveHUD.tsx

api:
  props:
    - activity: Activity (required)
    - duration: number
    - onComplete: () => void
  
immutable-contract: 🔴 UNSTABLE
  - Early prototype phase
  - Layout and props under development
  - Expected breaking changes

changes-since-release: N/A
breaking-changes: Expected
migration-guide: TBD
```

### Component 5: ActivitySlot (Skill Slot Container)
```yaml
name: ActivitySlot
version: 0.1.0
status: wip
released: null
phase: 2
test-page: /minimal-activity-slot
test-file: tests/e2e/minimal_slice_05_activity_slot.spec.ts
repository: src/components/core/ActivitySlot.tsx

api:
  props:
    - skill: Skill (required)
    - isActive: boolean
    - onActivate: () => void
  
immutable-contract: 🔴 UNSTABLE
  - Under development
  - Likely to change
  - Not stabilized

changes-since-release: N/A
breaking-changes: Very likely
migration-guide: Contact team
```

---

## Phase 3: Advanced Mechanics Components

### Component 6-10: [Planned for Phase 3]

```yaml
name: TBD
version: 0.1.0
status: planned
released: null
phase: 3
note: Components 6-10 planned for Phase 3 (Week 2)
```

---

## Phase 4-6: Complex Systems Components

### Component 11-13: [Planned for Phase 4-6]

```yaml
name: TBD
version: 0.1.0
status: planned
released: null
phase: 4-6
note: Components 11-13 planned for Phase 4-6 (Week 3+)
```

---

## 🔐 Immutable Contract Details

### PGCard v1.0.0 Contract (FROZEN ✅)

**Props Interface (LOCKED):**
```typescript
interface PGCardProps {
  id: string;
  character: Character;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  isDragging?: boolean;
}
```

**What Cannot Change (Immutable):**
- ✅ Prop names must remain unchanged
- ✅ Required props must remain required
- ✅ Prop types must remain compatible
- ✅ Export must be named export `PGCard`
- ✅ Component display must match v1.0.0 design

**What Can Change (Non-breaking):**
- ✅ Internal implementation
- ✅ New optional props (if non-breaking)
- ✅ New CSS classes (if hidden)
- ✅ Performance optimizations
- ✅ Bug fixes that don't change behavior

**What Requires New Version:**
- 🔴 Removing a prop
- 🔴 Renaming a prop
- 🔴 Changing prop type
- 🔴 Changing component export name
- 🔴 Major visual changes

---

## 📊 Version Lifecycle

```
Phase 1-2: Core Components (Development)
├─ PGCard v1.0.0 ✅ FROZEN (stable)
├─ ActivityCard v1.0.0 🟡 (wip → stable)
├─ TheaterView v0.1.0 🔴 (unstable → v1.0.0)
├─ ActiveHUD v0.1.0 🔴 (unstable → v1.0.0)
└─ ActivitySlot v0.1.0 🔴 (unstable → v1.0.0)

Phase 3: Advanced (Planned)
├─ Component 6 v0.1.0 (development)
├─ Component 7 v0.1.0 (development)
└─ Component 8-10 TBD (planning)

Phase 4-6: Complex (Planned)
├─ Component 11 v0.1.0 (planning)
├─ Component 12 v0.1.0 (planning)
└─ Component 13 v0.1.0 (planning)
```

---

## 🔄 Release History

### PGCard
| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-05-20 | Initial release | ✅ Stable |

### Other Components
| Component | Current | Expected v1.0.0 | Status |
|-----------|---------|-----------------|--------|
| ActivityCard | 1.0.0 | 2026-05-22 | 🟡 WIP |
| TheaterView | 0.1.0 | 2026-05-23 | 🔴 Unstable |
| ActiveHUD | 0.1.0 | 2026-05-24 | 🔴 Unstable |
| ActivitySlot | 0.1.0 | 2026-05-25 | 🔴 Unstable |

---

## 📈 Promotion Path: 0.1.0 → 1.0.0

Components follow this path from unstable to stable:

```
Phase Development (v0.1.0 - v0.x.x)
└─ Multiple breaking changes expected
└─ Not recommended for external use
└─ Frequent updates

FREEZE POINT
└─ Component API stabilizes
└─ All tests pass
└─ Contract locked

v1.0.0 Release (Stable)
└─ Immutable contract begins
└─ Non-breaking changes only
└─ Backwards compatible forever
└─ Safe for external use

Future: v1.1.0, v1.2.0... (PATCH/MINOR)
└─ Non-breaking changes only
└─ Full backwards compatibility

MAJOR Breaking Change (v2.0.0)
└─ Only when necessary
└─ Migration guide required
└─ Previous version remains available
```

---

## 🎯 Phase 2 Goals (2026-05-21 to 2026-05-23)

By end of Phase 2:

- [ ] ActivityCard stabilized to v1.0.0
- [ ] TheaterView stabilized to v1.0.0
- [ ] ActiveHUD stabilized to v1.0.0
- [ ] ActivitySlot stabilized to v1.0.0
- [ ] All immutable contracts documented
- [ ] Component versions auto-generated in CI/CD
- [ ] Release notes auto-generated from commits

---

## 🔍 Verification Commands

### Check Component Version

```bash
# Manual check
grep -A 2 "^version:" context/VERTICAL_SLICE_FROZEN_VERSIONS.md | grep "ActivityCard" -A 2

# Or use npm script (Phase 3)
npm run check-component-version ActivityCard
```

### View Component API

```bash
# Extract props interface
grep -A 10 "interface.*Props" src/components/core/ActivityCard.tsx
```

### Track Changes Since Release

```bash
# See all commits affecting component since v1.0.0
git log --oneline v1.0.0.. -- src/components/core/ActivityCard.tsx
```

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| [VERTICAL_SLICE_REFERENCE.md](./VERTICAL_SLICE_REFERENCE.md) | Governance rules |
| [IMPLEMENTATION_PLAN_DETAILED.md](./IMPLEMENTATION_PLAN_DETAILED.md) | Full roadmap |
| [PHASE_2_SETUP_GUIDE.md](../PHASE_2_SETUP_GUIDE.md) | Semantic versioning setup |
| [CHANGELOG.md](../CHANGELOG.md) | Auto-generated changelog |

---

## 🚀 Next Steps

1. **Phase 2:** Stabilize remaining components to v1.0.0
2. **Phase 3:** Auto-generate versions from git tags
3. **Phase 4:** Enforce version rules via CI/CD

---

**Status:** Phase 1 Complete ✅  
**Last Updated:** 2026-05-20 14:40 UTC  
**Next Review:** 2026-05-23 (Phase 2 completion)
