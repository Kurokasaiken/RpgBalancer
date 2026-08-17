# poiKit

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical components: `JobPOI`, `ActivityPOI`, `QuestPOI`, `DayNightPOI`, `GenericPoiSkin`, `DayNightPoiSkin`
- Reference route: `/minimal-poi` → `src/pages/minimal-poi.tsx`
- Minimal route: `/minimal-poi`
- Provider chain (canonical): `SkinSystemProvider → SandboxTimingProvider → DndContext` via `PoiKitShell`

## Public API

```tsx
import {
  JobPOI,
  ActivityPOI,
  QuestPOI,
  DayNightPOI,
  JobPOIStandalone,
  ActivityPOIStandalone,
  QuestPOIStandalone,
  PoiKitShell,
} from '@/ui/idleVillage/frozen/kits/poiKit';

function MinimalPoi() {
  return (
    <PoiKitShell>
      <JobPOIStandalone activityId="chop-wood" />
    </PoiKitShell>
  );
}
```

## Contract
The frozen TypeScript contracts live in `poiKit.contract.ts`. The contract subtrees are the POI `data-testid` roots.

## Fixture
Canonical data comes from `IdleVillageConfig.activities` and `useCanonicalRosterBundle`.

## Certification
- **Status:** candidate
- **Manifest:** `poiKit.cert.json`
- **Evidence:**
  - E2E: `tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts`
  - Build: `npm run build:check`
