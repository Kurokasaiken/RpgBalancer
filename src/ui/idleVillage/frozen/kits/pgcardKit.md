# PgcardKit

**Status:** frozen
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical component: `PgCard` (`src/ui/idleVillage/components/PgCard.tsx`)
- Reference route: `/test` → `TestRosterPage` → `ResidentRosterPanel` → `PgCard`
- Minimal route: `/minimal-pgcard`
- Provider chain (canonical): `SkinSystemProvider → SandboxTimingProvider → DragProvider → DndContext` via `PgCardKitShell`

## Public API

```tsx
import {
  PgCard,
  PgCardStandalone,
  PgCardKitShell,
  usePgCardKitData,
  residentToPgCardProps,
} from '@/ui/idleVillage/frozen/kits/pgcardKit';

function MinimalPgCard() {
  const { firstResident } = usePgCardKitData();
  const props = firstResident ? residentToPgCardProps(firstResident) : undefined;
  return (
    <PgCardKitShell>
      {props && <PgCard {...props} />}
    </PgCardKitShell>
  );
}
```

## Contract
The frozen TypeScript contract lives in `pgcardKit.contract.ts`. The subtree selector used by the contract test is the `PgCard` DOM rendered under `[data-testid*="pg-card"]`.

Any change to the props the page passes — or to the canonical component's rendered DOM under the contract subtree — invalidates the certification and requires:
1. A version bump in `pgcardKit.contract.ts`.
2. A new `pgcardKit.cert.json` produced by the cert pipeline.
3. A new git tag `frozen/pgcardKit-v<version>`.

## Fixture
Fixture sources are re-exports of the canonical config files:
- `useCanonicalRosterBundle` (`@/ui/idleVillage/frozen/_infra/CanonicalDataBridge`)
- `residentToPgCardProps` — helper that maps `ResidentState` to `PgCard` props

## Freezing and Drag Contract

For the detailed drag/freeze semantics of `PgCard` (frozen during drag, returning animation, drag overlay, magnetic tilt, spring-back), see:

- `src/docs/docs/idle_village/trusted/pgcard_trusted.md`

## Certification
- **Status:** frozen (certified 2026-08-15)
- **Manifest:** `pgcardKit.cert.json`
- **Evidence:**
  - Contract test: `tests/contract/minimal-vs-test.spec.ts`
  - DOM snapshot: `tests/unit/frozen/pgcardKit.dom.test.tsx` if present
  - E2E: `tests/e2e/idleVillage/testRosterPgCards.spec.ts`, `tests/e2e/idleVillage/testRosterPgCardSkin.spec.ts`
  - Build: `npm run build:check`
