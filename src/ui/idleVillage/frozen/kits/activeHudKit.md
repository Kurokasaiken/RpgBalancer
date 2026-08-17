# activeHudKit

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical component: `ActiveHUD` (`src/ui/idleVillage/components/ActiveHUD.tsx`)
- Reference route: N/A (currently used inside pages)
- Minimal route: N/A
- Provider chain (canonical): `FULL_PROVIDER_CHAIN` via `ActiveHudKitShell`

## Public API

```tsx
import {
  ActiveHUD,
  ActiveHUDStandalone,
  ActiveHudKitShell,
  useActiveHudKitData,
} from '@/ui/idleVillage/frozen/kits/activeHudKit';

function MinimalActiveHud() {
  const { activeSlots, secondsPerTimeUnit, variant } = useActiveHudKitData();
  return (
    <ActiveHudKitShell>
      <ActiveHUD activeSlots={activeSlots} secondsPerTimeUnit={secondsPerTimeUnit} variant={variant} />
    </ActiveHudKitShell>
  );
}
```

## Contract
The frozen TypeScript contract lives in `activeHudKit.contract.ts`. The contract subtree is `[data-testid="active-hud"]`.

## Fixture
Demo HUD: `activeSlots: []`, `secondsPerTimeUnit: 60`, `variant: 'compact'`.

## Certification
- **Status:** candidate
- **Manifest:** `activeHudKit.cert.json`
- **Evidence:**
  - E2E: `tests/e2e/idleVillage/minimalGameplay.spec.ts`
  - Build: `npm run build:check`
