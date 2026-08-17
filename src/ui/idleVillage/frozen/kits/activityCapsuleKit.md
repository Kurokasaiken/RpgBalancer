# activityCapsuleKit

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical component: `ActivityCapsule` (`src/ui/idleVillage/components/ActivityCapsule.tsx`)
- Reference route: `/minimal-poi` → `src/pages/minimal-poi.tsx`
- Minimal route: `/minimal-poi`
- Provider chain (canonical): `SkinSystemProvider → SandboxTimingProvider` via `ActivityCapsuleKitShell`

## Public API

```tsx
import {
  ActivityCapsule,
  ActivityCapsuleStandalone,
  ActivityCapsuleKitShell,
  useActivityCapsuleKitData,
} from '@/ui/idleVillage/frozen/kits/activityCapsuleKit';

function MinimalActivityCapsule() {
  const { slot, dataTestId } = useActivityCapsuleKitData();
  return (
    <ActivityCapsuleKitShell>
      <ActivityCapsule slot={slot} data-testid={dataTestId} />
    </ActivityCapsuleKitShell>
  );
}
```

## Contract
The frozen TypeScript contract lives in `activityCapsuleKit.contract.ts`. The contract subtree is `[data-testid="activity-capsule-root"]`.

## Fixture
Canonical data comes from `useCanonicalRosterBundle` and a deterministic demo slot (`gather-wood`, 100 ticks).

## Certification
- **Status:** candidate
- **Manifest:** `activityCapsuleKit.cert.json`
- **Evidence:**
  - E2E: `tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts`
  - Build: `npm run build:check`
