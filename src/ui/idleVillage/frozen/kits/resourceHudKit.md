# resourceHudKit

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical component: `ResourcePanel` (`src/ui/idleVillage/components/ResourcePanel.tsx`)
- Reference route: `/minimal-resourcehud` → `src/pages/minimal-resourcehud.tsx`
- Minimal route: `/minimal-resourcehud`
- Provider chain (canonical): `SkinSystemProvider → SandboxTimingProvider` via `ResourceHudKitShell`

## Public API

```tsx
import {
  ResourcePanel,
  ResourcePanelStandalone,
  ResourceHudKitShell,
  useResourceHudKitData,
} from '@/ui/idleVillage/frozen/kits/resourceHudKit';

function MinimalResourceHud() {
  const { title, goldRate, foodRate, populationRate } = useResourceHudKitData();
  return (
    <ResourceHudKitShell>
      <ResourcePanel title={title} goldRate={goldRate} foodRate={foodRate} populationRate={populationRate} />
    </ResourceHudKitShell>
  );
}
```

## Contract
The frozen TypeScript contract lives in `resourceHudKit.contract.ts`. The contract subtree is `[data-testid="resource-panel"]`.

## Fixture
Demo resource data: `goldRate: 12`, `foodRate: 8`, `populationRate: 3`.

## Certification
- **Status:** candidate
- **Manifest:** `resourceHudKit.cert.json`
- **Evidence:**
  - E2E: `tests/e2e/idleVillage/minimalGameplay.spec.ts`
  - Build: `npm run build:check`
