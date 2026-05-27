# clockKit

**Status:** Draft · **Version:** 1.0.0
- Canonical component: `ClockWidget` (`src/ui/idleVillage/components/minimal/ClockWidget.tsx`)
- Reference route: `/minimal-gameplay`
- Minimal route: `/minimal-clock`
- Contract subtree: `[data-testid="minimal-clock-widget"]`

```tsx
import { IsolatedShowcase } from '@/ui/idleVillage/frozen';
import { ClockWidget, useClockKitData } from '@/ui/idleVillage/frozen/kits/clockKit';

function MinimalClock() {
  const props = useClockKitData();
  return (
    <IsolatedShowcase componentName="ClockWidget">
      <ClockWidget {...props} onSpeedChange={() => {}} />
    </IsolatedShowcase>
  );
}
```
