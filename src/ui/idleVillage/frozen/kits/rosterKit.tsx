/**
 * rosterKit
 *
 * Frozen re-export of the canonical {@link VillageRosterSection} together with
 * a thin data binder. This kit is the source of truth for the `/minimal-roster`
 * isolation page.
 *
 * Design (Plan v2 §S2):
 * - This file contains NO new component code. It re-exports the canonical
 *   `VillageRosterSection` and exposes a single binder hook
 *   ({@link useRosterKitData}) that returns the canonical resident bundle.
 * - Total original code in this file must stay below ~50 LOC. If it grows,
 *   the logic belongs in `VillageRosterSection` or in the bridge — not here.
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

import type { ReactNode, ReactElement } from 'react';
import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from '@dnd-kit/core';
import { useCanonicalRosterBundle } from '../_infra/CanonicalDataBridge';
import type { CanonicalRosterBundle } from '../_infra/CanonicalDataBridge';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import type { VillageRosterSectionProps } from '@/ui/idleVillage/components/VillageRosterSection';
import { DEFAULT_ROSTER_SORT_MODE, type RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';

// Canonical component — re-exported, not re-implemented.
export { VillageRosterSection } from '@/ui/idleVillage/roster';
export type { VillageRosterSectionProps } from '@/ui/idleVillage/components/VillageRosterSection';

// Canonical data binder — returns the same bundle TestRosterPage uses.
export function useRosterKitData(defaultFatigue: number = 0): CanonicalRosterBundle {
  return useCanonicalRosterBundle(defaultFatigue);
}

/**
 * RosterKitShell
 *
 * Mounts the canonical provider chain required by `VillageRosterSection` and
 * its descendants (`ResidentRosterPanel`, `PgCard`, ...). The chain mirrors
 * exactly what `TestRosterPage` wraps the roster with (Audit §2.5):
 *
 *   SkinSystemProvider → SandboxTimingProvider → DragProvider → DndContext
 *
 * Using this shell guarantees provider parity between `/test` and
 * `/minimal-roster`, which is a prerequisite for the contract test.
 */
export function RosterKitShell({ children }: { children: ReactNode }): ReactElement {
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

/**
 * RosterDraggable
 *
 * Pre-configured roster component with full drag & drop context.
 * Includes sorting, filtering, and all necessary providers.
 * Use this for a drop-in roster with drag functionality.
 */
export function RosterDraggable({
  defaultFatigue = 0,
  componentId = 'roster-draggable',
  pillar = 'frontier',
  ...props
}: Omit<VillageRosterSectionProps, 'residents' | 'sortMode' | 'onSortModeChange'> & {
  defaultFatigue?: number;
  componentId?: string;
  pillar?: string;
}) {
  const { residents, residentsById } = useRosterKitData(defaultFatigue);
  const [sortMode, setSortMode] = useState<RosterSortMode>(DEFAULT_ROSTER_SORT_MODE);

  // Drag visual state
  const [dragVisualState, setDragVisualState] = useState<{
    mode: 'idle' | 'dragging' | 'flight';
    residentId?: string;
  }>({ mode: 'idle' });

  // Sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const residentId = event.active.id as string;
    setDragVisualState({ mode: 'dragging', residentId });
  };

  const handleDragMove = (_event: DragMoveEvent) => {
    // Placeholder for drag move logic
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    setDragVisualState({ mode: 'idle' });
  };

  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <DragProvider>
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <VillageRosterSection
              residents={residents}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              componentId={componentId}
              getResidentCompatibility={() => undefined}
              context={{ locationType: 'roster', residentType: 'worker', scenarioType: 'test' }}
              dragVisualState={dragVisualState}
              pillar={pillar as any}
              {...props}
            />
            <CustomDragOverlay
              residentsById={residentsById}
              usePgCardPreview={true}
              dragVisualState={dragVisualState}
            />
          </DndContext>
        </DragProvider>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}

// Re-export the kit contract for convenience.
export { ROSTER_KIT_VERSION, type RosterKitContract } from './rosterKit.contract';
