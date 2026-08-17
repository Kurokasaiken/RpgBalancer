# skillCheckKit

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical component: `SkillCheckComponent` (`src/ui/idleVillage/components/SkillCheckComponent.tsx`)
- Reference route: `/minimal-skillcheck` → `src/pages/minimal-skillcheck.tsx`
- Minimal route: `/minimal-skillcheck`
- Provider chain (canonical): `SkinSystemProvider → SandboxTimingProvider` via `SkillCheckKitShell`

## Public API

```tsx
import {
  SkillCheckComponent,
  SkillCheckComponentStandalone,
  SkillCheckKitShell,
  useSkillCheckKitData,
} from '@/ui/idleVillage/frozen/kits/skillCheckKit';

function MinimalSkillCheck() {
  const { state, targetNumber, difficulty } = useSkillCheckKitData();
  return (
    <SkillCheckKitShell>
      <SkillCheckComponent state={state} targetNumber={targetNumber} difficulty={difficulty} />
    </SkillCheckKitShell>
  );
}
```

## Contract
The frozen TypeScript contract lives in `skillCheckKit.contract.ts`. The contract subtree is `[data-testid="skill-check-component"]`.

## Fixture
Demo skill check: `state: 'rolling'`, `targetNumber: 12`, `difficulty: 'medium'`.

## Certification
- **Status:** candidate
- **Manifest:** `skillCheckKit.cert.json`
- **Evidence:**
  - E2E: `tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts` — skill check flow
  - Build: `npm run build:check`
