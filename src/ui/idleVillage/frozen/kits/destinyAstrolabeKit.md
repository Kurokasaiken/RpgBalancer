# destinyAstrolabeKit

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical component: `DestinyAstrolabe` (`src/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe.tsx`)
- Reference route: `/minimal-destiny-astrolabe` → `src/pages/minimal-destiny-astrolabe.tsx`
- Minimal route: `/minimal-destiny-astrolabe`
- Provider chain (canonical): `SkinSystemProvider` via `DestinyAstrolabeKitShell`

## Public API

```tsx
import {
  DestinyAstrolabe,
  DestinyAstrolabeStandalone,
  DestinyAstrolabeKitShell,
} from '@/ui/idleVillage/frozen/kits/destinyAstrolabeKit';

function MinimalAstrolabe() {
  return <DestinyAstrolabeStandalone skills={[...]} onRoll={(result) => console.log(result)} />;
}
```

## Contract
The frozen TypeScript contract lives in `destinyAstrolabeKit.contract.ts`.

Any change to the props or to the canonical component's rendered DOM invalidates the certification and requires:
1. A version bump in `destinyAstrolabeKit.contract.ts`.
2. A new `destinyAstrolabeKit.cert.json` produced by the cert pipeline.
3. A new git tag `frozen/destinyAstrolabeKit-v<version>`.

## Fixture
No external fixture is required; the astrolabe is driven by `AstrolabeSkill[]` props.

## Certification
- **Status:** candidate
- **Manifest:** `destinyAstrolabeKit.cert.json`
- **Evidence:**
  - E2E: `tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts` — skill check flow
  - Build: `npm run build:check`
