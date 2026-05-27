# rosterKit

**Status:** Draft (pending certification)
**Version:** 1.0.0
**Owner:** TBD
**Last Updated:** 2026-05-21

## Source
- **Canonical component:** `VillageRosterSection` (`src/ui/idleVillage/components/VillageRosterSection.tsx`)
- **Reference route:** `/test` → `TestRosterPage` (subtree at L1795–1796 `[data-testid="village-roster-wrapper"] > [data-testid="village-roster-section"]`)
- **Minimal route:** `/minimal-roster`
- **Provider chain (canonical):** `SkinSystemProvider → SandboxTimingProvider → DragProvider → DndContext`

## Public API

```tsx
import {
  VillageRosterSection,
  useRosterKitData,
  ROSTER_KIT_VERSION,
} from '@/ui/idleVillage/frozen/kits/rosterKit';
import { IsolatedShowcase } from '@/ui/idleVillage/frozen';

function MinimalRoster() {
  const { residents } = useRosterKitData();
  return (
    <IsolatedShowcase componentName="VillageRosterSection" specPath="src/docs/docs/minimal_slice/03_roster.md">
      <VillageRosterSection residents={residents} componentId="minimal-roster-component" />
    </IsolatedShowcase>
  );
}
```

## Contract
The frozen TypeScript contract lives in `rosterKit.contract.ts`. The subtree selector used by the contract test is `[data-testid="village-roster-section"]`.

Any change to the props the page passes — or to the canonical component's rendered DOM under that selector — invalidates the certification and requires:
1. A version bump in `rosterKit.contract.ts`.
2. A new `rosterKit.cert.json` produced by the cert pipeline.
3. A new git tag `frozen/rosterKit-v<version>`.

## Fixture
Fixture sources are re-exports of the canonical config files:
- `MINIMAL_GAMEPLAY_RESIDENTS` (`@/balancing/config/idleVillage/minimalGameplayConfig`)
- `TEST_ROSTER_HEROES` (`@/balancing/config/idleVillage/testRosterResidents`)
- `TEST_RESIDENTS` (`@/balancing/config/idleVillage/testResidents`)

The `canonicalResidentData(defaultFatigue)` factory is the same function `TestRosterPage` uses to materialize the working dataset.

## Certification
- **Status:** Pending (created 2026-05-21, certification scheduled Day 5)
- **Manifest:** `rosterKit.cert.json`
- **Evidence:**
  - Contract test: `tests/contract/minimal-vs-test.spec.ts`
  - DOM snapshot: `__tests__/rosterKit.dom.test.tsx`

## Historical reference
See the 1:1 backup at `src/ui/idleVillage/_ARCHIVED_ROSTER_SLOT_INTERACTION/components/TestRosterPage.tsx` (Feb 20 2026 snapshot) and the postmortem at `src/docs/docs/freeze/POSTMORTEM_ARCHIVED.md`.
