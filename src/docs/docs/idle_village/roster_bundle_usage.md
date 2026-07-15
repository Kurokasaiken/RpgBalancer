# Roster Bundle Usage Guide

**Bundle Location**: `src/ui/idleVillage/roster/index.ts`
**Status**: Active - Shared roster surface for all Idle Village pages
**Last Updated**: 2026-07-15
**Adoption**: MinimalGameplayPage (RT-MG-ROSTER-ADOPT-007)

## Overview

The shared roster bundle provides canonical roster components for all Idle Village surfaces. Import from this module whenever you need resident list/roster UI functionality.

## Bundle Exports

```typescript
// Primary roster surface
export { default as VillageRosterSection } from '@/ui/idleVillage/components/VillageRosterSection';
export type { VillageRosterSectionProps } from '@/ui/idleVillage/components/VillageRosterSection';

// Roster panel component
export { ResidentRosterPanel } from '@/ui/idleVillage/components/ResidentRosterPanel';
export type { ResidentRosterPanelProps } from '@/ui/idleVillage/components/ResidentRosterPanel';

// Slot rack integration
export { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
export type { ResidentSlotRackProps } from '@/ui/idleVillage/components/ResidentSlotRack';

// Wanderlust-themed roster card
export { default as WanderlustRosterCard } from '@/ui/idleVillage/components/WanderlustRosterCard';
export type { WanderlustRosterCardProps } from '@/ui/idleVillage/components/WanderlustRosterCard';

// Materic roster component
export { MatericRosterComponent } from '@/ui/idleVillage/components/MatericRosterComponent';
export type { MatericRosterComponentProps } from '@/ui/idleVillage/components/MatericRosterComponent';
```

## Usage Patterns

### Import Pattern

```typescript
// Import specific components you need
import { VillageRosterSection, ResidentRosterPanel } from '@/ui/idleVillage/roster';
import type { VillageRosterSectionProps } from '@/ui/idleVillage/roster';

// Or import all if needed
import * as Roster from '@/ui/idleVillage/roster';
```

### Basic Usage

```typescript
import { VillageRosterSection } from '@/ui/idleVillage/roster';

function MyPage() {
  return (
    <VillageRosterSection
      componentId="roster-component"
      residents={residents}
      onResidentSelect={handleResidentSelect}
    />
  );
}
```

### With Slot Rack Integration

```typescript
import { VillageRosterSection, ResidentSlotRack } from '@/ui/idleVillage/roster';

function RosterSlotIntegration() {
  return (
    <>
      <VillageRosterSection
        componentId="roster-component"
        residents={residents}
        onResidentSelect={handleResidentSelect}
      />
      <ResidentSlotRack
        slots={slots}
        onDrop={handleDrop}
        onExtract={handleExtract}
      />
    </>
  );
}
```

## Trusted Documentation

For detailed component contracts, behavior specifications, and integration patterns, refer to:

- **Roster/Drag Contract**: `src/docs/docs/idle_village/trusted/roster_drag_trusted.md`
- **Roster Components**: `src/docs/docs/idle_village/roster_trusted_components.md`
- **Character-to-Resident**: `src/docs/docs/idle_village/trusted/character_resident_trusted.md`

## Integration Guidelines

1. **Always import from bundle**: Use `@/ui/idleVillage/roster` for all roster components
2. **No page-specific implementations**: Do not create duplicate roster logic in pages
3. **Follow trusted contracts**: Refer to trusted docs for behavior specifications
4. **Use canonical data flow**: Follow Character-to-Resident architecture for data
5. **Respect skin system**: Components support dynamic skin binding via SkinBindingRegistry

## Component Master Index

The roster bundle is registered in `COMPONENT_MASTER_INDEX.md` under:
- **Roster/Drag Contract**: `roster-drag` (trusted)
- **Shared Bundle**: `src/ui/idleVillage/roster/index.ts`

## Runtime Verification

Bundle behavior is verified through:
- **Test Harness**: `/test` route (TestRosterPage)
- **Integration Tests**: Playwright/RTL suites in `tests/unit/idleVillage/`
- **Contract Compliance**: Verified against `roster_drag_trusted.md`

## Skin Binding

All roster components support dynamic skin binding:
- PgCard: Certified for skin binding
- VillageRosterSection: Certified for skin binding
- ResidentSlotRack: Certified for skin binding

See `docs/SKIN_BINDING_REGISTRY_GUIDE.md` for integration patterns.

## Migration Notes

If you have page-specific roster implementations:
1. Import from `@/ui/idleVillage/roster` instead
2. Remove duplicate roster logic
3. Follow trusted contract patterns
4. Verify behavior matches trusted documentation

---

*Last Updated: 2026-07-15*
*Status: Active - Shared bundle for all Idle Village roster surfaces*
