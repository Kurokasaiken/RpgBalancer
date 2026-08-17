# locationDetailKit

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical component: `LocationDetail` (`src/ui/idleVillage/frozen/kits/locationDetailKit.tsx`)
- Reference route: `/minimal-location-detail` → `src/pages/minimal-location-detail.tsx`
- Minimal route: `/minimal-location-detail`
- Provider chain (canonical): `SkinSystemProvider → SandboxTimingProvider` via `LocationDetailKitShell`

## Public API

```tsx
import { LocationDetail, LocationDetailIsolated, LocationDetailKitShell } from '@/ui/idleVillage/frozen/kits/locationDetailKit';

function MinimalLocationDetail() {
  return (
    <LocationDetailKitShell>
      <LocationDetailIsolated />
    </LocationDetailKitShell>
  );
}
```

## Contract
The frozen TypeScript contract lives in `locationDetailKit.contract.ts`. The contract subtree is `[data-testid="location-detail"]`.

## Workflow
- `LocationDetailIsolated` cycles through `DEMO_LOCATIONS`.
- Each location shows: header, biome/distance, flavor text, description, danger/slots stats, resources, linked activities.
- `Esplora Luogo` is enabled only when `unlocked` is `true`; disabled locations show `Sblocca per Esplorare`.
- Clicking explore emits `location_detail_explore_clicked` telemetry; close emits `location_detail_closed`.
- `ancient-ruins` is built from the C2 `ActivityDefinition` (`DEFAULT_IDLE_VILLAGE_CONFIG.activities['ancient-ruins']`) to stay config-first.

## Fixture
`DEMO_LOCATIONS` array with `forest-edge`, `iron-mine`, `ancient-ruins`, `village-fields`.

## Certification
- **Status:** candidate
- **Manifest:** `locationDetailKit.cert.json`
- **Evidence:**
  - Runtime smoke: `/minimal-location-detail` must return 200.
  - Build: `npm run build:check`
