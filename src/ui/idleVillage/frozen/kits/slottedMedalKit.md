# slottedMedalKit

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical component: `SlottedMedal` (`src/ui/idleVillage/components/SlottedMedal.tsx`)
- Reference route: `/minimal-slot` → `src/pages/minimal-slot.tsx`
- Minimal route: `/minimal-slot`
- Provider chain (canonical): `SkinSystemProvider → SandboxTimingProvider` via `SlottedMedalKitShell`

## Notes
- `SlottedMedal` is the circular portrait token **without** the outer bronze ring.
- It is the drop-in representation of an assigned resident inside a slot; it is not the roster `PgCard`.

## Public API

```tsx
import {
  SlottedMedal,
  SlottedMedalStandalone,
  SlottedMedalKitShell,
  useSlottedMedalKitData,
} from '@/ui/idleVillage/frozen/kits/slottedMedalKit';

function MinimalSlottedMedal() {
  const props = useSlottedMedalKitData();
  return (
    <SlottedMedalKitShell>
      <SlottedMedal {...props} />
    </SlottedMedalKitShell>
  );
}
```

## Contract
The frozen TypeScript contract lives in `slottedMedalKit.contract.ts`. The contract subtree is `[data-testid="slotted-medal-root"]`.

## Fixture
Canonical data comes from `useCanonicalRosterBundle`; the first resident is assigned to a gold slot.

## Certification
- **Status:** candidate
- **Manifest:** `slottedMedalKit.cert.json`
- **Evidence:**
  - E2E: `tests/e2e/idleVillage/testRoutePoiSkin.spec.ts`
  - Build: `npm run build:check`
