# questCardKit

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Source
- Canonical component: `QuestCard` (`src/ui/idleVillage/map/actionCards/wrappers/QuestCard.tsx`)
- Reference route: `/minimal-questcard` → `src/pages/minimal-questcard.tsx`
- Minimal route: `/minimal-questcard`
- Provider chain (canonical): `SkinSystemProvider → SandboxTimingProvider` via `QuestCardKitShell`

## Public API

```tsx
import {
  QuestCard,
  QuestCardStandalone,
  QuestCardKitShell,
  useQuestCardKitData,
} from '@/ui/idleVillage/frozen/kits/questCardKit';

function MinimalQuestCard() {
  const props = useQuestCardKitData();
  return (
    <QuestCardKitShell>
      <QuestCard {...props} />
    </QuestCardKitShell>
  );
}
```

## Contract
The frozen TypeScript contract lives in `questCardKit.contract.ts`. The contract subtree is `[data-testid="quest-card"]`.

## Fixture
Demo quest data with `Goblin Raid` label, mock progress, injury/death percentages and assignees.

## Certification
- **Status:** candidate
- **Manifest:** `questCardKit.cert.json`
- **Evidence:**
  - E2E: `tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts`
  - Build: `npm run build:check`
