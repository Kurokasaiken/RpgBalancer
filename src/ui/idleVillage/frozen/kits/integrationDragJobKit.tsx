/**
 * integrationDragJobKit — composition kit for drag-from-roster → drop-on-JobCard.
 *
 * Re-exports the canonical components plus a Shell with the full canonical
 * provider chain (Skin → SandboxTiming → DragProvider → DndContext) and a
 * canonical data binder that produces the same residents + the job card from
 * canonical config sources.
 *
 * Contract subtree: `[data-testid="integration-drag-job-root"]` (wrapper added
 * by the minimal page so the contract test can target the whole scene).
 */

import type { ReactNode } from 'react';
import { DndContext } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';

export { VillageRosterSection } from '@/ui/idleVillage/roster';
export { JobCard } from '@/ui/idleVillage/map/actionCards/wrappers/JobCard';
export { useRosterKitData } from './rosterKit';
export { useJobCardKitData } from './jobCardKit';

export function IntegrationDragJobKitShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <DragProvider>
          <DndContext>{children}</DndContext>
        </DragProvider>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}

export * from './integrationDragJobKit.contract';
