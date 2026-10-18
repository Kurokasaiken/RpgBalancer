# slotRackKit

**Status:** frozen
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-10-18

## Source
- Canonical component: `ResidentSlotRack` (`src/ui/idleVillage/components/ResidentSlotRack.tsx`)
- Canonical skin: `ResidentSlotRackSkin` (`src/ui/idleVillage/components/ResidentSlotRackSkin.tsx`)
- Reference route: `/test` → `TestRosterPage` → `ResidentSlotRackSkin`
- Minimal route: `/minimal-slot-rack`
- Provider chain (canonical): `SkinSystemProvider → SandboxTimingProvider → DragProvider → DndContext` via `SlotRackKitShell`

## Public API

```tsx
import {
  ResidentSlotRack,
  ResidentSlotRackSkin,
  useSlotRackKitData,
  SlotRackKitShell,
  SLOT_LAB_CONFIG,
} from '@/ui/idleVillage/frozen/kits/slotRackKit';
import { PgCard } from '@/ui/idleVillage/frozen/kits/pgcardKit';

function MinimalSlotRack() {
  const { slots } = useSlotRackKitData();
  return (
    <SlotRackKitShell>
      <ResidentSlotRack slots={slots} />
    </SlotRackKitShell>
  );
}
```

## Contract
The frozen TypeScript contract lives in `slotRackKit.contract.ts`. The subtree selector used by the contract test is `[data-testid="resident-slot-rack-root"]`.

Any change to the props the page passes — or to the canonical component's rendered DOM under that selector — invalidates the certification and requires:
1. A version bump in `slotRackKit.contract.ts`.
2. A new `slotRackKit.cert.json` produced by the cert pipeline.
3. A new git tag `frozen/slotRackKit-v<version>`.

## Drag feedback (2026-10-18)

Compatibility state and active-target animation are distinct. Empty seats may
show their static valid/invalid affordance during a drag, but they do not use
the breathing bloom while empty. A valid breathing bloom is reserved for an
occupied seat that is the active valid slot-swap target. The `/game` quest
planner measures flight geometry from the actual `slot-button-<slotId>`
wrapper; the rack cell (which also contains the caption/footer) is not a
flight target.

## Fixture
Fixture sources are re-exports of the canonical config files:
- `SLOT_LAB_CONFIG` (`@/ui/idleVillage/frozen/_infra/CanonicalDataBridge`)
- `useCanonicalRosterBundle` (`@/ui/idleVillage/frozen/_infra/CanonicalDataBridge`)

## Certification
- **Status:** frozen (certified 2026-08-15)
- **Manifest:** `slotRackKit.cert.json`
- **Evidence:**
  - Contract test: `tests/contract/minimal-vs-test.spec.ts`
  - DOM snapshot: `tests/unit/frozen/slotRackKit.dom.test.tsx` if present
  - E2E: `tests/e2e/idleVillage/rosterSlotPoiIntegration.spec.ts`
  - Build: `npm run build:check`
  - R-214 visual feedback follow-up: `test-results/r214-quest-planner-drag-feedback-2026-10-18.log` (2026-10-18); public API and DOM structure are unchanged, contract recheck is pending.
