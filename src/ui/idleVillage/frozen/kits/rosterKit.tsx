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
  useWanderlustSkin = false,
  onDragEnd: externalOnDragEnd,
  useExternalDndContext = false,
  ...props
}: Omit<VillageRosterSectionProps, 'residents' | 'sortMode' | 'onSortModeChange'> & {
  defaultFatigue?: number;
  componentId?: string;
  pillar?: string;
  useWanderlustSkin?: boolean;
  onDragEnd?: (event: DragEndEvent) => void;
  useExternalDndContext?: boolean; // If true, don't create internal DndContext
}) {
  const { residents, residentsById } = useRosterKitData(defaultFatigue);
  const [sortMode, setSortMode] = useState<RosterSortMode>(DEFAULT_ROSTER_SORT_MODE);

  // Drag visual state
  const [dragVisualState, setDragVisualState] = useState<{
    mode: 'idle' | 'dragging' | 'flight' | 'returning';
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

  const handleDragEnd = (event: DragEndEvent) => {
    // Call external handler if provided
    externalOnDragEnd?.(event);
    
    // Only reset to idle if the drop was valid (has 'over')
    // If no 'over', set to 'returning' for spring-back animation
    if (!event.over) {
      setDragVisualState({ mode: 'returning' });
      // Reset to idle after spring-back animation completes
      setTimeout(() => {
        setDragVisualState({ mode: 'idle' });
      }, 300);
    } else {
      setDragVisualState({ mode: 'idle' });
    }
  };

  const rosterContent = (
    <>
      <VillageRosterSection
        residents={residents}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        componentId={componentId}
        getResidentCompatibility={() => undefined}
        context={{ locationType: 'roster', residentType: 'worker', scenarioType: 'test' }}
        dragVisualState={dragVisualState}
        pillar={pillar as any}
        useWanderlustSkin={useWanderlustSkin}
        {...props}
      />
      <CustomDragOverlay
        residentsById={residentsById}
        usePgCardPreview={true}
        dragVisualState={dragVisualState}
      />
    </>
  );

  // If using external DndContext, return just the content without providers
  if (useExternalDndContext) {
    return rosterContent;
  }

  // Otherwise, wrap with full provider chain
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
            {rosterContent}
          </DndContext>
        </DragProvider>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}

// Re-export the kit contract for convenience.
export { ROSTER_KIT_VERSION, type RosterKitContract } from './rosterKit.contract';
